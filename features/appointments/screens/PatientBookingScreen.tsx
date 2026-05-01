import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { useAuth } from "@/features/auth";
import {
  bookingSchema,
  type BookingFormValues
} from "@/features/appointments/schemas/booking.schemas";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import {
  confirmPatientBooking,
  getDoctorBookingOptions
} from "@/services/booking.service";
import {
  type PublicDoctor,
  type PublicDoctorAvailableSlot,
  type PublicDoctorLocation
} from "@/services/doctor.service";
import {
  formatPaymentAmount,
  getAppointmentPaymentPreview
} from "@/services/payment.service";

type BookingConfirmation = {
  appointmentId: string;
  location: PublicDoctorLocation;
  slot: PublicDoctorAvailableSlot;
};

type BookingMutationVariables = {
  location: PublicDoctorLocation;
  reasonForVisit?: string;
  slot: PublicDoctorAvailableSlot;
};

export function PatientBookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { isLoading: isAuthLoading, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const bookingQuery = useQuery({
    enabled: Boolean(doctorId) && role === "patient",
    queryKey: ["doctor-booking-options", doctorId],
    queryFn: () => getDoctorBookingOptions(doctorId ?? "")
  });
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      reasonForVisit: ""
    }
  });
  const doctor = bookingQuery.data;
  const reasonForVisit = watch("reasonForVisit") ?? "";
  const bookingLocations = useMemo(
    () => (doctor ? getBookableLocations(doctor) : []),
    [doctor]
  );
  const availableDates = useMemo(
    () => getAvailableDates(doctor, selectedLocationId),
    [doctor, selectedLocationId]
  );
  const availableSlots = useMemo(
    () => getAvailableSlots(doctor, selectedLocationId, selectedDate),
    [doctor, selectedDate, selectedLocationId]
  );
  const selectedLocation =
    bookingLocations.find((location) => location.id === selectedLocationId) ?? null;
  const selectedSlot =
    availableSlots.find((slot) => slot.id === selectedSlotId) ?? null;
  const bookingMutation = useMutation({
    mutationFn: ({ reasonForVisit, slot }: BookingMutationVariables) =>
      confirmPatientBooking({
        slotId: slot.id,
        reasonForVisit
      }),
    onSuccess: async (appointmentId, variables) => {
      setConfirmation({
        appointmentId,
        location: variables.location,
        slot: variables.slot
      });
      reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["public-doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["public-doctor", doctorId] }),
        queryClient.invalidateQueries({
          queryKey: ["doctor-booking-options", doctorId]
        }),
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] })
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Unable to book appointment",
        error instanceof Error
          ? error.message
          : "Please choose another available time slot."
      );
    }
  });

  useEffect(() => {
    if (bookingLocations.length === 0) {
      setSelectedLocationId(null);
      return;
    }

    if (
      !selectedLocationId ||
      !bookingLocations.some((location) => location.id === selectedLocationId)
    ) {
      setSelectedLocationId(bookingLocations[0].id);
    }
  }, [bookingLocations, selectedLocationId]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate(null);
      return;
    }

    if (!selectedDate || !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  useEffect(() => {
    if (selectedSlotId && !availableSlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(null);
    }
  }, [availableSlots, selectedSlotId]);

  if (!doctorId) {
    return (
      <Screen>
        <ErrorState message="Doctor profile id is missing." />
      </Screen>
    );
  }

  if (isAuthLoading) {
    return (
      <Screen>
        <LoadingState message="Checking your session..." />
      </Screen>
    );
  }

  if (role === "guest") {
    return (
      <Screen contentStyle={styles.centerContent}>
        <Card>
          <Badge label="Patient account required" variant="warning" />
          <Text style={styles.signInTitle}>Sign in before booking</Text>
          <Text style={styles.helperText}>
            Doctor profiles are public, but appointment booking requires a patient
            account so appointment data stays private.
          </Text>
          <View style={styles.stack}>
            <Button
              title="Sign in or create account"
              onPress={() =>
                router.push({
                  pathname: ROUTES.loginPrompt,
                  params: { doctorId }
                })
              }
            />
            <Button
              title="Back to doctor profile"
              variant="ghost"
              onPress={() =>
                router.replace({
                  pathname: "/doctors/[doctorId]",
                  params: { doctorId }
                })
              }
            />
          </View>
        </Card>
      </Screen>
    );
  }

  if (role !== "patient") {
    return (
      <Screen>
        <ErrorState
          title="Patient account required"
          message="Only signed-in patients can book appointments from public doctor profiles."
        />
      </Screen>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading appointment options..." />
      </Screen>
    );
  }

  if (bookingQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            bookingQuery.error instanceof Error
              ? bookingQuery.error.message
              : "Unable to load appointment options."
          }
          onRetry={() => void bookingQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!doctor) {
    return (
      <Screen>
        <EmptyState
          title="Doctor not available"
          message="This doctor is not public or has no bookable profile right now."
          actionLabel="Search doctors"
          onAction={() => router.push(ROUTES.doctors)}
        />
      </Screen>
    );
  }

  if (confirmation) {
    return (
      <BookingConfirmationView
        confirmation={confirmation}
        doctor={doctor}
        onBackToProfile={() =>
          router.replace({
            pathname: "/doctors/[doctorId]",
            params: { doctorId }
          })
        }
        onViewDashboard={() => router.replace(ROUTES.patientHome)}
      />
    );
  }

  const onSubmit = (values: BookingFormValues) => {
    if (!selectedLocation || !selectedSlot) {
      Alert.alert(
        "Choose a time slot",
        "Select a location, date, and available time before confirming."
      );
      return;
    }

    bookingMutation.mutate({
      location: selectedLocation,
      slot: selectedSlot,
      reasonForVisit: values.reasonForVisit
    });
  };

  const activeStep = selectedSlot ? 4 : selectedDate ? 3 : selectedLocationId ? 2 : 1;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <AuthBackButton onPress={() => router.back()} />
        <Text style={styles.pageTitle}>Book appointment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <BookingProgress activeStep={activeStep} />

      <View style={styles.doctorCard}>
        <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} size={104} />
        <View style={styles.doctorCopy}>
          <Text style={styles.doctorName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.doctorSpecialty}>
            {doctor.specialties[0] ?? "General practice"}
          </Text>
          <Text style={styles.doctorMeta}>
            {doctor.averageRating.toFixed(1)} ({doctor.reviews.length} reviews)
          </Text>
          <Text style={styles.doctorMeta}>{doctor.yearsOfExperience}+ years experience</Text>
        </View>
        <View style={styles.doctorTag}>
          <Text style={styles.doctorTagText}>
            {doctor.specialties[0] ?? "Consultation"}
          </Text>
        </View>
      </View>

      <Pressable style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <PatientGlyph name="location" color={colors.primary} size={28} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationLabel}>Location</Text>
          <Text style={styles.locationValue}>
            {selectedLocation ? formatLocation(selectedLocation) : "Select a location"}
          </Text>
        </View>
      </Pressable>

      {bookingLocations.length > 1 ? (
        <View style={styles.locationChoices}>
          {bookingLocations.map((location) => (
            <ChoiceChip
              active={selectedLocationId === location.id}
              key={location.id}
              label={location.name ?? location.city ?? "Clinic"}
              onPress={() => {
                setSelectedLocationId(location.id);
                setSelectedSlotId(null);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select date</Text>
        {availableDates.length > 0 ? (
          <View style={styles.dateRow}>
            {availableDates.map((date) => (
              <DateChip
                active={selectedDate === date}
                date={date}
                key={date}
                onPress={() => {
                  setSelectedDate(date);
                  setSelectedSlotId(null);
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No available dates"
            message="Choose another location or check back when more slots open."
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select time</Text>
        {availableSlots.length > 0 ? (
          <View style={styles.timeGrid}>
            {availableSlots.map((slot) => (
              <TimeChip
                active={selectedSlotId === slot.id}
                key={slot.id}
                label={formatTime(slot.startTime)}
                onPress={() => setSelectedSlotId(slot.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No available slots"
            message="No open slots exist for the selected location and date."
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason for visit</Text>
        <Text style={styles.sectionHint}>(optional)</Text>
        <Controller
          control={control}
          name="reasonForVisit"
          render={({ field: { onBlur, onChange, value } }) => (
            <View style={styles.reasonWrap}>
              <TextInput
                multiline
                numberOfLines={5}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Please describe the reason for your visit"
                placeholderTextColor="#9AA9C1"
                style={[
                  styles.reasonInput,
                  errors.reasonForVisit?.message ? styles.reasonInputError : null
                ]}
                textAlignVertical="top"
                value={value ?? ""}
              />
              <Text style={styles.characterCount}>{reasonForVisit.length}/250</Text>
            </View>
          )}
        />
        {errors.reasonForVisit?.message ? (
          <Text style={styles.errorText}>{errors.reasonForVisit.message}</Text>
        ) : null}
      </View>

      <BookingSummaryStrip location={selectedLocation} slot={selectedSlot} />

      <Button
        disabled={!selectedSlot || bookingMutation.isPending}
        isLoading={bookingMutation.isPending}
        title="Confirm Booking"
        onPress={handleSubmit(onSubmit)}
        style={styles.confirmButton}
      />
    </Screen>
  );
}

function BookingConfirmationView({
  confirmation,
  doctor,
  onBackToProfile,
  onViewDashboard
}: {
  confirmation: BookingConfirmation;
  doctor: PublicDoctor;
  onBackToProfile: () => void;
  onViewDashboard: () => void;
}) {
  const paymentPreview = getAppointmentPaymentPreview({
    amount: doctor.consultationFee
  });

  return (
    <Screen contentStyle={styles.centerContent}>
      <Card style={styles.confirmationCard}>
        <View style={styles.confirmationMark}>
          <PatientGlyph color={colors.success} name="calendar" size={40} />
        </View>
        <Badge label="Appointment confirmed" variant="success" />
        <Text style={styles.confirmationTitle}>Your appointment is booked</Text>
        <Text style={styles.helperText}>
          The doctor has been notified. You can find this appointment in your
          patient dashboard.
        </Text>
        <View style={styles.confirmationSummary}>
          <SummaryItem label="Doctor" value={formatDoctorName(doctor)} />
          <SummaryItem label="Location" value={formatLocation(confirmation.location)} />
          <SummaryItem
            label="Date and time"
            value={`${formatDateLong(confirmation.slot.startTime)} at ${formatTime(
              confirmation.slot.startTime
            )}`}
          />
          <SummaryItem label="Appointment ID" value={confirmation.appointmentId.slice(0, 8)} />
          <SummaryItem label="Payment method" value={paymentPreview.methodLabel} />
          <Text style={styles.helperText}>{paymentPreview.note}</Text>
        </View>
        <View style={styles.stack}>
          <Button title="View patient dashboard" onPress={onViewDashboard} />
          <Button
            title="Back to doctor profile"
            variant="secondary"
            onPress={onBackToProfile}
          />
        </View>
      </Card>
    </Screen>
  );
}

function BookingProgress({ activeStep }: { activeStep: number }) {
  const steps = [
    "Select details",
    "Your information",
    "Review",
    "Confirmation"
  ];

  return (
    <View style={styles.progressRow}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = activeStep >= stepNumber;

        return (
          <View key={step} style={styles.progressItem}>
            <View style={styles.progressLineWrap}>
              <View
                style={[styles.progressDot, isActive ? styles.progressDotActive : null]}
              >
                <Text
                  style={[
                    styles.progressDotText,
                    isActive ? styles.progressDotTextActive : null
                  ]}
                >
                  {stepNumber}
                </Text>
              </View>
              {index < steps.length - 1 ? <View style={styles.progressLine} /> : null}
            </View>
            <Text style={[styles.progressLabel, isActive ? styles.progressLabelActive : null]}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ChoiceChip({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choiceChip, active ? styles.choiceChipActive : null]}
    >
      <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DateChip({
  active,
  date,
  onPress
}: {
  active: boolean;
  date: string;
  onPress: () => void;
}) {
  const values = getDateParts(date);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.dateChip, active ? styles.dateChipActive : null]}
    >
      <Text style={[styles.dateDay, active ? styles.dateTextActive : null]}>{values.day}</Text>
      <Text style={[styles.dateNumber, active ? styles.dateTextActive : null]}>
        {values.dayOfMonth}
      </Text>
      <Text style={[styles.dateMonth, active ? styles.dateTextActive : null]}>{values.month}</Text>
    </Pressable>
  );
}

function TimeChip({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.timeChip, active ? styles.timeChipActive : null]}
    >
      <Text style={[styles.timeChipText, active ? styles.timeChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function BookingSummaryStrip({
  location,
  slot
}: {
  location: PublicDoctorLocation | null;
  slot: PublicDoctorAvailableSlot | null;
}) {
  return (
    <View style={styles.summaryStrip}>
      <SummaryBlock
        icon="calendar"
        label="Date"
        value={slot ? formatDateLong(slot.startTime) : "Not selected"}
      />
      <SummaryBlock
        icon="bookmark"
        label="Time"
        value={slot ? formatTime(slot.startTime) : "Not selected"}
      />
      <SummaryBlock
        icon="location"
        label="Clinic"
        value={location ? location.name ?? location.city ?? "Clinic" : "Not selected"}
      />
    </View>
  );
}

function SummaryBlock({
  icon,
  label,
  value
}: {
  icon: "calendar" | "bookmark" | "location";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryBlock}>
      <View style={styles.summaryIconCircle}>
        <PatientGlyph color={colors.primary} name={icon} size={24} />
      </View>
      <View style={styles.summaryTextWrap}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={styles.summaryItemValue}>{value}</Text>
    </View>
  );
}

function getBookableLocations(doctor: PublicDoctor): PublicDoctorLocation[] {
  const locationIds = new Set(
    doctor.availableSlots.map((slot) => slot.locationId).filter(Boolean)
  );

  return doctor.locations.filter((location) => locationIds.has(location.id));
}

function getAvailableDates(
  doctor: PublicDoctor | undefined | null,
  locationId: string | null
): string[] {
  if (!doctor || !locationId) {
    return [];
  }

  return Array.from(
    new Set(
      doctor.availableSlots
        .filter((slot) => slot.locationId === locationId)
        .map((slot) => toDateKey(slot.startTime))
    )
  ).sort();
}

function getAvailableSlots(
  doctor: PublicDoctor | undefined | null,
  locationId: string | null,
  date: string | null
): PublicDoctorAvailableSlot[] {
  if (!doctor || !locationId || !date) {
    return [];
  }

  return doctor.availableSlots.filter(
    (slot) => slot.locationId === locationId && toDateKey(slot.startTime) === date
  );
}

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function formatDoctorName(doctor: PublicDoctor): string {
  return [doctor.title, doctor.fullName].filter(Boolean).join(" ");
}

function formatLocation(location: PublicDoctorLocation): string {
  const label = location.name ?? location.city ?? "Practice location";
  const details = [location.address, location.city].filter(Boolean).join(", ");

  return details ? `${label} - ${details}` : label;
}

function formatDateLong(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getDateParts(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const parts = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short"
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }
      return result;
    }, {});

  return {
    day: parts.weekday ?? "",
    dayOfMonth: parts.day ?? "",
    month: parts.month ?? ""
  };
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: "center"
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"]
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerSpacer: {
    width: 52
  },
  pageTitle: {
    color: "#0D2557",
    fontSize: 32,
    lineHeight: 38,
    ...fontStyles.extraBold
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.xs
  },
  progressItem: {
    flex: 1,
    gap: spacing.sm,
    alignItems: "center"
  },
  progressLineWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center"
  },
  progressDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#D4DFEF",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  progressDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  progressDotText: {
    color: "#7A8CAA",
    fontSize: 18,
    ...fontStyles.medium
  },
  progressDotTextActive: {
    color: colors.white
  },
  progressLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D4DFEF",
    marginLeft: spacing.sm
  },
  progressLabel: {
    color: "#7A8CAA",
    fontSize: 13,
    textAlign: "center",
    ...fontStyles.medium
  },
  progressLabelActive: {
    color: colors.primary
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: "#0D2557",
    fontSize: 26,
    lineHeight: 30,
    ...fontStyles.extraBold
  },
  doctorSpecialty: {
    color: "#344E79",
    fontSize: 18,
    ...fontStyles.medium
  },
  doctorMeta: {
    color: "#5E7398",
    fontSize: 16,
    ...fontStyles.regular
  },
  doctorTag: {
    borderRadius: radius.full,
    backgroundColor: "#EAF8FA",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  doctorTagText: {
    color: colors.primary,
    fontSize: 15,
    ...fontStyles.medium
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.soft
  },
  locationIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  locationCopy: {
    flex: 1,
    gap: spacing.xs
  },
  locationLabel: {
    color: "#0D2557",
    fontSize: 18,
    ...fontStyles.bold
  },
  locationValue: {
    color: "#556E9B",
    fontSize: 17,
    lineHeight: 24,
    ...fontStyles.regular
  },
  locationChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  choiceChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#CDE7EF",
    backgroundColor: "#F2FBFC",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.soft
  },
  choiceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  choiceChipText: {
    color: "#24406F",
    fontSize: 15,
    ...fontStyles.medium
  },
  choiceChipTextActive: {
    color: colors.white
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: "#0D2557",
    fontSize: 20,
    ...fontStyles.extraBold
  },
  sectionHint: {
    marginTop: -spacing.sm,
    color: "#7689A9",
    fontSize: 16,
    ...fontStyles.regular
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  dateChip: {
    width: 98,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    ...shadows.soft
  },
  dateChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#F2FBFC"
  },
  dateDay: {
    color: "#7A8CAA",
    fontSize: 16,
    ...fontStyles.medium
  },
  dateNumber: {
    color: "#0D2557",
    fontSize: 24,
    lineHeight: 28,
    ...fontStyles.extraBold
  },
  dateMonth: {
    color: "#7A8CAA",
    fontSize: 16,
    ...fontStyles.medium
  },
  dateTextActive: {
    color: colors.primary
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  timeChip: {
    width: "23%",
    minWidth: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#39B5BF",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    ...shadows.soft
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  timeChipText: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  timeChipTextActive: {
    color: colors.white
  },
  reasonWrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D7E4FA",
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.soft
  },
  reasonInput: {
    minHeight: 126,
    color: "#243F73",
    fontSize: 18,
    lineHeight: 26,
    ...fontStyles.regular
  },
  reasonInputError: {
    borderColor: colors.danger
  },
  characterCount: {
    alignSelf: "flex-end",
    color: "#8093BC",
    fontSize: 14,
    ...fontStyles.medium
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  summaryStrip: {
    flexDirection: "row",
    gap: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#F2FBFC",
    borderWidth: 1,
    borderColor: "#D7EEF2",
    padding: spacing.lg,
    ...shadows.soft
  },
  summaryBlock: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center"
  },
  summaryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  summaryTextWrap: {
    flex: 1,
    gap: spacing.xs
  },
  summaryLabel: {
    color: "#7A8CAA",
    fontSize: 14,
    ...fontStyles.medium
  },
  summaryValue: {
    color: "#0D2557",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.bold
  },
  confirmButton: {
    minHeight: 72
  },
  confirmationCard: {
    gap: spacing.lg,
    alignItems: "center",
    ...shadows.card
  },
  confirmationMark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmationTitle: {
    color: "#0D2557",
    fontSize: 30,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  confirmationSummary: {
    width: "100%",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#F8FBFF",
    padding: spacing.lg
  },
  summaryItem: {
    gap: spacing.xs
  },
  summaryItemLabel: {
    color: "#8093BC",
    fontSize: 13,
    textTransform: "uppercase",
    ...fontStyles.bold
  },
  summaryItemValue: {
    color: "#0D2557",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.bold
  },
  signInTitle: {
    color: "#0D2557",
    fontSize: 28,
    ...fontStyles.extraBold
  },
  helperText: {
    color: "#556E9B",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    ...fontStyles.regular
  },
  stack: {
    width: "100%",
    gap: spacing.md
  }
});

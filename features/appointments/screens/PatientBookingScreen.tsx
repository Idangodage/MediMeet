import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  bookingSchema,
  type BookingFormValues
} from "@/features/appointments/schemas/booking.schemas";
import {
  confirmPatientBooking,
  getDoctorBookingOptions
} from "@/services/booking.service";
import {
  formatConsultationType,
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
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null
  );
  const bookingQuery = useQuery({
    enabled: Boolean(doctorId) && role === "patient",
    queryKey: ["doctor-booking-options", doctorId],
    queryFn: () => getDoctorBookingOptions(doctorId ?? "")
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      reasonForVisit: ""
    }
  });
  const doctor = bookingQuery.data;
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
    bookingLocations.find((location) => location.id === selectedLocationId) ??
    null;
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
    if (
      selectedSlotId &&
      !availableSlots.some((slot) => slot.id === selectedSlotId)
    ) {
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
          <Text style={styles.title}>Sign in before booking</Text>
          <Text style={styles.bodyText}>
            Doctor profiles are public, but appointment booking requires a
            patient account so appointment data stays private.
          </Text>
          <View style={styles.actions}>
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

  return (
    <Screen>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Avatar
            imageUrl={doctor.profileImageUrl}
            name={doctor.fullName}
            size={76}
          />
          <View style={styles.heroCopy}>
            <Badge label="Automatic confirmation" variant="success" />
            <Text style={styles.title}>
              Book {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
            </Text>
            <Text style={styles.bodyText}>
              Choose a location, date, and available slot. The MVP confirms
              bookings automatically when the server locks the slot.
            </Text>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                This platform is for doctor discovery and appointment booking
                only. It is not for emergency medical care.
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <BookingProgress
        activeStep={
          selectedSlot ? 4 : selectedDate ? 3 : selectedLocationId ? 2 : 1
        }
      />

      <Card title="1. Select location">
        {bookingLocations.length > 0 ? (
          <View style={styles.choiceGroup}>
            {bookingLocations.map((location) => (
              <Button
                key={location.id}
                title={formatLocation(location)}
                variant={
                  selectedLocationId === location.id ? "primary" : "secondary"
                }
                onPress={() => {
                  setSelectedLocationId(location.id);
                  setSelectedSlotId(null);
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No bookable locations"
            message="This doctor has no active locations with available slots."
          />
        )}
      </Card>

      <Card title="2. Select date">
        {availableDates.length > 0 ? (
          <View style={styles.choiceGroup}>
            {availableDates.map((date) => (
              <Button
                key={date}
                title={formatDateLabel(date)}
                variant={selectedDate === date ? "primary" : "secondary"}
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
            message="Choose another location or check back when the doctor opens more availability."
          />
        )}
      </Card>

      <Card title="3. Select time slot">
        {availableSlots.length > 0 ? (
          <View style={styles.slotGrid}>
            {availableSlots.map((slot) => (
              <View key={slot.id} style={styles.slotItem}>
                <Button
                  title={`${formatTime(slot.startTime)} - ${formatTime(
                    slot.endTime
                  )}`}
                  variant={selectedSlotId === slot.id ? "primary" : "secondary"}
                  onPress={() => setSelectedSlotId(slot.id)}
                />
                <Badge label={formatConsultationType(slot.consultationType)} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No available slots"
            message="No open slots exist for the selected location and date."
          />
        )}
      </Card>

      <Card
        title="4. Add reason and confirm"
        subtitle="The reason is optional and visible only to your care team."
      >
        <Controller
          control={control}
          name="reasonForVisit"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.reasonForVisit?.message}
              label="Reason for visit"
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Example: recurring headache, annual checkup, follow-up..."
              style={styles.reasonInput}
              textAlignVertical="top"
              value={value ?? ""}
            />
          )}
        />

        <BookingSummary
          doctor={doctor}
          location={selectedLocation}
          slot={selectedSlot}
        />

        <Button
          disabled={!selectedSlot || bookingMutation.isPending}
          isLoading={bookingMutation.isPending}
          title="Confirm booking"
          onPress={handleSubmit(onSubmit)}
        />
      </Card>
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
        <View style={styles.successMark}>
          <Text style={styles.successMarkText}>OK</Text>
        </View>
        <Badge label="Appointment confirmed" variant="success" />
        <Text style={styles.title}>Your appointment is booked</Text>
        <Text style={styles.bodyText}>
          The doctor has been notified. You can find this appointment in your
          patient dashboard.
        </Text>
        <View style={styles.summaryBox}>
          <Info label="Doctor" value={formatDoctorName(doctor)} />
          <Info label="Location" value={formatLocation(confirmation.location)} />
          <Info
            label="Date and time"
            value={`${formatDateTime(confirmation.slot.startTime)} - ${formatTime(
              confirmation.slot.endTime
            )}`}
          />
          <Info
            label="Appointment ID"
            value={confirmation.appointmentId.slice(0, 8)}
          />
          <Info label="Payment method" value={paymentPreview.methodLabel} />
          <Text style={styles.bodyText}>{paymentPreview.note}</Text>
        </View>
        <View style={styles.actions}>
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
  const steps = ["Location", "Date", "Time", "Confirm"];

  return (
    <Card style={styles.progressCard}>
      <View style={styles.progressRow}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep >= stepNumber;

          return (
            <View key={step} style={styles.progressItem}>
              <View style={[styles.progressDot, isActive && styles.progressDotActive]}>
                <Text
                  style={[
                    styles.progressDotText,
                    isActive && styles.progressDotTextActive
                  ]}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text style={[styles.progressLabel, isActive && styles.progressLabelActive]}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function BookingSummary({
  doctor,
  location,
  slot
}: {
  doctor: PublicDoctor;
  location: PublicDoctorLocation | null;
  slot: PublicDoctorAvailableSlot | null;
}) {
  const paymentPreview = getAppointmentPaymentPreview({
    amount: doctor.consultationFee
  });

  return (
    <View style={styles.summaryBox}>
      <Info label="Doctor" value={formatDoctorName(doctor)} />
      <Info label="Location" value={location ? formatLocation(location) : "Not selected"} />
      <Info
        label="Time"
        value={
          slot
            ? `${formatDateTime(slot.startTime)} - ${formatTime(slot.endTime)}`
            : "Not selected"
        }
      />
      <Info
        label="Consultation fee"
        value={formatPaymentAmount(
          paymentPreview.amount,
          paymentPreview.currency
        )}
      />
      <Info label="Payment method" value={paymentPreview.methodLabel} />
      <Text style={styles.bodyText}>{paymentPreview.note}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: "center"
  },
  heroCard: {
    borderColor: colors.border,
    backgroundColor: colors.primaryTint
  },
  heroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  heroCopy: {
    flex: 1,
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 34
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  disclaimerBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warningSoft,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  disclaimerText: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 19
  },
  choiceGroup: {
    gap: spacing.sm
  },
  progressCard: {
    paddingVertical: spacing.md
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  progressItem: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs
  },
  progressDot: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  progressDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  progressDotText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900"
  },
  progressDotTextActive: {
    color: colors.white
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: typography.tiny,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase"
  },
  progressLabelActive: {
    color: colors.primaryDark
  },
  slotGrid: {
    gap: spacing.md
  },
  slotItem: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  reasonInput: {
    minHeight: 112,
    paddingTop: spacing.md
  },
  summaryBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.lg
  },
  infoItem: {
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    lineHeight: 23
  },
  confirmationCard: {
    alignItems: "center",
    backgroundColor: colors.successSoft
  },
  successMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface
  },
  successMarkText: {
    color: colors.success,
    fontSize: 34,
    fontWeight: "900"
  },
  actions: {
    gap: spacing.md
  }
});

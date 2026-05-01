import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  availabilitySchema,
  type AvailabilityFormValues
} from "@/features/doctor/schemas/availability.schemas";
import {
  createDoctorAvailability,
  deleteDoctorAvailability,
  formatConsultationType,
  formatSlotStatus,
  getAvailabilityCounts,
  getTodayIsoDate,
  listOwnAvailabilityCalendar,
  shiftAnchorDate,
  updateDoctorAvailability,
  updateDoctorSlotStatus,
  type AvailabilitySlot,
  type CalendarViewMode,
  type ConsultationType,
  type DoctorAvailability
} from "@/services/availability.service";

const availabilityQueryKey = "own-availability-calendar";
const viewModes: CalendarViewMode[] = ["day", "week", "month"];
const consultationTypes: ConsultationType[] = ["in_person", "video", "phone"];

export function DoctorAvailabilityScreen() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(getTodayIsoDate());
  const [editingAvailability, setEditingAvailability] =
    useState<DoctorAvailability | null>(null);
  const calendarQuery = useQuery({
    queryKey: [availabilityQueryKey, viewMode, anchorDate],
    queryFn: () => listOwnAvailabilityCalendar(viewMode, anchorDate)
  });
  const invalidateCalendar = async () => {
    await queryClient.invalidateQueries({ queryKey: [availabilityQueryKey] });
  };
  const createMutation = useMutation({
    mutationFn: createDoctorAvailability,
    onSuccess: async () => {
      setEditingAvailability(null);
      await invalidateCalendar();
      Alert.alert("Availability created", "Appointment slots were generated.");
    },
    onError: showMutationError
  });
  const updateMutation = useMutation({
    mutationFn: updateDoctorAvailability,
    onSuccess: async () => {
      setEditingAvailability(null);
      await invalidateCalendar();
      Alert.alert("Availability updated", "Future slots were regenerated.");
    },
    onError: showMutationError
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctorAvailability,
    onSuccess: invalidateCalendar,
    onError: showMutationError
  });
  const slotMutation = useMutation({
    mutationFn: updateDoctorSlotStatus,
    onSuccess: invalidateCalendar,
    onError: showMutationError
  });
  const counts = useMemo(
    () => getAvailabilityCounts(calendarQuery.data?.availability ?? []),
    [calendarQuery.data?.availability]
  );

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <PublicBrandLockup />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.notifications)}
          style={styles.bellButton}
        >
          <PatientGlyph name="bell" color="#0F2C66" />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Availability</Text>
        <Text style={styles.subtitle}>
          Manage your available slots and schedule.
        </Text>
      </View>

      <View style={styles.doctorCard}>
        <View style={styles.doctorIdentity}>
          <View style={styles.doctorAvatarCircle}>
            <PatientGlyph name="user" color={colors.primary} size={28} />
          </View>
          <View style={styles.doctorCopy}>
            <Text style={styles.doctorName}>
              {profile?.fullName ?? user?.email?.split("@")[0] ?? "Doctor"}
            </Text>
            <Text style={styles.doctorMeta}>Availability workspace</Text>
          </View>
        </View>
        <View style={styles.doctorLocationBox}>
          <Text style={styles.doctorLocationLabel}>
            {calendarQuery.data?.locations[0]?.name ?? "Select location"}
          </Text>
          <Text style={styles.doctorLocationLink}>Switch clinic</Text>
        </View>
      </View>

      <Card>
        <View style={styles.viewModeRow}>
          {viewModes.map((mode) => (
            <Button
              key={mode}
              title={capitalize(mode)}
              variant={viewMode === mode ? "primary" : "secondary"}
              onPress={() => setViewMode(mode)}
            />
          ))}
        </View>
        <View style={styles.navigationRow}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={() => setAnchorDate(shiftAnchorDate(viewMode, anchorDate, -1))}
          />
          <Button title="Today" variant="ghost" onPress={() => setAnchorDate(getTodayIsoDate())} />
          <Button
            title="Next"
            variant="secondary"
            onPress={() => setAnchorDate(shiftAnchorDate(viewMode, anchorDate, 1))}
          />
        </View>
        {calendarQuery.data ? (
          <Text style={styles.rangeText}>
            {calendarQuery.data.rangeStart} to {calendarQuery.data.rangeEnd}
          </Text>
        ) : null}
      </Card>

      {calendarQuery.isLoading ? (
        <LoadingState message="Loading availability calendar..." />
      ) : null}

      {calendarQuery.isError ? (
        <ErrorState
          message={
            calendarQuery.error instanceof Error
              ? calendarQuery.error.message
              : "Unable to load availability."
          }
          onRetry={() => void calendarQuery.refetch()}
        />
      ) : null}

      {calendarQuery.data ? (
        <>
          <Card title="Slot summary" subtitle="Booked slots are separated from open inventory.">
            <View style={styles.statsRow}>
              <Stat label="Available" value={String(counts.available)} />
              <Stat label="Booked" value={String(counts.booked)} />
              <Stat label="Blocked" value={String(counts.blocked)} />
            </View>
          </Card>

          <AvailabilityForm
            editingAvailability={editingAvailability}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            locations={calendarQuery.data.locations}
            onCancelEdit={() => setEditingAvailability(null)}
            onSubmit={(values) => {
              if (editingAvailability) {
                updateMutation.mutate({
                  availabilityId: editingAvailability.id,
                  ...values,
                  appointmentDurationMinutes: Number(
                    values.appointmentDurationMinutes
                  ),
                  breakMinutes: Number(values.breakMinutes),
                  maxPatients: Number(values.maxPatients)
                });
                return;
              }

              createMutation.mutate({
                ...values,
                appointmentDurationMinutes: Number(
                  values.appointmentDurationMinutes
                ),
                breakMinutes: Number(values.breakMinutes),
                maxPatients: Number(values.maxPatients)
              });
            }}
          />

          <AvailabilityList
            availability={calendarQuery.data.availability}
            isDeleting={deleteMutation.isPending}
            isUpdatingSlot={slotMutation.isPending}
            onDelete={(availability) => {
              Alert.alert(
                "Delete availability",
                "This is allowed only when no bookings exist.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(availability.id)
                  }
                ]
              );
            }}
            onEdit={setEditingAvailability}
            onToggleSlot={(slot) => {
              slotMutation.mutate({
                slotId: slot.id,
                status: slot.status === "available" ? "blocked" : "available"
              });
            }}
          />
        </>
      ) : null}

      <View style={styles.bottomNav}>
        <DoctorBottomNavItem
          icon="home"
          label="Dashboard"
          onPress={() => router.push(ROUTES.doctorHome)}
        />
        <DoctorBottomNavItem
          active
          icon="calendar"
          label="Availability"
          onPress={() => router.push(ROUTES.doctorAvailability)}
        />
        <DoctorBottomNavItem
          icon="bookmark"
          label="Appointments"
          onPress={() => router.push(ROUTES.doctorAppointments)}
        />
        <DoctorBottomNavItem
          icon="shield"
          label="Subscription"
          onPress={() => router.push(ROUTES.doctorBilling)}
        />
        <DoctorBottomNavItem
          icon="user"
          label="Profile"
          onPress={() => router.push(ROUTES.doctorProfile)}
        />
      </View>

      <Button title="Back to dashboard" variant="ghost" onPress={() => router.push(ROUTES.doctorHome)} />
    </Screen>
  );
}

function DoctorBottomNavItem({
  active = false,
  icon,
  label,
  onPress
}: {
  active?: boolean;
  icon: "home" | "calendar" | "bookmark" | "shield" | "user";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.bottomNavItem}>
      <PatientGlyph color={active ? colors.primary : "#6B7FA8"} name={icon} size={26} />
      <Text style={[styles.bottomNavLabel, active ? styles.bottomNavLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AvailabilityForm({
  editingAvailability,
  isSubmitting,
  locations,
  onCancelEdit,
  onSubmit
}: {
  editingAvailability: DoctorAvailability | null;
  isSubmitting: boolean;
  locations: Array<{ id: string; name: string; address: string | null; city: string | null }>;
  onCancelEdit: () => void;
  onSubmit: (values: AvailabilityFormValues) => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: getEmptyAvailabilityForm(locations[0]?.id)
  });
  const selectedLocationId = watch("locationId");
  const selectedConsultationType = watch("consultationType");
  const isActive = watch("isActive");

  useEffect(() => {
    if (editingAvailability) {
      reset({
        locationId: editingAvailability.locationId,
        date: editingAvailability.date,
        startTime: trimSeconds(editingAvailability.startTime),
        endTime: trimSeconds(editingAvailability.endTime),
        appointmentDurationMinutes: String(
          editingAvailability.appointmentDurationMinutes
        ),
        breakMinutes: String(editingAvailability.breakMinutes),
        maxPatients: String(editingAvailability.maxPatients),
        consultationType: editingAvailability.consultationType,
        isActive: editingAvailability.isActive
      });
      return;
    }

    reset(getEmptyAvailabilityForm(locations[0]?.id));
  }, [editingAvailability, locations, reset]);

  if (locations.length === 0) {
    return (
      <Card title="Create availability">
        <EmptyState
          title="No active visiting locations"
          message="Add an active visiting location before creating availability."
          actionLabel="Manage profile locations"
          onAction={() => router.push(ROUTES.doctorProfile)}
        />
      </Card>
    );
  }

  return (
    <Card
      title={editingAvailability ? "Edit future availability" : "Create availability"}
      subtitle="Slots are generated automatically from the time window and duration."
    >
      <View style={styles.locationPicker}>
        <Text style={styles.sectionLabel}>Location</Text>
        {locations.map((location) => (
          <Button
            key={location.id}
            title={`${location.name}${location.city ? `, ${location.city}` : ""}`}
            variant={selectedLocationId === location.id ? "primary" : "secondary"}
            onPress={() =>
              setValue("locationId", location.id, {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
        ))}
        {errors.locationId?.message ? (
          <Text style={styles.errorText}>{errors.locationId.message}</Text>
        ) : null}
      </View>

      <FormInput control={control} error={errors.date?.message} label="Date" name="date" placeholder="YYYY-MM-DD" />
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <FormInput control={control} error={errors.startTime?.message} label="Start time" name="startTime" placeholder="09:00" />
        </View>
        <View style={styles.column}>
          <FormInput control={control} error={errors.endTime?.message} label="End time" name="endTime" placeholder="17:00" />
        </View>
      </View>
      <FormInput control={control} error={errors.appointmentDurationMinutes?.message} keyboardType="number-pad" label="Appointment duration minutes" name="appointmentDurationMinutes" />
      <FormInput control={control} error={errors.breakMinutes?.message} keyboardType="number-pad" label="Break time minutes" name="breakMinutes" />
      <FormInput control={control} error={errors.maxPatients?.message} keyboardType="number-pad" label="Maximum patients" name="maxPatients" />

      <View style={styles.locationPicker}>
        <Text style={styles.sectionLabel}>Consultation type</Text>
        <View style={styles.typeRow}>
          {consultationTypes.map((type) => (
            <Button
              key={type}
              title={formatConsultationType(type)}
              variant={selectedConsultationType === type ? "primary" : "secondary"}
              onPress={() =>
                setValue("consultationType", type, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.activeRow}>
        <Badge
          label={isActive ? "Active availability" : "Inactive availability"}
          variant={isActive ? "success" : "neutral"}
        />
        <Button
          title={isActive ? "Set inactive" : "Set active"}
          variant="secondary"
          onPress={() =>
            setValue("isActive", !isActive, {
              shouldDirty: true,
              shouldValidate: true
            })
          }
        />
      </View>

      <View style={styles.formActions}>
        <Button
          title={editingAvailability ? "Save availability" : "Create availability"}
          isLoading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        {editingAvailability ? (
          <Button title="Cancel edit" variant="ghost" onPress={onCancelEdit} />
        ) : null}
      </View>
    </Card>
  );
}

function AvailabilityList({
  availability,
  isDeleting,
  isUpdatingSlot,
  onDelete,
  onEdit,
  onToggleSlot
}: {
  availability: DoctorAvailability[];
  isDeleting: boolean;
  isUpdatingSlot: boolean;
  onDelete: (availability: DoctorAvailability) => void;
  onEdit: (availability: DoctorAvailability) => void;
  onToggleSlot: (slot: AvailabilitySlot) => void;
}) {
  if (availability.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No availability in this range"
          message="Create availability or move the calendar to another date range."
        />
      </Card>
    );
  }

  return (
    <View style={styles.availabilityList}>
      {availability.map((item) => (
        <AvailabilityCard
          availability={item}
          isDeleting={isDeleting}
          isUpdatingSlot={isUpdatingSlot}
          key={item.id}
          onDelete={() => onDelete(item)}
          onEdit={() => onEdit(item)}
          onToggleSlot={onToggleSlot}
        />
      ))}
    </View>
  );
}

function AvailabilityCard({
  availability,
  isDeleting,
  isUpdatingSlot,
  onDelete,
  onEdit,
  onToggleSlot
}: {
  availability: DoctorAvailability;
  isDeleting: boolean;
  isUpdatingSlot: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSlot: (slot: AvailabilitySlot) => void;
}) {
  const bookedSlots = availability.slots.filter(
    (slot) => slot.appointment || slot.status === "booked"
  );
  const availableSlots = availability.slots.filter(
    (slot) => !slot.appointment && slot.status === "available"
  );
  const blockedSlots = availability.slots.filter(
    (slot) => !slot.appointment && slot.status !== "available"
  );
  const canEdit = availability.date >= getTodayIsoDate() && bookedSlots.length === 0;

  return (
    <Card>
      <View style={styles.availabilityHeader}>
        <View style={styles.availabilityCopy}>
          <Text style={styles.availabilityDate}>{availability.date}</Text>
          <Text style={styles.availabilityTitle}>
            {trimSeconds(availability.startTime)} to {trimSeconds(availability.endTime)}
          </Text>
          <Text style={styles.bodyText}>
            {availability.location?.name ?? "Location"} -{" "}
            {formatConsultationType(availability.consultationType)}
          </Text>
        </View>
        <Badge
          label={availability.isActive ? "Active" : "Inactive"}
          variant={availability.isActive ? "success" : "neutral"}
        />
      </View>

      <View style={styles.infoGrid}>
        <Info label="Duration" value={`${availability.appointmentDurationMinutes} min`} />
        <Info label="Break" value={`${availability.breakMinutes} min`} />
        <Info label="Max patients" value={String(availability.maxPatients)} />
        <Info label="Slots" value={String(availability.slots.length)} />
      </View>

      <SlotSection
        emptyText="No booked slots."
        isUpdatingSlot={isUpdatingSlot}
        slots={bookedSlots}
        title="Booked slots"
        onToggleSlot={onToggleSlot}
      />
      <SlotSection
        emptyText="No available slots."
        isUpdatingSlot={isUpdatingSlot}
        slots={availableSlots}
        title="Available slots"
        onToggleSlot={onToggleSlot}
      />
      <SlotSection
        emptyText="No blocked slots."
        isUpdatingSlot={isUpdatingSlot}
        slots={blockedSlots}
        title="Blocked slots"
        onToggleSlot={onToggleSlot}
      />

      <View style={styles.formActions}>
        <Button title="Edit" disabled={!canEdit} variant="secondary" onPress={onEdit} />
        <Button
          title="Delete"
          disabled={bookedSlots.length > 0}
          isLoading={isDeleting}
          variant="danger"
          onPress={onDelete}
        />
      </View>
      {!canEdit ? (
        <Text style={styles.helperText}>
          Availability with booked slots cannot be edited until rescheduling logic
          exists.
        </Text>
      ) : null}
    </Card>
  );
}

function SlotSection({
  emptyText,
  isUpdatingSlot,
  slots,
  title,
  onToggleSlot
}: {
  emptyText: string;
  isUpdatingSlot: boolean;
  slots: AvailabilitySlot[];
  title: string;
  onToggleSlot: (slot: AvailabilitySlot) => void;
}) {
  return (
    <View style={styles.slotSection}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {slots.length === 0 ? (
        <Text style={styles.helperText}>{emptyText}</Text>
      ) : (
        slots.map((slot) => (
          <View key={slot.id} style={styles.slotRow}>
            <View style={styles.slotCopy}>
              <Text style={styles.slotTime}>
                {formatDateTime(slot.startTime)} to {formatTime(slot.endTime)}
              </Text>
              <Text style={styles.bodyText}>
                {slot.appointment
                  ? `${formatStatus(slot.appointment.status)} appointment`
                  : formatSlotStatus(slot.status)}
              </Text>
            </View>
            <Badge
              label={slot.appointment ? "Booked" : formatSlotStatus(slot.status)}
              variant={slot.appointment ? "success" : slot.status === "available" ? "neutral" : "warning"}
            />
            {!slot.appointment && (slot.status === "available" || slot.status === "blocked") ? (
              <Button
                title={slot.status === "available" ? "Disable" : "Enable"}
                variant="secondary"
                isLoading={isUpdatingSlot}
                onPress={() => onToggleSlot(slot)}
              />
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  keyboardType?: "default" | "number-pad";
  placeholder?: string;
};

function FormInput<T extends FieldValues>({
  control,
  error,
  label,
  name,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <Input
          error={error}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          value={typeof value === "string" ? value : ""}
          {...props}
        />
      )}
    />
  );
}

function getEmptyAvailabilityForm(locationId = ""): AvailabilityFormValues {
  return {
    locationId,
    date: getTodayIsoDate(),
    startTime: "09:00",
    endTime: "17:00",
    appointmentDurationMinutes: "30",
    breakMinutes: "0",
    maxPatients: "1",
    consultationType: "in_person",
    isActive: true
  };
}

function showMutationError(error: unknown) {
  Alert.alert(
    "Availability update failed",
    error instanceof Error ? error.message : "Unable to save availability."
  );
}

function trimSeconds(value: string): string {
  return value.slice(0, 5);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map((part) => capitalize(part))
    .join(" ");
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"]
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bellButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E1ECF8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.soft
  },
  bellDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  header: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 40
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card
  },
  doctorIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1
  },
  doctorAvatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  doctorMeta: {
    color: colors.textMuted,
    fontSize: typography.body
  },
  doctorLocationBox: {
    alignItems: "flex-start",
    gap: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: "#E6EDF7",
    paddingLeft: spacing.lg
  },
  doctorLocationLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  doctorLocationLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600"
  },
  viewModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  navigationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  rangeText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  locationPicker: {
    gap: spacing.sm
  },
  sectionLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "700"
  },
  twoColumn: {
    flexDirection: "row",
    gap: spacing.md
  },
  column: {
    flex: 1
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  activeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  formActions: {
    gap: spacing.sm
  },
  availabilityList: {
    gap: spacing.lg
  },
  availabilityHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  availabilityCopy: {
    flex: 1,
    gap: spacing.xs
  },
  availabilityDate: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  availabilityTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  infoItem: {
    minWidth: "45%",
    flex: 1,
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  slotSection: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  slotRow: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  slotCopy: {
    gap: spacing.xs
  },
  slotTime: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 92,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    paddingHorizontal: spacing.sm,
    ...shadows.card
  },
  bottomNavItem: {
    alignItems: "center",
    gap: spacing.sm
  },
  bottomNavLabel: {
    color: "#6B7FA8",
    fontSize: 14,
    fontWeight: "500"
  },
  bottomNavLabelActive: {
    color: colors.primary
  }
});

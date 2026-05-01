import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

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
import { ROUTES } from "@/constants/routes";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import {
  canCancelDoctorAppointment,
  canCompleteDoctorAppointment,
  canConfirmDoctorAppointment,
  canMarkDoctorNoShow,
  canRescheduleDoctorAppointment,
  cancelDoctorAppointment,
  completeDoctorAppointment,
  confirmDoctorAppointment,
  formatDoctorAppointmentDateTime,
  formatDoctorAppointmentStatus,
  formatDoctorLocation,
  getOwnDoctorAppointment,
  isCancelledDoctorAppointment,
  listDoctorAppointmentHistory,
  listDoctorRescheduleSlots,
  markDoctorAppointmentNoShow,
  rescheduleDoctorAppointment,
  trimAppointmentTime,
  type DoctorAppointment,
  type DoctorRescheduleSlot
} from "@/services/doctorAppointments.service";

export function DoctorAppointmentDetailScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const queryClient = useQueryClient();
  const appointmentQuery = useQuery({
    enabled: Boolean(appointmentId),
    queryKey: ["doctor-appointment", appointmentId],
    queryFn: () => getOwnDoctorAppointment(appointmentId ?? "")
  });
  const appointment = appointmentQuery.data ?? null;
  const historyQuery = useQuery({
    enabled: Boolean(appointment?.patientId),
    queryKey: ["doctor-appointment-history", appointment?.patientId],
    queryFn: () => listDoctorAppointmentHistory(appointment?.patientId ?? "")
  });
  const rescheduleSlotsQuery = useQuery({
    enabled: Boolean(
      appointmentId && appointment && canRescheduleDoctorAppointment(appointment)
    ),
    queryKey: ["doctor-reschedule-slots", appointmentId],
    queryFn: () => listDoctorRescheduleSlots(appointmentId ?? "")
  });
  const confirmMutation = useMutation({
    mutationFn: () => confirmDoctorAppointment(appointmentId ?? ""),
    onSuccess: () => invalidateDoctorAppointmentData(queryClient, appointmentId),
    onError: showMutationError
  });
  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelDoctorAppointment({
        appointmentId: appointmentId ?? "",
        reason: "Cancelled by doctor"
      }),
    onSuccess: () => invalidateDoctorAppointmentData(queryClient, appointmentId),
    onError: showMutationError
  });
  const completeMutation = useMutation({
    mutationFn: () => completeDoctorAppointment(appointmentId ?? ""),
    onSuccess: () => invalidateDoctorAppointmentData(queryClient, appointmentId),
    onError: showMutationError
  });
  const noShowMutation = useMutation({
    mutationFn: () => markDoctorAppointmentNoShow(appointmentId ?? ""),
    onSuccess: () => invalidateDoctorAppointmentData(queryClient, appointmentId),
    onError: showMutationError
  });
  const rescheduleMutation = useMutation({
    mutationFn: (slotId: string) =>
      rescheduleDoctorAppointment({
        appointmentId: appointmentId ?? "",
        slotId
      }),
    onSuccess: async (newAppointmentId) => {
      await invalidateDoctorAppointmentData(queryClient, appointmentId);
      router.replace({
        pathname: "/doctor/appointments/[appointmentId]",
        params: { appointmentId: newAppointmentId }
      });
      Alert.alert("Appointment rescheduled", "The patient has been notified.");
    },
    onError: showMutationError
  });

  if (!appointmentId) {
    return (
      <Screen>
        <ErrorState message="Appointment id is missing." />
      </Screen>
    );
  }

  if (appointmentQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading appointment..." />
      </Screen>
    );
  }

  if (appointmentQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            appointmentQuery.error instanceof Error
              ? appointmentQuery.error.message
              : "Unable to load appointment."
          }
          onRetry={() => void appointmentQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen>
        <EmptyState
          title="Appointment not found"
          message="Doctors can only open appointments that belong to their own doctor profile."
          actionLabel="Back to appointments"
          onAction={() => router.replace(ROUTES.doctorAppointments)}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <AuthBackButton onPress={() => router.back()} />
        <Text style={styles.pageTitle}>Appointment details</Text>
        <Pressable accessibilityRole="button" style={styles.shareButton}>
          <PatientGlyph name="bookmark" color="#0F2C66" size={22} />
        </Pressable>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Badge
              label={formatDoctorAppointmentStatus(appointment.status)}
              variant={getStatusVariant(appointment)}
            />
            <Text style={styles.title}>
              {appointment.patient?.fullName ?? "Patient"}
            </Text>
            <Text style={styles.subtitle}>
              {formatDoctorAppointmentDateTime(appointment)}
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Doctor profile">
        <View style={styles.doctorCard}>
          <Avatar name="Doctor" size={84} />
          <View style={styles.doctorCardCopy}>
            <Text style={styles.doctorCardTitle}>Your consultation workspace</Text>
            <Text style={styles.bodyText}>
              {formatDoctorLocation(appointment.location)}
            </Text>
          </View>
          <Button
            title="Directions"
            variant="secondary"
            onPress={() => openDirections(appointment)}
          />
        </View>
      </Card>

      <Card
        title="Patient details"
        subtitle="Contact details are shown only after a booking is confirmed."
      >
        <View style={styles.infoBox}>
          <Info
            label="Name"
            value={appointment.patient?.fullName ?? "Patient"}
          />
          <Info
            label="City"
            value={appointment.patient?.city ?? "Not provided"}
          />
          <Info
            label="Preferred language"
            value={appointment.patient?.preferredLanguage ?? "en"}
          />
          {appointment.canShowPatientContact ? (
            <>
              <Info
                label="Email"
                value={appointment.patient?.email ?? "Not provided"}
              />
              <Info
                label="Phone"
                value={appointment.patient?.phone ?? "Not provided"}
              />
            </>
          ) : (
            <View style={styles.privateNotice}>
              <Badge label="Contact hidden" variant="warning" />
              <Text style={styles.bodyText}>
                Confirm the appointment before patient phone and email are shown
                in this workspace.
              </Text>
            </View>
          )}
        </View>
      </Card>

      <Card title="Appointment details">
        <View style={styles.infoBox}>
          <Info label="Date" value={appointment.appointmentDate} />
          <Info
            label="Time"
            value={`${trimAppointmentTime(
              appointment.startTime
            )} - ${trimAppointmentTime(appointment.endTime)}`}
          />
          <Info label="Status" value={formatDoctorAppointmentStatus(appointment.status)} />
          <Info label="Location" value={formatDoctorLocation(appointment.location)} />
          <Info
            label="Reason for visit"
            value={appointment.reasonForVisit || "No reason provided."}
          />
          {appointment.cancellationReason ? (
            <Info
              label="Cancellation reason"
              value={appointment.cancellationReason}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          {canConfirmDoctorAppointment(appointment) ? (
            <Button
              title="Confirm appointment"
              isLoading={confirmMutation.isPending}
              onPress={() =>
                confirmAction(
                  "Confirm appointment",
                  "The patient will be notified.",
                  () => confirmMutation.mutate()
                )
              }
            />
          ) : null}
          {canCancelDoctorAppointment(appointment) ? (
            <Button
              title="Cancel appointment"
              variant="danger"
              isLoading={cancelMutation.isPending}
              onPress={() =>
                confirmAction(
                  "Cancel appointment",
                  "This releases the slot if the appointment is still in the future.",
                  () => cancelMutation.mutate()
                )
              }
            />
          ) : null}
          {canCompleteDoctorAppointment(appointment) ? (
            <Button
              title="Mark completed"
              variant="secondary"
              isLoading={completeMutation.isPending}
              onPress={() =>
                confirmAction(
                  "Mark completed",
                  "This adds the patient to treated patients.",
                  () => completeMutation.mutate()
                )
              }
            />
          ) : null}
          {canMarkDoctorNoShow(appointment) ? (
            <Button
              title="Mark no-show"
              variant="secondary"
              isLoading={noShowMutation.isPending}
              onPress={() =>
                confirmAction(
                  "Mark patient no-show",
                  "Use this only when the patient did not attend.",
                  () => noShowMutation.mutate()
                )
              }
            />
          ) : null}
          <Button
            title="Directions / location"
            variant="secondary"
            onPress={() => openDirections(appointment)}
          />
        </View>
      </Card>

      {canRescheduleDoctorAppointment(appointment) ? (
        <RescheduleCard
          isLoading={rescheduleSlotsQuery.isLoading}
          isRescheduling={rescheduleMutation.isPending}
          isError={rescheduleSlotsQuery.isError}
          slots={rescheduleSlotsQuery.data ?? []}
          onRetry={() => void rescheduleSlotsQuery.refetch()}
          onSelectSlot={(slot) =>
            confirmAction(
              "Reschedule appointment",
              `Move this appointment to ${formatSlotRange(slot)}?`,
              () => rescheduleMutation.mutate(slot.id)
            )
          }
        />
      ) : null}

      <Card title="Appointment history with this patient">
        {historyQuery.isLoading ? (
          <LoadingState message="Loading appointment history..." />
        ) : null}
        {historyQuery.isError ? (
          <ErrorState
            message={
              historyQuery.error instanceof Error
                ? historyQuery.error.message
                : "Unable to load appointment history."
            }
            onRetry={() => void historyQuery.refetch()}
          />
        ) : null}
        {historyQuery.data ? (
          historyQuery.data.length > 0 ? (
            <View style={styles.historyList}>
              {historyQuery.data.map((historyItem) => (
                <View key={historyItem.id} style={styles.historyItem}>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle}>
                      {formatDoctorAppointmentDateTime(historyItem)}
                    </Text>
                    <Text style={styles.bodyText}>
                      {historyItem.reasonForVisit || "No reason provided."}
                    </Text>
                  </View>
                  <Badge
                    label={formatDoctorAppointmentStatus(historyItem.status)}
                    variant={getStatusVariant(historyItem)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No appointment history"
              message="History is scoped to appointments between this doctor and patient."
            />
          )
        ) : null}
      </Card>

      <Button
        title="Back to appointments"
        variant="ghost"
        onPress={() => router.push(ROUTES.doctorAppointments)}
      />
    </Screen>
  );
}

function RescheduleCard({
  isError,
  isLoading,
  isRescheduling,
  slots,
  onRetry,
  onSelectSlot
}: {
  isError: boolean;
  isLoading: boolean;
  isRescheduling: boolean;
  slots: DoctorRescheduleSlot[];
  onRetry: () => void;
  onSelectSlot: (slot: DoctorRescheduleSlot) => void;
}) {
  return (
    <Card
      title="Reschedule"
      subtitle="Move the appointment into a future available slot for the same doctor."
    >
      {isLoading ? <LoadingState message="Loading available slots..." /> : null}
      {isError ? (
        <ErrorState message="Unable to load reschedule slots." onRetry={onRetry} />
      ) : null}
      {!isLoading && !isError ? (
        slots.length > 0 ? (
          <View style={styles.slotList}>
            {slots.map((slot) => (
              <View key={slot.id} style={styles.slotRow}>
                <View style={styles.slotCopy}>
                  <Text style={styles.slotTime}>{formatSlotRange(slot)}</Text>
                  <Text style={styles.bodyText}>
                    {formatDoctorLocation(slot.location)}
                  </Text>
                </View>
                <Button
                  title="Move here"
                  variant="secondary"
                  isLoading={isRescheduling}
                  onPress={() => onSelectSlot(slot)}
                />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No available slots"
            message="Create future availability before rescheduling this appointment."
            actionLabel="Manage availability"
            onAction={() => router.push(ROUTES.doctorAvailability)}
          />
        )
      ) : null}
    </Card>
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

function getStatusVariant(
  appointment: DoctorAppointment
): "neutral" | "success" | "warning" | "danger" {
  if (isCancelledDoctorAppointment(appointment)) {
    return "danger";
  }

  if (appointment.status === "completed") {
    return "success";
  }

  if (
    appointment.status === "no_show" ||
    ["requested", "pending"].includes(appointment.status)
  ) {
    return "warning";
  }

  return "neutral";
}

function confirmAction(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Continue",
      onPress: onConfirm
    }
  ]);
}

function showMutationError(error: unknown) {
  Alert.alert(
    "Appointment update failed",
    error instanceof Error ? error.message : "Unable to update appointment."
  );
}

async function invalidateDoctorAppointmentData(
  queryClient: ReturnType<typeof useQueryClient>,
  appointmentId?: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["doctor-appointment-dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["doctor-home-dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["doctor-treated-patients"] }),
    queryClient.invalidateQueries({ queryKey: ["doctor-appointment-history"] }),
    queryClient.invalidateQueries({ queryKey: ["own-notifications"] }),
    appointmentId
      ? queryClient.invalidateQueries({
          queryKey: ["doctor-appointment", appointmentId]
        })
      : Promise.resolve(),
    appointmentId
      ? queryClient.invalidateQueries({
          queryKey: ["doctor-reschedule-slots", appointmentId]
        })
      : Promise.resolve()
  ]);
}

function openDirections(appointment: DoctorAppointment) {
  const location = appointment.location;

  if (!location) {
    Alert.alert("Location unavailable", "No location is linked to this appointment.");
    return;
  }

  const query =
    location.latitude && location.longitude
      ? `${location.latitude},${location.longitude}`
      : [location.address, location.city].filter(Boolean).join(", ");

  if (!query) {
    Alert.alert("Location unavailable", "This appointment has no address.");
    return;
  }

  void Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  );
}

function formatSlotRange(slot: DoctorRescheduleSlot): string {
  const start = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(slot.startTime));
  const end = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short"
  }).format(new Date(slot.endTime));

  return `${start} - ${end}`;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"]
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pageTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38
  },
  shareButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1ECF8",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft
  },
  heroCard: {
    backgroundColor: colors.primarySoft,
    ...shadows.soft
  },
  heroHeader: {
    gap: spacing.lg
  },
  heroCopy: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  infoBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  doctorCardCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorCardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  privateNotice: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
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
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    gap: spacing.sm
  },
  historyList: {
    gap: spacing.md
  },
  historyItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  historyCopy: {
    flex: 1,
    gap: spacing.xs
  },
  historyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  slotList: {
    gap: spacing.md
  },
  slotRow: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  slotCopy: {
    gap: spacing.xs
  },
  slotTime: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  }
});

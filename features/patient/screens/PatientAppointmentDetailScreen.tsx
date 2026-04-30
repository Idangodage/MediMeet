import type { ComponentProps } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

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
import {
  appointmentReviewSchema,
  type AppointmentReviewFormInput,
  type AppointmentReviewFormValues
} from "@/features/patient/schemas/review.schemas";
import {
  canCancelAppointment,
  canRescheduleAppointment,
  cancelOwnAppointment,
  formatAppointmentStatus,
  getOwnPatientAppointment,
  isCancelledAppointment,
  setFavouriteDoctor,
  type PatientAppointment
} from "@/services/patient.service";
import {
  createAppointmentReview,
  formatRating
} from "@/services/review.service";
import {
  formatPaymentAmount,
  getAppointmentPaymentPreview
} from "@/services/payment.service";

export function PatientAppointmentDetailScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<
    AppointmentReviewFormInput,
    unknown,
    AppointmentReviewFormValues
  >({
    resolver: zodResolver(appointmentReviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      isPublic: true
    }
  });
  const appointmentQuery = useQuery({
    enabled: Boolean(appointmentId),
    queryKey: ["patient-appointment", appointmentId],
    queryFn: () => getOwnPatientAppointment(appointmentId ?? "")
  });
  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelOwnAppointment({
        appointmentId: appointmentId ?? "",
        reason: "Cancelled by patient"
      }),
    onSuccess: async () => {
      await invalidatePatientData(queryClient, appointmentId);
      Alert.alert("Appointment cancelled", "The doctor has been notified.");
    },
    onError: (error) => {
      Alert.alert(
        "Unable to cancel",
        error instanceof Error
          ? error.message
          : "Please try again or contact the clinic."
      );
    }
  });
  const favouriteMutation = useMutation({
    mutationFn: ({
      doctorId,
      isFavourite
    }: {
      doctorId: string;
      isFavourite: boolean;
    }) => setFavouriteDoctor({ doctorId, isFavourite }),
    onSuccess: async () => {
      await invalidatePatientData(queryClient, appointmentId);
    },
    onError: (error) => {
      Alert.alert(
        "Unable to update favourite",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });
  const reviewMutation = useMutation({
    mutationFn: (values: AppointmentReviewFormValues) =>
      createAppointmentReview({
        appointmentId: appointmentId ?? "",
        rating: values.rating,
        comment: values.comment,
        isPublic: values.isPublic
      }),
    onSuccess: async () => {
      reset({
        rating: 5,
        comment: "",
        isPublic: true
      });
      await invalidatePatientData(queryClient, appointmentId);
      await queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      await queryClient.invalidateQueries({
        queryKey: ["public-doctor", appointmentQuery.data?.doctorId]
      });
      Alert.alert("Review submitted", "Thank you for reviewing your visit.");
    },
    onError: (error) => {
      Alert.alert(
        "Unable to submit review",
        error instanceof Error ? error.message : "Please try again."
      );
    }
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

  if (!appointmentQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Appointment not found"
          message="You can only view appointments that belong to your patient profile."
          actionLabel="Back to appointments"
          onAction={() => router.replace(ROUTES.patientAppointments)}
        />
      </Screen>
    );
  }

  const appointment = appointmentQuery.data;
  const canCancel = canCancelAppointment(appointment);
  const canReschedule = canRescheduleAppointment(appointment);
  const paymentPreview = getAppointmentPaymentPreview({
    amount: appointment.doctor?.consultationFee ?? 0
  });

  return (
    <Screen>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Avatar
            imageUrl={appointment.doctor?.profileImageUrl}
            name={appointment.doctor?.fullName ?? "Doctor"}
            size={76}
          />
          <View style={styles.heroCopy}>
            <Badge
              label={formatAppointmentStatus(appointment.status)}
              variant={isCancelledAppointment(appointment) ? "danger" : "success"}
            />
            <Text style={styles.title}>
              {[appointment.doctor?.title, appointment.doctor?.fullName]
                .filter(Boolean)
                .join(" ") || "Doctor"}
            </Text>
            <Text style={styles.subtitle}>
              {appointment.doctor?.specialties.join(", ") || "General practice"}
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Appointment details">
        <View style={styles.infoBox}>
          <Info label="Date" value={appointment.appointmentDate} />
          <Info
            label="Time"
            value={`${trimSeconds(appointment.startTime)} - ${trimSeconds(
              appointment.endTime
            )}`}
          />
          <Info
            label="Location"
            value={
              appointment.location
                ? formatLocation(appointment.location)
                : "Location unavailable"
            }
          />
          <Info
            label="Reason for visit"
            value={appointment.reasonForVisit || "No reason provided."}
          />
          {appointment.cancellationReason ? (
            <Info label="Cancellation reason" value={appointment.cancellationReason} />
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            title={
              appointment.isFavouriteDoctor
                ? "Remove favourite doctor"
                : "Add favourite doctor"
            }
            variant="secondary"
            isLoading={favouriteMutation.isPending}
            onPress={() =>
              favouriteMutation.mutate({
                doctorId: appointment.doctorId,
                isFavourite: !appointment.isFavouriteDoctor
              })
            }
          />
          <Button
            title="Directions / location"
            variant="secondary"
            onPress={() => openDirections(appointment)}
          />
          {canReschedule ? (
            <Button
              title="Reschedule"
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Reschedule not available yet",
                  "The backend is protected for rescheduling, but the reschedule flow is not implemented in this MVP."
                )
              }
            />
          ) : null}
          {canCancel ? (
            <Button
              title="Cancel appointment"
              variant="danger"
              isLoading={cancelMutation.isPending}
              onPress={() =>
                Alert.alert(
                  "Cancel appointment",
                  "This will cancel your appointment and release the slot if it is still in the future.",
                  [
                    { text: "Keep appointment", style: "cancel" },
                    {
                      text: "Cancel appointment",
                      style: "destructive",
                      onPress: () => cancelMutation.mutate()
                    }
                  ]
                )
              }
            />
          ) : null}
        </View>
      </Card>

      <Card title="Payment">
        <View style={styles.infoBox}>
          <Info
            label="Consultation fee"
            value={formatPaymentAmount(
              paymentPreview.amount,
              paymentPreview.currency
            )}
          />
          <Info label="Payment method" value={paymentPreview.methodLabel} />
          <Text style={styles.infoValue}>{paymentPreview.note}</Text>
        </View>
      </Card>

      {appointment.status === "completed" ? (
        <Card
          title={appointment.review ? "Your review" : "Review this appointment"}
          subtitle={
            appointment.review
              ? "You already reviewed this completed appointment."
              : "Only completed appointments can be reviewed. You can choose whether the written comment is public."
          }
        >
          {appointment.review ? (
            <View style={styles.reviewBox}>
              <Badge label={formatRating(appointment.review.rating)} variant="success" />
              <Text style={styles.infoValue}>
                {appointment.review.comment || "No written comment."}
              </Text>
              <Badge
                label={
                  appointment.review.isPublic
                    ? "Public comment"
                    : "Private comment"
                }
                variant={appointment.review.isPublic ? "success" : "neutral"}
              />
            </View>
          ) : (
            <View style={styles.reviewBox}>
              <FormInput
                control={control}
                error={errors.rating?.message}
                keyboardType="number-pad"
                label="Rating"
                name="rating"
                placeholder="1-5"
              />
              <FormInput
                control={control}
                error={errors.comment?.message}
                label="Written comment"
                multiline
                name="comment"
                numberOfLines={5}
                placeholder="Share what helped future patients understand this visit."
                style={styles.reviewInput}
              />
              <Controller
                control={control}
                name="isPublic"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.visibilityBox}>
                    <Text style={styles.infoLabel}>Comment visibility</Text>
                    <View style={styles.actions}>
                      <Button
                        title="Public comment"
                        variant={value ? "primary" : "secondary"}
                        onPress={() => onChange(true)}
                      />
                      <Button
                        title="Private comment"
                        variant={!value ? "primary" : "secondary"}
                        onPress={() => onChange(false)}
                      />
                    </View>
                  </View>
                )}
              />
              <Button
                title="Submit review"
                isLoading={reviewMutation.isPending}
                onPress={handleSubmit((values) => reviewMutation.mutate(values))}
              />
            </View>
          )}
        </Card>
      ) : null}

      <Button
        title="Back to appointments"
        variant="ghost"
        onPress={() => router.push(ROUTES.patientAppointments)}
      />
    </Screen>
  );
}

type FormInputProps = ComponentProps<typeof Input> & {
  control: Control<
    AppointmentReviewFormInput,
    unknown,
    AppointmentReviewFormValues
  >;
  name: keyof AppointmentReviewFormInput;
  label: string;
  error?: string;
};

function FormInput({
  control,
  error,
  label,
  name,
  ...props
}: FormInputProps) {
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
          value={String(value ?? "")}
          {...props}
        />
      )}
    />
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

function formatLocation(
  location: NonNullable<PatientAppointment["location"]>
): string {
  const label = location.name ?? location.city ?? "Practice location";
  const details = [location.address, location.city].filter(Boolean).join(", ");

  return details ? `${label} - ${details}` : label;
}

function openDirections(appointment: PatientAppointment) {
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

function trimSeconds(value: string): string {
  return value.slice(0, 5);
}

async function invalidatePatientData(
  queryClient: ReturnType<typeof useQueryClient>,
  appointmentId?: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["patient-appointments"] }),
    queryClient.invalidateQueries({ queryKey: ["patient-favourite-doctors"] }),
    queryClient.invalidateQueries({ queryKey: ["patient-visited-doctors"] }),
    queryClient.invalidateQueries({ queryKey: ["own-notifications"] }),
    appointmentId
      ? queryClient.invalidateQueries({
          queryKey: ["patient-appointment", appointmentId]
        })
      : Promise.resolve()
  ]);
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primarySoft
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
  actions: {
    gap: spacing.sm
  },
  reviewBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  reviewInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  visibilityBox: {
    gap: spacing.sm
  }
});

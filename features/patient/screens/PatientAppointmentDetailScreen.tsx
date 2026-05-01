import type { ComponentProps } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
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
  const referenceNumber = `CL-${appointment.id.slice(0, 8).toUpperCase()}`;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <AuthBackButton onPress={() => router.back()} />
        <Text style={styles.pageTitle}>Appointment details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.statusBanner,
          isCancelledAppointment(appointment)
            ? styles.statusBannerDanger
            : styles.statusBannerSuccess
        ]}
      >
        <View
          style={[
            styles.statusIconCircle,
            isCancelledAppointment(appointment)
              ? styles.statusIconCircleDanger
              : styles.statusIconCircleSuccess
          ]}
        >
          <Text style={styles.statusIconText}>
            {isCancelledAppointment(appointment) ? "!" : "OK"}
          </Text>
        </View>
        <View style={styles.statusCopy}>
          <Text
            style={[
              styles.statusTitle,
              isCancelledAppointment(appointment)
                ? styles.statusTitleDanger
                : styles.statusTitleSuccess
            ]}
          >
            {formatAppointmentStatus(appointment.status)}
          </Text>
          <Text style={styles.statusText}>
            {isCancelledAppointment(appointment)
              ? appointment.cancellationReason || "This appointment has been cancelled."
              : "Your appointment is confirmed. We look forward to seeing you."}
          </Text>
        </View>
      </View>

      <View style={styles.doctorCard}>
        <Avatar
          imageUrl={appointment.doctor?.profileImageUrl}
          name={appointment.doctor?.fullName ?? "Doctor"}
          size={110}
        />
        <View style={styles.doctorCopy}>
          <Text style={styles.doctorName}>
            {[appointment.doctor?.title, appointment.doctor?.fullName]
              .filter(Boolean)
              .join(" ") || "Doctor"}
          </Text>
          <Text style={styles.doctorSpecialty}>
            {appointment.doctor?.specialties[0] ?? "General practice"}
          </Text>
          <Text style={styles.verifiedText}>Verified provider</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            favouriteMutation.mutate({
              doctorId: appointment.doctorId,
              isFavourite: !appointment.isFavouriteDoctor
            })
          }
          style={styles.favouriteButton}
        >
          <Text style={styles.favouriteButtonText}>
            {appointment.isFavouriteDoctor ? "Saved" : "Save"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.detailsCard}>
        <DetailRow icon="calendar" title="Date & Time">
          <Text style={styles.detailPrimary}>
            {formatPrettyDate(appointment.appointmentDate)}
          </Text>
          <Text style={styles.detailSecondary}>
            {trimSeconds(appointment.startTime)} - {trimSeconds(appointment.endTime)}
          </Text>
        </DetailRow>

        <Divider />

        <DetailRow icon="location" title="Clinic Location">
          <Text style={styles.detailPrimary}>
            {appointment.location?.name ?? appointment.location?.city ?? "Clinic location"}
          </Text>
          <Text style={styles.detailSecondary}>
            {appointment.location
              ? [appointment.location.address, appointment.location.city]
                  .filter(Boolean)
                  .join(", ")
              : "Location unavailable"}
          </Text>
          {appointment.location ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => openDirections(appointment)}
            >
              <Text style={styles.detailLink}>Get Directions</Text>
            </Pressable>
          ) : null}
        </DetailRow>

        <Divider />

        <DetailRow icon="bookmark" title="Reason for Visit">
          <Text style={styles.detailSecondary}>
            {appointment.reasonForVisit || "No reason provided."}
          </Text>
        </DetailRow>

        <Divider />

        <DetailRow icon="shield" title="Payment Method">
          <Text style={styles.detailPrimary}>
            {formatPaymentAmount(paymentPreview.amount, paymentPreview.currency)}
          </Text>
          <Text style={styles.detailSecondary}>{paymentPreview.methodLabel}</Text>
        </DetailRow>

        <Divider />

        <DetailRow icon="bell" title="Reminder">
          <Text style={styles.detailSecondary}>
            You will receive a reminder before your appointment.
          </Text>
        </DetailRow>
      </View>

      <View style={styles.referenceCard}>
        <View style={styles.referenceLeft}>
          <View style={styles.referenceIconCircle}>
            <PatientGlyph color={colors.info} name="bookmark" size={24} />
          </View>
          <View style={styles.referenceCopy}>
            <Text style={styles.referenceTitle}>Reference Number</Text>
            <Text style={styles.referenceValue}>{referenceNumber}</Text>
          </View>
        </View>
      </View>

      {appointment.status === "completed" ? (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>
            {appointment.review ? "Your review" : "Review this appointment"}
          </Text>

          {appointment.review ? (
            <View style={styles.reviewSubmittedBox}>
              <Badge label={formatRating(appointment.review.rating)} variant="success" />
              <Text style={styles.detailSecondary}>
                {appointment.review.comment || "No written comment."}
              </Text>
              <Badge
                label={appointment.review.isPublic ? "Public comment" : "Private comment"}
                variant={appointment.review.isPublic ? "success" : "neutral"}
              />
            </View>
          ) : (
            <View style={styles.reviewForm}>
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
                    <Text style={styles.visibilityLabel}>Comment visibility</Text>
                    <View style={styles.visibilityActions}>
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
        </View>
      ) : null}

      {canReschedule ? (
        <Button
          title="Reschedule"
          onPress={() =>
            Alert.alert(
              "Reschedule not available yet",
              "The backend is protected for rescheduling, but the reschedule flow is not implemented in this MVP."
            )
          }
          style={styles.primaryAction}
        />
      ) : null}

      {canCancel ? (
        <Button
          title="Cancel Appointment"
          variant="secondary"
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
      ) : (
        <Button
          title="Back to appointments"
          variant="ghost"
          onPress={() => router.push(ROUTES.patientAppointments)}
        />
      )}
    </Screen>
  );
}

function DetailRow({
  children,
  icon,
  title
}: {
  children: React.ReactNode;
  icon: "calendar" | "location" | "bookmark" | "shield" | "bell";
  title: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconCircle}>
        <PatientGlyph color={colors.info} name={icon} size={24} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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

function formatPrettyDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
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
  content: {
    gap: spacing.lg
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
  statusBanner: {
    flexDirection: "row",
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1
  },
  statusBannerSuccess: {
    backgroundColor: "#F0FBF7",
    borderColor: "#CFEFDB"
  },
  statusBannerDanger: {
    backgroundColor: "#FFF4F2",
    borderColor: "#F7D2CC"
  },
  statusIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  statusIconCircleSuccess: {
    backgroundColor: colors.success
  },
  statusIconCircleDanger: {
    backgroundColor: colors.danger
  },
  statusIconText: {
    color: colors.white,
    fontSize: 18,
    ...fontStyles.extraBold
  },
  statusCopy: {
    flex: 1,
    gap: spacing.sm
  },
  statusTitle: {
    fontSize: 18,
    ...fontStyles.extraBold
  },
  statusTitleSuccess: {
    color: colors.success
  },
  statusTitleDanger: {
    color: colors.danger
  },
  statusText: {
    color: "#415877",
    fontSize: 16,
    lineHeight: 26,
    ...fontStyles.regular
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: "#0D2557",
    fontSize: 28,
    lineHeight: 32,
    ...fontStyles.extraBold
  },
  doctorSpecialty: {
    color: "#415877",
    fontSize: 18,
    ...fontStyles.medium
  },
  verifiedText: {
    color: "#256DDE",
    fontSize: 17,
    ...fontStyles.medium
  },
  favouriteButton: {
    minWidth: 86,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#D6E8FF",
    backgroundColor: "#F8FBFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md
  },
  favouriteButtonText: {
    color: "#256DDE",
    fontSize: 15,
    ...fontStyles.bold
  },
  detailsCard: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl
  },
  detailRow: {
    flexDirection: "row",
    gap: spacing.lg
  },
  detailIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    justifyContent: "center"
  },
  detailCopy: {
    flex: 1,
    gap: spacing.xs
  },
  detailTitle: {
    color: "#102A35",
    fontSize: 18,
    ...fontStyles.bold
  },
  detailPrimary: {
    color: "#0D2557",
    fontSize: 17,
    lineHeight: 24,
    ...fontStyles.bold
  },
  detailSecondary: {
    color: "#556E9B",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.regular
  },
  detailLink: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EFF7"
  },
  referenceCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  referenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  referenceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    justifyContent: "center"
  },
  referenceCopy: {
    gap: spacing.xs
  },
  referenceTitle: {
    color: "#102A35",
    fontSize: 17,
    ...fontStyles.bold
  },
  referenceValue: {
    color: "#256DDE",
    fontSize: 16,
    ...fontStyles.medium
  },
  reviewCard: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl
  },
  reviewTitle: {
    color: "#0D2557",
    fontSize: 22,
    ...fontStyles.extraBold
  },
  reviewSubmittedBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#F8FBFF",
    padding: spacing.lg
  },
  reviewForm: {
    gap: spacing.md
  },
  reviewInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  visibilityBox: {
    gap: spacing.sm
  },
  visibilityLabel: {
    color: "#415877",
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  visibilityActions: {
    gap: spacing.sm
  },
  primaryAction: {
    minHeight: 68
  }
});

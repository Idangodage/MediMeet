import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, StyleSheet, Text, View } from "react-native";

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
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatRating,
  hideReview,
  listAdminReviews,
  type AdminReview
} from "@/services/review.service";

export function AdminReviewsScreen() {
  const queryClient = useQueryClient();
  const [moderationNote, setModerationNote] = useState("");
  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: listAdminReviews
  });
  const hideMutation = useMutation({
    mutationFn: hideReview,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["public-doctors"] })
      ]);
      Alert.alert("Review hidden", "The review is no longer shown publicly.");
    },
    onError: (error) => {
      Alert.alert(
        "Unable to hide review",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Review moderation</Text>
        <Text style={styles.title}>Patient reviews</Text>
        <Text style={styles.subtitle}>
          Platform admins can hide inappropriate public reviews while preserving
          the completed-appointment audit trail.
        </Text>
      </View>

      <Card title="Moderation note">
        <Input
          label="Reason for hiding"
          onChangeText={setModerationNote}
          placeholder="Optional audit note"
          value={moderationNote}
        />
      </Card>

      {reviewsQuery.isLoading ? <LoadingState message="Loading reviews..." /> : null}

      {reviewsQuery.isError ? (
        <ErrorState
          message={
            reviewsQuery.error instanceof Error
              ? reviewsQuery.error.message
              : "Unable to load reviews."
          }
          onRetry={() => void reviewsQuery.refetch()}
        />
      ) : null}

      {reviewsQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No reviews yet"
            message="Patient reviews will appear here after completed appointments."
          />
        </Card>
      ) : null}

      {reviewsQuery.data?.map((review) => (
        <AdminReviewCard
          isHiding={hideMutation.isPending}
          key={review.id}
          onHide={() =>
            hideMutation.mutate({
              reviewId: review.id,
              note: moderationNote
            })
          }
          review={review}
        />
      ))}
    </Screen>
  );
}

function AdminReviewCard({
  isHiding,
  onHide,
  review
}: {
  isHiding: boolean;
  onHide: () => void;
  review: AdminReview;
}) {
  return (
    <Card>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewCopy}>
          <Text style={styles.rowTitle}>{review.doctorName ?? "Doctor"}</Text>
          <Text style={styles.bodyText}>
            {review.doctorSpecialties.join(", ") || "Specialty not listed"}
          </Text>
        </View>
        <Badge label={formatRating(review.rating)} variant="success" />
        <Badge
          label={review.isPublic ? "Public" : "Hidden/private"}
          variant={review.isPublic ? "success" : "neutral"}
        />
      </View>

      <View style={styles.reviewBox}>
        <Text style={styles.bodyText}>
          {review.comment || "No written comment."}
        </Text>
      </View>

      <View style={styles.infoGrid}>
        <Info label="Patient" value={review.patientName ?? "Patient"} />
        <Info label="Created" value={formatDate(review.createdAt)} />
        <Info label="Appointment" value={review.appointmentId.slice(0, 8)} />
      </View>

      <Button
        title="Hide public review"
        variant="danger"
        disabled={!review.isPublic}
        isLoading={isHiding}
        onPress={() =>
          Alert.alert(
            "Hide this review?",
            "The review will stop appearing on public doctor profiles.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Hide review",
                style: "destructive",
                onPress: onHide
              }
            ]
          )
        }
      />
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  reviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  reviewCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 180
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  reviewBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
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
  }
});

import { useState } from "react";
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
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatAdminRole,
  formatReportStatus,
  listAdminReports,
  moderateDoctorProfile,
  reviewUserReport,
  type AdminReport,
  type ReportStatus
} from "@/services/admin.service";
import { formatVerificationStatus } from "@/services/verification.service";

const REPORT_FILTERS: Array<ReportStatus | "all"> = [
  "all",
  "open",
  "under_review",
  "resolved",
  "dismissed"
];

export function AdminReportsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [reviewNote, setReviewNote] = useState("");
  const reportsQuery = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: () => listAdminReports(statusFilter)
  });
  const reviewMutation = useMutation({
    mutationFn: reviewUserReport,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] })
      ]);
      Alert.alert("Report updated", "Reported profile review status was saved.");
    },
    onError: (error) => {
      Alert.alert(
        "Review failed",
        error instanceof Error ? error.message : "Unable to update report."
      );
    }
  });
  const moderationMutation = useMutation({
    mutationFn: moderateDoctorProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] })
      ]);
      Alert.alert("Doctor profile updated", "Moderation action was saved.");
    },
    onError: (error) => {
      Alert.alert(
        "Moderation failed",
        error instanceof Error ? error.message : "Unable to moderate profile."
      );
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Reports</Text>
        <Text style={styles.title}>Reported profiles</Text>
        <Text style={styles.subtitle}>
          Review user-submitted reports, update report status, and moderate
          reported doctor profiles when needed.
        </Text>
      </View>

      <Card title="Report controls">
        <View style={styles.filterRow}>
          {REPORT_FILTERS.map((status) => (
            <FilterPill
              isActive={statusFilter === status}
              key={status}
              label={status === "all" ? "All" : formatReportStatus(status)}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </View>
        <Input
          label="Review note"
          multiline
          numberOfLines={3}
          onChangeText={setReviewNote}
          placeholder="Optional note stored on the report and in audit metadata"
          style={styles.noteInput}
          value={reviewNote}
        />
      </Card>

      {reportsQuery.isLoading ? (
        <LoadingState message="Loading reported profiles..." />
      ) : null}

      {reportsQuery.isError ? (
        <ErrorState
          message={
            reportsQuery.error instanceof Error
              ? reportsQuery.error.message
              : "Unable to load reports."
          }
          onRetry={() => void reportsQuery.refetch()}
        />
      ) : null}

      {reportsQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No reports found"
            message="Reports matching this status will appear here."
          />
        </Card>
      ) : null}

      {reportsQuery.data?.map((report) => (
        <ReportCard
          isModerating={moderationMutation.isPending}
          isReviewing={reviewMutation.isPending}
          key={report.id}
          onModerateDoctor={() => {
            if (!report.reportedDoctorProfile) {
              return;
            }

            moderationMutation.mutate({
              doctorId: report.reportedDoctorProfile.id,
              isPublic: false,
              note: reviewNote,
              verificationStatus: "suspended"
            });
          }}
          onReview={(status) =>
            reviewMutation.mutate({
              reportId: report.id,
              status,
              note: reviewNote
            })
          }
          report={report}
        />
      ))}
    </Screen>
  );
}

function ReportCard({
  isModerating,
  isReviewing,
  onModerateDoctor,
  onReview,
  report
}: {
  isModerating: boolean;
  isReviewing: boolean;
  onModerateDoctor: () => void;
  onReview: (status: ReportStatus) => void;
  report: AdminReport;
}) {
  const reportedDoctorId = report.reportedDoctorProfile?.id;

  return (
    <Card>
      <View style={styles.reportHeader}>
        <View style={styles.reportCopy}>
          <Text style={styles.rowTitle}>Report #{report.id.slice(0, 8)}</Text>
          <Text style={styles.bodyText}>{report.reason}</Text>
        </View>
        <Badge
          label={formatReportStatus(report.status)}
          variant={getReportVariant(report.status)}
        />
      </View>

      <View style={styles.infoGrid}>
        <Info label="Reporter" value={formatUserIdentity(report.reporter)} />
        <Info label="Reported" value={formatUserIdentity(report.reported)} />
        <Info label="Created" value={formatDate(report.createdAt)} />
        <Info
          label="Appointment"
          value={report.appointmentId ? report.appointmentId.slice(0, 8) : "Not linked"}
        />
      </View>

      {report.reportedDoctorProfile ? (
        <View style={styles.doctorBox}>
          <View style={styles.reportHeader}>
            <View style={styles.reportCopy}>
              <Text style={styles.rowTitle}>
                {report.reportedDoctorProfile.fullName}
              </Text>
              <Text style={styles.bodyText}>
                {report.reportedDoctorProfile.specialties.join(", ") ||
                  "No specialty listed"}
              </Text>
            </View>
            <Badge
              label={formatVerificationStatus(
                report.reportedDoctorProfile.verificationStatus
              )}
              variant={getVerificationVariant(
                report.reportedDoctorProfile.verificationStatus
              )}
            />
            <Badge
              label={report.reportedDoctorProfile.isPublic ? "Public" : "Hidden"}
              variant={
                report.reportedDoctorProfile.isPublic ? "success" : "neutral"
              }
            />
          </View>
          <View style={styles.actionGrid}>
            <Button
              title="Open doctor review"
              variant="secondary"
              onPress={() => {
                if (reportedDoctorId) {
                  router.push(`/admin/verifications/${reportedDoctorId}`);
                }
              }}
            />
            <Button
              title="Suspend reported doctor"
              variant="danger"
              isLoading={isModerating}
              onPress={() =>
                Alert.alert(
                  "Suspend reported doctor?",
                  "This hides the public profile and sets verification to suspended.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Suspend",
                      style: "destructive",
                      onPress: onModerateDoctor
                    }
                  ]
                )
              }
            />
          </View>
        </View>
      ) : null}

      {report.adminNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.infoLabel}>Admin note</Text>
          <Text style={styles.bodyText}>{report.adminNote}</Text>
        </View>
      ) : null}

      <View style={styles.actionGrid}>
        <Button
          title="Mark under review"
          variant="secondary"
          isLoading={isReviewing}
          onPress={() => onReview("under_review")}
        />
        <Button
          title="Resolve"
          isLoading={isReviewing}
          onPress={() => onReview("resolved")}
        />
        <Button
          title="Dismiss"
          variant="ghost"
          isLoading={isReviewing}
          onPress={() => onReview("dismissed")}
        />
      </View>
    </Card>
  );
}

function FilterPill({
  isActive,
  label,
  onPress
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterPill, isActive ? styles.filterPillActive : null]}
    >
      <Text style={[styles.filterText, isActive ? styles.filterTextActive : null]}>
        {label}
      </Text>
    </Pressable>
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

function formatUserIdentity(user: AdminReport["reporter"]): string {
  if (!user) {
    return "Unavailable";
  }

  return `${user.fullName ?? user.email ?? "Unnamed user"} (${formatAdminRole(user.role)})`;
}

function getReportVariant(status: ReportStatus) {
  if (status === "resolved") {
    return "success";
  }

  if (status === "dismissed") {
    return "neutral";
  }

  if (status === "under_review") {
    return "warning";
  }

  return "danger";
}

function getVerificationVariant(status: string) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  if (status === "needs_review") {
    return "warning";
  }

  return "neutral";
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filterPill: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  filterTextActive: {
    color: colors.primaryDark
  },
  noteInput: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  reportHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  reportCopy: {
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
  doctorBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  noteBox: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  actionGrid: {
    gap: spacing.sm
  }
});

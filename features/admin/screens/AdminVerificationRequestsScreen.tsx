import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
import { colors, spacing, typography } from "@/constants/theme";
import {
  formatVerificationStatus,
  listPendingDoctorVerificationRequests,
  type DoctorVerificationRequest,
  type VerificationStatus
} from "@/services/verification.service";

export function AdminVerificationRequestsScreen() {
  const requestsQuery = useQuery({
    queryKey: ["admin-verification-requests"],
    queryFn: listPendingDoctorVerificationRequests
  });

  if (requestsQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading verification requests..." />
      </Screen>
    );
  }

  if (requestsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            requestsQuery.error instanceof Error
              ? requestsQuery.error.message
              : "Unable to load verification requests."
          }
          onRetry={() => void requestsQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Verification queue</Text>
        <Text style={styles.title}>Pending doctor reviews</Text>
        <Text style={styles.subtitle}>
          Review private documents, inspect doctor profile details, and update
          verification status.
        </Text>
      </View>

      {requestsQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No pending verification requests"
            message="Doctors with pending or needs-update verification documents will appear here."
          />
        </Card>
      ) : null}

      {requestsQuery.data?.map((request) => (
        <VerificationRequestCard key={request.doctor.id} request={request} />
      ))}

      <Button title="Back to admin dashboard" variant="ghost" onPress={() => router.push(ROUTES.adminHome)} />
    </Screen>
  );
}

function VerificationRequestCard({
  request
}: {
  request: DoctorVerificationRequest;
}) {
  const latestDocument = request.documents[0];

  return (
    <Card>
      <View style={styles.requestHeader}>
        <Avatar
          imageUrl={request.doctor.profileImageUrl}
          name={request.doctor.fullName}
          size={64}
        />
        <View style={styles.requestIdentity}>
          <Text style={styles.doctorName}>
            {[request.doctor.title, request.doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.bodyText}>
            {request.doctor.specialties.join(", ") || "Specialty not listed"}
          </Text>
        </View>
        <Badge
          label={formatVerificationStatus(request.doctor.verificationStatus)}
          variant={getStatusBadgeVariant(request.doctor.verificationStatus)}
        />
      </View>

      <View style={styles.infoGrid}>
        <Info
          label="Required docs"
          value={`${request.uploadedRequiredDocumentCount}/${request.requiredDocumentCount}`}
        />
        <Info label="Total uploads" value={String(request.documents.length)} />
        <Info label="Registration" value={request.doctor.registrationNumber} />
        <Info
          label="Latest upload"
          value={latestDocument ? formatDate(latestDocument.createdAt) : "No uploads"}
        />
      </View>

      <Button
        title="Open verification request"
        onPress={() => router.push(`/admin/verifications/${request.doctor.id}`)}
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

function getStatusBadgeVariant(status: VerificationStatus) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected") {
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
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  requestHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  requestIdentity: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
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
  }
});

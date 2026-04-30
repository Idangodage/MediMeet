import { useState } from "react";
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
import { moderateDoctorProfile } from "@/services/admin.service";
import {
  createVerificationDocumentSignedUrl,
  formatVerificationDocumentType,
  formatVerificationStatus,
  getAdminDoctorVerificationRequest,
  reviewDoctorVerificationRequest,
  type DoctorVerificationDocument,
  type VerificationStatus
} from "@/services/verification.service";

export function AdminVerificationDetailScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const queryClient = useQueryClient();
  const [verificationNote, setVerificationNote] = useState("");
  const requestQuery = useQuery({
    enabled: Boolean(doctorId),
    queryKey: ["admin-verification-request", doctorId],
    queryFn: () => getAdminDoctorVerificationRequest(doctorId ?? "")
  });
  const signedUrlMutation = useMutation({
    mutationFn: createVerificationDocumentSignedUrl,
    onSuccess: async (url) => {
      await Linking.openURL(url);
    },
    onError: (error) => {
      Alert.alert(
        "Unable to open document",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });
  const reviewMutation = useMutation({
    mutationFn: reviewDoctorVerificationRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin-verification-request", doctorId]
      });
      Alert.alert("Review saved", "Doctor verification status has been updated.");
    },
    onError: (error) => {
      Alert.alert(
        "Review failed",
        error instanceof Error ? error.message : "Unable to save review."
      );
    }
  });
  const moderationMutation = useMutation({
    mutationFn: (values: {
      isPublic?: boolean | null;
      verificationStatus?: VerificationStatus | null;
    }) => {
      return moderateDoctorProfile({
        doctorId: doctorId ?? "",
        note: verificationNote,
        ...values
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-verification-request", doctorId]
        }),
        queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] })
      ]);
      Alert.alert("Profile updated", "Doctor profile moderation was saved.");
    },
    onError: (error) => {
      Alert.alert(
        "Moderation failed",
        error instanceof Error ? error.message : "Unable to update profile."
      );
    }
  });

  if (!doctorId) {
    return (
      <Screen>
        <ErrorState message="Doctor id is missing." />
      </Screen>
    );
  }

  if (requestQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading verification request..." />
      </Screen>
    );
  }

  if (requestQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            requestQuery.error instanceof Error
              ? requestQuery.error.message
              : "Unable to load verification request."
          }
          onRetry={() => void requestQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!requestQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Verification request not found"
          message="This doctor profile does not exist or cannot be accessed."
        />
      </Screen>
    );
  }

  const request = requestQuery.data;
  const canApprove =
    request.uploadedRequiredDocumentCount === request.requiredDocumentCount &&
    request.documents.length > 0;

  const submitReview = (status: VerificationStatus) => {
    reviewMutation.mutate({
      doctorId: request.doctor.id,
      note: verificationNote,
      status
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Verification review</Text>
        <Text style={styles.title}>Review doctor credentials</Text>
        <Text style={styles.subtitle}>
          Open private documents through short-lived signed URLs. Guests and
          patients cannot access these files.
        </Text>
      </View>

      <Card style={styles.profileHero}>
        <View style={styles.profileHeader}>
          <Avatar
            imageUrl={request.doctor.profileImageUrl}
            name={request.doctor.fullName}
            size={84}
          />
          <View style={styles.profileIdentity}>
            <Badge
              label={formatVerificationStatus(request.doctor.verificationStatus)}
              variant={getStatusBadgeVariant(request.doctor.verificationStatus)}
            />
            <Text style={styles.name}>
              {[request.doctor.title, request.doctor.fullName].filter(Boolean).join(" ")}
            </Text>
            <Text style={styles.meta}>
              {request.doctor.email ?? "Email not available"}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <Info label="Registration" value={request.doctor.registrationNumber} />
          <Info label="Specialties" value={request.doctor.specialties.join(", ") || "Not listed"} />
          <Info label="Experience" value={`${request.doctor.yearsOfExperience} years`} />
          <Info label="Required docs" value={`${request.uploadedRequiredDocumentCount}/${request.requiredDocumentCount}`} />
          <Info label="Public visibility" value={request.doctor.isPublic ? "Public" : "Hidden"} />
        </View>
      </Card>

      <Card title="Doctor profile">
        <ProfileLine label="Qualifications" value={request.doctor.qualifications.join(", ") || "Not listed"} />
        <ProfileLine label="Subspecialties" value={request.doctor.subspecialties.join(", ") || "Not listed"} />
        <ProfileLine label="Languages" value={request.doctor.languages.join(", ") || "Not listed"} />
        <ProfileLine label="Services" value={request.doctor.services.join(", ") || "Not listed"} />
        <ProfileLine label="Consultation fee" value={`$${request.doctor.consultationFee.toFixed(2)}`} />
        <ProfileLine label="Biography" value={request.doctor.biography ?? "Not listed"} />
      </Card>

      <Card
        title="Uploaded documents"
        subtitle={`${request.documents.length} secure document uploads.`}
      >
        {request.documents.length > 0 ? (
          request.documents.map((document) => (
            <VerificationDocumentCard
              document={document}
              isOpening={signedUrlMutation.isPending}
              key={document.id}
              onOpen={() => signedUrlMutation.mutate(document.storagePath)}
            />
          ))
        ) : (
          <EmptyState
            title="No documents uploaded"
            message="Ask the doctor to upload required documents before approving."
          />
        )}
      </Card>

      <Card
        title="Admin review"
        subtitle="This note is visible to the doctor on their document status screen."
      >
        <Input
          label="Verification note"
          multiline
          numberOfLines={5}
          onChangeText={setVerificationNote}
          placeholder="Add a reason, evidence summary, or requested update."
          style={styles.noteInput}
          value={verificationNote}
        />
        {!canApprove ? (
          <Text style={styles.bodyText}>
            Approval is disabled until all required documents are uploaded.
          </Text>
        ) : null}
        <View style={styles.reviewActions}>
          <Button
            title="Approve"
            disabled={!canApprove}
            isLoading={reviewMutation.isPending}
            onPress={() => submitReview("approved")}
          />
          <Button
            title="Request update"
            variant="secondary"
            isLoading={reviewMutation.isPending}
            onPress={() => submitReview("needs_review")}
          />
          <Button
            title="Reject"
            variant="danger"
            isLoading={reviewMutation.isPending}
            onPress={() => submitReview("rejected")}
          />
        </View>
      </Card>

      <Card
        title="Profile moderation"
        subtitle="Publication and suspension changes are stored in audit logs."
      >
        <View style={styles.reviewActions}>
          <Button
            title="Publish verified profile"
            disabled={!canApprove}
            isLoading={moderationMutation.isPending}
            onPress={() =>
              moderationMutation.mutate({
                verificationStatus: "approved",
                isPublic: true
              })
            }
          />
          <Button
            title="Hide public profile"
            variant="secondary"
            disabled={!request.doctor.isPublic}
            isLoading={moderationMutation.isPending}
            onPress={() => moderationMutation.mutate({ isPublic: false })}
          />
          <Button
            title="Suspend doctor profile"
            variant="danger"
            isLoading={moderationMutation.isPending}
            onPress={() =>
              Alert.alert(
                "Suspend doctor profile?",
                "This hides the profile and blocks public discovery until an admin restores it.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Suspend",
                    style: "destructive",
                    onPress: () =>
                      moderationMutation.mutate({
                        verificationStatus: "suspended",
                        isPublic: false
                      })
                  }
                ]
              )
            }
          />
        </View>
      </Card>

      <Button title="Back to queue" variant="ghost" onPress={() => router.push(ROUTES.adminVerifications)} />
    </Screen>
  );
}

function VerificationDocumentCard({
  document,
  isOpening,
  onOpen
}: {
  document: DoctorVerificationDocument;
  isOpening: boolean;
  onOpen: () => void;
}) {
  return (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentCopy}>
          <Text style={styles.documentName}>
            {formatVerificationDocumentType(document.documentType)}
          </Text>
          <Text style={styles.bodyText}>{document.fileName ?? "Uploaded file"}</Text>
          <Text style={styles.bodyText}>Uploaded {formatDate(document.createdAt)}</Text>
        </View>
        <Badge
          label={formatVerificationStatus(document.status)}
          variant={getStatusBadgeVariant(document.status)}
        />
      </View>
      {document.verificationNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Previous note</Text>
          <Text style={styles.bodyText}>{document.verificationNote}</Text>
        </View>
      ) : null}
      <Button
        title="Open secure document"
        variant="secondary"
        isLoading={isOpening}
        onPress={onOpen}
      />
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

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.bodyText}>{value}</Text>
    </View>
  );
}

function getStatusBadgeVariant(status: VerificationStatus) {
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
    gap: spacing.sm,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
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
    letterSpacing: -0.5,
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  profileHero: {
    borderColor: colors.border,
    backgroundColor: colors.primaryTint
  },
  profileHeader: {
    flexDirection: "row",
    gap: spacing.lg
  },
  profileIdentity: {
    flex: 1,
    gap: spacing.sm
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  meta: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "800"
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
  profileLine: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  documentCard: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  documentHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  documentCopy: {
    flex: 1,
    gap: spacing.xs
  },
  documentName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  noteBox: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  noteLabel: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  noteInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  reviewActions: {
    gap: spacing.sm
  }
});

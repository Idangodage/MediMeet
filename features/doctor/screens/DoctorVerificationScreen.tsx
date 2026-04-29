import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  createVerificationDocumentSignedUrl,
  formatVerificationStatus,
  getLatestDocumentByType,
  getOwnDoctorVerification,
  uploadDoctorVerificationDocument,
  VERIFICATION_DOCUMENT_REQUIREMENTS,
  type DoctorVerificationDocument,
  type VerificationDocumentType,
  type VerificationStatus
} from "@/services/verification.service";

const verificationQueryKey = ["own-doctor-verification"];

export function DoctorVerificationScreen() {
  const queryClient = useQueryClient();
  const verificationQuery = useQuery({
    queryKey: verificationQueryKey,
    queryFn: getOwnDoctorVerification
  });
  const uploadMutation = useMutation({
    mutationFn: uploadDoctorVerificationDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: verificationQueryKey });
      Alert.alert("Document uploaded", "Your verification document is pending review.");
    },
    onError: (error) => {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Unable to upload this document."
      );
    }
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

  const pickDocument = async (documentType: VerificationDocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset) {
      return;
    }

    uploadMutation.mutate({
      documentType,
      asset: {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size
      }
    });
  };

  if (verificationQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading verification documents..." />
      </Screen>
    );
  }

  if (verificationQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            verificationQuery.error instanceof Error
              ? verificationQuery.error.message
              : "Unable to load verification documents."
          }
          onRetry={() => void verificationQuery.refetch()}
        />
      </Screen>
    );
  }

  const verification = verificationQuery.data;

  if (!verification) {
    return (
      <Screen>
        <EmptyState
          title="Verification unavailable"
          message="Complete doctor onboarding before uploading documents."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Doctor verification</Text>
        <Text style={styles.title}>Upload secure verification documents</Text>
        <Text style={styles.subtitle}>
          Documents are stored in a private Supabase Storage bucket. Only you and
          platform admins can access them.
        </Text>
      </View>

      <Card
        title="Verification status"
        subtitle={`${verification.uploadedRequiredDocumentCount} of ${verification.requiredDocumentCount} required documents uploaded.`}
      >
        <View style={styles.statusRow}>
          <Badge
            label={formatVerificationStatus(verification.doctor.verificationStatus)}
            variant={getStatusBadgeVariant(verification.doctor.verificationStatus)}
          />
          <Text style={styles.bodyText}>
            Admin review updates your profile verification status.
          </Text>
        </View>
      </Card>

      {VERIFICATION_DOCUMENT_REQUIREMENTS.map((requirement) => {
        const latestDocument = getLatestDocumentByType(
          verification.documents,
          requirement.type
        );

        return (
          <DocumentRequirementCard
            document={latestDocument}
            isOpening={signedUrlMutation.isPending}
            isUploading={
              uploadMutation.isPending &&
              uploadMutation.variables?.documentType === requirement.type
            }
            key={requirement.type}
            onOpen={(document) => signedUrlMutation.mutate(document.storagePath)}
            onUpload={() => void pickDocument(requirement.type)}
            requirementLabel={requirement.label}
            requirementDescription={requirement.description}
            required={requirement.required}
          />
        );
      })}

      <Button title="Back to dashboard" variant="ghost" onPress={() => router.push(ROUTES.doctorHome)} />
    </Screen>
  );
}

function DocumentRequirementCard({
  document,
  isOpening,
  isUploading,
  onOpen,
  onUpload,
  required,
  requirementDescription,
  requirementLabel
}: {
  document: DoctorVerificationDocument | null;
  isOpening: boolean;
  isUploading: boolean;
  onOpen: (document: DoctorVerificationDocument) => void;
  onUpload: () => void;
  required: boolean;
  requirementDescription: string;
  requirementLabel: string;
}) {
  return (
    <Card
      title={requirementLabel}
      subtitle={required ? "Required document" : "Optional document"}
    >
      <Text style={styles.bodyText}>{requirementDescription}</Text>

      {document ? (
        <View style={styles.documentBox}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentName}>
              {document.fileName ?? "Uploaded document"}
            </Text>
            <Badge
              label={formatVerificationStatus(document.status)}
              variant={getStatusBadgeVariant(document.status)}
            />
          </View>
          <Text style={styles.bodyText}>Uploaded {formatDate(document.createdAt)}</Text>
          {document.verificationNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Admin note</Text>
              <Text style={styles.bodyText}>{document.verificationNote}</Text>
            </View>
          ) : null}
          <View style={styles.documentActions}>
            <Button
              title="Open securely"
              variant="secondary"
              isLoading={isOpening}
              onPress={() => onOpen(document)}
            />
            <Button title="Upload replacement" isLoading={isUploading} onPress={onUpload} />
          </View>
        </View>
      ) : (
        <View style={styles.emptyDocumentBox}>
          <Badge label="Not uploaded" variant={required ? "warning" : "neutral"} />
          <Button title="Upload document" isLoading={isUploading} onPress={onUpload} />
        </View>
      )}
    </Card>
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
  statusRow: {
    gap: spacing.md
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  documentBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  emptyDocumentBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  documentHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  documentName: {
    flex: 1,
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
  documentActions: {
    gap: spacing.sm
  }
});

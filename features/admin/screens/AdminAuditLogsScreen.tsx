import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatAdminRole,
  formatAuditAction,
  listAuditLogs,
  type AdminAuditLog
} from "@/services/admin.service";

export function AdminAuditLogsScreen() {
  const auditQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => listAuditLogs(150)
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Audit logs</Text>
        <Text style={styles.title}>Sensitive admin activity</Text>
        <Text style={styles.subtitle}>
          Sensitive platform-admin changes are recorded by database triggers and
          explicit admin review RPCs.
        </Text>
      </View>

      {auditQuery.isLoading ? <LoadingState message="Loading audit logs..." /> : null}

      {auditQuery.isError ? (
        <ErrorState
          message={
            auditQuery.error instanceof Error
              ? auditQuery.error.message
              : "Unable to load audit logs."
          }
          onRetry={() => void auditQuery.refetch()}
        />
      ) : null}

      {auditQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No audit logs yet"
            message="Admin changes to sensitive resources will appear here."
          />
        </Card>
      ) : null}

      {auditQuery.data?.map((log) => (
        <AuditLogCard key={log.id} log={log} />
      ))}
    </Screen>
  );
}

function AuditLogCard({ log }: { log: AdminAuditLog }) {
  return (
    <Card>
      <View style={styles.logHeader}>
        <View style={styles.logCopy}>
          <Text style={styles.rowTitle}>{formatAuditAction(log.action)}</Text>
          <Text style={styles.bodyText}>{formatDate(log.createdAt)}</Text>
        </View>
        <Badge label={log.resourceType} variant="neutral" />
      </View>

      <View style={styles.infoGrid}>
        <Info
          label="Actor"
          value={
            log.actor
              ? `${log.actor.fullName ?? log.actor.email ?? "Unknown"} (${formatAdminRole(log.actor.role)})`
              : "System or unavailable"
          }
        />
        <Info label="Resource ID" value={log.resourceId ?? "Not linked"} />
      </View>

      <View style={styles.metadataBox}>
        <Text style={styles.infoLabel}>Metadata preview</Text>
        <Text style={styles.metadataText}>{formatMetadata(log.metadata)}</Text>
      </View>
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

function formatMetadata(metadata: unknown): string {
  try {
    const serialized = JSON.stringify(metadata, null, 2);
    return serialized.length > 900
      ? `${serialized.slice(0, 900)}...`
      : serialized;
  } catch {
    return "Metadata could not be displayed.";
  }
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
  logHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  logCopy: {
    flex: 1,
    gap: spacing.xs
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
  metadataBox: {
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  metadataText: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18
  }
});

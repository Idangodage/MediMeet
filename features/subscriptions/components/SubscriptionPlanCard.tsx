import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, ErrorState, LoadingState } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  canAccessClinicDashboard,
  canUseFeaturedListing,
  canViewAnalytics,
  formatSubscriptionStatus,
  getOwnClinicSubscriptionContext,
  getOwnDoctorSubscriptionContext,
  type EffectiveSubscription
} from "@/services/subscription.service";

type SubscriptionPlanCardProps = {
  scope: "doctor" | "clinic";
};

export function SubscriptionPlanCard({ scope }: SubscriptionPlanCardProps) {
  const subscriptionQuery = useQuery({
    queryKey: [`${scope}-subscription-context`],
    queryFn: async (): Promise<EffectiveSubscription> =>
      scope === "doctor"
        ? getOwnDoctorSubscriptionContext()
        : getOwnClinicSubscriptionContext()
  });

  return (
    <Card
      title="Subscription plan"
      subtitle="Expired or inactive subscriptions fall back to Free without deleting appointments."
    >
      {subscriptionQuery.isLoading ? (
        <LoadingState message="Loading subscription plan..." />
      ) : null}

      {subscriptionQuery.isError ? (
        <ErrorState
          message={
            subscriptionQuery.error instanceof Error
              ? subscriptionQuery.error.message
              : "Unable to load subscription plan."
          }
          onRetry={() => void subscriptionQuery.refetch()}
        />
      ) : null}

      {subscriptionQuery.data ? (
        <PlanSummary subscription={subscriptionQuery.data} />
      ) : null}
    </Card>
  );
}

function PlanSummary({
  subscription
}: {
  subscription: EffectiveSubscription;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.planHeader}>
        <View style={styles.planCopy}>
          <Text style={styles.planName}>{subscription.plan.name}</Text>
          <Text style={styles.bodyText}>{subscription.plan.description}</Text>
        </View>
        <Badge
          label={formatSubscriptionStatus(subscription)}
          variant={subscription.isDowngradedToFree ? "warning" : "success"}
        />
      </View>

      {subscription.isDowngradedToFree ? (
        <View style={styles.warningBox}>
          <Badge label="Premium disabled" variant="warning" />
          <Text style={styles.bodyText}>
            Existing appointments remain intact. Premium limits and capabilities
            are disabled until a valid subscription is restored.
          </Text>
        </View>
      ) : null}

      <View style={styles.limitGrid}>
        <Limit label="Locations" value={subscription.plan.limits.max_locations} />
        <Limit
          label="Monthly bookings"
          value={subscription.plan.limits.max_monthly_bookings}
        />
      </View>

      <View style={styles.features}>
        <Feature label="Analytics" enabled={canViewAnalytics(subscription)} />
        <Feature
          label="Featured listing"
          enabled={canUseFeaturedListing(subscription)}
        />
        <Feature
          label="Automated reminders"
          enabled={subscription.plan.limits.reminders_enabled}
        />
        <Feature
          label="Clinic management"
          enabled={canAccessClinicDashboard(subscription)}
        />
      </View>
    </View>
  );
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.limit}>
      <Text style={styles.limitValue}>{value}</Text>
      <Text style={styles.limitLabel}>{label}</Text>
    </View>
  );
}

function Feature({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{label}</Text>
      <Badge label={enabled ? "Enabled" : "Disabled"} variant={enabled ? "success" : "neutral"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg
  },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  planCopy: {
    flex: 1,
    gap: spacing.xs
  },
  planName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  warningBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  limitGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  limit: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  limitValue: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  limitLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  features: {
    gap: spacing.sm
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  featureLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  }
});

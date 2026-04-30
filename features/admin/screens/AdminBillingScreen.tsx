import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  getAdminBillingOverview,
  type AdminBillingOverview,
  type AdminBillingRevenueByPlan
} from "@/services/subscription.service";

export function AdminBillingScreen() {
  const billingQuery = useQuery({
    queryKey: ["admin-billing-overview"],
    queryFn: getAdminBillingOverview
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Platform billing</Text>
        <Text style={styles.title}>Stripe subscription overview</Text>
        <Text style={styles.subtitle}>
          Operational billing data is sourced from local subscription, invoice,
          and payment rows written by Stripe webhooks.
        </Text>
      </View>

      {billingQuery.isLoading ? (
        <LoadingState message="Loading billing overview..." />
      ) : null}

      {billingQuery.isError ? (
        <ErrorState
          message={
            billingQuery.error instanceof Error
              ? billingQuery.error.message
              : "Unable to load billing overview."
          }
          onRetry={() => void billingQuery.refetch()}
        />
      ) : null}

      {billingQuery.data ? <BillingOverview data={billingQuery.data} /> : null}
    </Screen>
  );
}

function BillingOverview({ data }: { data: AdminBillingOverview }) {
  return (
    <>
      <Card title="Subscription health" subtitle="Counts by billing lifecycle state.">
        <View style={styles.statGrid}>
          <Stat label="Active" value={data.activeSubscriptions} variant="success" />
          <Stat label="Past due" value={data.pastDueSubscriptions} variant="warning" />
          <Stat label="Cancelled" value={data.cancelledSubscriptions} variant="danger" />
          <Stat label="Trial users" value={data.trialUsers} variant="neutral" />
        </View>
      </Card>

      <Card title="Revenue by plan" subtitle="Paid invoice totals grouped by plan.">
        {data.revenueByPlan.length === 0 ? (
          <EmptyState
            title="No paid invoices yet"
            message="Revenue totals will populate after invoice.payment_succeeded webhooks are processed."
          />
        ) : null}

        {data.revenueByPlan.map((item) => (
          <RevenueRow key={`${item.planId}:${item.currency}`} item={item} />
        ))}
      </Card>

      <Card title="Recent subscriptions" subtitle="Latest subscription records.">
        {data.subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            message="Checkout and webhook events will create subscription rows here."
          />
        ) : null}

        {data.subscriptions.slice(0, 12).map((subscription) => (
          <View key={subscription.id} style={styles.subscriptionRow}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{subscription.plan_name}</Text>
              <Text style={styles.bodyText}>
                {subscription.doctor_id ? "Doctor" : "Clinic"} billing account
                {subscription.current_period_end
                  ? ` - renews ${formatDate(subscription.current_period_end)}`
                  : ""}
              </Text>
            </View>
            <Badge
              label={formatStatus(subscription.status)}
              variant={getSubscriptionVariant(subscription.status)}
            />
          </View>
        ))}
      </Card>

      <Card title="Failed payments" subtitle="Recent failed Stripe payment records.">
        {data.failedPayments.length === 0 ? (
          <EmptyState
            title="No failed payments"
            message="Failed subscription or appointment payments will appear here."
          />
        ) : null}

        {data.failedPayments.map((payment) => (
          <View key={payment.id} style={styles.subscriptionRow}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>
                {payment.payment_type} payment failed
              </Text>
              <Text style={styles.bodyText}>
                {payment.provider_payment_id ?? "No provider payment id"} -{" "}
                {formatDate(payment.created_at)}
              </Text>
            </View>
            <Text style={styles.money}>
              {formatMoney(Number(payment.amount), payment.currency)}
            </Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function Stat({
  label,
  value,
  variant
}: {
  label: string;
  value: number;
  variant: "danger" | "neutral" | "success" | "warning";
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Badge label={label} variant={variant} />
    </View>
  );
}

function RevenueRow({ item }: { item: AdminBillingRevenueByPlan }) {
  return (
    <View style={styles.subscriptionRow}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{item.planName}</Text>
        <Text style={styles.bodyText}>Paid Stripe invoices</Text>
      </View>
      <Text style={styles.money}>{formatMoney(item.amount, item.currency)}</Text>
    </View>
  );
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency"
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSubscriptionVariant(status: string) {
  if (status === "active" || status === "trialing") {
    return "success";
  }

  if (status === "past_due" || status === "suspended") {
    return "warning";
  }

  if (status === "cancelled" || status === "expired") {
    return "danger";
  }

  return "neutral";
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
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  stat: {
    minWidth: "45%",
    flex: 1,
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  subscriptionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  money: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  }
});

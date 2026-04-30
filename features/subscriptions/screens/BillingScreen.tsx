import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ExpoLinking from "expo-linking";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId
} from "@/constants/subscriptions";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  createStripeCheckoutSessionUrl,
  createStripePortalSessionUrl,
  formatSubscriptionStatus,
  getClinicBillingData,
  getDoctorBillingData,
  type BillingData,
  type BillingInvoice,
  type BillingScope,
  type BillablePlanId
} from "@/services/subscription.service";

type BillingScreenProps = {
  scope: BillingScope;
};

const doctorUpgradePlans: BillablePlanId[] = ["basic", "pro"];
const clinicUpgradePlans: BillablePlanId[] = ["clinic"];

export function BillingScreen({ scope }: BillingScreenProps) {
  const queryClient = useQueryClient();
  const billingPath = scope === "doctor" ? "doctor/billing" : "clinic/billing";
  const returnUrl = ExpoLinking.createURL(billingPath);
  const billingQuery = useQuery({
    queryKey: [scope, "billing"],
    queryFn: () => (scope === "doctor" ? getDoctorBillingData() : getClinicBillingData())
  });
  const checkoutMutation = useMutation({
    mutationFn: async (planId: BillablePlanId) => {
      const url = await createStripeCheckoutSessionUrl({
        cancelUrl: returnUrl,
        planId,
        scope,
        successUrl: returnUrl
      });
      await Linking.openURL(url);
    },
    onError: showMutationError
  });
  const portalMutation = useMutation({
    mutationFn: async () => {
      const url = await createStripePortalSessionUrl({
        returnUrl,
        scope
      });
      await Linking.openURL(url);
    },
    onError: showMutationError
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {scope === "doctor" ? "Doctor billing" : "Clinic billing"}
        </Text>
        <Text style={styles.title}>Subscription management</Text>
        <Text style={styles.subtitle}>
          Stripe Checkout and the customer portal handle payment collection and
          card updates. MediMeet stores subscription state and invoice history only.
        </Text>
      </View>

      {billingQuery.isLoading ? (
        <LoadingState message="Loading billing account..." />
      ) : null}

      {billingQuery.isError ? (
        <ErrorState
          message={
            billingQuery.error instanceof Error
              ? billingQuery.error.message
              : "Unable to load billing data."
          }
          onRetry={() => void billingQuery.refetch()}
        />
      ) : null}

      {billingQuery.data ? (
        <>
          <CurrentPlanCard
            data={billingQuery.data}
            onOpenPortal={() => portalMutation.mutate()}
            portalLoading={portalMutation.isPending}
          />

          <UpgradePlansCard
            currentPlanId={billingQuery.data.subscription.planId}
            disabled={checkoutMutation.isPending}
            onUpgrade={(planId) => checkoutMutation.mutate(planId)}
            plans={scope === "doctor" ? doctorUpgradePlans : clinicUpgradePlans}
          />

          <InvoiceHistoryCard invoices={billingQuery.data.invoices} />

          <Button
            title="Refresh billing status"
            variant="secondary"
            onPress={() => {
              void queryClient.invalidateQueries({ queryKey: [scope, "billing"] });
              void queryClient.invalidateQueries({
                queryKey: [`${scope}-subscription-context`]
              });
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

function CurrentPlanCard({
  data,
  onOpenPortal,
  portalLoading
}: {
  data: BillingData;
  onOpenPortal: () => void;
  portalLoading: boolean;
}) {
  const subscription = data.subscription;

  return (
    <Card
      title="Current plan"
      subtitle="Use the Stripe customer portal to cancel or update payment details."
    >
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

      <View style={styles.metaGrid}>
        <Meta label="Status" value={formatSubscriptionStatus(subscription)} />
        <Meta
          label="Renewal date"
          value={
            subscription.currentPeriodEnd
              ? formatDate(subscription.currentPeriodEnd)
              : "Not scheduled"
          }
        />
      </View>

      <Button
        title="Open Stripe customer portal"
        variant="secondary"
        isLoading={portalLoading}
        onPress={onOpenPortal}
      />
    </Card>
  );
}

function UpgradePlansCard({
  currentPlanId,
  disabled,
  onUpgrade,
  plans
}: {
  currentPlanId: SubscriptionPlanId;
  disabled: boolean;
  onUpgrade: (planId: BillablePlanId) => void;
  plans: BillablePlanId[];
}) {
  return (
    <Card
      title="Upgrade plan"
      subtitle="Checkout sessions are hosted by Stripe; card details are not stored in MediMeet."
    >
      {plans.map((planId) => {
        const plan = SUBSCRIPTION_PLANS[planId];
        const isCurrent = currentPlanId === planId;

        return (
          <View key={planId} style={styles.planOption}>
            <View style={styles.planCopy}>
              <Text style={styles.optionTitle}>{plan.name}</Text>
              <Text style={styles.bodyText}>{plan.description}</Text>
              <View style={styles.featureLine}>
                <Badge
                  label={`${plan.limits.max_locations} locations`}
                  variant="neutral"
                />
                <Badge
                  label={`${plan.limits.max_monthly_bookings} slots/month`}
                  variant="neutral"
                />
              </View>
            </View>
            <Button
              title={isCurrent ? "Current plan" : "Upgrade"}
              disabled={disabled || isCurrent}
              isLoading={disabled && !isCurrent}
              onPress={() => onUpgrade(planId)}
            />
          </View>
        );
      })}
    </Card>
  );
}

function InvoiceHistoryCard({ invoices }: { invoices: BillingInvoice[] }) {
  return (
    <Card title="Invoice history" subtitle="Invoices are written from Stripe webhooks.">
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          message="Paid and failed subscription invoices will appear after Stripe webhook events are processed."
        />
      ) : null}

      {invoices.map((invoice) => (
        <View key={invoice.id} style={styles.invoiceRow}>
          <View style={styles.planCopy}>
            <Text style={styles.optionTitle}>
              {formatMoney(invoice.amount, invoice.currency)}
            </Text>
            <Text style={styles.bodyText}>
              {formatDate(invoice.createdAt)}
              {invoice.periodStart && invoice.periodEnd
                ? ` - ${formatDate(invoice.periodStart)} to ${formatDate(invoice.periodEnd)}`
                : ""}
            </Text>
          </View>
          <View style={styles.invoiceActions}>
            <Badge label={formatStatus(invoice.status)} variant={getInvoiceVariant(invoice.status)} />
            {invoice.invoiceUrl ? (
              <Button
                title="Open"
                variant="ghost"
                onPress={() => void Linking.openURL(invoice.invoiceUrl as string)}
              />
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function showMutationError(error: Error) {
  Alert.alert("Billing action failed", error.message);
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

function getInvoiceVariant(status: BillingInvoice["status"]) {
  if (status === "paid") {
    return "success";
  }

  if (status === "open") {
    return "warning";
  }

  if (status === "void" || status === "uncollectible") {
    return "danger";
  }

  return "neutral";
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
    letterSpacing: -0.5
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
  metaGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  metaItem: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  metaValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  planOption: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  featureLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  invoiceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md
  },
  invoiceActions: {
    alignItems: "flex-end",
    gap: spacing.sm
  }
});

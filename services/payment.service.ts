import {
  APPOINTMENT_PAYMENT_MODE,
  PAYMENT_PROVIDER_CONFIGS
} from "@/constants/payments";
import type { PaymentProvider } from "@/constants/payments";

export type AppointmentPaymentPreview = {
  amount: number;
  currency: string;
  methodLabel: string;
  provider: PaymentProvider;
  providerLabel: string;
  note: string;
  onlinePaymentEnabled: boolean;
};

export function getAppointmentPaymentPreview({
  amount,
  currency = "USD"
}: {
  amount: number;
  currency?: string;
}): AppointmentPaymentPreview {
  const provider = PAYMENT_PROVIDER_CONFIGS.manual;

  return {
    amount,
    currency,
    methodLabel: APPOINTMENT_PAYMENT_MODE.label,
    provider: provider.id,
    providerLabel: provider.label,
    note: APPOINTMENT_PAYMENT_MODE.helperText,
    onlinePaymentEnabled: APPOINTMENT_PAYMENT_MODE.onlinePaymentEnabled
  };
}

export function formatPaymentAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency"
  }).format(amount);
}

export async function createAppointmentPaymentSession(): Promise<never> {
  throw new Error(
    "Online appointment payments are not active in the MVP. Use pay at clinic."
  );
}

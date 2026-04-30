import type { Database } from "@/types/supabase";

export type PaymentProvider = Database["public"]["Enums"]["payment_provider"];
export type PaymentType = Database["public"]["Enums"]["payment_type"];
export type AppointmentPaymentMode = "pay_at_clinic" | "online";

export type PaymentProviderConfig = {
  id: PaymentProvider;
  label: string;
  supportsAppointmentPayments: boolean;
  supportsSubscriptionPayments: boolean;
  isOnline: boolean;
  isEnabledForMvpAppointments: boolean;
};

export const APPOINTMENT_PAYMENT_MODE: {
  id: AppointmentPaymentMode;
  label: string;
  helperText: string;
  onlinePaymentEnabled: boolean;
} = {
  id: "pay_at_clinic",
  label: "Pay at clinic",
  helperText: "Online payment coming later",
  onlinePaymentEnabled: false
};

export const PAYMENT_PROVIDER_CONFIGS: Record<
  PaymentProvider,
  PaymentProviderConfig
> = {
  stripe: {
    id: "stripe",
    label: "Stripe",
    supportsAppointmentPayments: true,
    supportsSubscriptionPayments: true,
    isOnline: true,
    isEnabledForMvpAppointments: false
  },
  paytrail: {
    id: "paytrail",
    label: "Paytrail",
    supportsAppointmentPayments: true,
    supportsSubscriptionPayments: false,
    isOnline: true,
    isEnabledForMvpAppointments: false
  },
  manual: {
    id: "manual",
    label: "Manual / pay at clinic",
    supportsAppointmentPayments: true,
    supportsSubscriptionPayments: false,
    isOnline: false,
    isEnabledForMvpAppointments: true
  },
  other: {
    id: "other",
    label: "Other provider",
    supportsAppointmentPayments: true,
    supportsSubscriptionPayments: false,
    isOnline: true,
    isEnabledForMvpAppointments: false
  }
};

export const FUTURE_APPOINTMENT_PAYMENT_TYPES: PaymentType[] = [
  "appointment",
  "deposit",
  "cancellation_fee",
  "platform_fee"
];

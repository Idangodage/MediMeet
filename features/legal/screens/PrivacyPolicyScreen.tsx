import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";

export function PrivacyPolicyScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Badge label="Privacy" variant="primary" />
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>
          MediMeet is designed for doctor discovery and appointment booking.
          Appointment and profile data are protected with role-based access and
          Supabase Row Level Security.
        </Text>
      </View>

      <PolicySection title="Data we collect">
        <PolicyText>
          Account details, role, profile information, doctor credentials,
          verification document metadata, clinic details, availability,
          appointments, reviews, notifications, subscription state, and audit
          logs needed to operate the platform.
        </PolicyText>
      </PolicySection>

      <PolicySection title="How data is used">
        <PolicyText>
          Data is used to authenticate users, show public verified doctor
          profiles, process appointment booking, manage clinic/doctor workflows,
          support platform administration, and maintain security audit history.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Access controls">
        <PolicyText>
          Patients can access only their own appointment and patient profile
          data. Doctors can access only their own profile, availability, and
          appointment-related patient details. Clinic admins are scoped to their
          clinics. Platform admins are restricted to operational workflows.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Payments and documents">
        <PolicyText>
          Card details are not stored in MediMeet. Subscription billing uses
          Stripe-hosted checkout and portal flows. Doctor verification documents
          are stored in private Supabase Storage buckets and are not public.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Healthcare disclaimer">
        <PolicyText>
          This platform is for doctor discovery and appointment booking only. It
          is not for emergency medical care.
        </PolicyText>
      </PolicySection>

      <View style={styles.actions}>
        <Link href={ROUTES.terms} asChild>
          <Button title="View terms" variant="secondary" />
        </Link>
        <Link href={ROUTES.guestHome} asChild>
          <Button title="Back to home" variant="ghost" />
        </Link>
      </View>
    </Screen>
  );
}

function PolicySection({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return <Card title={title}>{children}</Card>;
}

function PolicyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 36
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
  actions: {
    gap: spacing.md
  }
});

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";

export function TermsAndConditionsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Badge label="Terms" variant="primary" />
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.subtitle}>
          These MVP terms describe the intended platform behavior for testing
          and deployment readiness. Replace with legal counsel-approved terms
          before public launch.
        </Text>
      </View>

      <TermsSection title="Platform purpose">
        <TermsText>
          MediMeet helps users discover doctors, review public verified doctor
          profiles, and book private-practice appointments. It is not a medical
          advice, diagnosis, treatment, emergency, or telemedicine record system.
        </TermsText>
      </TermsSection>

      <TermsSection title="Healthcare disclaimer">
        <TermsText>
          This platform is for doctor discovery and appointment booking only. It
          is not for emergency medical care.
        </TermsText>
      </TermsSection>

      <TermsSection title="User responsibilities">
        <TermsText>
          Users must provide accurate account, profile, booking, and clinic
          information. Patients should contact emergency services or a local
          emergency provider for urgent or life-threatening medical issues.
        </TermsText>
      </TermsSection>

      <TermsSection title="Doctor and clinic responsibilities">
        <TermsText>
          Doctors and clinics are responsible for keeping profile details,
          qualifications, locations, availability, and appointment outcomes
          accurate. Verification approval is an operational trust signal, not a
          guarantee of medical outcome.
        </TermsText>
      </TermsSection>

      <TermsSection title="Payments">
        <TermsText>
          The MVP supports subscription billing through Stripe-hosted checkout
          for doctors and clinics. Appointment payments are not active online;
          patients pay at the clinic unless a future online payment workflow is
          enabled.
        </TermsText>
      </TermsSection>

      <TermsSection title="Account and access controls">
        <TermsText>
          Role-based access controls restrict patient, doctor, clinic admin, and
          platform admin workspaces. The platform may suspend, hide, or restrict
          profiles during verification, billing, report, or safety reviews.
        </TermsText>
      </TermsSection>

      <View style={styles.actions}>
        <Link href={ROUTES.privacy} asChild>
          <Button title="View privacy policy" variant="secondary" />
        </Link>
        <Link href={ROUTES.guestHome} asChild>
          <Button title="Back to home" variant="ghost" />
        </Link>
      </View>
    </Screen>
  );
}

function TermsSection({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return <Card title={title}>{children}</Card>;
}

function TermsText({ children }: { children: React.ReactNode }) {
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

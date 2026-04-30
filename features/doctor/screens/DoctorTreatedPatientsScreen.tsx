import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
  listDoctorTreatedPatients,
  type DoctorTreatedPatient
} from "@/services/doctorAppointments.service";

export function DoctorTreatedPatientsScreen() {
  const treatedPatientsQuery = useQuery({
    queryKey: ["doctor-treated-patients"],
    queryFn: listDoctorTreatedPatients
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Care relationships</Text>
        <Text style={styles.title}>Treated patients</Text>
        <Text style={styles.subtitle}>
          Patients appear here only after completed appointments create a
          doctor-patient relationship.
        </Text>
      </View>

      {treatedPatientsQuery.isLoading ? (
        <LoadingState message="Loading treated patients..." />
      ) : null}

      {treatedPatientsQuery.isError ? (
        <ErrorState
          message={
            treatedPatientsQuery.error instanceof Error
              ? treatedPatientsQuery.error.message
              : "Unable to load treated patients."
          }
          onRetry={() => void treatedPatientsQuery.refetch()}
        />
      ) : null}

      {treatedPatientsQuery.data ? (
        treatedPatientsQuery.data.length > 0 ? (
          <View style={styles.list}>
            {treatedPatientsQuery.data.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              title="No treated patients yet"
              message="Mark appointments completed to build this doctor's patient history."
              actionLabel="View appointments"
              onAction={() => router.push(ROUTES.doctorAppointments)}
            />
          </Card>
        )
      ) : null}

      <Button
        title="Back to doctor home"
        variant="ghost"
        onPress={() => router.push(ROUTES.doctorHome)}
      />
    </Screen>
  );
}

function PatientCard({ patient }: { patient: DoctorTreatedPatient }) {
  return (
    <Card>
      <View style={styles.patientHeader}>
        <View style={styles.patientCopy}>
          <Text style={styles.patientName}>{patient.fullName}</Text>
          <Text style={styles.meta}>
            {[patient.city, `Language: ${patient.preferredLanguage}`]
              .filter(Boolean)
              .join(" - ")}
          </Text>
        </View>
        <Badge label={`${patient.totalVisits} visits`} variant="success" />
      </View>

      <View style={styles.infoBox}>
        <Info label="First visit" value={patient.firstVisitDate ?? "N/A"} />
        <Info label="Last visit" value={patient.lastVisitDate ?? "N/A"} />
        <Info
          label="Relationship"
          value={formatRelationshipStatus(patient.relationshipStatus)}
        />
      </View>

      <Button
        title="View related appointments"
        variant="secondary"
        onPress={() => router.push(ROUTES.doctorAppointments)}
      />
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

function formatRelationshipStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  list: {
    gap: spacing.lg
  },
  patientHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  patientCopy: {
    flex: 1,
    gap: spacing.xs
  },
  patientName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  infoBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  infoItem: {
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    lineHeight: 23
  }
});

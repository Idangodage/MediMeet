import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
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
  listVisitedDoctors,
  setFavouriteDoctor,
  type PatientDoctorListItem
} from "@/services/patient.service";

export function PatientVisitedDoctorsScreen() {
  const queryClient = useQueryClient();
  const visitedQuery = useQuery({
    queryKey: ["patient-visited-doctors"],
    queryFn: listVisitedDoctors
  });
  const favouriteMutation = useMutation({
    mutationFn: ({
      doctorId,
      isFavourite
    }: {
      doctorId: string;
      isFavourite: boolean;
    }) => setFavouriteDoctor({ doctorId, isFavourite }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient-visited-doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-favourite-doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] })
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Unable to update favourite",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Care history</Text>
        <Text style={styles.title}>Already visited doctors</Text>
        <Text style={styles.subtitle}>
          Doctors appear here after a completed appointment creates an active
          doctor-patient relationship.
        </Text>
      </View>

      {visitedQuery.isLoading ? (
        <LoadingState message="Loading visited doctors..." />
      ) : null}

      {visitedQuery.isError ? (
        <ErrorState
          message={
            visitedQuery.error instanceof Error
              ? visitedQuery.error.message
              : "Unable to load visited doctors."
          }
          onRetry={() => void visitedQuery.refetch()}
        />
      ) : null}

      {visitedQuery.data ? (
        visitedQuery.data.length > 0 ? (
          <View style={styles.list}>
            {visitedQuery.data.map((doctor) => (
              <DoctorCard
                doctor={doctor}
                isUpdatingFavourite={favouriteMutation.isPending}
                key={doctor.id}
                onToggleFavourite={() =>
                  favouriteMutation.mutate({
                    doctorId: doctor.id,
                    isFavourite: !doctor.isFavourite
                  })
                }
              />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              title="No visited doctors yet"
              message="Your care history will appear after a doctor marks an appointment completed."
              actionLabel="View appointments"
              onAction={() => router.push(ROUTES.patientAppointments)}
            />
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function DoctorCard({
  doctor,
  isUpdatingFavourite,
  onToggleFavourite
}: {
  doctor: PatientDoctorListItem;
  isUpdatingFavourite: boolean;
  onToggleFavourite: () => void;
}) {
  return (
    <Card>
      <View style={styles.doctorHeader}>
        <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} />
        <View style={styles.doctorCopy}>
          <Text style={styles.doctorName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.meta}>
            {doctor.specialties.join(", ") || "General practice"}
          </Text>
        </View>
        <Badge label={`${doctor.totalVisits} visits`} variant="success" />
      </View>

      <View style={styles.infoBox}>
        <Info label="First visit" value={doctor.firstVisitDate ?? "N/A"} />
        <Info label="Last visit" value={doctor.lastVisitDate ?? "N/A"} />
        <Info
          label="Experience"
          value={`${doctor.yearsOfExperience} years`}
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="View public profile"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/doctors/[doctorId]",
              params: { doctorId: doctor.id }
            })
          }
        />
        <Button
          title={doctor.isFavourite ? "Remove favourite" : "Add favourite"}
          variant={doctor.isFavourite ? "ghost" : "secondary"}
          isLoading={isUpdatingFavourite}
          onPress={onToggleFavourite}
        />
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
  list: {
    gap: spacing.lg
  },
  doctorHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
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
    fontWeight: "800"
  },
  actions: {
    gap: spacing.sm
  }
});

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
  listFavouriteDoctors,
  setFavouriteDoctor,
  type PatientDoctorListItem
} from "@/services/patient.service";

export function PatientFavouriteDoctorsScreen() {
  const queryClient = useQueryClient();
  const favouritesQuery = useQuery({
    queryKey: ["patient-favourite-doctors"],
    queryFn: listFavouriteDoctors
  });
  const removeMutation = useMutation({
    mutationFn: (doctorId: string) =>
      setFavouriteDoctor({ doctorId, isFavourite: false }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient-favourite-doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-visited-doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] })
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Unable to remove favourite",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Saved doctors</Text>
        <Text style={styles.title}>Favourite doctors</Text>
        <Text style={styles.subtitle}>
          Keep preferred doctors easy to find when booking future appointments.
        </Text>
      </View>

      {favouritesQuery.isLoading ? (
        <LoadingState message="Loading favourite doctors..." />
      ) : null}

      {favouritesQuery.isError ? (
        <ErrorState
          message={
            favouritesQuery.error instanceof Error
              ? favouritesQuery.error.message
              : "Unable to load favourite doctors."
          }
          onRetry={() => void favouritesQuery.refetch()}
        />
      ) : null}

      {favouritesQuery.data ? (
        favouritesQuery.data.length > 0 ? (
          <View style={styles.list}>
            {favouritesQuery.data.map((doctor) => (
              <FavouriteDoctorCard
                doctor={doctor}
                isRemoving={removeMutation.isPending}
                key={doctor.id}
                onRemove={() => removeMutation.mutate(doctor.id)}
              />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              title="No favourites yet"
              message="Add favourites from appointment details or visited doctors."
              actionLabel="Search doctors"
              onAction={() => router.push(ROUTES.doctors)}
            />
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function FavouriteDoctorCard({
  doctor,
  isRemoving,
  onRemove
}: {
  doctor: PatientDoctorListItem;
  isRemoving: boolean;
  onRemove: () => void;
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
        <Badge label="Favourite" variant="success" />
      </View>

      <View style={styles.infoBox}>
        <Info
          label="Qualifications"
          value={doctor.qualifications.slice(0, 2).join(", ") || "Not listed"}
        />
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
          title="Remove favourite"
          variant="ghost"
          isLoading={isRemoving}
          onPress={onRemove}
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

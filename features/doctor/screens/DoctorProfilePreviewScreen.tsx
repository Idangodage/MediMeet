import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
import { colors, spacing, typography } from "@/constants/theme";
import {
  calculateDoctorProfileCompletion,
  formatConsultationType,
  formatDoctorProfileStatus,
  getOwnDoctorProfile,
  type DoctorProfileStatus,
  type ManagedDoctorProfile
} from "@/services/doctor.service";

export function DoctorProfilePreviewScreen() {
  const profileQuery = useQuery({
    queryKey: ["own-doctor-profile"],
    queryFn: getOwnDoctorProfile
  });

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading private profile preview..." />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Unable to load profile preview."
          }
          onRetry={() => void profileQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!profileQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Doctor profile not found"
          message="Complete doctor onboarding before previewing your profile."
        />
      </Screen>
    );
  }

  return <DoctorProfilePreview profile={profileQuery.data} />;
}

function DoctorProfilePreview({ profile }: { profile: ManagedDoctorProfile }) {
  const completion = calculateDoctorProfileCompletion(profile);
  const isPubliclyVisible =
    profile.verificationStatus === "approved" && profile.isPublic;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Private preview</Text>
        <Text style={styles.title}>How patients will read your profile</Text>
        <Text style={styles.subtitle}>
          This preview is visible to you even when the profile is incomplete,
          pending verification, rejected, suspended, or needs update.
        </Text>
      </View>

      <Card style={styles.profileHero}>
        <View style={styles.heroHeader}>
          <Avatar imageUrl={profile.profileImageUrl} name={profile.fullName} size={92} />
          <View style={styles.heroIdentity}>
            <Badge
              label={formatDoctorProfileStatus(completion.status)}
              variant={getStatusBadgeVariant(completion.status)}
            />
            <Text style={styles.name}>
              {[profile.title, profile.fullName].filter(Boolean).join(" ")}
            </Text>
            <Text style={styles.meta}>
              {profile.specialties.join(", ") || "Specialty not listed"}
            </Text>
          </View>
        </View>

        {!isPubliclyVisible ? (
          <View style={styles.warningBox}>
            <Badge label="Private only" variant="warning" />
            <Text style={styles.bodyText}>
              This profile is not listed in public search. Public discovery requires
              platform verification and public visibility.
            </Text>
          </View>
        ) : null}

        <View style={styles.heroStats}>
          <Stat label="Rating" value={profile.averageRating.toFixed(1)} />
          <Stat label="Experience" value={`${profile.yearsOfExperience} yrs`} />
          <Stat label="Fee" value={`$${profile.consultationFee.toFixed(2)}`} />
        </View>
      </Card>

      <ProfileSection title="Specialty and subspecialty">
        <TagList values={[...profile.specialties, ...profile.subspecialties]} />
      </ProfileSection>

      <ProfileSection title="Qualifications">
        <TagList values={profile.qualifications} emptyText="No qualifications listed." />
      </ProfileSection>

      <ProfileSection title="Languages">
        <TagList values={profile.languages} emptyText="No languages listed." />
      </ProfileSection>

      <ProfileSection title="Biography">
        <Text style={styles.bodyText}>
          {profile.biography ?? "No biography has been published yet."}
        </Text>
      </ProfileSection>

      <ProfileSection title="Services">
        <TagList values={profile.services} emptyText="No services listed." />
      </ProfileSection>

      <ProfileSection title="Visiting locations">
        {profile.locations.length > 0 ? (
          profile.locations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>
                  {location.name ?? location.city ?? "Clinic location"}
                </Text>
                <Badge
                  label={location.isActive ? "Active" : "Inactive"}
                  variant={location.isActive ? "success" : "neutral"}
                />
              </View>
              <Text style={styles.bodyText}>
                {[location.address, location.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>No visiting locations listed.</Text>
        )}
      </ProfileSection>

      <ProfileSection title="Available dates">
        {profile.availableSlots.length > 0 ? (
          profile.availableSlots.slice(0, 8).map((slot) => (
            <View key={slot.id} style={styles.availabilityItem}>
              <Text style={styles.availabilityDate}>{formatDate(slot.startTime)}</Text>
              <Badge label={formatConsultationType(slot.consultationType)} />
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>No upcoming availability.</Text>
        )}
      </ProfileSection>

      <ProfileSection title="Reviews">
        {profile.reviews.length > 0 ? (
          profile.reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <Badge label={`${review.rating}/5`} variant="success" />
              <Text style={styles.bodyText}>
                {review.comment ?? "No written comment."}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>No public reviews yet.</Text>
        )}
      </ProfileSection>

      <View style={styles.actionRow}>
        <Button title="Edit profile" onPress={() => router.push(ROUTES.doctorProfile)} />
        <Button title="Back to dashboard" variant="ghost" onPress={() => router.push(ROUTES.doctorHome)} />
      </View>
    </Screen>
  );
}

function ProfileSection({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return <Card title={title}>{children}</Card>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TagList({
  emptyText = "Nothing listed.",
  values
}: {
  emptyText?: string;
  values: string[];
}) {
  const visibleValues = values.filter(Boolean);

  if (visibleValues.length === 0) {
    return <Text style={styles.bodyText}>{emptyText}</Text>;
  }

  return (
    <View style={styles.tags}>
      {visibleValues.map((value) => (
        <Badge key={value} label={value} />
      ))}
    </View>
  );
}

function getStatusBadgeVariant(status: DoctorProfileStatus) {
  if (status === "verified") {
    return "success";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  if (status === "incomplete" || status === "needs_update") {
    return "warning";
  }

  return "neutral";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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
  profileHero: {
    backgroundColor: colors.primarySoft
  },
  heroHeader: {
    flexDirection: "row",
    gap: spacing.lg
  },
  heroIdentity: {
    flex: 1,
    gap: spacing.sm
  },
  name: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36
  },
  meta: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "900"
  },
  warningBox: {
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.md
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  locationItem: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md
  },
  locationHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  locationName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  availabilityItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md
  },
  availabilityDate: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  reviewItem: {
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md
  },
  actionRow: {
    gap: spacing.sm
  }
});

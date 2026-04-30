import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
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
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  formatConsultationType,
  getPublicDoctorById,
  recordDoctorProfileView,
  type PublicDoctor
} from "@/services/doctor.service";

export function DoctorPublicProfileScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { role } = useAuth();
  const doctorQuery = useQuery({
    enabled: Boolean(doctorId),
    queryKey: ["public-doctor", doctorId],
    queryFn: () => getPublicDoctorById(doctorId ?? "")
  });
  const recordedDoctorIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadedDoctorId = doctorQuery.data?.id;

    if (!loadedDoctorId || recordedDoctorIdRef.current === loadedDoctorId) {
      return;
    }

    recordedDoctorIdRef.current = loadedDoctorId;
    void recordDoctorProfileView(loadedDoctorId).catch(() => {
      recordedDoctorIdRef.current = null;
    });
  }, [doctorQuery.data?.id]);

  if (!doctorId) {
    return (
      <Screen>
        <ErrorState message="Doctor profile id is missing." />
      </Screen>
    );
  }

  if (doctorQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading doctor profile..." />
      </Screen>
    );
  }

  if (doctorQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            doctorQuery.error instanceof Error
              ? doctorQuery.error.message
              : "Unable to load doctor profile."
          }
          onRetry={() => void doctorQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!doctorQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Doctor not found"
          message="This doctor is not public or has not been verified yet."
        />
      </Screen>
    );
  }

  const doctor = doctorQuery.data;

  return (
    <Screen>
      <Card style={styles.profileHero}>
        <View style={styles.heroHeader}>
          <Avatar
            imageUrl={doctor.profileImageUrl}
            name={doctor.fullName}
            size={92}
          />
          <View style={styles.heroIdentity}>
            <Badge label="Verified doctor" variant="success" />
            <Text style={styles.name}>
              {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
            </Text>
            <Text style={styles.meta}>
              {doctor.specialties.join(", ") || "General practice"}
            </Text>
            <View style={styles.trustRow}>
              <Badge label="Verified credentials" variant="success" />
              <Badge label="Private booking records" variant="primary" />
            </View>
          </View>
        </View>

        <View style={styles.heroStats}>
          <Stat label="Rating" value={doctor.averageRating.toFixed(1)} />
          <Stat label="Experience" value={`${doctor.yearsOfExperience} yrs`} />
          <Stat label="Fee" value={`$${doctor.consultationFee.toFixed(2)}`} />
        </View>

        <BookingAction
          doctor={doctor}
          onBook={() => {
            if (role === "guest") {
              router.push({
                pathname: ROUTES.loginPrompt,
                params: { doctorId: doctor.id }
              });
              return;
            }

            if (role !== "patient") {
              Alert.alert(
                "Patient account required",
                "Only signed-in patients can book public appointments."
              );
              return;
            }

            if (doctor.availableSlots.length === 0) {
              Alert.alert("No availability", "This doctor has no open slots.");
              return;
            }

            router.push({
              pathname: "/book-doctor/[doctorId]",
              params: { doctorId: doctor.id }
            });
          }}
        />
      </Card>

      <ProfileSection title="Specialty and subspecialty">
        <TagList values={[...doctor.specialties, ...doctor.subspecialties]} />
      </ProfileSection>

      <ProfileSection title="Qualifications">
        <TagList values={doctor.qualifications} emptyText="No qualifications listed." />
      </ProfileSection>

      <ProfileSection title="Languages">
        <TagList values={doctor.languages} emptyText="No languages listed." />
      </ProfileSection>

      <ProfileSection title="Biography">
        <Text style={styles.bodyText}>
          {doctor.biography ?? "No biography has been published yet."}
        </Text>
      </ProfileSection>

      <ProfileSection title="Services">
        <TagList values={getServices(doctor)} emptyText="No services listed." />
      </ProfileSection>

      <ProfileSection title="Visiting locations">
        {doctor.locations.length > 0 ? (
          doctor.locations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <Text style={styles.locationName}>
                {location.name ?? location.city ?? "Clinic location"}
              </Text>
              <Text style={styles.bodyText}>
                {[location.address, location.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>No public locations listed.</Text>
        )}
      </ProfileSection>

      <ProfileSection title="Available dates">
        {doctor.availableSlots.length > 0 ? (
          doctor.availableSlots.slice(0, 8).map((slot) => (
            <View key={slot.id} style={styles.availabilityItem}>
              <Text style={styles.availabilityDate}>
                {formatDate(slot.startTime)}
              </Text>
              <Badge label={formatConsultationType(slot.consultationType)} />
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>No upcoming availability.</Text>
        )}
      </ProfileSection>

      <ProfileSection title="Reviews">
        {doctor.reviews.length > 0 ? (
          doctor.reviews.slice(0, 5).map((review) => (
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
    </Screen>
  );
}

function BookingAction({
  doctor,
  onBook
}: {
  doctor: PublicDoctor;
  onBook: () => void;
}) {
  const nextSlot = doctor.availableSlots[0];

  return (
    <View style={styles.bookingBox}>
      <View style={styles.bookingCopy}>
        <Text style={styles.bookingTitle}>Book appointment</Text>
        <Text style={styles.bodyText}>
          {nextSlot
            ? `Next available: ${formatDate(nextSlot.startTime)}`
            : "No available appointment slots."}
        </Text>
        <View style={styles.trustRow}>
          <Badge label="Automatic confirmation" variant="info" />
          <Badge label="Pay at clinic" variant="neutral" />
        </View>
      </View>
      <Button
        disabled={!nextSlot}
        title={nextSlot ? "Choose appointment" : "No slots"}
        onPress={onBook}
      />
    </View>
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

function getServices(doctor: PublicDoctor): string[] {
  if (doctor.services.length > 0) {
    return doctor.services;
  }

  return Array.from(
    new Set(doctor.availableSlots.map((slot) => formatConsultationType(slot.consultationType)))
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  profileHero: {
    borderColor: colors.border,
    backgroundColor: colors.primaryTint
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
    letterSpacing: -0.6,
    lineHeight: 36
  },
  meta: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "900"
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.md
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
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
  bookingBox: {
    gap: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  bookingCopy: {
    gap: spacing.xs
  },
  bookingTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
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
  }
});

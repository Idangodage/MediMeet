import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { useAuth } from "@/features/auth";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  formatConsultationType,
  getPublicDoctorById,
  recordDoctorProfileView,
  type PublicDoctor,
  type PublicDoctorLocation
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
  const primaryLocation = doctor.locations[0] ?? null;
  const nextSlot = doctor.availableSlots[0] ?? null;
  const services = getServices(doctor).slice(0, 5);
  const reviews = doctor.reviews.slice(0, 2);
  const reviewStats = getReviewStats(doctor);

  const handleBook = () => {
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
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <AuthBackButton onPress={() => router.back()} />
        <PublicBrandLockup centered />
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.heroRow}>
        <View style={styles.photoPanel}>
          <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} size={188} />
          <View style={styles.availablePill}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>
              {nextSlot ? "Available" : "Profile only"}
            </Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.heroSpecialty}>
            {doctor.specialties[0] ?? "General practice"}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.ratingText}>
              {doctor.averageRating.toFixed(1)} ({doctor.reviews.length} reviews)
            </Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>
              {doctor.yearsOfExperience}+ years experience
            </Text>
          </View>

          <View style={styles.chipRow}>
            {doctor.languages.slice(0, 3).map((language) => (
              <View key={language} style={styles.softChip}>
                <Text style={styles.softChipText}>{language}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <InfoCard title="About" icon="user">
        <Text style={styles.bodyText}>
          {doctor.biography ??
            `${doctor.fullName} is a dedicated ${
              doctor.specialties[0]?.toLowerCase() ?? "doctor"
            } with ${doctor.yearsOfExperience}+ years of experience providing patient-first care.`}
        </Text>
      </InfoCard>

      <View style={styles.twoColumnRow}>
        <InfoCard title="Qualifications" icon="bookmark" style={styles.halfCard}>
          {doctor.qualifications.length > 0 ? (
            doctor.qualifications.slice(0, 4).map((qualification) => (
              <Text key={qualification} style={styles.listText}>
                - {qualification}
              </Text>
            ))
          ) : (
            <Text style={styles.bodyText}>Qualifications available on profile.</Text>
          )}
        </InfoCard>

        <InfoCard title="Services" icon="shield" style={styles.halfCard}>
          {services.length > 0 ? (
            services.map((service) => (
              <Text key={service} style={styles.listText}>
                - {service}
              </Text>
            ))
          ) : (
            <Text style={styles.bodyText}>Services will appear here.</Text>
          )}
        </InfoCard>
      </View>

      <View style={styles.twoColumnRow}>
        <InfoCard title="Clinic Location" icon="location" style={styles.halfCard}>
          {primaryLocation ? (
            <>
              <Text style={styles.sectionHeadline}>
                {primaryLocation.name ?? primaryLocation.city ?? "Clinic location"}
              </Text>
              <Text style={styles.bodyText}>
                {[primaryLocation.address, primaryLocation.city]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void openDirections(primaryLocation)}
              >
                <Text style={styles.inlineLink}>Get directions {">"}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.bodyText}>No public clinic location listed.</Text>
          )}
        </InfoCard>

        <InfoCard title="Consultation Fee" icon="bookmark" style={styles.halfCard}>
          <Text style={styles.feeText}>${doctor.consultationFee.toFixed(0)}</Text>
          <Text style={styles.bodyText}>Transparent consultation pricing.</Text>
          <View style={styles.secureRow}>
            <PatientGlyph name="shield" color={colors.primary} size={22} />
            <Text style={styles.secureText}>Secure appointment records</Text>
          </View>
        </InfoCard>
      </View>

      <View style={styles.twoColumnRow}>
        <InfoCard title="Next Available Slot" icon="calendar" style={styles.halfCard}>
          {nextSlot ? (
            <>
              <Text style={styles.sectionHeadline}>
                {formatDate(nextSlot.startTime, {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })}
              </Text>
              <Text style={styles.bodyText}>
                {formatTime(nextSlot.startTime)} - {formatTime(nextSlot.endTime)}
              </Text>
              <View style={styles.limitedPill}>
                <Text style={styles.limitedPillText}>Bookable slot available</Text>
              </View>
            </>
          ) : (
            <Text style={styles.bodyText}>No upcoming slots are open right now.</Text>
          )}
        </InfoCard>

        <InfoCard title="Patient Reviews" icon="support" style={styles.halfCard}>
          <Text style={styles.reviewScore}>{doctor.averageRating.toFixed(1)}</Text>
          <Text style={styles.reviewMeta}>{doctor.reviews.length} public reviews</Text>
          <View style={styles.reviewBars}>
            {reviewStats.map((item) => (
              <View key={item.rating} style={styles.reviewBarRow}>
                <Text style={styles.reviewBarLabel}>{item.rating}</Text>
                <View style={styles.reviewBarTrack}>
                  <View
                    style={[
                      styles.reviewBarFill,
                      { width: `${item.percentage}%` }
                    ]}
                  />
                </View>
                <Text style={styles.reviewBarCount}>{item.count}</Text>
              </View>
            ))}
          </View>
          {reviews[0]?.comment ? (
            <View style={styles.reviewQuote}>
              <Text style={styles.reviewQuoteText}>{reviews[0].comment}</Text>
            </View>
          ) : null}
        </InfoCard>
      </View>

      <Button title="Book Appointment" onPress={handleBook} style={styles.bookButton} />
    </Screen>
  );
}

function InfoCard({
  children,
  icon,
  style,
  title
}: {
  children: React.ReactNode;
  icon: "user" | "bookmark" | "shield" | "location" | "calendar" | "support";
  style?: object;
  title: string;
}) {
  return (
    <View style={[styles.infoCard, style]}>
      <View style={styles.infoHeader}>
        <View style={styles.infoIconCircle}>
          <PatientGlyph color={colors.primary} name={icon} size={24} />
        </View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {children}
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

function getReviewStats(doctor: PublicDoctor) {
  const total = doctor.reviews.length || 1;

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = doctor.reviews.filter((review) => review.rating === rating).length;
    return {
      rating,
      count,
      percentage: Math.max((count / total) * 100, count > 0 ? 8 : 0)
    };
  });
}

async function openDirections(location: PublicDoctorLocation) {
  const query = [location.address, location.city].filter(Boolean).join(", ");

  if (!query) {
    return;
  }

  await Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  );
}

function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"]
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  topBarSpacer: {
    width: 52
  },
  heroRow: {
    flexDirection: "row",
    gap: spacing.xl,
    alignItems: "center"
  },
  photoPanel: {
    position: "relative",
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    ...shadows.soft
  },
  availablePill: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#38B000"
  },
  availableText: {
    color: colors.text,
    fontSize: typography.small,
    ...fontStyles.medium
  },
  heroCopy: {
    flex: 1,
    gap: spacing.md
  },
  heroName: {
    color: "#0D2557",
    fontSize: 34,
    lineHeight: 40,
    ...fontStyles.extraBold
  },
  heroSpecialty: {
    color: "#1E63C6",
    fontSize: 18,
    ...fontStyles.medium
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap"
  },
  ratingText: {
    color: "#0D2557",
    fontSize: 17,
    ...fontStyles.bold
  },
  metaDivider: {
    color: "#A1B2CA",
    fontSize: 18,
    ...fontStyles.regular
  },
  metaText: {
    color: "#223D72",
    fontSize: 17,
    ...fontStyles.medium
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap"
  },
  softChip: {
    borderRadius: radius.full,
    backgroundColor: "#EEF6FB",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  softChipText: {
    color: "#26436F",
    fontSize: 15,
    ...fontStyles.medium
  },
  infoCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  infoIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  infoTitle: {
    color: "#112A5B",
    fontSize: 18,
    ...fontStyles.bold
  },
  bodyText: {
    color: "#415877",
    fontSize: 16,
    lineHeight: 28,
    ...fontStyles.regular
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "stretch"
  },
  halfCard: {
    flex: 1
  },
  listText: {
    color: "#334E73",
    fontSize: 16,
    lineHeight: 28,
    ...fontStyles.regular
  },
  sectionHeadline: {
    color: "#112A5B",
    fontSize: 17,
    lineHeight: 24,
    ...fontStyles.bold
  },
  inlineLink: {
    color: "#256DDE",
    fontSize: 16,
    ...fontStyles.bold
  },
  feeText: {
    color: "#102A35",
    fontSize: 34,
    lineHeight: 40,
    ...fontStyles.extraBold
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E7EEF7"
  },
  secureText: {
    color: "#315F72",
    fontSize: 15,
    ...fontStyles.medium
  },
  limitedPill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    backgroundColor: "#EAF8EE",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  limitedPillText: {
    color: "#278451",
    fontSize: 15,
    ...fontStyles.bold
  },
  reviewScore: {
    color: "#0D2557",
    fontSize: 42,
    lineHeight: 46,
    ...fontStyles.extraBold
  },
  reviewMeta: {
    color: "#6C80AA",
    fontSize: 15,
    ...fontStyles.medium
  },
  reviewBars: {
    gap: spacing.sm
  },
  reviewBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  reviewBarLabel: {
    width: 12,
    color: "#59718F",
    fontSize: 13,
    ...fontStyles.medium
  },
  reviewBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "#E5EDF7",
    overflow: "hidden"
  },
  reviewBarFill: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary
  },
  reviewBarCount: {
    minWidth: 24,
    color: "#59718F",
    fontSize: 13,
    textAlign: "right",
    ...fontStyles.medium
  },
  reviewQuote: {
    borderRadius: radius.md,
    backgroundColor: "#F8FBFF",
    padding: spacing.md
  },
  reviewQuoteText: {
    color: "#334E73",
    fontSize: 15,
    lineHeight: 24,
    ...fontStyles.regular
  },
  bookButton: {
    minHeight: 72
  }
});

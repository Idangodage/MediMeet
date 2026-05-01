import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/Screen";
import { Avatar, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import {
  getNextAvailableDate,
  listPublicDoctors,
  type DoctorSearchFilters,
  type PublicDoctor
} from "@/services/doctor.service";

const searchSchema = z.object({
  specialty: z.string().trim().optional(),
  city: z.string().trim().optional(),
  language: z.string().trim().optional(),
  availabilityDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .or(z.literal(""))
    .optional(),
  maxFee: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount.")
    .or(z.literal(""))
    .optional()
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function PublicDoctorSearchScreen() {
  const [filters, setFilters] = useState<DoctorSearchFilters>({
    verificationStatus: "approved"
  });
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      specialty: "",
      city: "",
      language: "",
      availabilityDate: "",
      maxFee: ""
    }
  });
  const doctorsQuery = useQuery({
    queryKey: ["public-doctors", filters],
    queryFn: () => listPublicDoctors(filters)
  });

  const onSubmit = handleSubmit((values) => {
    setFilters({
      specialty: normalizeText(values.specialty),
      city: normalizeText(values.city),
      language: normalizeText(values.language),
      availabilityDate: normalizeText(values.availabilityDate),
      maxFee: normalizeNumber(values.maxFee),
      verificationStatus: "approved"
    });
  });

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined).length - 1,
    [filters]
  );

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <AuthBackButton />
        <Text style={styles.title}>Find a doctor</Text>
        <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.filterButton}>
          <PatientGlyph name="filter" color={colors.primary} />
        </Pressable>
      </View>

      <Controller
        control={control}
        name="specialty"
        render={({ field: { onBlur, onChange, value } }) => (
          <View style={styles.searchBar}>
            <PatientGlyph name="search" color="#7B8F99" size={30} />
            <TextInput
              autoCapitalize="words"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Search doctors, specialties..."
              placeholderTextColor="#8093BC"
              style={styles.searchInput}
              value={value}
            />
          </View>
        )}
      />

      <View style={styles.filterChipRow}>
        <CompactFilterField
          control={control}
          name="city"
          placeholder="Location"
          icon="location"
        />
        <CompactFilterField
          control={control}
          name="availabilityDate"
          placeholder="Available Today"
          icon="calendar"
        />
        <CompactFilterField
          control={control}
          name="language"
          placeholder="Language"
          icon="globe"
        />
        <CompactFilterField
          control={control}
          name="maxFee"
          placeholder="Fee"
          icon="bookmark"
          keyboardType="decimal-pad"
        />
      </View>

      {errors.availabilityDate?.message || errors.maxFee?.message ? (
        <Text style={styles.filterError}>
          {errors.availabilityDate?.message ?? errors.maxFee?.message}
        </Text>
      ) : null}

      {activeFilterCount > 0 ? (
        <Text style={styles.filterSummary}>{activeFilterCount} active filters</Text>
      ) : null}

      {doctorsQuery.isLoading ? (
        <LoadingState message="Finding doctors for you..." />
      ) : null}

      {doctorsQuery.isError ? (
        <ErrorState
          message={
            doctorsQuery.error instanceof Error
              ? doctorsQuery.error.message
              : "Unable to load doctors."
          }
          onRetry={() => void doctorsQuery.refetch()}
        />
      ) : null}

      {doctorsQuery.isSuccess && doctorsQuery.data.length === 0 ? (
        <View style={styles.emptyCard}>
          <EmptyState
            title="No doctors match these filters"
            message="Try widening the location, language, date, or fee filters."
          />
        </View>
      ) : null}

      {doctorsQuery.data?.map((doctor) => (
        <DoctorDiscoveryCard doctor={doctor} key={doctor.id} />
      ))}

      <View style={styles.safetyStrip}>
        <PatientGlyph name="shield" color={colors.primary} />
        <Text style={styles.safetyText}>
          All doctors are verified and background-checked. Your health is in safe hands.
        </Text>
      </View>
    </Screen>
  );
}

function DoctorDiscoveryCard({ doctor }: { doctor: PublicDoctor }) {
  const nextAvailableDate = getNextAvailableDate(doctor);

  return (
    <View style={styles.doctorCard}>
      <View style={styles.doctorTopRow}>
        <View style={styles.doctorMainInfo}>
          <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} size={96} />
          <View style={styles.doctorCopy}>
            <Text style={styles.doctorName}>
              {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
            </Text>
            <Text style={styles.doctorSpecialty}>
              {doctor.specialties[0] ?? "General practice"}
            </Text>
            <Text style={styles.doctorMeta}>{summarizeQualifications(doctor)}</Text>
            <Text style={styles.doctorMeta}>
              {doctor.yearsOfExperience}+ years experience
            </Text>
            <Text style={styles.doctorRating}>
              {doctor.averageRating.toFixed(1)} ({doctor.reviews.length} reviews)
            </Text>
          </View>
        </View>
        <View style={styles.verifiedRow}>
          <PatientGlyph name="shield" color={colors.primary} size={20} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      <View style={styles.metricsColumn}>
        <View style={styles.metricPanel}>
          <Text style={styles.metricValue}>${doctor.consultationFee.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>Consultation fee</Text>
        </View>
        <View style={styles.metricPanel}>
          <Text style={styles.metricLabel}>Next available</Text>
          <Text style={styles.metricValueSmall}>
            {nextAvailableDate ? formatNextSlot(nextAvailableDate) : "No slots"}
          </Text>
        </View>
      </View>

      <View style={styles.profileLinkRow}>
        <Link href={`/doctors/${doctor.id}`} style={styles.profileLink}>
          View profile {">"}
        </Link>
      </View>
    </View>
  );
}

function CompactFilterField({
  control,
  icon,
  keyboardType,
  name,
  placeholder
}: {
  control: ReturnType<typeof useForm<SearchFormValues>>["control"];
  icon: "location" | "calendar" | "globe" | "bookmark";
  keyboardType?: "default" | "decimal-pad";
  name: keyof SearchFormValues;
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <View style={styles.filterChip}>
          <PatientGlyph name={icon} color="#1A5C97" size={22} />
          <TextInput
            keyboardType={keyboardType}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#36507C"
            style={styles.filterChipInput}
            value={value}
          />
        </View>
      )}
    />
  );
}

function summarizeQualifications(doctor: PublicDoctor) {
  if (doctor.qualifications.length === 0) {
    return "Qualifications available on profile";
  }

  return doctor.qualifications.slice(0, 2).join(", ");
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeNumber(value?: string): number | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function formatNextSlot(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    ...fontStyles.extraBold
  },
  filterButton: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D6E8FF",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  searchBar: {
    minHeight: 76,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D7E4FA",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  searchInput: {
    flex: 1,
    color: "#243F73",
    fontSize: 18,
    ...fontStyles.medium
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  filterChip: {
    minWidth: 150,
    flex: 1,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CDE7EF",
    backgroundColor: "#F2FBFC",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  filterChipInput: {
    flex: 1,
    color: "#163067",
    fontSize: 16,
    ...fontStyles.medium
  },
  filterError: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  filterSummary: {
    color: colors.primary,
    fontSize: typography.small,
    ...fontStyles.bold
  },
  emptyCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9"
  },
  doctorCard: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    padding: spacing.xl,
    gap: spacing.lg
  },
  doctorTopRow: {
    gap: spacing.md
  },
  doctorMainInfo: {
    flexDirection: "row",
    gap: spacing.lg
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: "#12306A",
    fontSize: 24,
    lineHeight: 30,
    ...fontStyles.extraBold
  },
  doctorSpecialty: {
    color: "#344E79",
    fontSize: 18,
    ...fontStyles.medium
  },
  doctorMeta: {
    color: "#6C80AA",
    fontSize: 16,
    lineHeight: 22,
    ...fontStyles.regular
  },
  doctorRating: {
    color: "#556E9B",
    fontSize: 16,
    ...fontStyles.medium
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  verifiedText: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  metricsColumn: {
    flexDirection: "row",
    gap: spacing.md
  },
  metricPanel: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F2FBFC",
    padding: spacing.md,
    gap: spacing.xs
  },
  metricLabel: {
    color: "#6C80AA",
    fontSize: 15,
    ...fontStyles.regular
  },
  metricValue: {
    color: "#12306A",
    fontSize: 28,
    ...fontStyles.extraBold
  },
  metricValueSmall: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.bold
  },
  profileLinkRow: {
    borderTopWidth: 1,
    borderTopColor: "#E3EEF9",
    paddingTop: spacing.md,
    alignItems: "flex-end"
  },
  profileLink: {
    color: "#2D73E1",
    fontSize: 18,
    ...fontStyles.bold
  },
  safetyStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E3EEF9",
    paddingTop: spacing.md
  },
  safetyText: {
    flex: 1,
    color: "#315F72",
    fontSize: 16,
    lineHeight: 22,
    ...fontStyles.medium
  }
});

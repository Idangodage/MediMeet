import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import {
  formatConsultationType,
  getNextAvailableDate,
  listPublicDoctors,
  type ConsultationType,
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
  minFee: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount.")
    .or(z.literal(""))
    .optional(),
  maxFee: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount.")
    .or(z.literal(""))
    .optional(),
  verificationStatus: z.string().trim().optional(),
  consultationType: z.string().trim().optional()
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function PublicDoctorSearchScreen() {
  const [filters, setFilters] = useState<DoctorSearchFilters>({
    verificationStatus: "approved"
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      specialty: "",
      city: "",
      language: "",
      availabilityDate: "",
      minFee: "",
      maxFee: "",
      verificationStatus: "approved",
      consultationType: ""
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
      minFee: normalizeNumber(values.minFee),
      maxFee: normalizeNumber(values.maxFee),
      verificationStatus: values.verificationStatus === "approved" ? "approved" : undefined,
      consultationType: normalizeConsultationType(values.consultationType)
    });
  });

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined).length,
    [filters]
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Badge label="Verified doctor directory" variant="primary" />
        <Text style={styles.title}>Search verified doctors</Text>
        <Text style={styles.subtitle}>
          Filter by specialty, city, language, date, fee, verification, and
          consultation type.
        </Text>
        <View style={styles.trustRow}>
          <Badge label="Public verified profiles only" variant="success" />
          <Badge label="No booking without patient login" variant="info" />
        </View>
        <View style={styles.actions}>
          <Link href={ROUTES.guestHome} asChild>
            <Button title="Guest home" variant="secondary" />
          </Link>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Sign in" variant="ghost" />
          </Link>
        </View>
      </View>

      <Card
        title="Search filters"
        subtitle={`${activeFilterCount} active filters. Refine results without exposing patient data.`}
      >
        <View style={styles.filterGrid}>
          <SearchInput control={control} label="Specialty" name="specialty" placeholder="Cardiology" />
          <SearchInput control={control} label="City / location" name="city" placeholder="Helsinki" />
          <SearchInput control={control} label="Language" name="language" placeholder="English" />
          <SearchInput control={control} error={errors.availabilityDate?.message} label="Availability date" name="availabilityDate" placeholder="YYYY-MM-DD" />
          <SearchInput control={control} keyboardType="decimal-pad" label="Min fee" name="minFee" placeholder="50" />
          <SearchInput control={control} keyboardType="decimal-pad" label="Max fee" name="maxFee" placeholder="250" />
          <SearchInput control={control} label="Verification status" name="verificationStatus" placeholder="approved" />
          <SearchInput control={control} label="Consultation type" name="consultationType" placeholder="in_person, video, phone" />
        </View>
        <View style={styles.actions}>
          <Button title="Apply filters" onPress={onSubmit} />
          <Button
            title="Clear"
            variant="secondary"
            onPress={() => {
              reset();
              setFilters({ verificationStatus: "approved" });
            }}
          />
        </View>
      </Card>

      {doctorsQuery.isLoading ? (
        <LoadingState message="Loading verified doctors..." />
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
        <Card>
          <EmptyState
            title="No doctors match these filters"
            message="Try widening the city, language, date, or fee filters."
          />
        </Card>
      ) : null}

      {doctorsQuery.data?.length ? (
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Available doctors</Text>
          <Badge label={`${doctorsQuery.data.length} result${doctorsQuery.data.length === 1 ? "" : "s"}`} />
        </View>
      ) : null}

      {doctorsQuery.data?.map((doctor) => (
        <DoctorDiscoveryCard doctor={doctor} key={doctor.id} />
      ))}
    </Screen>
  );
}

function DoctorDiscoveryCard({ doctor }: { doctor: PublicDoctor }) {
  const nextAvailableDate = getNextAvailableDate(doctor);
  const primaryLocation = doctor.locations[0];

  return (
    <Card style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <Avatar
          imageUrl={doctor.profileImageUrl}
          name={doctor.fullName}
          size={64}
        />
        <View style={styles.doctorIdentity}>
          <Text style={styles.doctorName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.doctorMeta}>
            {doctor.specialties[0] ?? "General practice"}
          </Text>
        </View>
        <Badge label="Verified doctor" variant="success" />
      </View>

      <View style={styles.infoGrid}>
        <Info label="Qualifications" value={summarize(doctor.qualifications)} />
        <Info label="Experience" value={`${doctor.yearsOfExperience} years`} />
        <Info
          label="Location"
          value={primaryLocation?.city ?? primaryLocation?.address ?? "Not listed"}
        />
        <Info label="Fee" value={`$${doctor.consultationFee.toFixed(2)}`} />
        <Info
          label="Next available"
          value={nextAvailableDate ? formatDate(nextAvailableDate) : "No slots"}
        />
        <Info
          label="Consultation"
          value={
            doctor.availableSlots[0]
              ? formatConsultationType(doctor.availableSlots[0].consultationType)
              : "Not listed"
          }
        />
      </View>

      <Text style={styles.bio} numberOfLines={3}>
        {doctor.biography ?? "No biography provided yet."}
      </Text>

      <View style={styles.cardTrustRow}>
        <Badge label="Public profile reviewed" variant="primary" />
        <Badge label="Pay at clinic" variant="neutral" />
      </View>

      <Link href={`/doctors/${doctor.id}` as Href} asChild>
        <Button title="View profile" />
      </Link>
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

function SearchInput({
  control,
  error,
  keyboardType,
  label,
  name,
  placeholder
}: {
  control: ReturnType<typeof useForm<SearchFormValues>>["control"];
  error?: string;
  keyboardType?: "default" | "decimal-pad";
  label: string;
  name: keyof SearchFormValues;
  placeholder?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <Input
          autoCapitalize="none"
          error={error}
          keyboardType={keyboardType}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          placeholder={placeholder}
          value={value}
        />
      )}
    />
  );
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

function normalizeConsultationType(value?: string): ConsultationType | undefined {
  const normalized = value?.trim();

  if (
    normalized === "in_person" ||
    normalized === "video" ||
    normalized === "phone"
  ) {
    return normalized;
  }

  return undefined;
}

function summarize(values: string[]): string {
  if (values.length === 0) {
    return "Not listed";
  }

  return values.slice(0, 2).join(", ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 38
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  filterGrid: {
    gap: spacing.md
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  doctorCard: {
    gap: spacing.md
  },
  doctorHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  doctorIdentity: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  doctorMeta: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "800"
  },
  cardTrustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  infoItem: {
    minWidth: "45%",
    flex: 1,
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  bio: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23
  }
});

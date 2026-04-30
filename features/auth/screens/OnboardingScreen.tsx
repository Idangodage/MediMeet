import { useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Redirect, router, type Href } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Badge, Button, Card, ErrorState, Input } from "@/components/ui";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  clinicAdminOnboardingSchema,
  doctorOnboardingSchema,
  patientOnboardingSchema,
  type ClinicAdminOnboardingFormValues,
  type DoctorOnboardingFormValues,
  type PatientOnboardingFormValues
} from "@/features/auth/schemas/onboarding.schemas";
import {
  completeClinicAdminOnboarding,
  completeDoctorOnboarding,
  completePatientOnboarding
} from "@/services/onboarding.service";
import {
  uploadDoctorVerificationDocument,
  type VerificationDocumentType
} from "@/services/verification.service";

type VerificationUploads = Partial<
  Record<VerificationDocumentType, DocumentPicker.DocumentPickerAsset>
>;

export function OnboardingScreen() {
  const {
    isOnboardingComplete,
    profile,
    refreshProfile,
    role,
    signOut,
    user
  } = useAuth();
  const [hasStartedSetup, setHasStartedSetup] = useState(false);

  if (role === "guest" || role === "platform_admin") {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  if (isOnboardingComplete) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  if (!hasStartedSetup) {
    const intro = getOnboardingIntro(
      role,
      profile?.fullName ?? user?.user_metadata?.full_name
    );

    return (
      <Screen contentStyle={styles.introContent}>
        <View style={styles.introHero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Badge label={intro.badge} variant="primary" />
          <Text style={styles.introTitle}>{intro.title}</Text>
          <Text style={styles.introSubtitle}>{intro.subtitle}</Text>
        </View>

        <Card style={styles.introCard}>
          <View style={styles.introCardHeader}>
            <Text style={styles.introCardTitle}>{intro.cardTitle}</Text>
            <Text style={styles.introCardSubtitle}>{intro.cardSubtitle}</Text>
          </View>

          <View style={styles.checklist}>
            {intro.items.map((item) => (
              <View key={item} style={styles.checklistItem}>
                <View style={styles.checklistDot} />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You can continue setup now, browse public doctors first, or sign
              out if this is not your account.
            </Text>
          </View>

          <View style={styles.formActions}>
            <Button title={intro.primaryAction} onPress={() => setHasStartedSetup(true)} />
            <Button
              title="Browse public doctors"
              variant="secondary"
              onPress={() => router.push(ROUTES.doctors as Href)}
            />
            <Button title="Not your account? Sign out" variant="ghost" onPress={() => void signOut()} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>MediMeet onboarding</Text>
        <Text style={styles.title}>{getOnboardingTitle(role)}</Text>
        <Text style={styles.subtitle}>
          Complete these setup steps so MediMeet can route you to the right
          private workspace.
        </Text>
      </View>

      {role === "patient" ? (
        <PatientOnboardingForm
          defaultFullName={profile?.fullName ?? user?.user_metadata?.full_name}
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}

      {role === "doctor" ? (
        <DoctorOnboardingForm
          defaultFullName={profile?.fullName ?? user?.user_metadata?.full_name}
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}

      {role === "clinic_admin" ? (
        <ClinicAdminOnboardingForm
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}
    </Screen>
  );
}

function PatientOnboardingForm({
  defaultFullName,
  onComplete
}: {
  defaultFullName?: string | null;
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PatientOnboardingFormValues>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues: {
      fullName: defaultFullName ?? "",
      phone: "",
      city: "",
      preferredLanguage: "English",
      dateOfBirth: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await completePatientOnboarding(values);
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card title="Patient details" subtitle="Used for appointment communication.">
      {formError ? <ErrorState message={formError} /> : null}
      <FormInput control={control} error={errors.fullName?.message} label="Full name" name="fullName" />
      <FormInput control={control} error={errors.phone?.message} keyboardType="phone-pad" label="Phone" name="phone" />
      <FormInput control={control} error={errors.city?.message} label="City" name="city" />
      <FormInput control={control} error={errors.preferredLanguage?.message} label="Preferred language" name="preferredLanguage" />
      <FormInput control={control} error={errors.dateOfBirth?.message} label="Date of birth optional" name="dateOfBirth" placeholder="YYYY-MM-DD" />
      <Button title="Complete patient onboarding" isLoading={isSubmitting} onPress={onSubmit} />
    </Card>
  );
}

function DoctorOnboardingForm({
  defaultFullName,
  onComplete
}: {
  defaultFullName?: string | null;
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationUploads, setVerificationUploads] =
    useState<VerificationUploads>({});
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DoctorOnboardingFormValues>({
    resolver: zodResolver(doctorOnboardingSchema),
    defaultValues: {
      fullName: defaultFullName ?? "",
      title: "",
      registrationNumber: "",
      qualifications: "",
      specialty: "",
      subspecialty: "",
      yearsOfExperience: "",
      languages: "",
      consultationFee: "",
      services: "",
      biography: "",
      visitingLocationName: "",
      visitingAddress: "",
      visitingCity: "",
      firstAvailableDate: "",
      startTime: "09:00",
      endTime: "17:00",
      appointmentDurationMinutes: "30",
      profilePhotoUri: null
    }
  });
  const profilePhotoUri = watch("profilePhotoUri");
  const doctorSteps = [
    "Professional Identity",
    "Qualifications and Expertise",
    "Practice Information",
    "Verification",
    "Availability Setup"
  ];

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to add a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8
    });

    if (!result.canceled) {
      setValue("profilePhotoUri", result.assets[0]?.uri ?? null, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };

  const pickVerificationDocument = async (documentType: VerificationDocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["application/pdf", "image/*"]
    });

    if (!result.canceled && result.assets[0]) {
      setVerificationUploads((current) => ({
        ...current,
        [documentType]: result.assets[0]
      }));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const requiredDocuments: VerificationDocumentType[] = [
      "medical_registration_certificate",
      "qualification_certificate",
      "identity_document"
    ];
    const missingDocument = requiredDocuments.find(
      (documentType) => !verificationUploads[documentType]
    );

    if (missingDocument) {
      setCurrentStep(3);
      setFormError("Upload all required verification documents before submitting.");
      return;
    }

    try {
      await completeDoctorOnboarding({
        ...values,
        yearsOfExperience: Number(values.yearsOfExperience),
        consultationFee: Number(values.consultationFee),
        appointmentDurationMinutes: Number(values.appointmentDurationMinutes)
      });
      for (const documentType of requiredDocuments) {
        const asset = verificationUploads[documentType];

        if (asset) {
          await uploadDoctorVerificationDocument({
            documentType,
            asset
          });
        }
      }
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card
      title={`Step ${currentStep + 1}: ${doctorSteps[currentStep]}`}
      subtitle="Your profile starts private until platform verification approves it."
    >
      {formError ? <ErrorState message={formError} /> : null}
      <View style={styles.stepper}>
        {doctorSteps.map((step, index) => (
          <View
            key={step}
            style={[styles.stepPill, index === currentStep && styles.stepPillActive]}
          >
            <Text
              style={[
                styles.stepPillText,
                index === currentStep && styles.stepPillTextActive
              ]}
            >
              {index + 1}
            </Text>
          </View>
        ))}
      </View>

      {currentStep === 0 ? (
        <>
          <View style={styles.photoRow}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.photoPreview} />
            ) : (
              <Avatar name={defaultFullName} size={72} />
            )}
            <Button title="Choose profile image" variant="secondary" onPress={pickProfilePhoto} />
          </View>
          <FormInput control={control} error={errors.fullName?.message} label="Full name" name="fullName" />
          <FormInput control={control} error={errors.title?.message} label="Title" name="title" placeholder="Dr., Consultant, Specialist" />
          <FormInput control={control} error={errors.registrationNumber?.message} label="Medical registration number" name="registrationNumber" />
        </>
      ) : null}

      {currentStep === 1 ? (
        <>
          <FormInput control={control} error={errors.qualifications?.message} helperText="Separate multiple qualifications with commas." label="Qualifications" name="qualifications" />
          <FormInput control={control} error={errors.specialty?.message} label="Specialty" name="specialty" placeholder="Cardiology" />
          <FormInput control={control} error={errors.subspecialty?.message} label="Subspecialty optional" name="subspecialty" placeholder="Preventive cardiology" />
          <FormInput control={control} error={errors.yearsOfExperience?.message} keyboardType="number-pad" label="Years of experience" name="yearsOfExperience" />
          <FormInput control={control} error={errors.languages?.message} helperText="Separate multiple languages with commas." label="Languages" name="languages" />
        </>
      ) : null}

      {currentStep === 2 ? (
        <>
          <FormInput control={control} error={errors.consultationFee?.message} keyboardType="decimal-pad" label="Consultation fee" name="consultationFee" />
          <FormInput control={control} error={errors.services?.message} helperText="Separate services with commas." label="Services offered" name="services" />
          <FormInput control={control} error={errors.biography?.message} label="Biography" multiline name="biography" numberOfLines={5} style={styles.multilineInput} />
          <FormInput control={control} error={errors.visitingLocationName?.message} label="Visiting location" name="visitingLocationName" placeholder="Main practice room" />
          <FormInput control={control} error={errors.visitingAddress?.message} label="Visiting address" name="visitingAddress" />
          <FormInput control={control} error={errors.visitingCity?.message} label="Visiting city" name="visitingCity" />
        </>
      ) : null}

      {currentStep === 3 ? (
        <>
          <VerificationUploadButton
            asset={verificationUploads.medical_registration_certificate}
            label="Medical registration certificate"
            onPress={() => pickVerificationDocument("medical_registration_certificate")}
          />
          <VerificationUploadButton
            asset={verificationUploads.qualification_certificate}
            label="Qualification document"
            onPress={() => pickVerificationDocument("qualification_certificate")}
          />
          <VerificationUploadButton
            asset={verificationUploads.identity_document}
            label="Identity document"
            onPress={() => pickVerificationDocument("identity_document")}
          />
        </>
      ) : null}

      {currentStep === 4 ? (
        <>
          <FormInput control={control} error={errors.firstAvailableDate?.message} label="First available date" name="firstAvailableDate" placeholder="YYYY-MM-DD" />
          <FormInput control={control} error={errors.startTime?.message} label="Start time" name="startTime" placeholder="09:00" />
          <FormInput control={control} error={errors.endTime?.message} label="End time" name="endTime" placeholder="17:00" />
          <FormInput control={control} error={errors.appointmentDurationMinutes?.message} keyboardType="number-pad" label="Appointment duration" name="appointmentDurationMinutes" />
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your profile will be set to pending verification. You can prepare
              your calendar while waiting for admin review.
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.formActions}>
        {currentStep > 0 ? (
          <Button title="Back" variant="secondary" onPress={() => setCurrentStep((step) => step - 1)} />
        ) : null}
        {currentStep < doctorSteps.length - 1 ? (
          <Button title="Next" onPress={() => setCurrentStep((step) => step + 1)} />
        ) : (
          <Button title="Submit for verification" isLoading={isSubmitting} onPress={onSubmit} />
        )}
      </View>
    </Card>
  );
}

function VerificationUploadButton({
  asset,
  label,
  onPress
}: {
  asset?: DocumentPicker.DocumentPickerAsset;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.uploadRow}>
      <View style={styles.uploadCopy}>
        <Text style={styles.uploadTitle}>{label}</Text>
        <Text style={styles.uploadMeta}>{asset?.name ?? "Required document not uploaded"}</Text>
      </View>
      <Badge label={asset ? "Uploaded" : "Required"} variant={asset ? "success" : "warning"} />
      <Button title={asset ? "Replace" : "Upload"} variant="secondary" onPress={onPress} />
    </View>
  );
}

function ClinicAdminOnboardingForm({
  onComplete
}: {
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ClinicAdminOnboardingFormValues>({
    resolver: zodResolver(clinicAdminOnboardingSchema),
    defaultValues: {
      clinicName: "",
      clinicEmail: "",
      clinicPhone: "",
      website: "",
      clinicAddress: "",
      city: "",
      clinicLocation: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await completeClinicAdminOnboarding(values);
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card
      title="Clinic workspace"
      subtitle="Create the clinic profile. You can invite doctors and manage subscriptions after setup."
    >
      {formError ? <ErrorState message={formError} /> : null}
      <FormInput control={control} error={errors.clinicName?.message} label="Clinic name" name="clinicName" />
      <FormInput control={control} error={errors.clinicEmail?.message} keyboardType="email-address" label="Clinic email" name="clinicEmail" />
      <FormInput control={control} error={errors.clinicPhone?.message} keyboardType="phone-pad" label="Clinic phone" name="clinicPhone" />
      <FormInput control={control} error={errors.website?.message} label="Website optional" name="website" placeholder="https://clinic.example.com" />
      <FormInput control={control} error={errors.clinicAddress?.message} label="Clinic address" name="clinicAddress" />
      <FormInput control={control} error={errors.city?.message} label="City" name="city" />
      <FormInput control={control} error={errors.clinicLocation?.message} label="First clinic location" name="clinicLocation" placeholder="Main clinic" />
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Doctor invitations, staff management, and subscription upgrades are
          available after the clinic dashboard is created.
        </Text>
      </View>
      <Button title="Create clinic workspace" isLoading={isSubmitting} onPress={onSubmit} />
    </Card>
  );
}

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  helperText?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad" | "decimal-pad";
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  style?: object;
};

function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  helperText,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <Input
          error={error}
          helperText={helperText}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          value={typeof value === "string" ? value : ""}
          {...props}
        />
      )}
    />
  );
}

function getOnboardingTitle(role: "patient" | "doctor" | "clinic_admin") {
  if (role === "patient") {
    return "Patient profile setup";
  }

  if (role === "doctor") {
    return "Doctor profile setup";
  }

  return "Clinic workspace setup";
}

function getOnboardingIntro(
  role: "patient" | "doctor" | "clinic_admin",
  name?: string | null
) {
  const firstName = typeof name === "string" ? name.split(" ")[0] : null;

  if (role === "patient") {
    return {
      badge: "Patient account setup",
      title: firstName
        ? `Finish setting up your account, ${firstName}`
        : "Finish setting up your patient account",
      subtitle:
        "MediMeet needs a few details before you can manage private appointments securely.",
      cardTitle: "What happens next",
      cardSubtitle:
        "This setup keeps appointment communication accurate and private.",
      primaryAction: "Continue patient setup",
      items: [
        "Confirm your name and appointment contact details.",
        "Add your city and preferred language.",
        "Optionally add your date of birth for clinic identification."
      ]
    };
  }

  if (role === "doctor") {
    return {
      badge: "Doctor workspace setup",
      title: firstName
        ? `Prepare your doctor profile, ${firstName}`
        : "Prepare your doctor profile",
      subtitle:
        "Your profile stays private until platform verification is completed.",
      cardTitle: "Doctor setup steps",
      cardSubtitle:
        "Complete identity, expertise, practice, verification, and first availability setup.",
      primaryAction: "Continue doctor setup",
      items: [
        "Add your professional identity and registration details.",
        "Describe qualifications, specialties, services, and locations.",
        "Upload verification documents and create first availability."
      ]
    };
  }

  return {
    badge: "Clinic workspace setup",
    title: "Create your clinic workspace",
    subtitle:
      "Set up the clinic profile before inviting doctors or managing clinic appointments.",
    cardTitle: "Clinic setup steps",
    cardSubtitle:
      "Start with the core clinic details. Doctors and billing can be managed after setup.",
    primaryAction: "Continue clinic setup",
    items: [
      "Add clinic name, contact details, website, and address.",
      "Create the first clinic location.",
      "Prepare the clinic dashboard for doctors and appointments."
    ]
  };
}

const styles = StyleSheet.create({
  introContent: {
    justifyContent: "center"
  },
  introHero: {
    alignItems: "center",
    gap: spacing.md
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: colors.primary
  },
  logoText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "900"
  },
  introTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center"
  },
  introSubtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: "center"
  },
  introCard: {
    gap: spacing.xl
  },
  introCardHeader: {
    gap: spacing.xs
  },
  introCardTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  introCardSubtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 20
  },
  checklist: {
    gap: spacing.md
  },
  checklistItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  checklistDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
    backgroundColor: colors.primary
  },
  checklistText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 24
  },
  header: {
    gap: spacing.sm
  },
  brand: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "900"
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
  photoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted
  },
  stepper: {
    flexDirection: "row",
    gap: spacing.sm
  },
  stepPill: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  stepPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  stepPillText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900"
  },
  stepPillTextActive: {
    color: colors.white
  },
  formActions: {
    gap: spacing.md
  },
  uploadRow: {
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  uploadCopy: {
    gap: spacing.xs
  },
  uploadTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  uploadMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700"
  },
  infoBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  infoText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 19
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  }
});

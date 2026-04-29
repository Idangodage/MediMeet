# MediMeet

MediMeet is an Expo React Native foundation for a doctor-patient private-practice appointment booking SaaS.

This repository currently contains the app foundation, Supabase database schema, authentication, role-based onboarding, public doctor discovery, doctor profile management, and doctor verification review workflows. Full appointment management, availability management, payments, subscriptions, and broader production admin workflows are not implemented in the frontend yet.

## Documentation Rule

The README acts as the project manual. Every future implementation should update this README when behavior, setup, routes, environment variables, architecture, scripts, or backend requirements change.

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- React Hook Form
- Zod
- TanStack Query
- Expo Image Picker
- Expo Document Picker
- Clean React Native styling with shared theme constants

## Current Implementation

- Expo Router app shell with role-based route groups.
- Supabase client setup with secure session persistence.
- Environment variable handling for Expo public Supabase config.
- Global auth provider for session, profile, role, and sign-out state.
- Safe missing-env handling with an in-app Supabase setup screen.
- Role protection structure for patient, doctor, clinic admin, and platform admin sections.
- Shared UI primitives: `Button`, `Input`, `Card`, `Badge`, `Avatar`, `EmptyState`, `LoadingState`, and `ErrorState`.
- Email/password sign-up, login, logout, and secure auth session persistence.
- Role selection during sign-up for `patient`, `doctor`, and `clinic_admin`.
- Role-specific onboarding forms for patients, doctors, and clinic admins.
- Public doctor discovery with guest home, filtered doctor search, public doctor profiles, guest login prompt, and patient booking from the first available public slot.
- Doctor profile management with editable credentials, services, visiting locations, private preview, verification warning badges, and profile completion scoring.
- Doctor verification system with private document uploads, doctor-side upload status, platform-admin review queue, secure signed document opening, approval, rejection, request-update status, and admin notes.
- Placeholder dashboard screens for patient, doctor, clinic admin, and platform admin roles.
- Supabase migrations for roles, profiles, avatar storage, complete SaaS domain tables, indexes, constraints, RBAC helper functions, and relationship-based RLS.

## Roles

The app role model is:

- `guest`
- `patient`
- `doctor`
- `clinic_admin`
- `platform_admin`

Authenticated roles are stored in `public.profiles.role`. Guests are unauthenticated users.

## Folder Structure

```txt
app/
components/
components/ui/
constants/
features/auth/
features/patient/
features/doctor/
features/clinic/
features/admin/
features/appointments/
features/subscriptions/
hooks/
lib/
services/
supabase/migrations/
types/
```

## Routing

Expo Router routes are organized by role:

```txt
app/index.tsx              Root role redirect
app/(public)/guest         Guest home
app/(public)/doctors       Public doctor search
app/(public)/doctors/[id]  Public doctor profile
app/(public)/login-prompt  Booking login/signup prompt for guests
app/(auth)/sign-in.tsx     Guest-only sign-in
app/(auth)/sign-up.tsx     Guest-only sign-up with role selection
app/onboarding/index.tsx   Authenticated role-based onboarding
app/patient/index.tsx      Patient area
app/doctor/index.tsx       Doctor area
app/doctor/profile.tsx     Doctor profile management
app/doctor/preview.tsx     Private doctor public-profile preview
app/doctor/verification.tsx Doctor verification document upload/status
app/clinic/index.tsx       Clinic admin area
app/admin/index.tsx        Platform admin area
app/admin/verifications/index.tsx Platform admin verification queue
app/admin/verifications/[doctorId].tsx Platform admin verification detail/review
```

Route protection lives in:

```txt
features/auth/components/GuestOnlyRoute.tsx
features/auth/components/RoleGate.tsx
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Add your Supabase values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Start Expo:

```bash
npm run start
```

If environment variables were added or changed while Metro was already running, restart with cache cleared:

```bash
npx expo start -c
```

## Expo Go Compatibility

This project uses Expo SDK 54. If Expo Go shows an incompatible SDK error, update Expo Go from the Play Store or App Store and restart Metro:

```bash
npx expo start -c
```

## Supabase Setup

Supabase migrations are stored in:

```txt
supabase/migrations/20260429000000_foundation.sql
supabase/migrations/20260429001000_complete_schema.sql
supabase/migrations/20260429002000_rls_policies.sql
supabase/migrations/20260429003000_rbac_relationship_rls.sql
supabase/migrations/20260429004000_auth_onboarding_support.sql
supabase/migrations/20260429005000_public_discovery_booking.sql
supabase/migrations/20260429006000_doctor_profile_management.sql
supabase/migrations/20260429007000_doctor_verification_system.sql
```

The foundation migration creates:

- `public.app_role` enum.
- `public.profiles` table.
- Profile timestamp trigger.
- New-user profile creation trigger.
- Role helper functions.
- Profile RLS policies.
- `avatars` Supabase Storage bucket.
- Avatar object RLS policies.

The complete schema migration adds the SaaS domain model:

- `patient_profiles`
- `doctor_profiles`
- `doctor_verification_documents`
- `clinics`
- `clinic_locations`
- `doctor_clinic_memberships`
- `doctor_locations`
- `doctor_availability`
- `appointment_slots`
- `appointments`
- `doctor_patient_relationships`
- `reviews`
- `subscriptions`
- `payments`
- `invoices`
- `notifications`
- `audit_logs`

The RBAC migration adds two supporting backend tables:

- `clinic_admin_memberships`, which links `clinic_admin` users to clinics they can manage.
- `user_reports`, which gives platform admins a protected table for reported-user workflows.

The auth onboarding support migration:

- Preserves selected signup roles in `public.profiles` for `patient`, `doctor`, and `clinic_admin`.
- Blocks public signup from creating `platform_admin` users.
- Adds `complete_clinic_admin_onboarding(...)`, a security-definer RPC that creates a clinic, first location, and active owner membership atomically for clinic admins.

The public discovery and booking migration:

- Allows anonymous users to read public verified doctor locations, public availability, available slots, and public reviews.
- Adds `book_public_appointment(slot_id, reason_for_visit)`, a security-definer RPC for signed-in patients.
- The RPC validates the user is a patient, verifies onboarding exists, locks the slot, checks public doctor status and active location/availability, creates a confirmed appointment, and marks the slot as booked.

The doctor profile management migration:

- Adds `services text[]` to `doctor_profiles`.
- Adds a GIN index on `doctor_profiles.services` for future service-based discovery.

The doctor verification system migration:

- Adds verification document enum values for medical registration certificates, qualification certificates, and clinic proof.
- Adds `storage_path`, file metadata, and `verification_note` to `doctor_verification_documents`.
- Creates the private `doctor-verification-documents` Supabase Storage bucket.
- Adds Storage RLS policies so only the owning doctor and platform admins can select/upload/read signed URLs for verification objects.
- Keeps verification files non-public; guests, patients, and unrelated authenticated users do not receive Storage access.

The schema includes:

- Domain enums for verification, memberships, consultation type, slots, appointments, billing, notifications, and relationships.
- Foreign keys between auth profiles, patient records, doctor records, clinics, locations, slots, appointments, reviews, billing, notifications, and audit logs.
- Timestamp defaults and `updated_at` triggers where applicable.
- Constraints for ratings, money amounts, coordinates, appointment times, availability times, email format, ownership checks, and one-review-per-appointment.
- Indexes for role lookup, discovery filters, GIN array search, appointments by participant/date, slot availability, billing provider IDs, notifications, and audit log lookup.

The latest RLS migration supersedes the earlier baseline policies and enforces role-based plus relationship-based access control:

- Guest users can read only public verified doctor profiles.
- Patients can read and update only their own patient profile, read public doctor profiles, create their own appointments, read their own appointments, and cancel only their own pending or confirmed appointments.
- Doctors can read and update only their own doctor profile, manage only their own availability, read only their appointments, and see patient details only through an appointment or active doctor-patient relationship.
- Clinic admins can read and manage clinic-scoped doctors, clinic locations, doctor memberships, availability, slots, and appointments only for clinics linked through `clinic_admin_memberships`.
- Platform admins can verify doctors, access verification documents, manage reported users, manage billing/admin records, and read audit logs.
- Sensitive platform-admin writes to profiles, doctors, verification documents, clinics, memberships, billing tables, and user reports are automatically recorded in `audit_logs`.
- Service-role backend jobs can still bypass RLS for trusted automation such as payment webhooks and notification fanout.

RLS helper functions include:

- `get_user_role()`
- `is_doctor_for_appointment(appointment_id)`
- `is_patient_for_appointment(appointment_id)`
- `is_clinic_admin(clinic_id default null)`
- `is_platform_admin()`
- `has_doctor_patient_relationship(doctor_id, patient_id)`

Additional internal helper functions support profile visibility, clinic scoping, appointment updates, review eligibility, and admin audit logging.

RLS example queries are in:

```txt
supabase/tests/rls_access_examples.sql
```

The examples use transaction-scoped JWT claim simulation and require seeded test users/profiles/appointments before running.

Apply migrations with the Supabase CLI from the project root:

```bash
supabase db push
```

If using a linked remote project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Auth And Onboarding

Sign-up uses Supabase email/password auth and stores selected role metadata:

```txt
full_name
role = patient | doctor | clinic_admin
```

The database trigger creates a matching `public.profiles` row. Platform admins are not available through public sign-up and must be provisioned through a trusted backend/admin process.

After sign-up:

- If Supabase email confirmation is disabled, the user is sent directly to `/onboarding`.
- If email confirmation is enabled, the user stays on sign-up with a confirmation message and must confirm email before signing in.
- Root routing sends incomplete authenticated users to `/onboarding`.
- Completed users are routed by role: patients to `/patient`, doctors to `/doctor`, clinic admins to `/clinic`, and platform admins to `/admin`.

Onboarding forms:

- Patient onboarding collects full name, phone, city, and preferred language, then writes `profiles` and `patient_profiles`.
- Doctor onboarding collects full name, title, registration number, qualifications, specialty, experience, languages, fee, biography, and optional profile photo, then writes `profiles`, uploads the photo to `avatars`, and writes `doctor_profiles`.
- Clinic admin onboarding collects clinic name, clinic email, clinic phone, and clinic location, then calls `complete_clinic_admin_onboarding(...)`.

Logout uses Supabase Auth sign-out and clears local auth context state. Sessions are persisted with `expo-secure-store`.

## Public Doctor Discovery

Guest users start at `/guest` and can browse public verified doctors without an account.

Search filters on `/doctors`:

- Specialty
- City or location
- Language
- Availability date in `YYYY-MM-DD` format
- Consultation fee range
- Verification status
- Consultation type: `in_person`, `video`, or `phone`

Doctor cards show:

- Profile image, name, title, specialty, and verification badge
- Qualifications summary
- Years of experience
- City/location
- Consultation fee
- Next available date
- Consultation type

Doctor public profiles at `/doctors/[doctorId]` show:

- Profile image, name, title, verification badge, rating, experience, and fee
- Specialty, subspecialty, qualifications, languages, biography, and services
- Visiting locations
- Available dates
- Public reviews
- Book appointment button

Booking behavior:

- Guests who tap book are redirected to `/login-prompt`.
- Signed-in patients can book the next available slot through `book_public_appointment(...)`.
- Non-patient authenticated roles cannot book from public doctor profiles.

If Supabase environment variables are missing, the app renders a setup screen instead of crashing.

## Doctor Profile Management

Doctors manage their profile from `/doctor/profile` and can preview it privately at `/doctor/preview`.

Editable profile fields:

- Profile image
- Title
- Full name
- Qualifications
- Registration number
- Specialties and subspecialties
- Years of experience
- Languages
- Biography
- Consultation fee
- Services
- Visiting locations

Profile status labels in the frontend:

- `incomplete`: required public-profile fields are missing.
- `pending_verification`: profile is complete and waiting for platform verification.
- `verified`: Supabase `verification_status = approved`.
- `rejected`: Supabase `verification_status = rejected`.
- `needs_update`: Supabase `verification_status = needs_review`.

Profile completion:

- Completion is calculated from profile image, title, full name, registration number, qualifications, specialties, experience, languages, biography, consultation fee, services, and at least one active visiting location.
- The doctor dashboard and profile editor both show completion percentage and status badge.
- Missing fields are displayed as warning badges in the profile editor.

Visibility rules:

- Public search still only loads doctors where `is_public = true` and `verification_status = approved`.
- Non-verified profiles show a warning badge and “not public yet” messaging.
- Doctors can preview their own profile privately even when incomplete, pending, rejected, or needs update.
- The current UI does not let doctors directly toggle `is_public`; publication remains platform/admin controlled.

## Doctor Verification System

Doctors upload verification documents from `/doctor/verification`.

Supported document requirements:

- Medical registration certificate: required.
- Qualification certificate: required.
- Identity document: required.
- Clinic proof: optional.

Doctor-side behavior:

- Files are selected with Expo Document Picker.
- Supported upload MIME types are PDF, JPEG, PNG, and WebP.
- Files are stored under the private `doctor-verification-documents` bucket using the doctor profile id as the first storage path segment.
- The doctor can see each document type, latest upload status, upload date, file name, and admin verification note.
- The doctor can open their own uploaded document through a short-lived signed URL.
- The doctor can upload replacement documents; replacement uploads create new pending document rows.

Platform admin behavior:

- Admins open the verification queue from `/admin/verifications`.
- The queue includes doctors with pending or needs-update verification profiles and doctors with pending/needs-update documents.
- Admins can open a doctor verification request, review profile details, and open private documents through signed URLs.
- Admins can approve, reject, or request update with a note.
- Review actions update all uploaded verification documents for the doctor and set `doctor_profiles.verification_status` to `approved`, `rejected`, or `needs_review`.
- Admin notes are stored in `doctor_verification_documents.verification_note` and are visible to the doctor.

Verification security:

- Guests and patients cannot query `doctor_verification_documents`.
- Doctors can select and insert only documents linked to their own `doctor_profiles.id`.
- Platform admins can select and review all verification documents.
- Private Storage access is additionally scoped by bucket and path-level ownership checks.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```

## Verification

Run these checks after implementation work:

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## Known Notes

- Full booking workflows are not implemented yet, but public profile booking can create a confirmed appointment from the next available public slot.
- Subscription and billing frontend workflows are not implemented yet, but backend subscription, payment, and invoice tables now exist.
- Doctor profile publication still requires platform verification and setting `is_public`.
- Clinic-admin access now depends on active rows in `clinic_admin_memberships`.
- `npm audit` may report moderate transitive advisories through Expo CLI dependencies. Do not force downgrade Expo to resolve these unless the Expo SDK strategy is intentionally changed.

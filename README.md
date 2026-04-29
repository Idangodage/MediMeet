# MediMeet

MediMeet is an Expo React Native foundation for a doctor-patient private-practice appointment booking SaaS.

This repository currently contains the app foundation and Supabase database schema. Appointment booking, availability management, payments, subscriptions, clinic onboarding, and production admin workflows are not implemented in the frontend yet.

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
- Clean React Native styling with shared theme constants

## Current Implementation

- Expo Router app shell with role-based route groups.
- Supabase client setup with secure session persistence.
- Environment variable handling for Expo public Supabase config.
- Global auth provider for session, profile, role, and sign-out state.
- Safe missing-env handling with an in-app Supabase setup screen.
- Role protection structure for patient, doctor, clinic admin, and platform admin sections.
- Shared UI primitives: `Button`, `Input`, `Card`, `Badge`, `Avatar`, `EmptyState`, `LoadingState`, and `ErrorState`.
- Basic auth screens for patient sign-in and patient sign-up.
- Placeholder home screens for patient, doctor, clinic admin, and platform admin roles.
- Supabase migrations for roles, profiles, avatar storage, complete SaaS domain tables, indexes, constraints, and baseline RLS.

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
app/(auth)/sign-in.tsx     Guest-only sign-in
app/(auth)/sign-up.tsx     Guest-only patient sign-up
app/patient/index.tsx      Patient area
app/doctor/index.tsx       Doctor area
app/clinic/index.tsx       Clinic admin area
app/admin/index.tsx        Platform admin area
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

This project uses Expo SDK 55. If Expo Go shows an incompatible SDK error, update Expo Go from the Play Store or App Store and restart Metro:

```bash
npx expo start -c
```

## Supabase Setup

Supabase migrations are stored in:

```txt
supabase/migrations/20260429000000_foundation.sql
supabase/migrations/20260429001000_complete_schema.sql
supabase/migrations/20260429002000_rls_policies.sql
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

The schema includes:

- Domain enums for verification, memberships, consultation type, slots, appointments, billing, notifications, and relationships.
- Foreign keys between auth profiles, patient records, doctor records, clinics, locations, slots, appointments, reviews, billing, notifications, and audit logs.
- Timestamp defaults and `updated_at` triggers where applicable.
- Constraints for ratings, money amounts, coordinates, appointment times, availability times, email format, ownership checks, and one-review-per-appointment.
- Indexes for role lookup, discovery filters, GIN array search, appointments by participant/date, slot availability, billing provider IDs, notifications, and audit log lookup.

The RLS migration enables baseline row-level security:

- Patients can manage their own patient profile and access their own appointments, reviews, notifications, and payments.
- Doctors can manage their own doctor profile, locations, availability, slots, relationships, verification uploads, and relevant appointments.
- Public users can read approved public doctor profiles, public clinics, active public doctor locations, active availability, available slots, and public reviews.
- Platform admins can manage protected operational records such as clinics, memberships, verification reviews, payments, invoices, subscriptions, notifications, and audit logs.
- Service-role backend jobs can still bypass RLS for trusted automation such as payment webhooks and notification fanout.

Apply migrations with the Supabase CLI from the project root:

```bash
supabase db push
```

If using a linked remote project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Auth Behavior

Patient sign-up sends Supabase Auth metadata with:

```txt
full_name
role = patient
```

The database trigger creates a matching `public.profiles` row. Doctor, clinic admin, and platform admin provisioning should be added through an invite or admin workflow later.

If Supabase environment variables are missing, the app renders a setup screen instead of crashing.

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

- Booking frontend is not implemented yet, but the backend appointment tables now exist.
- Subscription and billing frontend workflows are not implemented yet, but backend subscription, payment, and invoice tables now exist.
- Doctor and clinic admin onboarding are not implemented yet.
- Clinic admins do not yet have a dedicated clinic-admin membership table. Current clinic write access is platform-admin controlled until that workflow is designed.
- `npm audit` may report moderate transitive advisories through Expo CLI dependencies. Do not force downgrade Expo to resolve these unless the Expo SDK strategy is intentionally changed.

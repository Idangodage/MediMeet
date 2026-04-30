# MediMeet

MediMeet is an Expo React Native foundation for a doctor-patient private-practice appointment booking SaaS.

This repository currently contains the app foundation, Supabase database schema, authentication, role-based onboarding, public doctor discovery, doctor profile management, doctor verification review workflows, doctor availability calendar management, patient appointment booking, the patient dashboard, the doctor appointment dashboard, doctor-patient relationships, reviews and ratings, clinic management, in-app notifications, SaaS subscription plan gating, basic analytics, Stripe-hosted subscription billing, future appointment-payment architecture, a platform admin dashboard, a professional healthcare UI polish layer, and a security access-test matrix. Online appointment payments are not activated in the MVP.

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
- Expo Notifications
- Clean React Native styling with shared theme constants

## Current Implementation

- Expo Router app shell with role-based route groups.
- Supabase client setup with secure session persistence.
- Environment variable handling for Expo public Supabase config.
- Global auth provider for session, profile, role, and sign-out state.
- Safe missing-env handling with an in-app Supabase setup screen.
- Role protection structure for patient, doctor, clinic admin, and platform admin sections.
- Shared UI primitives: `Button`, `Input`, `Card`, `Badge`, `Avatar`, `EmptyState`, `LoadingState`, and `ErrorState`, styled with the professional healthcare design system.
- Splash/session redirect, welcome screen, landing page, onboarding carousel, public role selection, login/signup, role-based onboarding, and dashboard routing.
- Email/password sign-up, login, logout, forgot-password email, email-verification message, and secure auth session persistence.
- Role selection before and during sign-up for `patient`, `doctor`, and `clinic_admin`.
- Role-specific onboarding forms for patients, doctors, and clinic admins, including multi-step doctor onboarding.
- Authenticated users with incomplete onboarding now land on a role-specific setup introduction before the detailed form, with options to continue setup, browse public doctors, or sign out.
- Public doctor discovery with guest home, filtered doctor search, public doctor profiles, guest login prompt, and patient routing into the booking flow.
- Doctor profile management with editable credentials, services, visiting locations, private preview, verification warning badges, and profile completion scoring.
- Doctor verification system with private document uploads, doctor-side upload status, platform-admin review queue, secure signed document opening, approval, rejection, request-update status, profile publication controls, suspension, and admin notes.
- Doctor availability calendar with day/week/month views, guarded availability creation/editing/deletion, automatic slot generation, available/booked/blocked slot separation, and specific-slot disabling.
- Patient appointment booking with location/date/slot selection, optional reason for visit, server-side slot locking, automatic confirmation, booking confirmation UI, patient appointment history, and doctor notifications.
- Appointment payment placeholder showing `Payment method: Pay at clinic` and `Online payment coming later`; patient booking remains free in-app for the MVP.
- Patient dashboard with appointment summary, upcoming/previous/cancelled appointments, appointment detail, patient-side cancellation, favourite doctors, visited doctors, notifications, and profile settings.
- Doctor appointment dashboard with today/upcoming/requested/completed/cancelled/no-show lists, appointment detail, doctor-side confirm/cancel/reschedule/complete/no-show actions, treated patients, contact visibility gating, profile views, booking mix, patient mix, location/day analytics, and feature-gated analytics visibility.
- Doctor-patient relationship tracking when completed appointments create or update visit relationships for patient visited-doctor and doctor treated-patient lists.
- Reviews and ratings with completed-appointment eligibility, one review per appointment, patient public/private comment choice, doctor average-rating recalculation, public review display, doctor read-only review visibility, and admin hiding.
- Clinic module with clinic profile creation/editing, logo upload, clinic locations, doctor invitations, doctor membership management, clinic appointment filters, clinic subscription access, bookings-by-doctor/location analytics, revenue estimates, and clinic-level analytics gated by the Clinic Plan.
- In-app notification center with granular event keys, unread badges, notification previews on role dashboards, mark-one-read, mark-all-read, and Expo Notifications push adapter scaffolding for later.
- SaaS subscription plan constants for Free, Basic, Pro, and Clinic plans, plus feature gates for monthly booking slots, locations, analytics, featured listing eligibility, reminders, and clinic management.
- Stripe Billing integration through Supabase Edge Functions for customer creation, subscription Checkout, customer portal cancellation/payment updates, webhook subscription sync, failed-payment notifications, and invoice history.
- Future appointment-payment architecture with Stripe, Paytrail, and manual/pay-at-clinic provider abstraction, extended payment types, commission/payout/refund metadata fields, and no card-data storage.
- Platform admin dashboard with overview metrics, all-user role filtering, verification queue/detail, doctor profile moderation, subscription overview, platform analytics, failed payments, reported profiles, and audit-log review.
- Dashboard screens for patient, doctor, clinic admin, and platform admin roles, with patient and doctor appointment workflows now wired into the MVP.
- Professional healthcare SaaS UI polish across guest home, doctor search/profile, patient dashboard, booking flow, doctor dashboards, availability calendar, billing, and admin verification screens.
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
supabase/functions/
types/
```

## Routing

Expo Router routes are organized by role:

```txt
app/index.tsx              Splash/session redirect
app/(public)/welcome       Welcome screen
app/(public)/landing       Product landing page
app/(public)/onboarding-intro Onboarding carousel
app/(public)/choose-role   Public role selection
app/(public)/guest         Guest home / legacy public entry
app/(public)/doctors       Public doctor search
app/(public)/doctors/[id]  Public doctor profile
app/(public)/login-prompt  Booking login/signup prompt for guests
app/(public)/book-doctor/[doctorId] Patient appointment booking flow
app/(public)/privacy       Privacy policy
app/(public)/terms         Terms and conditions
app/(auth)/sign-in.tsx     Guest-only sign-in
app/(auth)/sign-up.tsx     Guest-only sign-up with role selection
app/(auth)/forgot-password.tsx Password reset request
app/(auth)/email-verification.tsx Email verification message
app/onboarding/index.tsx   Authenticated role-based onboarding
app/notifications.tsx      Authenticated notification center
app/(patient)/patient/index.tsx Patient area
app/(patient)/patient/appointments/index.tsx Patient appointment list
app/(patient)/patient/appointments/[appointmentId].tsx Patient appointment detail
app/(patient)/patient/visited-doctors.tsx Patient visited doctors
app/(patient)/patient/favourite-doctors.tsx Patient favourite doctors
app/(patient)/patient/profile.tsx Patient profile settings
app/(doctor)/doctor/index.tsx Doctor area
app/(doctor)/doctor/appointments/index.tsx Doctor appointment dashboard
app/(doctor)/doctor/appointments/[appointmentId].tsx Doctor appointment detail
app/(doctor)/doctor/availability.tsx Doctor availability calendar
app/(doctor)/doctor/billing.tsx Doctor Stripe billing screen
app/(doctor)/doctor/patients.tsx Doctor treated patients
app/(doctor)/doctor/profile.tsx Doctor profile management
app/(doctor)/doctor/preview.tsx Private doctor public-profile preview
app/(doctor)/doctor/verification.tsx Doctor verification document upload/status
app/(clinic)/clinic/index.tsx Clinic admin area
app/(clinic)/clinic/billing.tsx Clinic Stripe billing screen
app/(clinic)/clinic/profile.tsx Clinic profile and location management
app/(clinic)/clinic/doctors.tsx Clinic doctor invitations and memberships
app/(clinic)/clinic/appointments.tsx Clinic appointment list and filters
app/(clinic)/clinic/analytics.tsx Clinic-level analytics
app/(admin)/admin/index.tsx Platform admin area
app/(admin)/admin/users.tsx Platform admin user directory
app/(admin)/admin/billing.tsx Platform admin billing overview
app/(admin)/admin/reviews.tsx Platform admin review moderation
app/(admin)/admin/reports.tsx Platform admin reported profiles
app/(admin)/admin/audit-logs.tsx Platform admin audit logs
app/(admin)/admin/verifications/index.tsx Platform admin verification queue
app/(admin)/admin/verifications/[doctorId].tsx Platform admin verification detail/review
```

Route protection lives in:

```txt
features/auth/components/GuestOnlyRoute.tsx
features/auth/components/RoleGate.tsx
```

First-time professional workflow:

```txt
Splash Screen
-> Welcome Screen
-> Landing Page
-> Onboarding Carousel
-> Role Selection
-> Login or Signup
-> Account Setup Introduction
-> Role-Based Onboarding
-> Correct Dashboard
```

If a user is already signed in but has not completed role-specific onboarding, the splash screen routes directly to the account setup introduction for that role instead of showing the public welcome flow again.

Guest browsing workflow:

```txt
Welcome Screen
-> Continue as Guest
-> Doctor Search
-> Doctor Public Profile
-> Login Required when trying to book
```

## Visual Design System

The app uses a premium healthcare SaaS visual direction defined in `constants/theme.ts` and shared through `components/ui/`.

- Backgrounds use white and soft blue-green medical surfaces.
- Cards use rounded corners, subtle borders, and elevation for a polished SaaS feel.
- Buttons are consistent pill-shaped actions with primary, secondary, ghost, and danger variants.
- Inputs use rounded healthcare form styling, stronger readable labels, and accessible placeholder/focus colors.
- Badges support neutral, primary, info, success, warning, and danger variants for verification, trust, appointment, billing, and review states.
- Empty, loading, and error states are styled as first-class UI states instead of placeholder text.
- Guest home, doctor search, public doctor profile, patient dashboard, booking flow, doctor dashboards, availability calendar, billing, and admin verification screens include trust cues, clear spacing, and status-forward cards.

## Legal And Safety

Public legal routes:

```txt
/privacy
/terms
```

The MVP includes this healthcare disclaimer on public and booking surfaces:

```txt
This platform is for doctor discovery and appointment booking only. It is not for emergency medical care.
```

The included privacy policy and terms screens are MVP implementation text. Replace them with legal counsel-approved production policy text before a public launch.

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
EXPO_PUBLIC_APP_ENV=development
```

Stripe server secrets are used only by Supabase Edge Functions. Set them with Supabase secrets, not with `EXPO_PUBLIC_` prefixes:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
supabase secrets set STRIPE_BASIC_PRICE_ID=price_basic
supabase secrets set STRIPE_PRO_PRICE_ID=price_pro
supabase secrets set STRIPE_CLINIC_PRICE_ID=price_clinic
```

Start Expo:

```bash
npm run start
```

EAS build profiles are defined in:

```txt
eas.json
```

Configured build profiles:

- `development`: internal development client.
- `preview`: internal QA build.
- `production`: app-store-ready build profile with auto-increment enabled.

Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_APP_ENV=production` in the EAS project environment before production builds.

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
supabase/migrations/20260429008000_doctor_availability_calendar.sql
supabase/migrations/20260429009000_patient_booking_flow.sql
supabase/migrations/20260429010000_patient_dashboard.sql
supabase/migrations/20260429011000_doctor_appointment_dashboard.sql
supabase/migrations/20260430000000_doctor_patient_relationships_logic.sql
supabase/migrations/20260430001000_notification_system.sql
supabase/migrations/20260430002000_subscription_plan_structure.sql
supabase/migrations/20260430003000_stripe_billing_integration.sql
supabase/migrations/20260430004000_clinic_module.sql
supabase/migrations/20260430005000_platform_admin_dashboard.sql
supabase/migrations/20260430006000_reviews_ratings.sql
supabase/migrations/20260430007000_basic_analytics.sql
supabase/migrations/20260430008000_future_appointment_payments.sql
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
- The foundation migration is written to tolerate a partially prepared database where the role, table, triggers, or policies already exist.

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
- Adds the initial `book_public_appointment(slot_id, reason_for_visit)`, a security-definer RPC for signed-in patients.
- The later patient booking flow migration hardens this RPC with duplicate-booking checks, doctor notifications, and updated appointment-status handling.

The doctor profile management migration:

- Adds `services text[]` to `doctor_profiles`.
- Adds a GIN index on `doctor_profiles.services` for future service-based discovery.

The doctor verification system migration:

- Adds verification document enum values for medical registration certificates, qualification certificates, and clinic proof.
- Adds `storage_path`, file metadata, and `verification_note` to `doctor_verification_documents`.
- Creates the private `doctor-verification-documents` Supabase Storage bucket.
- Adds Storage RLS policies so only the owning doctor and platform admins can select/upload/read signed URLs for verification objects.
- Keeps verification files non-public; guests, patients, and unrelated authenticated users do not receive Storage access.

The doctor availability calendar migration:

- Adds helper checks for booking history on availability and active bookings on slots.
- Adds guarded RPCs for creating, updating, and deleting doctor availability.
- Adds automatic `appointment_slots` generation from date, start time, end time, appointment duration, and break time.
- Adds overlap prevention for active availability windows owned by the same doctor.
- Adds validation for past dates, invalid times, non-positive duration, negative break time, and invalid patient capacity.
- Adds a slot-status RPC that lets doctors toggle only unbooked future slots between `available` and `blocked`.
- Blocks editing or deleting availability with booking history until rescheduling logic exists.

The patient booking flow migration:

- Adds appointment status values for `requested`, `cancelled_by_patient`, and `cancelled_by_doctor`.
- Replaces active appointment uniqueness rules so cancelled-by-patient and cancelled-by-doctor appointments do not block future booking.
- Adds active doctor-time and patient-doctor-time unique indexes to prevent double booking.
- Updates appointment cancellation guards so patients can cancel only their own requested, pending, or confirmed appointments.
- Replaces `book_public_appointment(slot_id, reason_for_visit)` with a hardened transaction that locks the slot row, validates patient onboarding, verifies the public doctor/location/availability state, prevents duplicate patient and doctor bookings, creates a confirmed appointment, marks the slot as booked, and creates a doctor notification.
- Also creates a patient confirmation notification when a booking is confirmed.
- The MVP does not create appointment payment rows during booking; payment is handled at the clinic.

The patient dashboard migration:

- Adds `patient_favourite_doctors` for patient-owned saved doctors.
- Adds RLS policies so patients can select, insert, and delete only their own favourite doctor rows.
- Adds patient-scoped read policies for doctor profiles and locations linked to the patient's own appointments or favourites.
- Adds `cancel_patient_appointment(appointment_id, reason)`, a security-definer RPC that validates patient ownership, locks the appointment, rejects past or non-cancellable appointments, marks the appointment `cancelled_by_patient`, releases the future booked slot, and notifies both doctor and patient.

The doctor appointment dashboard migration:

- Adds `get_owned_doctor_id()` for doctor-scoped backend workflows.
- Adds doctor appointment RPCs for confirming, cancelling, completing, marking no-show, and rescheduling appointments.
- Locks appointment and slot rows during doctor actions so status changes and slot updates happen atomically.
- Validates that the signed-in doctor owns the appointment before any mutation.
- Releases future booked slots when doctors cancel or reschedule appointments.
- Creates a replacement confirmed appointment when rescheduling into a future available slot and marks the original appointment `rescheduled`.
- Upserts `doctor_patient_relationships` when an appointment is marked completed.
- Notifies patients when doctors confirm, cancel, complete, mark no-show, or reschedule appointments.

The doctor-patient relationships migration:

- Adds `record_completed_doctor_patient_relationship(doctor_id, patient_id, visit_date)` as the central server-side relationship upsert helper.
- Redefines `doctor_mark_appointment_completed(...)` to mark the appointment completed and call the relationship helper.
- Creates a relationship with `first_visit_date`, `last_visit_date`, `total_visits = 1`, and `relationship_status = active` when the first completed visit is recorded.
- Updates an existing relationship by preserving the earliest first visit, moving `last_visit_date` forward when applicable, incrementing `total_visits`, and reactivating the relationship.
- Adds patient relationship-based read access for `doctor_profiles`, so patient visited-doctor lists can rely on `doctor_patient_relationships` as the source of truth.
- Keeps medical-record data out of the relationship model for MVP.

The notification system migration:

- Adds `notification_event` enum values for patient, doctor, clinic admin, and platform admin notification events.
- Adds nullable `notifications.event` for granular event tracking while preserving existing `notifications.type`.
- Adds indexes for user-event notification history.
- Adds `create_app_notification(...)` as the server-side helper for future backend workflows.
- Adds event inference for legacy notification inserts that only provide title, body, and type.
- Adds verification-status notification triggers for doctor approval and rejection.
- Adds platform-admin notifications when doctors upload verification documents for review.
- Keeps notification reads and updates protected by existing user-owned RLS policies.

The subscription plan structure migration:

- Adds `normalize_subscription_plan_name(...)` for safe plan-name normalization.
- Adds `is_subscription_effective(...)` to centralize active/trialing and current-period checks.
- Adds period indexes for doctor and clinic subscription lookups.
- Keeps expired and inactive subscription rows for billing history; app logic downgrades feature access to Free.

The Stripe billing integration migration:

- Adds `suspended` to `subscription_status` for Stripe unpaid, paused, or incomplete subscription states.
- Adds Stripe invoice/payment identifiers and billing periods to `invoices`.
- Adds unique invoice-provider indexes so webhook processing can upsert invoice history safely.
- Adds `stripe_webhook_events` for webhook idempotency and platform-admin visibility.
- Adds subscription status/period indexes for platform billing dashboards.

The clinic module migration:

- Creates the public `clinic-logos` Storage bucket for clinic profile logos.
- Adds Storage RLS policies so only admins of a clinic can upload, update, or delete logo objects under that clinic id path.
- Adds `clinic_has_effective_clinic_plan(...)` for server-side Clinic Plan checks.
- Adds a trigger that blocks adding or reactivating multiple clinic doctors unless the clinic has an effective Clinic Plan.
- Adds `create_clinic_profile_for_current_admin(...)`, allowing a `clinic_admin` user without an active clinic to create one owned by themselves.
- Adds `clinic_invite_doctor(...)`, a security-definer RPC that lets clinic admins invite doctors by account email or registration number without exposing global doctor search.

The platform admin dashboard migration:

- Adds `suspended` to `verification_status` so platform admins can suspend doctor public profiles without deleting profile data.
- Adds `user_reports.admin_note` for report-review notes.
- Adds created-at indexes for reports and audit logs.
- Adds `admin_moderate_doctor_profile(...)`, a platform-admin RPC that updates doctor verification/public visibility and writes explicit moderation audit metadata.
- Adds `admin_review_user_report(...)`, a platform-admin RPC that updates report status, reviewer metadata, admin notes, and explicit audit metadata.

The reviews and ratings migration:

- Adds `create_patient_review(...)`, a patient RPC that validates completed appointment ownership before inserting a review.
- Keeps one review per appointment through the existing `reviews_appointment_unique` constraint.
- Adds average-rating refresh functions and a review trigger so `doctor_profiles.average_rating` recalculates after review insert, update, or delete.
- Preserves doctor-profile update protection while allowing trusted average-rating refreshes.
- Adds `admin_hide_review(...)`, a platform-admin RPC that sets `reviews.is_public = false` and writes an explicit audit log entry.

The basic analytics migration:

- Adds `doctor_profile_views` for doctor public-profile view events.
- Adds indexes for doctor/date and viewer/date profile-view analytics.
- Adds RLS so only the owning doctor or platform admins can read view events.
- Adds `record_doctor_profile_view(doctor_id)`, an anon/authenticated RPC that records views only for public verified doctors.

The future appointment-payment migration:

- Extends `payment_type` with `deposit`, `cancellation_fee`, and `platform_fee` while preserving older values for migration compatibility.
- Extends `payment_provider` with `paytrail`; `stripe`, `manual`, and `other` remain available.
- Adds future payment metadata on `payments` for checkout ids, refund ids, platform fee, provider fee, payout amount, payout provider id, refund reason, cancellation policy snapshots, generic metadata, and lifecycle timestamps.
- Adds indexes for payment type/status, paid-at reporting, checkout ids, and refund ids.
- Adds comments documenting that card details must remain with the provider and must not be stored in MediMeet.

The schema includes:

- Domain enums for verification, reports, memberships, consultation type, slots, appointments, billing, notifications, and relationships.
- Foreign keys between auth profiles, patient records, doctor records, clinics, locations, slots, appointments, reviews, billing, notifications, and audit logs.
- Timestamp defaults and `updated_at` triggers where applicable.
- Constraints for ratings, money amounts, payment fee/payout amounts, coordinates, appointment times, availability times, email format, ownership checks, and one-review-per-appointment.
- Indexes for role lookup, discovery filters, GIN array search, appointments by participant/date, slot availability, billing provider IDs, notifications, and audit log lookup.

The latest RLS migration supersedes the earlier baseline policies and enforces role-based plus relationship-based access control:

- Guest users can read only public verified doctor profiles.
- Patients can read and update only their own patient profile, read public doctor profiles, create their own appointments, read their own appointments, cancel only their own requested, pending, or confirmed appointments, and review only their own completed appointments.
- Doctors can read and update only their own doctor profile, manage only their own availability, read only their appointments, read reviews for their own doctor profile, and see patient details only through an appointment or active doctor-patient relationship.
- Clinic admins can read and manage clinic-scoped doctors, clinic locations, doctor memberships, availability, slots, and appointments only for clinics linked through `clinic_admin_memberships`.
- Platform admins can verify doctors, access verification documents, publish/hide/suspend doctor profiles, manage reported users, manage billing/admin records, and read audit logs.
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

The executable security access matrix and checklist are in:

```txt
supabase/tests/security_access_matrix.sql
supabase/tests/security_access_checklist.md
```

Run the matrix against the linked Supabase project:

```bash
npx supabase db query --linked -f supabase/tests/security_access_matrix.sql
```

The matrix seeds isolated test records inside a transaction, simulates guest/patient/doctor/clinic-admin/platform-admin JWT contexts, verifies RLS/RPC access boundaries, and rolls back all seed data.

Apply migrations with the Supabase CLI from the project root:

```bash
supabase db push
```

`supabase db push` runs migration files in timestamp filename order and records applied versions in the remote migration history table. If a remote database was partially prepared before migration tracking existed, the foundation migration can continue past existing foundation objects.

If using a linked remote project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

For this project, the remote Supabase project ref is `zbcpikmqfvbnldyaorqq`. The Supabase CLI stores the local link under `supabase/.temp`, which is intentionally local machine state. If `supabase db push` says `Cannot find project ref`, relink from the project root:

```bash
npx supabase link --project-ref zbcpikmqfvbnldyaorqq
npx supabase db push
```

Deploy the Stripe Edge Functions after setting Stripe secrets:

```bash
supabase functions deploy create-stripe-checkout-session
supabase functions deploy create-stripe-portal-session
supabase functions deploy stripe-webhook
```

Configure the Stripe webhook endpoint to point at:

```txt
https://your-project-ref.supabase.co/functions/v1/stripe-webhook
```

## Auth And Onboarding

Sign-up uses Supabase email/password auth and stores selected role metadata:

```txt
full_name
phone optional
role = patient | doctor | clinic_admin
terms and privacy agreement
```

The database trigger creates a matching `public.profiles` row. Platform admins are not available through public sign-up and must be provisioned through a trusted backend/admin process.

After sign-up:

- If Supabase email confirmation is disabled, the user is sent directly to `/onboarding`.
- If email confirmation is enabled, the user is sent to `/email-verification` and must confirm email before signing in.
- Root routing sends incomplete authenticated users to `/onboarding`.
- Completed users are routed by role: patients to `/patient`, doctors to `/doctor`, clinic admins to `/clinic`, and platform admins to `/admin`.
- Forgot-password requests are available at `/forgot-password`.

Onboarding forms:

- Patient onboarding collects full name, phone, city, preferred language, and optional date of birth, then writes `profiles` and `patient_profiles`.
- Doctor onboarding is multi-step: professional identity, qualifications/expertise, practice information, verification documents, and first availability setup.
- Doctor onboarding writes `doctor_profiles`, uploads the profile image to `avatars`, creates a first `doctor_locations` row, generates initial availability slots, uploads required verification documents, and leaves the doctor profile pending verification.
- Clinic admin onboarding collects clinic name, clinic email, clinic phone, optional website, address, city, first clinic location, and then calls `complete_clinic_admin_onboarding(...)`.

Logout uses Supabase Auth sign-out and clears local auth context state. Sessions are persisted with `expo-secure-store`.

## Public Doctor Discovery

Guest users start at `/welcome`, can continue to `/doctors`, and can browse public verified doctors without an account.

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
- Signed-in patients go to `/book-doctor/[doctorId]` to choose a location, available date, and available time slot.
- Confirmed bookings call `book_public_appointment(...)`, which performs the slot lock and appointment creation server-side.
- Booking screens show `Payment method: Pay at clinic` and `Online payment coming later`.
- Non-patient authenticated roles cannot book from public doctor profiles.

If Supabase environment variables are missing, the app renders a setup screen instead of crashing.

## Patient Appointment Booking

Patients book appointments from `/book-doctor/[doctorId]` after opening a public doctor profile and tapping book.

Booking flow:

- Patient selects a doctor location that has available slots.
- Patient selects an available date for that location.
- Patient selects an available time slot.
- Patient enters an optional reason for visit using React Hook Form and Zod validation.
- Patient confirms the booking.
- The app calls `book_public_appointment(...)`.
- The booking confirmation screen shows the doctor, location, time, appointment id, and pay-at-clinic method.

MVP confirmation behavior:

- The app uses automatic confirmation.
- New appointments are created with `status = confirmed`.
- The selected slot changes from `available` to `booked`.
- A notification row is created for the doctor with `type = appointment`.
- The doctor dashboard shows recent notifications.
- The patient dashboard shows the patient's appointment list.
- The app does not create an online appointment payment or charge the patient during MVP booking.

Server-side booking safety:

- Booking requires an authenticated `patient` user with completed patient onboarding.
- The RPC locks the selected `appointment_slots` row with `for update`.
- The RPC rejects unavailable or past slots.
- The RPC verifies the doctor is public and approved before booking.
- The RPC verifies the selected availability and location are still active.
- Unique indexes prevent two active appointments for the same slot, doctor time, or patient-doctor time.
- Cancelled, cancelled-by-patient, cancelled-by-doctor, and rescheduled appointments do not block future bookings.

Not implemented yet:

- Doctor approval mode for requested appointments.
- Online appointment payment collection.

## Patient Dashboard

Patients manage their account from `/patient`.

Dashboard modules:

- Appointment summary for upcoming, previous, and cancelled appointments.
- Next upcoming appointment card with detail navigation.
- Quick links to appointments, visited doctors, favourite doctors, and profile settings.
- Recent notifications from the patient's own `notifications` rows.

Patient routes:

- `/patient`: dashboard home.
- `/patient/appointments`: appointment list with upcoming, previous, cancelled, and all filters.
- `/patient/appointments/[appointmentId]`: appointment detail.
- `/patient/visited-doctors`: doctors from active `doctor_patient_relationships`.
- `/patient/favourite-doctors`: saved doctors.
- `/patient/profile`: profile settings.

Appointment detail shows:

- Doctor name, title, and specialty.
- Location, date, and time.
- Appointment status.
- Reason for visit and cancellation reason when present.
- Favourite/unfavourite doctor action.
- Directions button using linked coordinates or address.
- Cancel button when the appointment is future and has `requested`, `pending`, or `confirmed` status.
- Reschedule button only when the appointment is eligible, but the current MVP shows a not-implemented message.

Patient visibility:

- Appointment list/detail queries rely on Supabase RLS and only return rows owned by the signed-in patient.
- Patients cannot select other patient bookings.
- Patient appointment detail can read doctor/location records only when linked to the patient's own appointments or favourites.
- Patient visited-doctor lists read active `doctor_patient_relationships` owned by the patient and then load the related doctor profile.

Review requests:

- Completed appointments without a review appear in the patient dashboard under Review requests.
- Completed appointments also show a Review requested badge in the appointment list.
- The appointment detail screen shows the review form only for completed appointments that do not already have a review.
- Patients choose a 1-5 rating, optional written comment, and whether the written comment is public.

Profile settings:

- Patients can edit full name, phone, date of birth, city, and preferred language.
- Email is shown from Supabase Auth/profile data as read-only in this screen.

## Doctor Appointment Dashboard

Doctors manage appointments from `/doctor/appointments`; individual appointments open at `/doctor/appointments/[appointmentId]`, and treated patients are available at `/doctor/patients`.

Dashboard modules:

- Today's appointments.
- Upcoming appointments.
- Requested and pending appointments.
- Completed appointments.
- Cancelled appointments.
- No-show appointments.
- Treated patients created from completed appointments.
- Basic analytics for profile views, total bookings, completed appointments, cancelled appointments, no-show rate, most booked days, most active location, new patients, returning patients, treated patients, completion rate, and cancellation rate.
- Analytics are hidden for Free and Basic plans and visible when the effective subscription has `analytics_enabled = true`.

Doctor appointment detail shows:

- Patient name, city, preferred language, and contact visibility state.
- Patient email and phone only when the appointment status is `confirmed`, `completed`, or `no_show`.
- Appointment date, time, status, location, reason for visit, and cancellation reason when present.
- Appointment history between the signed-in doctor and the same patient.
- Directions button using linked coordinates or address.

Doctor actions:

- Confirm `requested` or `pending` future appointments.
- Cancel future `requested`, `pending`, or `confirmed` appointments.
- Reschedule future active appointments into another available slot for the same doctor.
- Mark past active appointments as completed.
- Mark past active appointments as no-show.

Doctor visibility:

- The appointment list/detail queries rely on Supabase RLS and return only appointments owned by the signed-in doctor profile.
- Patient profile lookups are relationship-scoped through appointments or active doctor-patient relationships.
- The treated-patient list reads active `doctor_patient_relationships` owned by the signed-in doctor profile.
- The UI does not include global patient search.
- Contact data is not requested by the doctor appointment service until the appointment status allows contact display.

## Doctor-Patient Relationships

`doctor_patient_relationships` is the MVP care-relationship table. It tracks relationship metadata only and does not store medical records.

Relationship fields:

- `doctor_id`
- `patient_id`
- `first_visit_date`
- `last_visit_date`
- `total_visits`
- `relationship_status`

Creation and update flow:

- A doctor marks an active past appointment as completed.
- The `doctor_mark_appointment_completed(...)` RPC locks and validates the appointment.
- The RPC updates appointment status to `completed`.
- The RPC calls `record_completed_doctor_patient_relationship(...)`.
- If no relationship exists, the helper creates one with `total_visits = 1`.
- If a relationship exists, the helper updates `last_visit_date`, increments `total_visits`, preserves the earliest first visit, and sets status back to `active`.

App behavior:

- Patients see doctors from active relationships under `/patient/visited-doctors`.
- Doctors see patients from active relationships under `/doctor/patients`.
- Doctors can access basic patient details only when an appointment exists between them or an active relationship exists.
- The MVP does not include full medical records, clinical notes, prescriptions, files, diagnoses, or treatment plans.

## Reviews And Ratings

Review rules:

- Only patients with completed appointments can leave reviews.
- Review creation calls `create_patient_review(...)`, which validates the signed-in patient, completed appointment ownership, doctor id, and rating range server-side.
- The database enforces one review per appointment with `reviews_appointment_unique`.
- Ratings are required and must be whole numbers from 1 to 5.
- Written comments are optional.
- Patients choose whether the written comment is public.
- Public doctor profiles show `doctor_profiles.average_rating` and public reviews only.
- Doctor dashboards show reviews for the signed-in doctor's own profile as read-only.
- Doctors cannot update or delete reviews through RLS or UI.
- Platform admins can hide inappropriate reviews from `/admin/reviews`.

Average rating behavior:

- Review insert, update, and delete events refresh `doctor_profiles.average_rating`.
- The current average uses all valid reviews tied to the doctor, including private-comment reviews, so private written comments still count toward rating.
- Hiding a review removes it from public review lists by setting `is_public = false`.
- Hidden reviews remain in the database for appointment history and auditability.

Admin review moderation:

- `/admin/reviews` lists patient reviews with doctor, patient, rating, visibility, and appointment reference.
- Admin hide actions call `admin_hide_review(...)`.
- Hidden review actions write `review_hidden` entries to `audit_logs`.
- Admin review hiding does not delete the review row.

## Basic Analytics

Doctor analytics:

- Public doctor profile views are recorded through `record_doctor_profile_view(...)` when a public profile loads.
- Doctor analytics use only the signed-in doctor's RLS-scoped appointments, treated relationships, locations, and profile-view rows.
- Metrics include profile views, total bookings, completed appointments, cancelled appointments, no-show rate, most booked days, most active location, new patients, and returning patients.
- Free and Basic doctor plans see an analytics-locked card; Pro and Clinic plans can view analytics through `canViewAnalytics()`.

Clinic analytics:

- Clinic analytics use only appointments where `appointments.clinic_id` matches the administered clinic.
- Metrics include total clinic bookings, bookings by doctor, paid appointment revenue estimate, cancelled/no-show rates, and location performance.
- Clinic analytics require `canAccessClinicDashboard()` and therefore an effective Clinic Plan.

Admin analytics:

- The platform admin home aggregates total users, total doctors, verified doctors, active subscriptions, trial users, monthly paid invoice revenue, failed payments, and total appointments.
- Admin analytics are available only inside the platform-admin route group and rely on platform-admin RLS policies.

## Clinic Module

Clinic admins manage clinic operations from `/clinic`.

Clinic routes:

- `/clinic`: clinic workspace dashboard with profile, subscription, and gated operations links.
- `/clinic/profile`: create or edit clinic profile, upload logo, and add/edit clinic locations.
- `/clinic/doctors`: invite doctors by email or registration number and manage membership status.
- `/clinic/appointments`: view clinic-scoped appointments with doctor, date, status, and location filters.
- `/clinic/analytics`: view clinic-level bookings, bookings by doctor, revenue estimates, cancellation/no-show rates, and location performance.
- `/clinic/billing`: manage the Clinic Plan through Stripe-hosted checkout and customer portal.

Clinic profile fields:

- Clinic name
- Logo
- Description
- Phone
- Email
- Website
- Locations with address, city, optional coordinates, and opening hours

Doctor-clinic relationship:

- Doctors can belong to multiple clinics through `doctor_clinic_memberships`.
- Clinic admins invite doctors through `clinic_invite_doctor(...)`.
- Invited doctors start with `pending` membership status.
- Clinic admins can set membership status to `active`, `suspended`, or `removed`.
- Clinic admins can select and update only memberships linked to clinics they administer.
- Clinic admins cannot search all doctors globally; invitation lookup happens inside the security-definer RPC.

Clinic Plan enforcement:

- One doctor can be linked before upgrading.
- Adding or reactivating multiple clinic doctors requires an effective Clinic Plan.
- The database enforces this with a trigger on `doctor_clinic_memberships`.
- Full clinic operations, appointment views, and analytics are hidden unless `canAccessClinicDashboard()` is true.
- Free or Basic doctor subscriptions do not grant access to the full clinic dashboard.

Clinic appointment visibility:

- Clinic appointment lists read appointments where `appointments.clinic_id` matches the administered clinic.
- Appointment filters support doctor, date, status, and location.
- Analytics intentionally exclude private doctor appointments that are not linked to the clinic.
- Revenue estimates include paid appointment payments linked to the clinic when payment rows exist.

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
- `suspended`: Supabase `verification_status = suspended`.

Profile completion:

- Completion is calculated from profile image, title, full name, registration number, qualifications, specialties, experience, languages, biography, consultation fee, services, and at least one active visiting location.
- The doctor dashboard and profile editor both show completion percentage and status badge.
- Missing fields are displayed as warning badges in the profile editor.

Visibility rules:

- Public search still only loads doctors where `is_public = true` and `verification_status = approved`.
- Non-verified profiles show a warning badge and "not public yet" messaging.
- Doctors can preview their own profile privately even when incomplete, pending, rejected, suspended, or needs update.
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
- Admins can publish verified profiles by setting `verification_status = approved` and `is_public = true`.
- Admins can hide a public profile by setting `is_public = false`.
- Admins can suspend a doctor profile by setting `verification_status = suspended` and `is_public = false`.
- Admin notes are stored in `doctor_verification_documents.verification_note` and are visible to the doctor.
- Moderation actions call `admin_moderate_doctor_profile(...)` and are written to `audit_logs`.

Verification security:

- Guests and patients cannot query `doctor_verification_documents`.
- Doctors can select and insert only documents linked to their own `doctor_profiles.id`.
- Platform admins can select and review all verification documents.
- Private Storage access is additionally scoped by bucket and path-level ownership checks.

## Doctor Availability Calendar

Doctors manage availability from `/doctor/availability`.

Calendar views:

- Day view shows one selected date.
- Week view shows Monday through Sunday for the selected anchor date.
- Month view shows the full selected month.
- Previous, Today, and Next controls shift the anchor date according to the active view.

Availability creation fields:

- Date
- Active visiting location
- Start time
- End time
- Appointment duration in minutes
- Break time in minutes
- Maximum patients
- Consultation type: in person, video, or phone
- Active/inactive status

Backend behavior:

- `create_doctor_availability_with_slots(...)` inserts one availability row and generates matching `appointment_slots`.
- Generated slots use `status = available` when the availability is active.
- Generated slots use `status = blocked` when the availability is inactive.
- Slot timestamps are generated from the availability date, start time, duration, and break interval.
- Active availability cannot overlap another active availability for the same doctor on the same date.
- The backend rejects past dates, start times after end times, and windows too short for one slot.

Doctor actions:

- View available, booked, and blocked slots separately.
- Disable an available future slot by marking it `blocked`.
- Re-enable a blocked future slot by marking it `available`.
- Edit future availability only when no booking history exists for its slots.
- Delete availability only when no booking history exists for its slots.

Booking safety:

- Slots linked to active appointments cannot be edited through the doctor slot-status RPC.
- Availability linked to booking history cannot be edited or deleted directly.
- Doctors should reschedule individual appointments into future available slots instead of changing booked availability windows.
- This prevents accidental time changes for confirmed, pending, completed, or historical appointments.

## Notification System

Authenticated users open the in-app notification center at `/notifications`.

Implemented in-app behavior:

- Role dashboards show a recent notification preview card.
- Notification preview cards show an unread badge count.
- The notification center lists all notifications visible to the signed-in user.
- Users can mark one notification as read.
- Users can mark all notifications as read.
- Notification reads and updates use the existing `notifications` table and RLS policies.

Notification event groups:

- Patient events: appointment booked, confirmed, cancelled, rescheduled, reminder, and review request after completed visit.
- Doctor events: new appointment booking, appointment cancelled by patient, appointment reminder, verification approved, verification rejected, subscription payment failed, and subscription renewal reminder.
- Clinic admin events: new clinic appointment, doctor added to clinic, and clinic subscription warning.
- Platform admin events: new doctor verification request, reported profile, and failed payment event.

Current backend notification producers:

- Patient booking creates patient and doctor appointment notifications.
- Patient cancellation creates patient and doctor cancellation notifications.
- Doctor confirm, cancel, complete, no-show, and reschedule actions notify patients.
- Doctor verification document uploads notify platform admins.
- Doctor verification approval or rejection notifies the doctor.

Push notification structure:

- `expo-notifications` and `expo-device` are installed.
- `services/pushNotifications.service.ts` contains registration, badge-count, and listener helpers.
- Push tokens are not persisted yet because the MVP is in-app only.
- Future push work should add a `push_tokens` table, device registration screen/bootstrap hook, and backend fanout using Expo push tokens.

## SaaS Subscription Plans

Plan constants live in `constants/subscriptions.ts`.

Plans:

- Free Plan: basic doctor profile, one active location, 25 monthly booking slots, standard visibility, no analytics, no featured listing, no automated reminders.
- Basic Plan: full profile, calendar management, standard booking management, two active locations, and 150 monthly booking slots.
- Pro Plan: up to five active locations, 500 monthly booking slots, analytics, featured listing eligibility, and automated reminders.
- Clinic Plan: up to 50 clinic locations, 10000 monthly booking slots, analytics, featured listing eligibility, reminders, clinic dashboard access, staff access foundation, and clinic-level billing foundation.

Plan limit fields:

- `max_locations`
- `max_monthly_bookings`
- `analytics_enabled`
- `featured_listing_enabled`
- `reminders_enabled`
- `clinic_management_enabled`

Feature gates live in `services/subscription.service.ts`:

- `canCreateMoreSlots()`
- `canAddLocation()`
- `canViewAnalytics()`
- `canUseFeaturedListing()`
- `canAccessClinicDashboard()`

Current app enforcement:

- Creating or updating doctor availability checks monthly generated slot limits before calling the availability RPC.
- Saving an active doctor visiting location checks the plan location limit.
- Doctor appointment analytics are visible only when analytics are enabled. Free and Basic plans are locked; Pro and Clinic plans are enabled.
- Clinic analytics and clinic appointment operations require an effective Clinic Plan.
- Doctor and clinic dashboards show current effective plan, limits, and enabled/disabled premium features.

Expiry behavior:

- `trialing` and `active` subscriptions are treated as usable only while `current_period_end` is null or in the future.
- `past_due`, `cancelled`, `expired`, `suspended`, and subscriptions whose period ended are treated as Free for feature access.
- Existing appointments, slots, and locations are not deleted when a subscription expires.
- Premium features are disabled until a valid subscription is restored.

## Future Appointment Payment Architecture

Current MVP behavior:

- Patients book appointments without paying online.
- Appointment fees are paid at the clinic.
- Booking and appointment detail screens show `Payment method: Pay at clinic`.
- Booking and appointment detail screens show `Online payment coming later`.
- No card details are collected or stored by the app.

Prepared database model:

- `payments` already stores billing records and is now prepared for appointment payments.
- `payment_type` supports `subscription`, `appointment`, `deposit`, `cancellation_fee`, and `platform_fee`. Legacy `refund` and `adjustment` enum values remain for compatibility with existing migrations.
- `payment_status` supports `pending`, `paid`, `failed`, `refunded`, and `cancelled`.
- Future appointment payment rows can store provider checkout ids, provider payment ids, provider refund ids, platform fee amounts, provider fee amounts, payout amounts, payout ids, refund reasons, cancellation policy snapshots, metadata, and lifecycle timestamps.
- Card numbers, CVC, card expiry, and bank credentials must never be stored in Supabase tables.

Provider abstraction:

- `constants/payments.ts` defines provider capabilities for Stripe, Paytrail, manual/pay-at-clinic, and other future providers.
- `services/payment.service.ts` exposes the current appointment payment preview and keeps online appointment payment session creation disabled for the MVP.
- Stripe remains active for subscriptions only.
- Paytrail is represented in the enum/config for later appointment-payment support.
- Manual/pay-at-clinic is the active MVP appointment payment method.

Future online payment flow:

- Patient selects an available slot.
- Backend creates a provider checkout/payment session for the appointment fee or deposit.
- Provider confirms payment through a webhook.
- Backend records the appointment payment, platform fee, provider fee, payout amount, and status.
- Booking confirmation should happen only after payment success or according to the selected deposit policy.
- Refund and cancellation policy decisions should be recorded against the payment row without storing card details.

## Stripe Billing

Stripe billing is implemented with hosted Stripe Checkout and the Stripe customer portal. The Expo app never stores card details and never receives the Stripe secret key.

Implemented Edge Functions:

- `create-stripe-checkout-session`: authenticated doctor or clinic admin endpoint that creates or reuses a Stripe customer, creates a subscription Checkout Session, and returns the hosted Checkout URL.
- `create-stripe-portal-session`: authenticated doctor or clinic admin endpoint that creates a Stripe customer portal URL for cancellation and payment-method updates.
- `stripe-webhook`: public Stripe webhook endpoint with signature verification, webhook-event deduplication, subscription sync, invoice history writes, payment records, and failed-payment notifications.

Handled Stripe webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Local subscription status mapping:

- Stripe `trialing`, `active`, and `past_due` map directly.
- Stripe `canceled` maps to `cancelled`.
- Stripe `incomplete_expired` maps to `expired`.
- Stripe `unpaid`, `paused`, and `incomplete` map to `suspended`.

Billing screens:

- Doctors open `/doctor/billing` to view current plan, status, renewal date, upgrade to Basic/Pro, open Stripe customer portal, and view invoices.
- Clinic admins open `/clinic/billing` to manage the Clinic plan and clinic invoice history.
- Platform admins open `/admin/billing` to view active, past-due, cancelled, trial, revenue-by-plan, failed payments, and recent subscription records.

Stripe setup requirements:

- Create Stripe recurring Prices for Basic, Pro, and Clinic plans.
- Store those price IDs in Supabase secrets as `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_CLINIC_PRICE_ID`.
- Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase secrets.
- In Stripe, subscribe the webhook endpoint to the handled events listed above.

## Platform Admin Dashboard

Platform admins manage operations from `/admin`. The entire route group is protected by `RoleGate` and allows only `platform_admin` users.

Admin routes:

- `/admin`: operational overview with users, doctors, verified doctors, subscriptions, trial users, monthly paid invoice revenue, appointments, pending verifications, reports, failed payments, past-due subscriptions, recent audit logs, and navigation.
- `/admin/verifications`: pending doctor verification queue.
- `/admin/verifications/[doctorId]`: doctor profile review, secure document review, verification decision, publication, hiding, and suspension.
- `/admin/users`: all users with role filters, doctor moderation state, profile review links, publication, hiding, and suspension.
- `/admin/billing`: subscription health, revenue by plan, recent subscriptions, and failed payments.
- `/admin/reviews`: review moderation with hide actions for inappropriate public comments.
- `/admin/reports`: reported profiles with status review and reported-doctor suspension.
- `/admin/audit-logs`: sensitive action history from audit triggers and explicit admin RPCs.

Admin access and security:

- User, report, billing, verification, and audit queries rely on platform-admin RLS policies.
- Doctor moderation uses `admin_moderate_doctor_profile(...)`.
- Review moderation uses `admin_hide_review(...)`.
- Report review uses `admin_review_user_report(...)`.
- Sensitive platform-admin table writes are also covered by `audit_sensitive_admin_action()` triggers.
- Doctor suspension does not delete profile, appointments, documents, or billing data; it sets `verification_status = suspended` and hides the public profile.

Reported profile workflow:

- Reports are stored in `user_reports`.
- Report statuses are `open`, `under_review`, `resolved`, and `dismissed`.
- Admin review notes are stored in `user_reports.admin_note`.
- Reports involving doctors expose direct actions to open the doctor review screen or suspend the reported doctor.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npx eas build --profile preview --platform android
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

## Verification

Run these checks after implementation work:

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## MVP Testing And Deployment

The full release-readiness checklist is maintained in:

```txt
docs/mvp-testing-deployment-checklist.md
```

Before release, run:

```bash
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform web --output-dir <temporary-output-dir>
npx supabase migration list
npx supabase db query --linked -f supabase/tests/security_access_matrix.sql
```

Test accounts to prepare in staging:

- Guest: no account required.
- Patient: `patient.test@medimeet.test`
- Doctor: `doctor.test@medimeet.test`
- Clinic admin: `clinic.admin.test@medimeet.test`
- Platform admin: `platform.admin.test@medimeet.test`

Create public-role test users through the sign-up UI to test onboarding. Create the platform admin through a trusted Supabase admin process by setting `public.profiles.role = 'platform_admin'`. Do not commit passwords, service-role keys, Stripe secrets, or production credentials.

## Known Notes

- Booking MVP uses automatic confirmation. Patient cancellation and doctor-side appointment actions are implemented; doctor approval mode and online appointment payments are not activated yet.
- Notifications are implemented in-app first. Expo push notification registration structure exists, but push token persistence and backend push fanout are not implemented yet.
- Subscription plan gating and Stripe subscription billing are implemented. Future appointment-payment schema/provider architecture is prepared, but online appointment checkout, coupons, taxes, metered billing, team/staff billing seats, and advanced Stripe dispute workflows are not implemented yet.
- Doctor profile publication still requires platform verification and setting `is_public`.
- Clinic-admin access now depends on active rows in `clinic_admin_memberships`.
- Clinic module manages profile, locations, doctors, clinic appointments, and analytics. Doctor invitation acceptance UX is not implemented yet; invited memberships are managed by clinic admins.
- `npm audit` may report moderate transitive advisories through Expo CLI dependencies. Do not force downgrade Expo to resolve these unless the Expo SDK strategy is intentionally changed.

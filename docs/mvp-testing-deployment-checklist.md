# MediMeet MVP Testing And Deployment Checklist

Last updated: 2026-04-30

## Automated Checks

Run these from the project root before every MVP release candidate:

```bash
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform web --output-dir <temporary-output-dir>
npx supabase migration list
npx supabase db query --linked -f supabase/tests/security_access_matrix.sql
```

Current release-readiness pass:

- [x] TypeScript check passed.
- [x] Expo Router/module export passed.
- [x] Supabase REST connection returned HTTP 200 with the configured anon key.
- [x] Local and remote Supabase migration versions are aligned.
- [x] RLS access matrix passed for guest, patient, doctor, clinic admin, and platform admin visibility.
- [x] Backend readiness probe confirmed required MVP RPCs and RLS-enabled tables exist.
- [x] Lint passed.
- [x] Expo Doctor passed.

## Manual Acceptance Tests

Guest:

- [ ] Open `/` and confirm the splash screen redirects unauthenticated users to `/welcome`.
- [ ] Open `/welcome` and confirm Get Started, Continue as Guest, and I already have an account work.
- [ ] Open `/landing`, `/onboarding-intro`, and `/choose-role` and confirm the first-time workflow is natural.
- [ ] Open `/privacy` and `/terms`.
- [ ] Search doctors and verify only public verified profiles are visible.
- [ ] Open a doctor profile and tap booking; confirm guest is redirected to login/signup prompt.

Auth:

- [ ] Sign up as a patient, doctor, and clinic admin with email/password.
- [ ] Confirm session persists after app reload.
- [ ] Log out from each role and confirm protected routes redirect to sign-in.

Patient:

- [ ] Complete patient onboarding.
- [ ] Book an available doctor slot.
- [ ] Confirm the success screen shows appointment details and pay-at-clinic messaging.
- [ ] Confirm the appointment appears in the patient dashboard.
- [ ] Cancel only the patient's own appointment.

Doctor:

- [ ] Complete doctor onboarding.
- [ ] Add visiting location and availability.
- [ ] Confirm slots are generated automatically.
- [ ] Upload verification documents.
- [ ] Confirm only the doctor can view their own document status.
- [ ] Confirm doctor dashboard shows only that doctor's appointments/patients.

Clinic admin:

- [ ] Complete clinic admin onboarding.
- [ ] Create or edit clinic profile and location.
- [ ] Invite/manage doctors connected to the clinic.
- [ ] Confirm unrelated clinics/doctors are not visible.
- [ ] Confirm Clinic Plan gating blocks full clinic operations without an effective Clinic Plan.

Platform admin:

- [ ] Open admin dashboard with a platform admin account.
- [ ] Review pending doctor verification.
- [ ] Approve, reject, request update, hide, and suspend doctor profiles in a test environment.
- [ ] Confirm each sensitive action writes to `audit_logs`.
- [ ] Confirm non-admin accounts cannot open `/admin`.

Subscriptions:

- [ ] Confirm Free doctors cannot access analytics.
- [ ] Confirm Pro or Clinic plan context unlocks analytics.
- [ ] Confirm expired, cancelled, past-due, or suspended subscriptions downgrade feature gates to Free.
- [ ] Confirm Stripe Checkout and customer portal open from billing screens when Edge Function secrets are configured.

## Test Accounts

Use a staging Supabase project for these accounts. Do not seed shared passwords into production.

- Guest: no account required.
- Patient: `patient.test@medimeet.test`
- Doctor: `doctor.test@medimeet.test`
- Clinic admin: `clinic.admin.test@medimeet.test`
- Platform admin: `platform.admin.test@medimeet.test`

Recommended setup:

1. Create patient, doctor, and clinic admin accounts through the public sign-up UI so onboarding is tested.
2. Create the platform admin through a trusted Supabase admin process by setting `public.profiles.role = 'platform_admin'`.
3. Store generated test passwords in a password manager or local secure test vault.
4. Never commit real passwords, service-role keys, Stripe secrets, or production test credentials.

## Production Supabase Preparation

- [ ] Create a production Supabase project separate from staging.
- [ ] Link locally with `npx supabase link --project-ref <production-project-ref>`.
- [ ] Apply migrations with `npx supabase db push`.
- [ ] Confirm `npx supabase migration list` shows matching local and remote versions.
- [ ] Deploy Stripe Edge Functions after setting Stripe secrets.
- [ ] Configure Stripe webhook endpoint for the production Supabase function URL.
- [ ] Verify Storage buckets and RLS policies for avatars, doctor verification documents, and clinic logos.
- [ ] Run `supabase/tests/security_access_matrix.sql` against production before opening public access.

## Expo Build Preparation

- [ ] Confirm `app.json` has production bundle/package identifiers.
- [ ] Confirm `eas.json` has `development`, `preview`, and `production` build profiles.
- [ ] Configure `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_APP_ENV` in the EAS project environment.
- [ ] Build preview with `npx eas build --profile preview --platform android` or `--platform ios`.
- [ ] Build production with `npx eas build --profile production --platform android` and `--platform ios`.
- [ ] Run a full manual acceptance test on a device build before App Store or Play Store submission.

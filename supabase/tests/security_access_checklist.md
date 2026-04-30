# MediMeet Security Access Checklist

Last verified: 2026-04-30

Automated RLS test command:

```bash
npx supabase db query --linked -f supabase/tests/security_access_matrix.sql
```

The SQL matrix seeds isolated test users/data inside a transaction, simulates Supabase JWT claims for each role, records pass/fail rows, and rolls everything back.

## Route Protection

- [x] Guest users are redirected away from `/patient` by `app/patient/_layout.tsx` using `RoleGate allowedRoles={["patient"]}`.
- [x] Guest users are redirected away from `/doctor` by `app/doctor/_layout.tsx` using `RoleGate allowedRoles={["doctor"]}`.
- [x] Guest users are redirected away from `/clinic` by `app/clinic/_layout.tsx` using `RoleGate allowedRoles={["clinic_admin"]}`.
- [x] Guest users are redirected away from `/admin` by `app/admin/_layout.tsx` using `RoleGate allowedRoles={["platform_admin"]}`.
- [x] Wrong-role authenticated users are redirected to their own role home by `RoleGate`.

## Guest

- [x] Cannot read `patient_profiles`.
- [x] Cannot read `appointments`.
- [x] Cannot read `doctor_verification_documents`.
- [x] Can read public verified doctor profiles.
- [x] Cannot read private or unverified doctor profiles.

## Patient

- [x] Cannot read another patient's appointment.
- [x] Cannot read another patient's profile data.
- [x] Cannot access doctor/admin route groups because protected layouts require doctor/platform-admin roles.
- [x] Can cancel own appointment.
- [x] Cannot cancel another patient's appointment.

## Doctor

- [x] Cannot read appointments for another doctor.
- [x] Cannot read patients without an appointment or relationship.
- [x] Cannot access admin route group because protected layout requires `platform_admin`.
- [x] Can edit own doctor profile.
- [x] Cannot edit another doctor's profile.
- [x] Can manage own availability.
- [x] Cannot manage another doctor's availability.

## Clinic Admin

- [x] Can access own clinic.
- [x] Cannot access unrelated clinic.
- [x] Can read connected private doctor profiles.
- [x] Cannot read unrelated private doctor profiles.
- [x] Can read own clinic appointments.
- [x] Cannot read unrelated appointments.
- [x] Cannot access platform-admin route group because protected layout requires `platform_admin`.

## Platform Admin

- [x] Can access doctor verification documents/queue.
- [x] Can perform moderation actions through admin RPCs.
- [x] Admin moderation creates a readable `audit_logs` row.

## Notes

- Frontend route protection is a UX boundary; Supabase RLS and security-definer RPC checks are the security boundary.
- This run found no app-policy failures. False negatives in the test harness were corrected by asserting forbidden update row counts instead of reading rows that RLS intentionally hides.

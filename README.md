# MediMeet

MediMeet is an Expo React Native foundation for a private-practice doctor-patient appointment booking SaaS.

## Stack

- Expo, React Native, TypeScript, Expo Router
- Supabase Auth, PostgreSQL, Storage, Row Level Security
- React Hook Form, Zod, TanStack Query
- Clean React Native styling

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

3. Add your Supabase project URL and anon key to `.env`.

4. Start Expo:

   ```bash
   npm run start
   ```

## Supabase

The initial backend foundation is in `supabase/migrations/20260429000000_foundation.sql`.
It creates app roles, user profiles, RLS policies, and an `avatars` storage bucket. Appointment booking tables are intentionally not included yet.

alter type public.verification_document_type
  add value if not exists 'medical_registration_certificate';

alter type public.verification_document_type
  add value if not exists 'qualification_certificate';

alter type public.verification_document_type
  add value if not exists 'clinic_proof';

alter table public.doctor_verification_documents
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size integer,
  add column if not exists verification_note text;

update public.doctor_verification_documents
set storage_path = file_url
where storage_path is null;

alter table public.doctor_verification_documents
  alter column storage_path set not null;

alter table public.doctor_verification_documents
  drop constraint if exists doctor_verification_documents_storage_path_doctor_check;

alter table public.doctor_verification_documents
  add constraint doctor_verification_documents_storage_path_doctor_check
  check (storage_path like doctor_id::text || '/%')
  not valid;

create index if not exists doctor_verification_documents_type_idx
on public.doctor_verification_documents (document_type);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'doctor-verification-documents',
  'doctor-verification-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_access_doctor_verification_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.doctor_profiles dp
      where dp.id::text = (storage.foldername(object_name))[1]
        and dp.user_id = auth.uid()
    )
$$;

drop policy if exists "doctor_verification_objects_select_owner_or_admin"
on storage.objects;
create policy "doctor_verification_objects_select_owner_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'doctor-verification-documents'
  and public.can_access_doctor_verification_object(name)
);

drop policy if exists "doctor_verification_objects_insert_owner_or_admin"
on storage.objects;
create policy "doctor_verification_objects_insert_owner_or_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'doctor-verification-documents'
  and public.can_access_doctor_verification_object(name)
);

drop policy if exists "doctor_verification_objects_update_owner_or_admin"
on storage.objects;
create policy "doctor_verification_objects_update_owner_or_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'doctor-verification-documents'
  and public.can_access_doctor_verification_object(name)
)
with check (
  bucket_id = 'doctor-verification-documents'
  and public.can_access_doctor_verification_object(name)
);

drop policy if exists "doctor_verification_objects_delete_platform_admin"
on storage.objects;
create policy "doctor_verification_objects_delete_platform_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'doctor-verification-documents'
  and public.is_platform_admin()
);

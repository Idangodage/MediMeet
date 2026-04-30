import { getSupabase } from "@/lib/supabase";
import {
  getPublicDoctorById,
  type PublicDoctor
} from "@/services/doctor.service";
import type { Database } from "@/types/supabase";

export type PatientAppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];

export type BookingConfirmationInput = {
  slotId: string;
  reasonForVisit?: string;
};

export type PatientAppointmentSummary = {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit: string | null;
  status: PatientAppointmentStatus;
  createdAt: string;
};

export async function getDoctorBookingOptions(
  doctorId: string
): Promise<PublicDoctor | null> {
  return getPublicDoctorById(doctorId);
}

export async function confirmPatientBooking({
  reasonForVisit,
  slotId
}: BookingConfirmationInput): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("book_public_appointment", {
    target_slot_id: slotId,
    reason_for_visit: reasonForVisit?.trim() || null
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listOwnPatientAppointments(): Promise<
  PatientAppointmentSummary[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, doctor_id, appointment_date, start_time, end_time, reason_for_visit, status, created_at"
    )
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  const doctorIds = Array.from(
    new Set((data ?? []).map((appointment) => appointment.doctor_id))
  );
  const doctors = await loadDoctorNames(doctorIds);

  return (data ?? []).map((appointment) => {
    const doctor = doctors.find((item) => item.id === appointment.doctor_id);

    return {
      id: appointment.id,
      doctorId: appointment.doctor_id,
      doctorName: doctor?.full_name ?? "Doctor",
      doctorTitle: doctor?.title ?? null,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      reasonForVisit: appointment.reason_for_visit,
      status: appointment.status,
      createdAt: appointment.created_at
    };
  });
}

async function loadDoctorNames(doctorIds: string[]) {
  if (doctorIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("id, title, full_name")
    .in("id", doctorIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

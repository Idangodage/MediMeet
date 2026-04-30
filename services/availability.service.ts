import { getSupabase } from "@/lib/supabase";
import { assertCanCreateMoreSlotsForAvailability } from "@/services/subscription.service";
import type { Database } from "@/types/supabase";

export type CalendarViewMode = "day" | "week" | "month";
export type ConsultationType = Database["public"]["Enums"]["consultation_type"];
export type SlotStatus = Database["public"]["Enums"]["slot_status"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export type DoctorAvailabilityInput = {
  availabilityId?: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentDurationMinutes: number;
  breakMinutes: number;
  maxPatients: number;
  consultationType: ConsultationType;
  isActive: boolean;
};

export type AvailabilityLocation = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

export type AvailabilityAppointment = {
  id: string;
  slotId: string | null;
  status: AppointmentStatus;
  reasonForVisit: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
};

export type AvailabilitySlot = {
  id: string;
  availabilityId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointment: AvailabilityAppointment | null;
};

export type DoctorAvailability = {
  id: string;
  doctorId: string;
  locationId: string;
  location: AvailabilityLocation | null;
  date: string;
  startTime: string;
  endTime: string;
  appointmentDurationMinutes: number;
  breakMinutes: number;
  maxPatients: number;
  consultationType: ConsultationType;
  isActive: boolean;
  createdAt: string;
  slots: AvailabilitySlot[];
};

export type AvailabilityCalendarData = {
  doctorId: string;
  locations: AvailabilityLocation[];
  rangeStart: string;
  rangeEnd: string;
  availability: DoctorAvailability[];
};

export async function listOwnAvailabilityCalendar(
  viewMode: CalendarViewMode,
  anchorDate: string
): Promise<AvailabilityCalendarData> {
  const supabase = getSupabase();
  const doctorId = await getOwnDoctorId();
  const [rangeStart, rangeEnd] = getCalendarRange(viewMode, anchorDate);
  const locations = await listOwnAvailabilityLocations();
  const { data: availabilityRows, error } = await supabase
    .from("doctor_availability")
    .select("*")
    .eq("doctor_id", doctorId)
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  const availabilityIds = (availabilityRows ?? []).map((item) => item.id);
  const slots = await loadAvailabilitySlots(availabilityIds);

  return {
    doctorId,
    locations,
    rangeStart,
    rangeEnd,
    availability: (availabilityRows ?? []).map((availability) => ({
      id: availability.id,
      doctorId: availability.doctor_id,
      locationId: availability.location_id,
      location: locations.find((location) => location.id === availability.location_id) ?? null,
      date: availability.date,
      startTime: availability.start_time,
      endTime: availability.end_time,
      appointmentDurationMinutes: availability.appointment_duration_minutes,
      breakMinutes: availability.break_minutes,
      maxPatients: availability.max_patients,
      consultationType: availability.consultation_type,
      isActive: availability.is_active,
      createdAt: availability.created_at,
      slots: slots.filter((slot) => slot.availabilityId === availability.id)
    }))
  };
}

export async function listOwnAvailabilityLocations(): Promise<
  AvailabilityLocation[]
> {
  const supabase = getSupabase();
  const doctorId = await getOwnDoctorId();
  const { data, error } = await supabase
    .from("doctor_locations")
    .select("id, custom_location_name, address, city, is_active")
    .eq("doctor_id", doctorId)
    .eq("is_active", true)
    .order("city", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((location) => ({
    id: location.id,
    name: location.custom_location_name ?? location.city ?? "Practice location",
    address: location.address,
    city: location.city
  }));
}

export async function createDoctorAvailability(
  values: DoctorAvailabilityInput
): Promise<string> {
  await assertCanCreateMoreSlotsForAvailability({
    appointmentDurationMinutes: values.appointmentDurationMinutes,
    breakMinutes: values.breakMinutes,
    date: values.date,
    endTime: values.endTime,
    startTime: values.startTime
  });

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "create_doctor_availability_with_slots",
    toRpcInput(values)
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function updateDoctorAvailability(
  values: DoctorAvailabilityInput & { availabilityId: string }
): Promise<string> {
  await assertCanCreateMoreSlotsForAvailability({
    availabilityId: values.availabilityId,
    appointmentDurationMinutes: values.appointmentDurationMinutes,
    breakMinutes: values.breakMinutes,
    date: values.date,
    endTime: values.endTime,
    startTime: values.startTime
  });

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "update_doctor_availability_with_slots",
    {
      target_availability_id: values.availabilityId,
      ...toRpcInput(values)
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteDoctorAvailability(
  availabilityId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("delete_doctor_availability_if_unbooked", {
    target_availability_id: availabilityId
  });

  if (error) {
    throw error;
  }
}

export async function updateDoctorSlotStatus({
  slotId,
  status
}: {
  slotId: string;
  status: Extract<SlotStatus, "available" | "blocked">;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("update_doctor_slot_status", {
    target_slot_id: slotId,
    target_status: status
  });

  if (error) {
    throw error;
  }
}

export function getAvailabilityCounts(availability: DoctorAvailability[]) {
  return availability.reduce(
    (counts, item) => {
      for (const slot of item.slots) {
        if (slot.appointment || slot.status === "booked") {
          counts.booked += 1;
        } else if (slot.status === "available") {
          counts.available += 1;
        } else {
          counts.blocked += 1;
        }
      }

      return counts;
    },
    { available: 0, blocked: 0, booked: 0 }
  );
}

export function getCalendarRange(
  viewMode: CalendarViewMode,
  anchorDate: string
): [string, string] {
  const anchor = parseDate(anchorDate);

  if (viewMode === "day") {
    return [toIsoDate(anchor), toIsoDate(anchor)];
  }

  if (viewMode === "week") {
    const start = new Date(anchor);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return [toIsoDate(start), toIsoDate(end)];
  }

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

  return [toIsoDate(start), toIsoDate(end)];
}

export function shiftAnchorDate(
  viewMode: CalendarViewMode,
  anchorDate: string,
  direction: -1 | 1
): string {
  const anchor = parseDate(anchorDate);

  if (viewMode === "day") {
    anchor.setDate(anchor.getDate() + direction);
  } else if (viewMode === "week") {
    anchor.setDate(anchor.getDate() + direction * 7);
  } else {
    anchor.setMonth(anchor.getMonth() + direction);
  }

  return toIsoDate(anchor);
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function formatConsultationType(type: ConsultationType): string {
  if (type === "in_person") {
    return "In person";
  }

  if (type === "video") {
    return "Video";
  }

  return "Phone";
}

export function formatSlotStatus(status: SlotStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function loadAvailabilitySlots(
  availabilityIds: string[]
): Promise<AvailabilitySlot[]> {
  if (availabilityIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data: slotRows, error } = await supabase
    .from("appointment_slots")
    .select("*")
    .in("availability_id", availabilityIds)
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  const slotIds = (slotRows ?? []).map((slot) => slot.id);
  const appointments = await loadSlotAppointments(slotIds);

  return (slotRows ?? []).map((slot) => ({
    id: slot.id,
    availabilityId: slot.availability_id,
    startTime: slot.start_time,
    endTime: slot.end_time,
    status: slot.status,
    appointment:
      appointments.find((appointment) => appointment.slotId === slot.id) ?? null
  }));
}

async function loadSlotAppointments(
  slotIds: string[]
): Promise<AvailabilityAppointment[]> {
  if (slotIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, slot_id, status, reason_for_visit, appointment_date, start_time, end_time, created_at"
    )
    .in("slot_id", slotIds)
    .not("status", "in", "(cancelled,cancelled_by_patient,cancelled_by_doctor,rescheduled)")
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((appointment) => ({
    id: appointment.id,
    slotId: appointment.slot_id,
    status: appointment.status,
    reasonForVisit: appointment.reason_for_visit,
    appointmentDate: appointment.appointment_date,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    createdAt: appointment.created_at
  }));
}

async function getOwnDoctorId(): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in as a doctor.");
  }

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Complete doctor onboarding before managing availability.");
  }

  return data.id;
}

function toRpcInput(values: DoctorAvailabilityInput) {
  return {
    target_location_id: values.locationId,
    target_date: values.date,
    target_start_time: normalizeTime(values.startTime),
    target_end_time: normalizeTime(values.endTime),
    target_appointment_duration_minutes: values.appointmentDurationMinutes,
    target_break_minutes: values.breakMinutes,
    target_max_patients: values.maxPatients,
    target_consultation_type: values.consultationType,
    target_is_active: values.isActive
  };
}

function normalizeTime(value: string): string {
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

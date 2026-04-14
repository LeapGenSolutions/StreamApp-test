import { BACKEND_URL } from "../constants";
import { appointmentActions } from "./appointment-slice";

const BASE = (BACKEND_URL || "").replace(/\/+$/, "");
const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;

const flattenEmails = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenEmails(item));
  }
  if (typeof value === "string") {
    return value.split(",");
  }
  return [];
};

const normalizeEmails = (value) =>
  Array.from(
    new Set(
      flattenEmails(value)
        .map((email) => String(email || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

const getAppointmentKey = (appointment = {}) => {
  const explicitId =
    appointment.id ??
    appointment.appointment_id ??
    appointment.appointmentId ??
    appointment.callId;

  if (explicitId !== undefined && explicitId !== null && String(explicitId).trim() !== "") {
    return String(explicitId).trim();
  }

  return [
    appointment.doctor_email,
    appointment.doctorEmail,
    appointment.userID,
    appointment.appointment_date,
    appointment.appointmentDate,
    appointment.time,
    appointment.patient_id,
    appointment.full_name,
    appointment.patient_name,
  ]
    .map((part) => String(part || "").trim().toLowerCase())
    .join("::");
};

const normalizeAppointmentPayload = (payload) => {
  if (Array.isArray(payload)) {
    if (payload.length > 0 && payload[0]?.data && Array.isArray(payload[0].data)) {
      return payload.flatMap((day) => day.data || []);
    }
    return payload;
  }
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const dedupeAppointments = (appointments) => {
  const byKey = new Map();

  appointments.forEach((appointment) => {
    byKey.set(getAppointmentKey(appointment), appointment);
  });

  return Array.from(byKey.values());
};

export const fetchAppointmentDetails = (emailInput, clinicName = "") => {
  return async (dispatch) => {
    const emails = normalizeEmails(emailInput);

    const fetchAppointments = async () => {
      const trimmedClinic = String(clinicName || "").replace(/\s+/g, " ").trim();

      if (trimmedClinic) {
        const response = await fetch(
          api(`/api/appointments/all?clinicName=${encodeURIComponent(trimmedClinic)}`)
        );

        if (!response.ok) {
          throw new Error("Could not fetch appointment data!");
        }

        const payload = await response.json();
        return dedupeAppointments(normalizeAppointmentPayload(payload));
      }

      if (emails.length === 0) {
        return [];
      }

      const response = await fetch(
        api(`/api/appointments/${emails.map(encodeURIComponent).join(",")}`)
      );

      if (!response.ok) {
        throw new Error("Could not fetch appointment data!");
      }

      const payload = await response.json();
      const appointments = dedupeAppointments(normalizeAppointmentPayload(payload));

      if (emails.length === 1) {
        return appointments.filter(
          (appointment) =>
            !appointment.clinicName || String(appointment.clinicName).trim() === ""
        );
      }

      return appointments;
    };

    try {
      const appointmentData = await fetchAppointments();
      dispatch(appointmentActions.setAppointments(appointmentData));
      dispatch(appointmentActions.markAppointmentsFetched());
    } catch (error) {
      dispatch(appointmentActions.setAppointments([]));
      dispatch(appointmentActions.markAppointmentsFetched());
    }
  };
};

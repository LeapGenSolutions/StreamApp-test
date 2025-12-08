import { BACKEND_URL } from "../constants";

export const createAppointment = async (doctorEmail, appointmentData) => {
  try {
    const encodedEmail = encodeURIComponent(doctorEmail?.toLowerCase());

    const response = await fetch(
      `${BACKEND_URL}api/appointments/${encodedEmail}/custom/appointment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create: ${err}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Create appointment error:", error);
    throw error;
  }
};

export const updateAppointment = async (doctorEmail, id, appointmentData) => {
  try {
    const encodedEmail = encodeURIComponent(doctorEmail?.toLowerCase());

    const response = await fetch(
      `${BACKEND_URL}api/appointments/${encodedEmail}/appointment/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update: ${errText}`);
    }

    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  } catch (error) {
    console.error("Update appointment error:", error);
    throw error;
  }
};

export const cancelAppointment = async (doctorEmail, id, payload = {}) => {
  try {
    const encodedEmail = encodeURIComponent(doctorEmail?.toLowerCase());

    const response = await fetch(
      `${BACKEND_URL}api/appointments/${encodedEmail}/cancel/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to cancel: ${errText}`);
    }

    return true;
  } catch (error) {
    console.error("Cancel appointment error:", error);
    throw error;
  }
};

export const deleteAppointment = async (doctorEmail, id, appointment_date) => {
  try {
    const encodedEmail = encodeURIComponent(doctorEmail?.toLowerCase());

    const response = await fetch(
      `${BACKEND_URL}api/appointments/${encodedEmail}/appointment/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_date }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to delete: ${errText}`);
    }

    return true;
  } catch (error) {
    console.error("Delete appointment error:", error);
    throw error;
  }
};
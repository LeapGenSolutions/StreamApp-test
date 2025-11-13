import { BACKEND_URL } from "../constants";

/**
 * Create a new appointment for a given doctor
 * @param {string} doctorEmail - the email of the logged-in doctor
 * @param {Object} appointmentData - appointment details payload
 */
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
      const errText = await response.text();
      console.error("Failed to create appointment:", errText);
      throw new Error(
        `Appointment creation failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("Appointment created successfully:", result);
    return result;
  } catch (error) {
    console.error("Network or server error while creating appointment:", error);
    throw error;
  }
};
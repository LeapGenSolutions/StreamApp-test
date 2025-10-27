import { BACKEND_URL } from "../constants";

export const insertCallHistory = async (sessionId, reqBody) => {
  const response = await fetch(`${BACKEND_URL}/api/call-history/${sessionId}`, 
    {
    method: "POST",
    body: JSON.stringify(reqBody),
    headers: { 'Content-Type': 'application/json' },
  }
);
  if (!response.ok) {
    console.log("New call History not inserted. Call history and id might exist");
  }
};

export const fetchCallHistory = async (emails) => {
  if (!emails || emails.length === 0) {
    return
  }
  const response = await fetch(`${BACKEND_URL}api/call-history?userIDs=${emails.join(",")}`);
  if (!response.ok) {
    throw new Error("Failed to fetch Call History data");
  }
  return response.json();
};

export const fetchDoctorsFromHistory = async () => {
  const response = await fetch(`${BACKEND_URL}api/call-history/doctors`);
  if (!response.ok) {
    throw new Error("Failed to fetch Call History data");
  }
  return response.json();
};

export const fetchAppointmentsByDoctorEmails = async (emails) => {
  if (!emails || emails.length === 0) return [];

  try {
    const response = await fetch(`${BACKEND_URL}api/appointments/${emails.join(",")}`);
    if (!response.ok) throw new Error("Failed to fetch appointments");

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching appointments:", err);
    return [];
  }
};

// Helper to check Seismified status Backend returns { found: [seismifiedIds], notFound: [others] }
export const checkAppointments = async (appointmentIDs) => {
  if (!appointmentIDs || appointmentIDs.length === 0)
    return { found: [], notFound: [] };

  try {
    const response = await fetch(`${BACKEND_URL}/api/call-history/checkAppointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentIDs }),
    });

    if (!response.ok) {
      throw new Error("Failed to check appointment seismification status");
    }

    return await response.json(); // { found: [...], notFound: [...] }
  } catch (error) {
    console.error("checkAppointments error:", error);
    return { found: [], notFound: [] };
  }
};
import { BACKEND_URL } from "../constants";
import { appointmentActions } from "./appointment-slice";




export const fetchAppointmentDetails = (email, clinicName = "") => {
  return async (dispatch) => {
    const fetchAppointments = async () => {
      // CASE 1: Specific Clinic (Normal Behavior)
      if (clinicName && clinicName.trim() !== "") {
        const trimmedClinic = clinicName.replace(/\s+/g, " ").trim();
        // Ensure we don't double-slash if BACKEND_URL ends with /
        const base = (BACKEND_URL || "").replace(/\/+$/, "");
        const url = `${base}/api/appointments/all?clinicName=${encodeURIComponent(trimmedClinic)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Could not fetch appointment data!');

        let data = await response.json();
        return normalizeData(data);
      }

      // CASE 2: Legacy User (No Clinic Name)
      // User requested to ONLY see the logged-in doctor's appointments, 
      // but filtered to ensure they have no clinicName.
      else {
        try {
          // Fallback: just fetch specifically for this user's email
          const url = `${BACKEND_URL}api/appointments/${email}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Could not fetch appointment data!');
          let data = await response.json();
          return normalizeData(data).filter(appt => !appt.clinicName || appt.clinicName.trim() === "");

        } catch (err) {
          console.error("Error fetching legacy schedule", err);
          // Return empty if fail
          return [];
        }
      }
    };

    // Helper to handle inconsistent API return structures
    const normalizeData = (data) => {
      if (Array.isArray(data)) {
        // Check for nested .data structure inside array elements
        if (data.length > 0 && data[0]?.data && Array.isArray(data[0].data)) {
          return data.flatMap(day => day.data || []);
        }
        return data;
      } else if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
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

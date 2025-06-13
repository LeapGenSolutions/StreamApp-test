import { BACKEND_URL } from "../constants"; 

export const fetchBillingByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/billing/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch billing codes");
  }
  return response.json();
};
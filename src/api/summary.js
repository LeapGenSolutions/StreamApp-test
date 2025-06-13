import { BACKEND_URL } from "../constants"

export const fetchSummaryByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}/api/summary/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch summary');
  }
  return response.json();
};
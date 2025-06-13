import { BACKEND_URL } from "../constants"

export const fetchTranscriptByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}/api/transcript/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transcript');
  }
  return response.json();
};
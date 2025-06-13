import { BACKEND_URL } from "../constants";

export const fetchSoapNotes = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}/api/soap/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Soap notes');
  }
  return response.json();
};
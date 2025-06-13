import { BACKEND_URL } from "../constants"; 

export const fetchClustersByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/clusters/${apptId}?username=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clusters data");
  }
  return response.json();
};
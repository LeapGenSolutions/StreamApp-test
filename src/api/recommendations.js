import { BACKEND_URL } from "../constants"

export const fetchRecommendationByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}/api/recommendations/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
};
import { BACKEND_URL } from "../constants"; 

export const fetchUpToDateRecommendation = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/uptodate/recommendation/${apptId}/${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clusters data");
  }
  return response.json();
};
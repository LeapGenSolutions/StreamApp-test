import { BACKEND_URL } from "../constants";

export const fetchSummaryofSummaries = async (patient_id) => {
  const response = await fetch(`${BACKEND_URL}/api/summary-of-summary/${patient_id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch summary');
  }
  return response.json();
}

import { SOS_URL } from "../constants";

export const fetchSummaryofSummaries = async (doctor_email, patient_id) => {
  const encodedEmail = encodeURIComponent(doctor_email);
  const url = `${SOS_URL}summaries/${encodedEmail}/${patient_id}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ doctor_email, patient_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch summary");
  }

  const data = await response.json();
  return data?.combined_summary || "No summary found"
}

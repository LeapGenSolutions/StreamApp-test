import { BACKEND_URL } from "../constants";

export const fetchBillingByAppointment = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/billing/${apptId}?userID=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch billing codes");
  }
  return response.json();
};

export const updateBillingByAppointment = async (apptId, userID, updatedCodes) => {
  const response = await fetch(
    `${BACKEND_URL}api/billing/${apptId}?username=${userID}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing_codes: updatedCodes })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update billing codes");
  }

  return response.json();
};
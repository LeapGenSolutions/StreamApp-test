import { BACKEND_URL } from "../constants";

// GET works with ?userID=
export const fetchSoapNotes = async (apptId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/soap-notes/${apptId}?userID=${userID}`);
  if (!response.ok) {
    const error = await response.text();
    console.error(" Failed to fetch SOAP notes:", error);
    throw new Error("Failed to fetch SOAP notes");
  }
  return response.json();
};

// PATCH works with ?username= and ?partitionkey= (note lowercase!)
export const updateSoapNotes = async (apptId, username, updatedNotes) => {
  const encodedUser = encodeURIComponent(username);

  const response = await fetch(
    `${BACKEND_URL}api/soap-notes/${apptId}?username=${encodedUser}&partitionkey=${encodedUser}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soap_notes: updatedNotes, //  send flat structure
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(" Failed to update SOAP notes:", error);
    throw new Error("Failed to update SOAP notes");
  }

  return response.json();
};
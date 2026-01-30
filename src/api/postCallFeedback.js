import { BACKEND_URL } from "../constants";

// Fetch Post Call feedback by appointment
export const fetchPostCallFeedbackByAppointment = async (apptId, userID) => {
  const response = await fetch(
    `${BACKEND_URL}api/post-call-feedback/${userID}/${apptId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch post call feedback");
  }
  return response.json();
};

// Create or update Post Call feedback by appointment
export const updatePostCallFeedbackByAppointment = async (apptId, feedbackData) => {
  const response = await fetch(
    `${BACKEND_URL}api/post-call-feedback/${feedbackData.userID}/${apptId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallExperience: feedbackData.overallExperience,
        summaryAccuracy: feedbackData.summaryAccuracy,
        soapHelpfulness: feedbackData.soapHelpfulness,
        billingAccuracy: feedbackData.billingAccuracy,
        transcriptAccuracy: feedbackData.transcriptAccuracy,
        featureSuggestions: feedbackData.featureSuggestions,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save post call feedback");
  }

  return response.json();
};

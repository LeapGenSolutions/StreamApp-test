import { BACKEND_URL } from "../constants";

// Fetch Post Call feedback by appointment
export const fetchPostCallFeedbackByAppointment = async (apptId, userID) => {
    // The backend route is defined as /:email/:appointmentId, 
    // where userID corresponds to email in the backend
    const response = await fetch(`${BACKEND_URL}api/post-call-feedback/${userID}/${apptId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch post call feedback");
    }
    return response.json();
};

// Create or update Post Call feedback by appointment
// The backend uses a POST request that handles both creation and update internally
// and expects 'rating' and 'comments' in the body.
export const updatePostCallFeedbackByAppointment = async (apptId, feedbackData) => {
    // Backend route is POST /:email/:appointmentId
    const response = await fetch(`${BACKEND_URL}api/post-call-feedback/${feedbackData.userID}/${apptId}`, {
        method: "POST", // The backend's postCallFeedback.js only has a POST route for writing feedback
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // Aligning with the backend's expected body keys: rating and comments
            rating: feedbackData.rating, 
            comments: feedbackData.content, // Changed content to comments
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to save post call feedback");
    }

    return response.json();
};
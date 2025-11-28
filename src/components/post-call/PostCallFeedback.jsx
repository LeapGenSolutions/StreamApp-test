import React, { useEffect, useState } from "react";
import {
  // 1. IMPORT RENAMED FUNCTIONS
  fetchPostCallFeedbackByAppointment, 
  updatePostCallFeedbackByAppointment,
} from "../../api/postCallFeedback"; // 2. IMPORT FROM RENAMED FILE (postCallFeedback.js)
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

// The component name already matches the intent
const PostCallFeedback = ({ appointmentId, username }) => {
  const [feedback, setFeedback] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    // 3. Backend uses 'comments', so update the frontend field name
    comments: "", 
    rating: 0, // 1–10 rating
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        // 4. Use the new fetch function
        const data = await fetchPostCallFeedbackByAppointment(
          appointmentId,
          username
        );
        setFeedback(data);
        setForm({
          // 5. Backend returns 'comments', so use that to populate the form
          comments: data?.comments || "", 
          rating: data?.rating || 0,
        });
      } catch {
        setFeedback(null);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [appointmentId, username]);

  // Save feedback
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 6. Use the new update function and align data keys
      await updatePostCallFeedbackByAppointment(appointmentId, {
        userID: username,
        // The client-side API (postCallFeedback.js) will map 'content' 
        // to 'comments' for the backend, so we need to pass the 'comments' state as 'content'
        content: form.comments, 
        rating: form.rating,
      });

      // 7. Update the local state to reflect the successful save
      setFeedback({
        // Aligning with the backend's ID suffix: '_PostCallFeedback'
        id: `${username}_${appointmentId}_PostCallFeedback`, 
        user_id: username, // Backend uses user_id
        appointment_id: appointmentId,
        // Backend uses 'comments' and 'rating' directly on the item, not inside a 'data' object
        comments: form.comments, 
        rating: form.rating,
        created_at: new Date().toISOString(),
        last_update: new Date().toISOString(),
      });

      setEditMode(false);
    } catch {
      setError("Failed to save post call feedback");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading post call feedback...</div>; // Update text

  // No feedback yet
  if (!feedback && !editMode) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded shadow p-6 border border-blue-100 text-center">
        <div className="mb-4 text-gray-500">
          No post call feedback found.<br />You can add new feedback now.
        </div>
        <Button
          size="sm"
          className="bg-blue-500 text-white"
          onClick={() => setEditMode(true)}
        >
          Add Feedback
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-6 border border-blue-100">
      {/* View Mode */}
      {feedback && !editMode && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-blue-800">
              Post Call Feedback
            </h2> {/* Update title */}
            <Button
              size="sm"
              onClick={() => setEditMode(true)}
              className="bg-blue-500 text-white"
            >
              Edit
            </Button>
          </div>

          {/* Rating Display */}
          <div className="mb-2">
            <span className="font-medium text-gray-700">Rating: </span>
            {/* 8. Rating is directly on the feedback object, not in 'data' */}
            <span className="text-blue-600 font-bold">
              {feedback.rating}/10 
            </span>
          </div>

          {/* Feedback Content */}
          <div className="mb-2">
            <span className="font-medium text-gray-700">Feedback:</span>
            <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-1 text-gray-800 whitespace-pre-line">
              {/* 9. Feedback content is in 'comments', not 'feedback_content' in 'data' */}
              {feedback.comments || "—"} 
            </div>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            Last updated: {new Date(feedback.last_update).toLocaleString()}
          </div>
        </>
      )}

      {/* Edit Mode */}
      {(!feedback || editMode) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-blue-800">
              {feedback ? "Edit Post Call Feedback" : "Add Post Call Feedback"} 
            </h2> {/* Update title */}
            {feedback && (
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            )}
          </div>

          {/* 1–10 Number Rating System - NO CHANGE REQUIRED */}
          <div>
            <div className="mb-1 font-medium text-gray-700">Rating (1–10)</div>
            <div className="flex flex-wrap gap-2">
              {[...Array(10)].map((_, i) => {
                const num = i + 1;
                const selected = form.rating === num;

                return (
                  <button
                    key={num}
                    onClick={() =>
                      setForm((f) => ({ ...f, rating: num }))
                    }
                    className={`
                      w-9 h-9 rounded-md border text-sm font-bold
                      transition 
                      ${selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-gray-300 text-gray-600"
                      }
                      hover:bg-blue-100
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Textarea */}
          <Textarea
            placeholder="Write additional feedback..."
            // 10. Bind to the 'comments' state field
            value={form.comments} 
            onChange={(e) =>
              // 11. Update the 'comments' state field
              setForm((f) => ({ ...f, comments: e.target.value })) 
            }
            rows={5}
            className="bg-blue-50 border-blue-200"
          />

          {error && <div className="text-red-500 text-xs">{error}</div>}

          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : feedback ? "Save Changes" : "Add Feedback"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostCallFeedback;
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { updatePostCallFeedbackByAppointment } from "../../api/postCallFeedback";

const CallFeedback = ({ username, appointmentId }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    overallExperience: 0,
    summaryAccuracy: 0,
    soapHelpfulness: 0,
    billingAccuracy: 0,
    transcriptAccuracy: 0,
    featureSuggestions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // null, "select", "view", "edit"

  const ratingOptions = [1, 2, 3, 4, 5];

  const renderRatingButtons = (field, editable = true) => (
    <div className="flex items-center space-x-2 mt-1">
      {ratingOptions.map((num) => (
        <button
          key={num}
          type="button"
          className={`w-8 h-8 rounded-lg border font-medium text-sm ${
            form[field] === num
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => {
            if (!editable) return;
            setForm((f) => ({
              ...f,
              [field]: f[field] === num ? 0 : num,
            }));
          }}
        >
          {num}
        </button>
      ))}
      <span className="ml-2 text-xs text-gray-500">1-Poor, 5-Very Satisfied</span>
    </div>
  );

  const validateForm = () => {
    const ratings = [
      form.overallExperience,
      form.summaryAccuracy,
      form.soapHelpfulness,
      form.billingAccuracy,
      form.transcriptAccuracy,
    ];
    return !ratings.every((r) => r === 0);
  };

  const handleSave = async () => {
    setError(null);
    if (!validateForm()) {
      setError("Please provide rating to submit. Thank you.");
      return;
    }

    setSaving(true);
    try {
      await updatePostCallFeedbackByAppointment(appointmentId, {
        userID: username,
        ...form,
      });
      setSubmitted(true);
      setShowForm(false);
      setDialogMode(null);
      setShowThankYou(true);

      setTimeout(() => setShowThankYou(false), 3000);
    } catch {
      setError("Failed to save post call feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeedbackButtonClick = () => {
    if (submitted) {
      setDialogMode("select");
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="relative">
      {!showForm && !showThankYou && (
        <Button
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={handleFeedbackButtonClick}
        >
          Call Feedback
        </Button>
      )}

      {/* Feedback form */}
      {showForm && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Call Feedback</h2>

          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700 text-sm">
                How satisfied are you with the overall experience during this call?
              </label>
              {renderRatingButtons("overallExperience")}
            </div>

            <div>
              <label className="font-medium text-gray-700 text-sm">Was summary accurate?</label>
              {renderRatingButtons("summaryAccuracy")}
            </div>

            <div>
              <label className="font-medium text-gray-700 text-sm">Were SOAP notes accurate?</label>
              {renderRatingButtons("soapHelpfulness")}
            </div>

            <div>
              <label className="font-medium text-gray-700 text-sm">Were billing codes accurate?</label>
              {renderRatingButtons("billingAccuracy")}
            </div>

            <div>
              <label className="font-medium text-gray-700 text-sm">Was transcript accurate?</label>
              {renderRatingButtons("transcriptAccuracy")}
            </div>

            <div>
              <label className="font-medium text-gray-700 text-sm">
                Are there any features or improvements you would like us to add?
              </label>
              <Textarea
                placeholder="Your suggestions..."
                value={form.featureSuggestions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, featureSuggestions: e.target.value }))
                }
                rows={3}
                className="bg-white border border-gray-300 mt-1 w-full rounded"
              />
            </div>

            {error && <div className="text-red-600 font-medium">{error}</div>}

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                size="sm"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onClick={handleSave} // Only Submit saves
                disabled={saving}
              >
                {saving ? "Saving..." : "Submit"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)} // Cancel just closes
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thank you message */}
      {showThankYou && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50 flex items-center justify-center">
          <span className="text-green-600 font-medium">
            Thank you for your feedback! We appreciate your input.
          </span>
        </div>
      )}

      {/* Dialog for already given feedback */}
      {dialogMode === "select" && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50 flex flex-col space-y-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">Feedback already given</span>
            <button
              className="text-gray-400 hover:text-gray-700 font-bold text-xl"
              onClick={() => setDialogMode(null)}
            >
              ✕
            </button>
          </div>
          <div className="flex justify-end space-x-2">
            <Button size="sm" onClick={() => setDialogMode("view")}>View</Button>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setDialogMode("edit")}
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* View Mode */}
      {dialogMode === "view" && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50">
          <button
            className="self-end text-gray-400 hover:text-gray-700 font-bold text-xl"
            onClick={() => setDialogMode(null)} // Cancel closes dialog, no save
          >
            ✕
          </button>
          <h2 className="text-lg font-semibold text-blue-800 mb-4">View Feedback</h2>

          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700 text-sm">Overall Experience</label>
              {renderRatingButtons("overallExperience", false)}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Summary Accuracy</label>
              {renderRatingButtons("summaryAccuracy", false)}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">SOAP Helpfulness</label>
              {renderRatingButtons("soapHelpfulness", false)}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Billing Accuracy</label>
              {renderRatingButtons("billingAccuracy", false)}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Transcript Accuracy</label>
              {renderRatingButtons("transcriptAccuracy", false)}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm"> Are there any features or improvements you would like us to add?</label>
              <Textarea
                value={form.featureSuggestions}
                readOnly
                rows={3}
                className="bg-white border border-gray-300 mt-1 w-full rounded"
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button size="sm" variant="outline" onClick={() => setDialogMode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {dialogMode === "edit" && (
        <div className="absolute top-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96 z-50">
          <button
            className="self-end text-gray-400 hover:text-gray-700 font-bold text-xl"
            onClick={() => setDialogMode(null)} // Cancel closes dialog, no save
          >
            
          </button>
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Edit Feedback</h2>

          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700 text-sm">How satisfied are you with the overall experience during this call?</label>
              {renderRatingButtons("overallExperience")}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Was summary accurate?</label>
              {renderRatingButtons("summaryAccuracy")}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Were SOAP notes accurate?</label>
              {renderRatingButtons("soapHelpfulness")}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Were billing codes accurate?</label>
              {renderRatingButtons("billingAccuracy")}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm">Was transcript accurate?</label>
              {renderRatingButtons("transcriptAccuracy")}
            </div>
            <div>
              <label className="font-medium text-gray-700 text-sm"></label>
              <Textarea
                placeholder="Your suggestions..."
                value={form.featureSuggestions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, featureSuggestions: e.target.value }))
                }
                rows={3}
                className="bg-white border border-gray-300 mt-1 w-full rounded"
              />
            </div>
            {error && <div className="text-red-600 font-medium">{error}</div>}
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                size="sm"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onClick={handleSave} // Only Submit saves
                disabled={saving}
              >
                {saving ? "Saving..." : "Submit"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogMode(null)} // Cancel closes dialog, no save
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallFeedback;

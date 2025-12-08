import { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { cancelAppointment } from "../../api/appointment";

const CancelAppointmentModal = ({ appointment, onClose, onCancelled }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");

  const REASONS = [
    "Patient requested cancellation",
    "Patient unreachable / no-show risk",
    "Provider unavailable",
    "Scheduling conflict",
    "Insurance or payment issue",
    "Other",
  ];

  const handleCancel = async () => {
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    if (reason === "Other" && !otherText.trim()) {
      toast({
        title: "Details required",
        description: "Please provide additional details for 'Other'.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      await cancelAppointment(
        appointment.doctor_email?.toLowerCase(),   // ⭐ FIX ADDED
        appointment.id,
        {
          appointment_date: appointment.appointment_date,
          reason,
          notes: reason === "Other" ? otherText.trim() : "",
        }
      );

      toast({
        title: "Appointment Cancelled",
        description: `${appointment.full_name}'s appointment has been successfully cancelled.`,
      });

      if (onCancelled) onCancelled();
      onClose();
    } catch (err) {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel this appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-semibold mb-4">Cancel Appointment</h2>

        <p className="text-gray-700 mb-4">
          Please select the reason for cancelling this appointment.
        </p>

        {/* Reason Options */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="cancel_reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {r}
            </label>
          ))}
        </div>

        {/* Other Reason Textbox */}
        {reason === "Other" && (
          <textarea
            className="w-full border rounded-md p-2 mt-3 text-sm"
            rows={3}
            placeholder="Please describe the reason..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
          />
        )}

        <div className="text-sm text-gray-500 mt-4 mb-6">
          <p>
            <strong>Patient:</strong> {appointment.full_name}
          </p>
          <p>
            <strong>Date:</strong> {appointment.appointment_date}
          </p>
          <p>
            <strong>Time:</strong> {appointment.time}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>

          <Button
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Cancel Appointment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal

import React from "react";
import { useToast } from "../../hooks/use-toast";
import { deleteAppointment } from "../../api/appointment";

const DeleteAppointmentModal = ({ appointment, onClose, onDeleted }) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (appointment.seismified) {
      toast({
        title: "Unable to delete",
        description:
          "This appointment has already been Seismified and cannot be removed.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteAppointment(
        appointment.doctor_email?.toLowerCase(),   // ⭐ FIX ADDED
        appointment.id,
        appointment.appointment_date 
      );

      toast({
        title: "Appointment deleted",
        description: "The appointment has been successfully removed.",
        variant: "success",
      });

      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      toast({
        title: "Deletion failed",
        description: "Unable to delete this appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Delete Appointment
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          Are you sure you want to delete this appointment?
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAppointmentModal

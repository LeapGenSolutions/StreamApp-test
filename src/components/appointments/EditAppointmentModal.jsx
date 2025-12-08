import React, { useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { updateAppointment } from "../../api/appointment";
import { Calendar, Clock, User2 } from "lucide-react";

const EditAppointmentModal = ({ appointment, onClose, onUpdated }) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    ...appointment,
  });

  const [clickedInside, setClickedInside] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPayload = {
      original_appointment_date: appointment.appointment_date,
      appointment_date: formData.appointment_date,
      time: formData.time,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      dob: formData.dob,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      mrn: formData.mrn,
      specialization: formData.specialization,
      id: appointment.id,
      doctor_email: appointment.doctor_email,
    };

    cleanPayload.appointment_date = new Date(cleanPayload.appointment_date)
      .toISOString()
      .slice(0, 10);

    try {
      const apiResult = await updateAppointment(
        appointment.doctor_email,
        appointment.id,
        cleanPayload
      );

      toast({
        title: "Appointment Updated",
        description: "Changes saved successfully.",
        variant: "success",
      });

      const updatedAppointment = {
        ...appointment,
        ...cleanPayload,
        ...(apiResult || {}),
      };

      if (onUpdated) onUpdated(updatedAppointment);
      onClose();
    } catch (err) {
      toast({
        title: "Error Updating",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const attemptClose = () => {
    const changed =
      JSON.stringify(appointment) !== JSON.stringify(formData);

    if (changed) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-end items-center z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !clickedInside) attemptClose();
        setClickedInside(false);
      }}
    >
      <div
        className="bg-white shadow-xl rounded-xl w-full max-w-lg h-[80vh] mr-16 mt-10 mb-6 overflow-y-auto flex flex-col border"
        onMouseDown={() => setClickedInside(true)}
      >
        <div className="flex justify-between items-center px-5 py-3 bg-blue-600 rounded-t-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={18} /> Edit Appointment
          </h2>

          <button
            onClick={attemptClose}
            className="text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form
          className="px-5 py-4 space-y-5 bg-gray-50"
          onSubmit={handleSubmit}
        >
          <section className="bg-white border rounded-xl p-4">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <Clock size={16} /> Appointment Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Appointment Date"
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
              />
              <Input
                label="Time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
              <Input
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4">
              <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <User2 size={16} /> Patient Information
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  type="date"
                  label="DOB"
                  name="dob"
                  value={formData.dob}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="MRN"
                  name="mrn"
                  value={formData.mrn}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            </section>


          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={attemptClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
            <p className="text-gray-800 text-sm mb-4">
              You have unsaved changes. Discard changes?
            </p>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  readOnly,
  className,
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      className={`border rounded-md w-full p-2 text-sm border-gray-300 ${className}`}
    />
  </div>
);

export default EditAppointmentModal

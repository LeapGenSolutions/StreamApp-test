import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useToast } from "../../hooks/use-toast";
import { updateAppointment } from "../../api/appointment";
import { Calendar, Clock, User2 } from "lucide-react";

const normalizeStatus = (status) => {
  const value = (status || "").toString().trim().toLowerCase();
  return value === "canceled" ? "cancelled" : value;
};

const isSeismifiedValue = (value) => {
  if (value === true) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  if (typeof value === "number") return value === 1;
  return false;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseISODate = (value) => {
  if (!DATE_REGEX.test(value || "")) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const getAppointmentDateTime = (appointment) => {
  const rawDate =
    appointment?.appointment_date || appointment?.date || appointment?.appointmentDate;
  const rawTime = appointment?.time || "";

  if (!rawDate || !rawTime) return null;

  const datePart = String(rawDate).split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;

  const [hRaw, mRaw] = String(rawTime).split(":");
  const hours = parseInt(hRaw || "0", 10);
  const minutes = parseInt(mRaw || "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const EditAppointmentModal = ({ appointment, onClose, onUpdated }) => {
  const { toast } = useToast();
  const loggedInDoctor = useSelector((state) => state.me.me);

  const [formData, setFormData] = useState({
    ...appointment,
  });

  const [clickedInside, setClickedInside] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // ✅ Inline error state
  const [errors, setErrors] = useState({
    appointment_date: "",
    time: "",
  });
  const todayISO = toISODate(new Date());

  const normalizeDateValue = (value) => {
    const match = String(value || "").match(/^(\d+)-(\d{2})-(\d{2})$/);
    if (!match) return value;

    const [, year, month, day] = match;
    if (year.length <= 4) return value;
    return `${year.slice(0, 4)}-${month}-${day}`;
  };

  const getAppointmentDateError = (value) => {
    if (!value || String(value).trim() === "") {
      return "Appointment date is required.";
    }

    const parsedDate = parseISODate(value);
    if (!parsedDate) return "Invalid appointment date";
    if (value < todayISO) return "Appointment date must be today or later.";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "appointment_date" ? normalizeDateValue(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    // clear inline error when user edits field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name !== "appointment_date") return;

    const dateError = getAppointmentDateError(value);
    setErrors((prev) => ({ ...prev, appointment_date: dateError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const appointmentDateTime = getAppointmentDateTime(appointment);
    const hasHappened =
      appointmentDateTime instanceof Date &&
      !Number.isNaN(appointmentDateTime.getTime()) &&
      appointmentDateTime <= new Date();
    const status = normalizeStatus(appointment?.status);
    const blocked =
      hasHappened ||
      isSeismifiedValue(appointment?.seismified) ||
      status === "completed" ||
      status === "cancelled";

    if (blocked) {
      toast({
        title: "Cannot update appointment",
        description:
          "This appointment has already happened, is completed/cancelled, or is seismified and cannot be rescheduled.",
        variant: "destructive",
      });
      onClose();
      return;
    }

    const newErrors = {
      appointment_date: "",
      time: "",
    };

    const today = new Date();
    const now = new Date(); // current moment
    today.setHours(0, 0, 0, 0);

    const dateError = getAppointmentDateError(formData.appointment_date);
    if (dateError) {
      newErrors.appointment_date = dateError;
    } else {
      const selectedDate = parseISODate(formData.appointment_date);
      selectedDate.setHours(0, 0, 0, 0);

      // 🛑 Past calendar day
      if (selectedDate.getTime() === today.getTime()) {
        // Today -> check time
        if (!formData.time) {
          newErrors.time = "Appointment time must be in the future.";
        } else {
          const [hh, mm] = formData.time.split(":");
          const selectedDateTime = new Date();
          selectedDateTime.setHours(
            parseInt(hh || "0", 10),
            parseInt(mm || "0", 10),
            0,
            0
          );

          // 🛑 Past time today
          if (selectedDateTime <= now) {
            newErrors.time = "Appointment time must be in the future.";
          }
        }
      }
    }

    // If any validation errors, show toast + inline red boxes and stop
    if (newErrors.appointment_date || newErrors.time) {
      setErrors(newErrors);

      toast({
        title: "Cannot update appointment",
        description:
          newErrors.time ||
          newErrors.appointment_date ||
          "Past appointments cannot be modified. Please schedule a future appointment.",
        variant: "destructive",
      });
      return;
    }

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
      clinicName: (appointment.clinicName || loggedInDoctor?.clinicName || "").replace(/\s+/g, " ").trim(),
    };

    // Keep local calendar date as yyyy-mm-dd without UTC shifting.
    cleanPayload.appointment_date = String(
      cleanPayload.appointment_date || ""
    ).split("T")[0];

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
                onBlur={handleBlur}
                min={todayISO}
                error={errors.appointment_date}
              />
              <Input
                label="Time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
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
              You have some unsaved details. Do you want to leave without saving?
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
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
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
  onBlur,
  readOnly,
  className = "",
  error,
  ...rest
}) => {
  const hasError = !!error;

  return (
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
        onBlur={onBlur}
        {...rest}
        className={`
          border rounded-md w-full p-2 text-sm 
          ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"} 
          ${className}
        `}
      />
      {hasError && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default EditAppointmentModal;

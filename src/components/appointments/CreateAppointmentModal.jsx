import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BACKEND_URL } from "../../constants";
import { createAppointment } from "../../api/appointment";
import { fetchPatientsDetails } from "../../redux/patient-actions";
import { useToast } from "../../hooks/use-toast";
import UnsavedChangesModal from "../UnsavedChangesModal";
import { Calendar, User2, Clock } from "lucide-react";
import SeismicTimeDropdown from "./SeismicTimeDropdown";

const CreateAppointmentModal = ({ username, onClose, onSuccess }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchPatientsDetails());
  }, [dispatch]);

  const loggedInDoctor = useSelector((state) => state.me.me);
  const patientsList = useSelector((state) => state.patients.patients);
  const [existingPatient, setExistingPatient] = useState(null);

  const resolvedDoctorName = loggedInDoctor?.doctor_name;
  const resolvedDoctorEmail =
    loggedInDoctor?.doctor_email || loggedInDoctor?.email;
  const resolvedSpecialization = loggedInDoctor?.specialization;
  const resolvedDoctorId = loggedInDoctor?.doctor_id;

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    ehr: "",
    mrn: "",
    appointment_date: "",
    time: "",
    specialization: resolvedSpecialization || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [nameMatches, setNameMatches] = useState([]);

  const requiredFields = [
    "first_name",
    "last_name",
    "dob",
    "appointment_date",
    "time",
  ];

  const extractMRN = (p) =>
    p.mrn ||
    p.original_json?.mrn ||
    p.original_json?.details?.mrn ||
    p.original_json?.original_json?.details?.mrn ||
    "";

  const extractDetails = (p) =>
    p.details ||
    p.original_json?.details ||
    p.original_json?.original_json?.details ||
    p;

  const norm = (str) => (str || "").toString().toLowerCase().trim();

  const resetPatientAndForm = () => {
    setExistingPatient(null);
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      dob: "",
      gender: "",
      email: "",
      phone: "",
      ehr: "",
      mrn: "",
      appointment_date: "",
      time: "",
      specialization: resolvedSpecialization || "",
    });
    setErrors({});
    setTouched({});
    setNameSearchTerm("");
    setNameMatches([]);
  };

  const handleNameInputChange = (e) => {
    const value = e.target.value;
    setNameSearchTerm(value);

    const term = norm(value);
    if (!term) {
      resetPatientAndForm();
      return;
    }

    const matches = patientsList.filter((p) => {
      const d = extractDetails(p);
      const full = norm(
        [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ")
      );
      const first = norm(d.first_name);
      const last = norm(d.last_name);
      return full.includes(term) || first.includes(term) || last.includes(term);
    });

    if (!matches.length) {
      setNameMatches([]);
      return;
    }

    setNameMatches(matches);
  };

  const applyExistingPatient = (match) => {
    setExistingPatient(match);
    const d = extractDetails(match);
    const resolvedMRN = extractMRN(match);

    setFormData((prev) => ({
      ...prev,
      first_name: d.first_name || "",
      middle_name: d.middle_name || "",
      last_name: d.last_name || "",
      dob: d.dob ?? "",
      gender: d.gender || "",
      email: d.email || "",
      phone: d.phone || "",
      ehr: d.ehr || "",
      mrn: resolvedMRN || d.mrn || prev.mrn || "",
    }));

    setTouched((prev) => ({
      ...prev,
      first_name: true,
      last_name: true,
      dob: true,
    }));

    setErrors((prev) => ({
      ...prev,
      first_name: "",
      last_name: "",
      dob: "",
    }));
  };

  const runFieldValidation = (name, value) => {
    let message = "";
    if (requiredFields.includes(name) && !value) {
      message = "This field is required.";
    }
    return message;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    setErrors((prev) => ({
      ...prev,
      [name]: runFieldValidation(name, value),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((f) => {
      if (!formData[f]) newErrors[f] = "This field is required.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertTo24Hour = (t) => {
    if (!t) return "";
    const d = new Date(`1970-01-01 ${t}`);
    if (isNaN(d.getTime())) return "";
    return d.toTimeString().slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched((prev) => {
      const next = { ...prev };
      requiredFields.forEach((f) => (next[f] = true));
      return next;
    });

    if (!validateForm()) {
      toast({
        title: "Form incomplete",
        description: "Review highlighted fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [Y, M, D] = formData.appointment_date.split("-").map(Number);
      const selectedDate = new Date(Y, (M || 1) - 1, D || 1);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast({
          title: "Cannot create appointment",
          description: "Appointment date must be today or in the future.",
          variant: "destructive",
        });

        setErrors((prev) => ({
          ...prev,
          appointment_date: "Appointment date must be today or in the future.",
        }));
        return;
      }
    } catch {}

    if (!existingPatient && formData.mrn?.trim()) {
      const enteredMRN = formData.mrn.trim().toLowerCase();

      const matches = patientsList.filter((p) => {
        const existing = extractMRN(p);
        if (!existing) return false;
        return existing.toString().trim().toLowerCase() === enteredMRN;
      });

      if (matches.length > 0) {
        toast({
          title: "Duplicate MRN",
          description: "This MRN already exists. Please use a unique MRN.",
          variant: "destructive",
        });

        setErrors((prev) => ({
          ...prev,
          mrn: "MRN already exists. Please use a unique MRN.",
        }));
        setTouched((prev) => ({ ...prev, mrn: true }));

        return;
      }
    }

    setIsSubmitting(true);

    try {
      let patient_id, practice_id;

      if (existingPatient) {
        const d = extractDetails(existingPatient);
        patient_id = existingPatient.patient_id || d.patient_id;
        practice_id = existingPatient.practice_id || d.practice_id;
      } else {
        const res = await fetch(`${BACKEND_URL}api/patients/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            dob: formData.dob,
            gender: formData.gender,
            email: formData.email,
            phone: formData.phone?.replace(/\D/g, ""),
            ehr: formData.ehr,
            mrn: formData.mrn,
          }),
        });

        const saved = await res.json();
        const d =
          saved?.chatbotPatient?.original_json?.details ||
          saved?.chatbotPatient;

        patient_id = saved?.chatbotPatient?.patientID || d?.patient_id;
        practice_id = saved?.chatbotPatient?.practiceID || d?.practice_id;
      }

      const fullName = [
        formData.first_name,
        formData.middle_name,
        formData.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      const appointmentData = {
        type: "appointment",
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        full_name: fullName,
        dob: formData.dob,
        gender: formData.gender,
        mrn: formData.mrn,
        ehr: formData.ehr,
        doctor_name: resolvedDoctorName,
        doctor_id: resolvedDoctorId,
        doctor_email: resolvedDoctorEmail,
        specialization: formData.specialization,
        time: convertTo24Hour(formData.time),
        appointment_date: formData.appointment_date,
        status: "scheduled",
        email: formData.email,
        phone: formData.phone?.replace(/\D/g, ""),
        patient_id,
        practice_id,
      };

      const created = await createAppointment(
        resolvedDoctorEmail,
        appointmentData
      );

      toast({
        title: "Appointment created",
        description: "The appointment has been successfully scheduled.",
        variant: "success",
      });

      const savedAppointment = created?.data?.[created.data.length - 1];
      onSuccess(savedAppointment);
      onClose();
    } catch (err) {
      toast({
        title: "Error creating appointment",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formHasAnyValue = Object.values(formData).some(
    (v) => v !== undefined && v !== null && String(v).trim() !== ""
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-end items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (formHasAnyValue) setShowUnsavedConfirm(true);
          else onClose();
        }
      }}
    >
      <div
        className="
          bg-white shadow-xl rounded-xl 
          w-[960px] max-h-[90vh]
          mr-16 mt-10 mb-6 
          overflow-y-auto h-full 
          flex flex-col 
          border border-black-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 bg-blue-600 rounded-t-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={18} /> Schedule Appointment
          </h2>
          <button onClick={onClose} className="text-white text-2xl">
            ×
          </button>
        </div>

        <div className="flex h-full">
          <div className="w-[40%] border-r border-black-200 p-4 overflow-y-auto">
            <h3 className="text-md font-semibold text-blue-700 mb-3">
              Find Existing Patient
            </h3>

            <div className="mb-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-black-600 mb-1">
                Search by Patient Name
              </label>
              <button
                type="button"
                onClick={resetPatientAndForm}
                className="text-xs text-blue-700 hover:text-blue-900 underline underline-offset-2"
              >
                Reset
              </button>
            </div>

            <input
              value={nameSearchTerm}
              onChange={handleNameInputChange}
              placeholder="Start typing name..."
              className="border rounded-md w-full p-2 text-sm border-black-300"
            />
          </div>

            {nameMatches.length > 0 && (
              <div className="border rounded-md max-h-80 overflow-y-auto">
                {nameMatches.map((p) => {
                  const d = extractDetails(p);

                  const displayName = [d.first_name, d.middle_name, d.last_name]
                    .filter(Boolean)
                    .join(" ");

                  let formattedDOB = "—";

                  if (d?.dob) {
                    const cleanDOB = d.dob.split("T")[0];
                    const parts = cleanDOB.split("-");
                    if (parts.length === 3) {
                      const [yyyy, mm, dd] = parts;
                      formattedDOB = `${mm}/${dd}/${yyyy}`;
                    }
                  }

                  const resolvedMRN = extractMRN(p) || "—";

                  return (
                    <div
                      key={p.patient_id}
                      className="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => {
                        applyExistingPatient(p);
                        setNameSearchTerm(displayName);
                        setNameMatches([]);
                      }}
                    >
                      <div className="font-medium">
                        {displayName || "Unnamed Patient"}
                      </div>

                      <div className="text-xs text-black-600 flex gap-2 mt-1">
                        <span>DOB: {formattedDOB}</span>
                        <span>|</span>
                        <span>MRN: {resolvedMRN}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-[60%] p-4 overflow-y-auto bg-black-50">
            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="bg-white border rounded-xl p-4">
                <h3 className="text-md font-semibold text-blue-700 flex items-center gap-2 mb-3">
                  <Clock size={16} /> Appointment Details
                </h3>

                <div className="grid grid-cols-2 gap-3 min-w-[0]">
                  <Input
                    label="Appointment Date *"
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    error={errors.appointment_date}
                    touched={touched.appointment_date}
                  />

                  <div className="min-w-[180px]">
                    <SeismicTimeDropdown
                      label="Appointment Time *"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      error={errors.time}
                      touched={touched.time}
                      appointmentDate={formData.appointment_date}
                      toast={toast}
                    />
                  </div>

                  <Input
                    label="Doctor Specialty"
                    name="specialization"
                    value={formData.specialization}
                    readOnly
                    className="bg-blue-50 cursor-not-allowed"
                  />
                </div>
              </section>

              <section className="bg-white border rounded-xl p-4">
                <h3 className="text-md font-semibold text-blue-700 flex items-center gap-2 mb-3">
                  <User2 size={16} /> Patient Information
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name *"
                    name="first_name"
                    value={formData.first_name}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                    error={errors.first_name}
                    touched={touched.first_name}
                  />

                  <Input
                    label="Middle Name"
                    name="middle_name"
                    value={formData.middle_name}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                  />

                  <Input
                    label="Last Name *"
                    name="last_name"
                    value={formData.last_name}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                    error={errors.last_name}
                    touched={touched.last_name}
                  />

                  <Input
                    type="date"
                    label="Date of Birth *"
                    name="dob"
                    value={formData.dob}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                    error={errors.dob}
                    touched={touched.dob}
                  />

                  <Select
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={existingPatient ? () => {} : handleChange}
                    options={["Male", "Female", "Other"]}
                    disabled={!!existingPatient}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                  />

                  <Input
                    label="Email"
                    name="email"
                    value={formData.email}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    placeholder="Enter phone number"
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                  />

                  <Input
                    label="MRN"
                    name="mrn"
                    value={formData.mrn}
                    readOnly={!!existingPatient}
                    onChange={existingPatient ? undefined : handleChange}
                    className={
                      existingPatient ? "bg-blue-50 cursor-not-allowed" : ""
                    }
                    error={errors.mrn}
                    touched={touched.mrn}
                  />
                </div>
              </section>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (formHasAnyValue) setShowUnsavedConfirm(true);
                    else onClose();
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600"
                >
                  {isSubmitting ? "Saving..." : "Save Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {showUnsavedConfirm && (
          <UnsavedChangesModal
            onConfirm={() => {
              setShowUnsavedConfirm(false);
              onClose();
            }}
            onCancel={() => setShowUnsavedConfirm(false)}
          />
        )}
      </div>
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
  placeholder,
  className = "",
  error,
  touched,
}) => {
  const isInvalid = touched && !!error;

  return (
    <div>
      <label className="block text-xs font-semibold text-black-600 mb-1">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          border rounded-md w-full p-2 text-sm 
          ${isInvalid ? "border-red-500 bg-red-50" : "border-black-300"}
          ${className}
        `}
      />

      {isInvalid && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  disabled,
  className = "",
}) => (
  <div>
    <label className="block text-xs font-semibold text-black-600 mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`border border-blue-300 rounded-md w-full p-2 text-sm bg-white ${className}`}
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default CreateAppointmentModal
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BACKEND_URL } from "../../constants";
import { createAppointment } from "../../api/appointment";
import { fetchPatientsDetails } from "../../redux/patient-actions";
import { useToast } from "../../hooks/use-toast";
import UnsavedChangesModal from "../UnsavedChangesModal";
import { Calendar, User2, Clock, ChevronDown, Search } from "lucide-react";

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

  const isSameCalendarDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const runFieldValidation = (name, value) => {
    let message = "";

    if (requiredFields.includes(name)) {
      if (!value) {
        message = "This field is required.";
      } else {
        if (name === "dob") {
          const d = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (!isNaN(d.getTime()) && d > today) {
            message = "Date of birth cannot be in the future.";
          }
        }

        if (name === "appointment_date") {
          const [y, m, d] = value.split("-");
          const selected = new Date(y, m - 1, d || 1);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (!isNaN(selected.getTime()) && selected < today) {
            message = "Appointment date cannot be in the past.";
          }
        }
      }
    }

    return message;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    setErrors((prev) => {
      const next = { ...prev };

      if (requiredFields.includes(name)) {
        next[name] = runFieldValidation(name, value);
      } else {
        next[name] = "";
      }

      return next;
    });
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
      dob: d.dob || "",
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
      mrn: true,
    }));

    setErrors((prev) => ({
      ...prev,
      first_name: "",
      last_name: "",
      dob: "",
      mrn: "",
    }));
  };

  const handleMRNSearch = () => {
    if (!formData.mrn.trim()) {
      setTouched((prev) => ({ ...prev, mrn: true }));
      setErrors((prev) => ({ ...prev, mrn: "MRN is required to search." }));

      toast({
        title: "MRN required",
        description: "Enter an MRN to search for a patient record.",
        variant: "destructive",
      });
      return;
    }

    const target = formData.mrn.toLowerCase().trim();
    const match = patientsList.find(
      (p) => extractMRN(p).toLowerCase().trim() === target
    );

    if (!match) {
      setExistingPatient(null);
      setErrors((prev) => ({
        ...prev,
        mrn: "No patient found with this MRN.",
      }));

      toast({
        title: "Patient not found",
        description:
          "No record matches this MRN. Verify and try again.",
        variant: "destructive",
      });
      return;
    }

    setNameMatches([]);
    applyExistingPatient(match);
  };

  const handleNameSearch = () => {
    if (!nameSearchTerm.trim()) {
      toast({
        title: "Name required",
        description: "Enter a patient name to search.",
        variant: "destructive",
      });
      return;
    }

    const term = norm(nameSearchTerm);

    const matches = patientsList.filter((p) => {
      const d = extractDetails(p);
      const first = norm(d.first_name);
      const last = norm(d.last_name);
      const full = norm(
        [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ")
      );
      return full.includes(term) || first.includes(term) || last.includes(term);
    });

    if (!matches.length) {
      toast({
        title: "No matching patients",
        description:
          "No records found for the entered name.",
        variant: "destructive",
      });
      return;
    }

    if (matches.length === 1) {
      applyExistingPatient(matches[0]);
      return;
    }

    setNameMatches(matches);
  };

  const validateForm = () => {
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = "This field is required.";
    });

    if (formData.dob) {
      const d = new Date(formData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(d.getTime()) && d > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
      }
    }

    if (formData.appointment_date) {
      const [y, m, d] = formData.appointment_date.split("-");
      const date = new Date(y, m - 1, d || 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!isNaN(date.getTime()) && date < today) {
        newErrors.appointment_date = "Appointment date cannot be in the past.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertTo24Hour = (t) => {
    if (!t) return "";
    const d = new Date(`1970-01-01 ${t}`);
    if (isNaN(d.getTime())) return "";
    return d.toTimeString().slice(0, 5);
  };

  const isSelectedTimeInPastToday = () => {
    if (!formData.appointment_date || !formData.time) return false;

    const [y, m, d] = formData.appointment_date.split("-");
    const selectedDate = new Date(y, m - 1, d || 1);
    const today = new Date();

    if (!isSameCalendarDay(selectedDate, today)) return false;

    const selectedTime = new Date(`1970-01-01 ${formData.time}`);
    if (isNaN(selectedTime.getTime())) return false;

    const now = new Date();

    if (selectedTime.getHours() < now.getHours()) return true;
    if (
      selectedTime.getHours() === now.getHours() &&
      selectedTime.getMinutes() <= now.getMinutes()
    ) {
      return true;
    }

    return false;
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

    if (formData.mrn?.trim() && !existingPatient) {
      const normalizedMRN = formData.mrn.trim().toLowerCase();

      const duplicateMRN = patientsList.some((p) => {
        const existingMRN = extractMRN(p)
          ?.toString()
          .trim()
          .toLowerCase();
        return existingMRN === normalizedMRN;
      });

      if (duplicateMRN) {
        toast({
          title: "Duplicate MRN",
          description:
            "This MRN already exists for another patient. Please enter a unique MRN.",
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
  

    if (isSelectedTimeInPastToday()) {
      setErrors((prev) => ({
        ...prev,
        time: "Appointment time cannot be in the past.",
      }));
      setTouched((prev) => ({ ...prev, time: true }));

      toast({
        title: "Invalid appointment time",
        description:
          "Selected time has already passed. Choose a future time.",
        variant: "destructive",
      });
      return;
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
            email: formData.email?.toLowerCase().trim(),
            phone: formData.phone?.replace(/\D/g, ""),
            ehr: formData.ehr,
            mrn: formData.mrn,
          }),
        });

        const saved = await res.json();
        const d =
          saved?.chatbotPatient?.original_json?.original_json?.details ||
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
        specialization: formData.specialization || resolvedSpecialization,
        time: convertTo24Hour(formData.time),
        status: "scheduled",
        appointment_date: formData.appointment_date,
        email: formData.email,
        phone: formData.phone?.replace(/\D/g, ""),
        patient_id,
        practice_id,
        ssn: String(patient_id),
        insurance_provider: "Self-Pay",
        insurance_verified: false,
      };

      const created = await createAppointment(
        resolvedDoctorEmail,
        appointmentData
      );

      const savedAppointment = created?.data?.[created.data.length - 1];

      toast({
        title: "Appointment created",
        description: "The appointment has been successfully scheduled.",
        variant: "success",
      });

      onSuccess(savedAppointment);
      onClose();
    } catch (err) {
      toast({
        title: "Error creating appointment",
        description:
          err?.message || "Unable to create appointment. Try again.",
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
          if (formHasAnyValue) {
            setShowUnsavedConfirm(true);
          } else {
            onClose();
          }
        }
      }}
    >
      <div
        className="bg-white shadow-xl rounded-xl w-full max-w-lg h-[70vh] mr-16 mt-10 mb-6 overflow-y-auto flex flex-col border border-gray-200"
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

        <form className="px-5 py-4 space-y-5 bg-gray-50" onSubmit={handleSubmit}>
          <section className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-blue-700 flex items-center gap-2">
                <Clock size={16} /> Appointment Details
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Appointment Date *"
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                error={errors.appointment_date}
                touched={touched.appointment_date}
              />

              <ScrollableTimeDropdown
                label="Appointment Time *"
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
                touched={touched.time}
                appointmentDate={formData.appointment_date}
                toast={toast}
              />

              <Input
                label="Doctor Specialty"
                name="specialization"
                value={formData.specialization}
                readOnly
                className="bg-blue-50 cursor-not-allowed"
              />

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Search by Patient Name *
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  If the patient already exists, their details will auto-fill once selected.
                  If not, you can enter their details manually.
                </p>

                <div className="flex gap-2">
                  <input
                    name="nameSearch"
                    value={nameSearchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNameSearchTerm(value);

                      if (value.trim() === "") {
                        setNameMatches([]);
                      }
                    }}
                    placeholder="Enter first, last, or full name"
                    className="border rounded-md w-full p-2 text-sm border-gray-300"
                  />

                  <button
                    type="button"
                    onClick={handleNameSearch}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex items-center gap-1 text-sm"
                  >
                    <Search size={16} /> Search
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  MRN (Optional)
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  If the patient already exists, their details will auto-fill once selected.
                  If not, you can enter their details manually.
                </p>
                <div className="flex gap-2">
                  <input
                    name="mrn"
                    value={formData.mrn}
                    onChange={handleChange}
                    className="border rounded-md w-full p-2 text-sm border-gray-300"
                    placeholder="Enter MRN (optional)"
                  />
                  <button
                    type="button"
                    onClick={handleMRNSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm"
                  >
                    <Search size={16} /> Search
                  </button>
                </div>

                {errors.mrn && touched.mrn && (
                  <p className="text-xs text-red-500 mt-1">{errors.mrn}</p>
                )}
              </div>

              {nameMatches.length > 1 && (
                <div className="col-span-2">
                  <div className="p-2 bg-blue-50 rounded-md border max-h-40 overflow-y-auto">
                    {nameMatches.map((p) => {
                      const d = extractDetails(p);
                      return (
                        <div
                          key={p.patient_id}
                          className="p-1 hover:bg-blue-100 cursor-pointer text-xs flex justify-between items-center"
                          onClick={() => {
                            applyExistingPatient(p);
                            setNameMatches([]);
                          }}
                        >
                          <span>
                            {d.first_name} {d.last_name}
                            {d.dob && (
                              <span className="text-[10px] text-gray-500 ml-1">
                                • DOB{" "}
                                {new Date(d.dob).toLocaleString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            MRN {extractMRN(p)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                onChange={handleChange}
                error={errors.first_name}
                touched={touched.first_name}
              />

              <Input
                label="Middle Name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
              />

              <Input
                label="Last Name *"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                touched={touched.last_name}
              />

              {existingPatient ? (
                <Input
                  type="month"
                  label="Date of Birth *"
                  name="dob"
                  value={formData.dob ? formData.dob.slice(0, 7) : ""}
                  onChange={() => {}}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  error={errors.dob}
                  touched={touched.dob}
                />
              ) : (
                <Input
                  type="date"
                  label="Date of Birth *"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  error={errors.dob}
                  touched={touched.dob}
                />
              )}

              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={["Male", "Female", "Other"]}
              />

              <Input
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />

              <Input
                label="EHR ID"
                name="ehr"
                value={formData.ehr}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => {
                if (formHasAnyValue) {
                  setShowUnsavedConfirm(true);
                } else {
                  onClose();
                }
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Save Appointment"}
            </button>
          </div>
        </form>
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
  );
};

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  touched,
  placeholder,
  readOnly,
  className = "",
}) => {
  const isInvalid = touched && !!error;
  const hasValue = String(value || "").trim() !== "";
  const isValid = touched && !error && hasValue;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <div
        className={`relative rounded-md ${
          isInvalid
            ? "border-l-4 border-l-red-500 pl-2"
            : isValid
            ? "border-l-4 border-l-green-500 pl-2"
            : ""
        }`}
      >
        <input
          type={type}
          name={name}
          value={value}
          readOnly={readOnly}
          onChange={onChange}
          placeholder={placeholder}
          className={`border rounded-md w-full p-2 text-sm ${
            isInvalid ? "border-red-500 bg-red-50" : "border-gray-300"
          } ${className}`}
        />
      </div>

      {isInvalid && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md w-full p-2 text-sm bg-white"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const ScrollableTimeDropdown = ({
  label,
  name,
  value,
  onChange,
  error,
  touched,
  appointmentDate,
  toast,
}) => {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const generateTimeSlots = () => {
    let slots = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        slots.push(
          d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      }
    }
    return slots;
  };

  const times = generateTimeSlots();

  const isSameCalendarDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const isPastTime = (slot) => {
    if (!appointmentDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [Y, M, D] = appointmentDate.split("-").map(Number);
    const selectedDate = new Date(Y, M - 1, D || 1);

    if (!isSameCalendarDay(selectedDate, today)) return false;

    const slotDate = new Date(`1970-01-01 ${slot}`);
    if (isNaN(slotDate.getTime())) return false;

    const now = new Date();

    if (slotDate.getHours() < now.getHours()) return true;
    if (
      slotDate.getHours() === now.getHours() &&
      slotDate.getMinutes() <= now.getMinutes()
    )
      return true;

    return false;
  };

  const isInvalid = touched && !!error;
  const hasValue = String(value || "").trim() !== "";
  const isValid = touched && !error && hasValue;

  const handleManualAdd = () => {
    if (!manualValue.trim()) {
      toast?.({
        title: "Time required",
        description: "Enter a valid appointment time.",
        variant: "destructive",
      });
      return;
    }

    const parsed = new Date(`1970-01-01 ${manualValue}`);
    if (isNaN(parsed.getTime())) {
      toast?.({
        title: "Invalid time format",
        description:
          "Enter time in a valid format (e.g., 03:30 PM or 19:30).",
        variant: "destructive",
      });
      return;
    }

    if (appointmentDate) {
      const [Y, M, D] = appointmentDate.split("-").map(Number);
      const selectedDate = new Date(Y, M - 1, D || 1);
      const today = new Date();

      if (isSameCalendarDay(selectedDate, today)) {
        const now = new Date();

        if (
          parsed.getHours() < now.getHours() ||
          (parsed.getHours() === now.getHours() &&
            parsed.getMinutes() <= now.getMinutes())
        ) {
          toast?.({
            title: "Invalid time",
            description:
              "Selected time has already passed. Choose a future time.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    onChange({ target: { name, value: manualValue } });
    setManualMode(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <div
        className={`relative rounded-md ${
          isInvalid
            ? "border-l-4 border-l-red-500 pl-2"
            : isValid
            ? "border-l-4 border-l-green-500 pl-2"
            : ""
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setManualMode(false);
          }}
          className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm bg-white ${
            isInvalid ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        >
          {value || "Select time"}
          <ChevronDown size={16} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border rounded-xl shadow-lg">
            <div
              onClick={() => setManualMode(true)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b text-blue-700 font-semibold"
            >
              Enter time manually
            </div>

            {manualMode && (
              <div className="px-3 py-2 bg-gray-50 border-b">
                <input
                  type="text"
                  placeholder="e.g., 07:45 PM or 19:45"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  className="border border-gray-300 rounded-md w-full p-2 text-sm mb-2"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualMode(false);
                      setManualValue("");
                    }}
                    className="px-3 py-1 text-sm bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleManualAdd}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const firstAvailableIndex = times.findIndex((t) => !isPastTime(t));

              return times.map((time, index) => {
                const disabled = isPastTime(time);

                return (
                  <div
                    key={time}
                    ref={(el) => {
                      if (index === firstAvailableIndex && el) {
                        setTimeout(() => {
                          el.scrollIntoView({
                            block: "center",
                            behavior: "smooth",
                          });
                        }, 50);
                      }
                    }}
                    onClick={() => {
                      if (!disabled) {
                        onChange({ target: { name, value: time } });
                        setOpen(false);
                      }
                    }}
                    className={`px-3 py-2 text-sm ${
                      disabled
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "cursor-pointer hover:bg-blue-50"
                    }`}
                  >
                    {time}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {isInvalid && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CreateAppointmentModal
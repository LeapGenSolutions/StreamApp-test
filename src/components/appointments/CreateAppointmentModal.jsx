import { useState, useEffect } from "react";
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
  console.log("LOGGED IN DOCTOR FROM REDUX:", loggedInDoctor);
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMRNSearch = () => {
    if (!formData.mrn.trim()) {
      toast({
        title: "MRN Missing",
        description: "Please enter an MRN.",
        variant: "destructive",
        className:
          "border-l-4 border-yellow-500 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
      });
      return;
    }

    const targetMRN = formData.mrn.toLowerCase().trim();

    const match = patientsList.find(
      (p) => extractMRN(p).toLowerCase().trim() === targetMRN
    );

            if (!match) {
          toast({
            title: "Patient Not Found",
            description: "Invalid MRN or patient does not exist.",
            variant: "destructive",
            className:
              "border-l-4 border-red-600 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
          });

          setExistingPatient(null);

          // RESET ALL PATIENT FIELDS WHEN MRN IS INVALID
          setFormData((prev) => ({
            ...prev,
            first_name: "",
            middle_name: "",
            last_name: "",
            dob: "",
            gender: "",
            email: "",
            phone: "",
            ehr: "",
            // Keep the MRN input as-is so user can correct it
            mrn: prev.mrn,
          }));

          return;
        }

        setExistingPatient(match);
        const d = extractDetails(match);

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
          mrn: d.mrn || "",
        }));

        toast({
          title: "Patient Record Matched",
          description: "You may proceed to schedule the appointment.",
          variant: "success",
          className:
            "border-l-4 border-green-600 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
        });
          };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "Required";
    if (!formData.last_name.trim()) newErrors.last_name = "Required";
    if (!formData.dob.trim()) newErrors.dob = "Required";
    if (!formData.mrn.trim()) newErrors.mrn = "Required";
    if (!formData.appointment_date.trim())
      newErrors.appointment_date = "Required";
    if (!formData.time) newErrors.time = "Required";

    if (formData.appointment_date) {
  // Safe parsing for YYYY-MM-DD
  const [year, month, day] = formData.appointment_date.split("-");
  const selected = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selected < today) {
    newErrors.appointment_date = "Cannot select a past date";
  }
}


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertTo24Hour = (t) => {
    if (!t) return "";
    const d = new Date(`1970-01-01 ${t}`);
    return d.toTimeString().slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
        className:
          "border-l-4 border-yellow-500 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
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
        const patientRes = await fetch(`${BACKEND_URL}api/patients/add`, {
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

        const saved = await patientRes.json();
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
        specialization: resolvedSpecialization,
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

      const createdItem = await createAppointment(
        resolvedDoctorEmail,
        appointmentData
      );

      const savedAppointment =
        createdItem?.data?.[createdItem.data.length - 1];

      toast({
        title: "Success",
        description: "Appointment created successfully.",
        variant: "success",
        className:
          "border-l-4 border-blue-600 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
      });

      onSuccess(savedAppointment);
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
        className:
          "border-l-4 border-red-600 bg-white text-gray-900 shadow-md px-4 py-3 rounded-md",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-end items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const filled = Object.values(formData).some((v) => v);
          if (filled) setShowUnsavedConfirm(true);
          else onClose();
        }
      }}
    >
      <div
        className="bg-white shadow-xl rounded-xl w-full max-w-lg h-[70vh] mr-16 mt-10 mb-6 overflow-y-auto flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 bg-blue-600 rounded-t-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={18} /> Create Appointment
          </h2>
          <button onClick={onClose} className="text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <form className="px-5 py-4 space-y-5 bg-gray-50" onSubmit={handleSubmit}>
          <section className="bg-white border rounded-xl p-4">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <Clock size={16} /> Appointment Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Appointment Date *"
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                error={errors.appointment_date}
              />

              <ScrollableTimeDropdown
                label="Time *"
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
              />

              <Input
                label="Doctor Specialization"
                name="specialization"
                readOnly
                value={resolvedSpecialization}
                className="bg-gray-100"
              />

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  MRN *
                </label>

                <div className="flex gap-2">
                  <input
                    name="mrn"
                    value={formData.mrn}
                    onChange={handleChange}
                    className={`border rounded-md w-full p-2 text-sm ${
                      errors.mrn ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={handleMRNSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-1"
                  >
                    <Search size={16} /> Search
                  </button>
                </div>

                {errors.mrn && (
                  <p className="text-xs text-red-500 mt-1">{errors.mrn}</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4">
            <h3 className="text-md font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <User2 size={16} /> Patient Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
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
              />
              <Input
                type="date"
                label="Date of Birth *"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                error={errors.dob}
              />

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
              />
              <Input
                label="EHR"
                name="ehr"
                value={formData.ehr}
                onChange={handleChange}
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
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
  placeholder,
  readOnly,
  className = "",
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
      placeholder={placeholder}
      className={`border rounded-md w-full p-2 text-sm ${
        error ? "border-red-500 bg-red-50" : "border-gray-300"
      } ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

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

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setManualMode(false);
        }}
        className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm bg-white ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
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
            ⌨️ Enter time manually
          </div>

          {manualMode && (
            <div className="px-3 py-2 bg-gray-50 border-b">
              <input
                type="text"
                placeholder="07:45 PM or 19:45"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                className="border border-gray-300 rounded-md w-full p-2 text-sm mb-2"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="px-3 py-1 text-sm bg-gray-300 rounded-md"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange({ target: { name, value: manualValue } });
                    setManualMode(false);
                    setOpen(false);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {times.map((time) => (
            <div
              key={time}
              onClick={() => {
                onChange({ target: { name, value: time } });
                setOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
            >
              {time}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CreateAppointmentModal

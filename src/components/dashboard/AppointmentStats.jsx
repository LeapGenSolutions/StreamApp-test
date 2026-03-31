import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const isCancelledStatus = (status = "") => {
  const normalized = normalizeToken(status);
  return normalized === "cancelled" || normalized === "canceled";
};

const isInPersonType = (type = "") => {
  const normalized = normalizeToken(type);
  return normalized === "inperson" || normalized === "office";
};

const isVirtualType = (type = "") => {
  const normalized = normalizeToken(type);
  return (
    normalized === "virtual" ||
    normalized === "online" ||
    normalized === "telehealth" ||
    normalized === "video"
  );
};

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const AppointmentStats = ({ date: propDate }) => {
  const loggedInDoctor = useSelector((state) => state.me.me);
  const appointments = useSelector((state) => state.appointments.appointments);
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    inPersonAppointments: 0,
    virtualAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const doctorEmail = loggedInDoctor?.email || loggedInDoctor?.doctor_email || null;
  const doctorUniqueId =
    loggedInDoctor?.doctor_id || loggedInDoctor?.id || loggedInDoctor?.oid || null;
  const clinicName = loggedInDoctor?.clinicName || loggedInDoctor?.clinic_name || "";

  const localTodayKey = new Date().toLocaleDateString("en-CA");
  const utcTodayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (doctorEmail) {
      dispatch(fetchAppointmentDetails(doctorEmail, clinicName));
    }
  }, [dispatch, doctorEmail, clinicName]);

  const todayKey =
    typeof propDate === "string"
      ? propDate === utcTodayKey && localTodayKey !== utcTodayKey
        ? localTodayKey
        : propDate
      : propDate instanceof Date
      ? format(propDate, "yyyy-MM-dd")
      : localTodayKey;

  let formattedDate = "";
  {
    const [year, month, day] = todayKey.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    formattedDate = format(localDate, "MMMM d, yyyy");
  }

  useEffect(() => {
    setIsLoading(true);

    if (!Array.isArray(appointments) || (!doctorEmail && !doctorUniqueId)) {
      setStats({
        totalAppointments: 0,
        inPersonAppointments: 0,
        virtualAppointments: 0,
      });
      setIsLoading(false);
      return;
    }

    const normalizedDoctorId = String(doctorUniqueId ?? "").trim();
    const normalizedDoctorEmail = String(doctorEmail ?? "").trim().toLowerCase();
    const normalizedClinicName = normalizeText(clinicName);

    const todayAppointments = appointments.filter((app) => {
      let appDateKey = app.appointment_date ?? app.appointmentDate ?? app.date ?? "";

      if (typeof appDateKey === "string") {
        appDateKey = appDateKey.slice(0, 10);
      } else if (appDateKey instanceof Date) {
        appDateKey = format(appDateKey, "yyyy-MM-dd");
      } else {
        appDateKey = "";
      }

      const appDoctorIdValues = [app.doctorId, app.doctor_id]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
      const appDoctorEmailValues = [app.doctorEmail, app.doctor_email]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

      const appClinicName = normalizeText(
        app.clinicName ||
          app.clinic_name ||
          app.details?.clinicName ||
          app.details?.clinic_name ||
          app.original_json?.clinicName ||
          app.original_json?.clinic_name ||
          app.original_json?.details?.clinicName ||
          app.original_json?.details?.clinic_name
      );

      const isSameDoctorById =
        normalizedDoctorId && appDoctorIdValues.includes(normalizedDoctorId);
      const isSameDoctorByEmail =
        normalizedDoctorEmail && appDoctorEmailValues.includes(normalizedDoctorEmail);

      const matchesClinic = !normalizedClinicName || appClinicName === normalizedClinicName;

      return (
        appDateKey === todayKey &&
        Boolean(isSameDoctorById || isSameDoctorByEmail) &&
        matchesClinic &&
        !isCancelledStatus(app.status ?? app.appointment_status ?? app.appointmentStatus)
      );
    });

    const inPersonAppointments = todayAppointments.filter((app) =>
      isInPersonType(app.type ?? app.appointment_type ?? app.appointmentType)
    ).length;

    const virtualAppointments = todayAppointments.filter((app) =>
      isVirtualType(app.type ?? app.appointment_type ?? app.appointmentType)
    ).length;

    setStats({
      totalAppointments: todayAppointments.length,
      inPersonAppointments,
      virtualAppointments,
    });
    setIsLoading(false);
  }, [appointments, todayKey, doctorEmail, doctorUniqueId, clinicName]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[260px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { totalAppointments, inPersonAppointments, virtualAppointments } = stats;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-800">Today's Schedule</div>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
        <div className="bg-sky-100 p-3 rounded-full">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="8" fill="#3b82f6" opacity="0.15" />
            <path d="M8 7h8M8 11h8M8 15h4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="min-h-[84px] rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            Total Visits
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-800">{totalAppointments}</div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            In-Person
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">{inPersonAppointments}</div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Virtual
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-800">{virtualAppointments}</div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentStats;

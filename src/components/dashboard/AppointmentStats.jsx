import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { FaUserMd, FaVideo} from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";

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

  // Logged-in doctor identifiers (used for filtering)
  const DoctorEmail =
    loggedInDoctor?.email || loggedInDoctor?.doctor_email || null;

  const doctorUniqueId =
    loggedInDoctor?.doctor_id ||
    loggedInDoctor?.id ||
    loggedInDoctor?.oid ||
    null;

  // Always fetch appointments for the logged-in doctor when dashboard loads
  useEffect(() => {
    if (DoctorEmail) {
      dispatch(fetchAppointmentDetails(DoctorEmail));
    }
  }, [dispatch, DoctorEmail]);

  // Get today's date in local timezone (yyyy-MM-dd)
  const today = propDate || new Date().toLocaleDateString("en-CA");

  // Safely build a local Date from yyyy-MM-dd for display
  let formattedDate = "";
  if (typeof today === "string") {
    const [year, month, day] = today.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    formattedDate = format(localDate, "MMMM d, yyyy");
  } else {
    formattedDate = format(today, "MMMM d, yyyy");
  }

  // Compute stats only for the logged-in doctor
  useEffect(() => {
    setIsLoading(true);

    if (!Array.isArray(appointments) || (!DoctorEmail && !doctorUniqueId)) {
      setStats({
        totalAppointments: 0,
        inPersonAppointments: 0,
        virtualAppointments: 0,
      });
      setIsLoading(false);
      return;
    }

    const todayAppointments = appointments.filter((app) => {
      // normalize date to yyyy-MM-dd
      let appDate = app.appointment_date;
      if (typeof appDate === 'string') {
        try {
          appDate = format(parseISO(appDate), 'yyyy-MM-dd');
        } catch {
          // leave as original if parse fails
        }
      }

      const isToday = appDate === today;

      // robust doctor matching (same pattern as other components)
      const isSameDoctor =
        (doctorUniqueId &&
          (app.doctorId === doctorUniqueId ||
            app.doctor_id === doctorUniqueId)) ||
        (DoctorEmail &&
          (app.doctorEmail === DoctorEmail ||
            app.doctor_email === DoctorEmail));

      return isToday && isSameDoctor && app.status !== "cancelled";
    });

    const inPersonAppointments = todayAppointments.filter(
      (app) => app.type === "in-person"
    ).length;

    const virtualAppointments = todayAppointments.filter(
      (app) => app.type === "virtual" || app.type === "online"
    ).length;

    const totalAppointments = todayAppointments.length;
    setStats({
      totalAppointments,
      inPersonAppointments,
      virtualAppointments,
    });
    setIsLoading(false);
  }, [appointments, today, DoctorEmail, doctorUniqueId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 min-h-[220px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="h-10 w-1/4 bg-neutral-200 rounded mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-20 bg-neutral-200 rounded"></div>
          <div className="h-20 bg-neutral-200 rounded"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-neutral-200 rounded"></div>
          <div className="h-10 w-24 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { totalAppointments, inPersonAppointments, virtualAppointments } = stats;

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-800">Today's Schedule</div>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#3b82f6" opacity="0.15"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div className="flex items-center bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex-1">
          <div className="text-sm text-blue-700 font-medium">Total Appointments</div>
          <div className="text-3xl font-bold text-blue-900">{totalAppointments}</div>
          <div className="text-xs text-blue-500 mt-1">Scheduled for today</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col items-center justify-center bg-green-50 rounded-xl p-4 border border-green-100">
          <FaUserMd className="text-green-500 text-2xl mb-2" />
          <div className="text-2xl font-bold text-green-700">{inPersonAppointments}</div>
          <div className="text-sm text-green-700 font-medium">In-Person</div>
        </div>
        <div className="flex flex-col items-center justify-center bg-blue-50 rounded-xl p-4 border border-blue-100">
          <FaVideo className="text-blue-500 text-2xl mb-2" />
          <div className="text-2xl font-bold text-blue-700">{virtualAppointments}</div>
          <div className="text-sm text-blue-700 font-medium">Virtual</div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentStats;
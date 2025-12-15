import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { navigate } from "wouter/use-browser-location";
import { useParams } from "wouter";
import PatientInfoComponent from "../components/patients/PatientInfoComponent";
import SummaryOfPatient from "../components/patients/SummaryOfPatient";
import AppointmentModal from "../components/appointments/AppointmentModal";
import { useQuery } from "@tanstack/react-query";
import { fetchSummaryofSummaries } from "../api/summaryOfSummaries";
import { PageNavigation } from "../components/ui/page-navigation";
import { format, isToday } from "date-fns";
import { fetchCallHistory } from "../api/callHistory";
import { formatUsDate } from "../lib/dateUtils";

const PatientReports = () => {
  const { patientId } = useParams();

  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  const doctorEmail = useSelector(
    (state) => state.me.me.email?.toLowerCase()
  );

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [summaryOfSummariesData, setSummaryOfSummariesData] = useState(null);
  const [callHistory, setCallHistory] = useState([]);

  const patient = useMemo(
    () => patients.find((p) => String(p.patient_id) === patientId),
    [patients, patientId]
  );
  const { data: summaryData } = useQuery({
    queryKey: ["summaryOfSummaries", patientId],
    queryFn: () => fetchSummaryofSummaries(patientId),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (summaryData) setSummaryOfSummariesData(summaryData);
  }, [summaryData]);

  useEffect(() => {
    if (doctorEmail) {
      fetchCallHistory([doctorEmail])
        .then((res) => setCallHistory(res || []))
        .catch(() => setCallHistory([]));
    }
  }, [doctorEmail]);

  const getUnifiedDate = (appt) =>
    appt.appointment_date ||
    appt.date ||
    appt.timestamp ||
    appt.created_at ||
    null;

  const sortedAppointments = useMemo(() => {
    return appointments
      .filter((a) => String(a.patient_id) === String(patientId))
      .sort(
        (a, b) =>
          new Date(getUnifiedDate(b)) - new Date(getUnifiedDate(a))
      );
  }, [appointments, patientId]);

  const mergedAppointments = useMemo(() => {
    return sortedAppointments.map((appt) => {
      const match = callHistory.find(
        (h) => h.appointmentID === appt.id
      );

      const apptDateStr = getUnifiedDate(appt);
      const apptDateObj = apptDateStr ? new Date(apptDateStr) : null;

      const startTimeObj = match?.startTime
        ? new Date(match.startTime)
        : null;
      const endTimeObj = match?.endTime ? new Date(match.endTime) : null;

      let durationMinutes = null;
      if (startTimeObj && endTimeObj) {
        const diff = Math.round((endTimeObj - startTimeObj) / 60000);
        if (!Number.isNaN(diff) && diff >= 0) durationMinutes = diff;
      }

      const isCompleted = !!match?.endTime;

      return {
        appt,
        history: match || null,
        apptDateObj,
        startTimeObj,
        endTimeObj,
        durationMinutes,
        isCompleted,
      };
    });
  }, [sortedAppointments, callHistory]);

  const now = useMemo(() => new Date(), []);

  const nextUpcoming = useMemo(() => {
    return (
      mergedAppointments
        .map((m) => {
          const dateStr = m.appt.appointment_date;
          if (!dateStr) return null;

          const timeStr = m.appt.time || "00:00";
          const dt = new Date(`${dateStr}T${timeStr}:00`);

          const status = (m.appt.status || "").toLowerCase();
          const cancelled = status === "cancelled" || status === "canceled";

          if (isNaN(dt.getTime())) return null;
          if (cancelled || m.isCompleted) return null;
          if (dt <= now) return null;

          return { meta: m, dt };
        })
        .filter(Boolean)
        .sort((a, b) => a.dt - b.dt)[0] || null
    );
  }, [mergedAppointments, now]);

  const canJoin = useMemo(() => {
    if (!nextUpcoming) return false;

    const { meta, dt } = nextUpcoming;

    const status = (meta.appt.status || "").toLowerCase();
    const cancelled = status === "cancelled" || status === "canceled";

    return isToday(dt) && dt > now && !cancelled && !meta.isCompleted;
  }, [nextUpcoming, now]);

  const firstName = patient?.firstname || patient?.first_name || "";
  const lastName = patient?.lastname || patient?.last_name || "";
  const maskedPhone = patient?.phone
    ? `XXX-XXX-${String(patient.phone).slice(-4)}`
    : "Not Available";
  const maskedEmail = patient?.email
    ? `${patient.email[0]}***@${patient.email.split("@")[1]}`
    : "Not Available";
  const insuranceProvider = patient?.insurance_provider || "N/A";
  const insuranceId = patient?.insurance_id || "N/A";
  const lastVisit = useMemo(() => {
    const completed = mergedAppointments
      .filter((m) => m.isCompleted && m.apptDateObj)
      .sort((a, b) => b.apptDateObj - a.apptDateObj);

    if (completed.length > 0)
      return format(completed[0].apptDateObj, "MMM dd, yyyy");

    if (mergedAppointments.length > 0 && mergedAppointments[0].apptDateObj)
      return format(mergedAppointments[0].apptDateObj, "MMM dd, yyyy");

    return "Not Available";
  }, [mergedAppointments]);

  const rawDOB =
    patient?.dob ||
    patient?.date_of_birth ||
    patient?.birthDate ||
    patient?.details?.dob ||
    patient?.original_json?.details?.dob ||
    patient?.original_json?.original_json?.details?.dob;

const formattedDOB = formatUsDate(rawDOB);

  return (
    <div className="p-6 w-full space-y-6">
      <PageNavigation
        title="Patient Reports"
        subtitle={`${firstName} ${lastName}`}
        customTrail={[
          { href: "/patients", label: "Patients" },
          { href: `/patients/${patientId}`, label: "Patient Details" },
          { href: `/patients/${patientId}/reports`, label: "Reports", isLast: true },
        ]}
      />

      {/* Patient Info */}
      <div className="bg-white border rounded-xl shadow p-6">
        <PatientInfoComponent
        firstName={firstName}
        lastName={lastName}
        phone={maskedPhone}
        email={maskedEmail}
        insuranceProvider={insuranceProvider}
        insuranceId={insuranceId}
        lastVisit={lastVisit}
        totalAppointments={mergedAppointments.length}
        dob={formattedDOB}
      />


        <SummaryOfPatient summaryDataProp={summaryOfSummariesData} />
      </div>

      {nextUpcoming && (
        <div className="bg-white border rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">Upcoming Appointment</h3>

            {canJoin && (
              <button
                onClick={() =>
                  setSelectedAppointment(nextUpcoming.meta.appt)
                }
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Join Call
              </button>
            )}
          </div>

          <div className="text-sm text-gray-800 space-y-1">
            <p>
              <strong>Date:</strong>{" "}
              {format(nextUpcoming.dt, "MMM dd, yyyy")}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {nextUpcoming.meta.appt.time ?? "N/A"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="px-2 py-1 bg-gray-100 border rounded text-xs">
                {nextUpcoming.meta.appt.status}
              </span>
            </p>
          </div>
        </div>
      )}

      <AppointmentModal
        selectedAppointment={selectedAppointment}
        setSelectedAppointment={setSelectedAppointment}
      />

      <div className="space-y-4">
        {mergedAppointments.map((m) => {
          const { appt, apptDateObj, isCompleted, durationMinutes } = m;

          const dateLabel =
            apptDateObj && !isNaN(apptDateObj.getTime())
              ? format(apptDateObj, "MMM dd, yyyy")
              : "N/A";

          return (
            <div
              key={appt.id}
              className="bg-white border rounded-xl shadow p-5 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {dateLabel} at {appt.time ?? "N/A"}
                </p>

                <p className="text-sm text-gray-600">
                  Doctor:{" "}
                  <span className="font-medium">
                    {appt.doctor_name ||
                      appt.doctor_email?.split("@")[0]}
                  </span>
                </p>

               
                {isCompleted && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                    Completed
                  </span>
                )}
                {durationMinutes != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {durationMinutes} min
                  </p>
                )}
              </div>

              {isCompleted && (
                <button
                  title="View Documentation"
                  onClick={() => navigate(`/post-call/${appt.id}`)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatientReports
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
} from "lucide-react";
import { useSelector } from "react-redux";
import { navigate } from "wouter/use-browser-location";
import { useParams } from "wouter";
import PatientInfoComponent from "../components/patients/PatientInfoComponent";
import SummaryOfPatient from "../components/patients/SummaryOfPatient";
import AppointmentModal from "../components/appointments/AppointmentModal";
import { useQuery } from "@tanstack/react-query";
import { fetchSummaryofSummaries } from "../api/summaryOfSummaries";
import { PageNavigation } from "../components/ui/page-navigation";

const PatientReports = () => {
  const { patientId } = useParams();
  const patients = useSelector((state) => state.patients.patients);
  const appointments = useSelector((state) => state.appointments.appointments);
  const patient = patients.find((p) => String(p.patient_id) === patientId);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [summaryOfSummariesData, setSummaryOfSummariesData] = useState(null);

  const { data: summaryData } = useQuery({
    queryKey: ["summaryOfSummaries", patientId],
    queryFn: () => fetchSummaryofSummaries(patientId)
  });

  useEffect(() => {
    if (summaryData) {
      setSummaryOfSummariesData(summaryData);
    }
  }, [summaryData]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => String(patient?.patient_id) === String(a.patient_id))
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date || b.created_at) -
          new Date(a.timestamp || a.date || a.created_at)
      );
  }, [appointments, patient?.patient_id]);

  const now = new Date();
  let nextAppointment = filteredAppointments
    .filter((apt) => new Date(apt.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (!nextAppointment && filteredAppointments.length > 0) {
    nextAppointment = filteredAppointments[0];
  }

  const handleJoinCall = () => {
    setSelectedAppointment(nextAppointment);
  };

  if (!patient) {
    navigate("/patients");
    return;
  }

  const [firstName, lastName] = [
    patient?.firstname, patient?.lastname]
    || ["", ""];
  const maskedSSN = patient?.ssn ? `XXX-XX-${patient?.ssn.slice(-4)}` : "Not Available";

  const lastVisit = filteredAppointments.length > 0
    ? new Date(filteredAppointments[0].date).toLocaleDateString()
    : "Not Available";

  return (
    <div className="p-6 w-full">
      <PageNavigation 
        title="Patient Reports"
        subtitle={`${firstName} ${lastName}`}
        customTrail={[
          { href: "/patients", label: "Patients", icon: null },
          { href: `/patients/${patient.id}`, label: "Patient Details", icon: null },
          { href: `/patients/${patient.id}/reports`, label: "Reports", icon: null, isLast: true }
        ]}
      />
      <div className="mb-4">
        {/*<button
          onClick={() => navigate("/patients")}
          className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition"
        >
          Back
        </button>*/}
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-800 text-left">Patient Reports</h1>

      <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
        <PatientInfoComponent
          firstName={firstName}
          lastName={lastName}
          maskedSSN={maskedSSN}
          patient={patient}
          lastVisit={lastVisit}
          filteredAppointments={filteredAppointments}
        />
        <SummaryOfPatient summaryDataProp={summaryOfSummariesData} />
      </div>

      {nextAppointment && (
        <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Upcoming Appointment</h3>
            <button
              onClick={handleJoinCall}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Join Call
            </button>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Patient Name:</strong> {nextAppointment.full_name}</p>
            <p><strong>Date:</strong> {new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.time}</p>
            <p><strong>Status:</strong> <span className="inline-block px-2 py-0.5 rounded-full border border-gray-300 text-gray-800 text-xs bg-gray-100">{nextAppointment.status ?? "N/A"}</span></p>
          </div>
        </div>
      )}

      <AppointmentModal
        selectedAppointment={selectedAppointment}
        setSelectedAppointment={setSelectedAppointment}
      />

      {filteredAppointments.map((appointment) => {
        const appointmentId = appointment.id;
        const appointmentTime = appointment.date
          ? `${new Date(appointment.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })} at ${appointment.time ?? "N/A"}`
          : appointment.time ?? "Time not available";

        return (
          <div
            key={appointmentId}
            className="bg-white border rounded-xl shadow-lg w-full mb-8"
          >
            <button
              onClick={() => navigate(`/post-call/${appointmentId}`)}
              className="w-full text-left px-6 py-4 flex justify-between items-center bg-white-100 rounded-t font-medium text-lg"
            >
              <span>Appointment: {appointmentTime}</span>
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PatientReports;

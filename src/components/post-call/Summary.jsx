import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { fetchSummaryByAppointment } from "../../api/summary";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";
import { fetchSoapNotes } from "../../api/soap";
import { fetchSummaryofSummaries } from "../../api/summaryOfSummaries";
import LoadingCard from "./LoadingCard";
import SummaryOfPatient from "../patients/SummaryOfPatient";
import { fetchCallHistory } from "../../api/callHistory"; // ✅ Added :contentReference[oaicite:0]{index=0}

const extractReasonFromSoap = (soapText) => {
  const match = soapText.match(/Reason for Visit\s*[-–—:]?\s*(.*?)(\n|$)/i);
  return match ? match[1].trim() : null;
};

const Summary = ({ appointmentId, username, patientId }) => {
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const dispatch = useDispatch();

  const appointments = useSelector((state) => state.appointments.appointments);

  const {
    data: callHistoryList = [],
    isLoading: loadingCallHistory,
  } = useQuery({
    queryKey: ["call-history-summary", username],
    queryFn: () => fetchCallHistory([username]),  // ← fetch all calls for this provider
    enabled: !!username,
  });

  
  const callHistoryEntry = callHistoryList.find(
    (entry) => String(entry.appointmentID) === String(appointmentId)
  );


  const {
    data: summaryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["summary", appointmentId, username],
    queryFn: () =>
      fetchSummaryByAppointment(
        `${username}_${appointmentId}_summary`,
        username
      ),
  });

  const { data: soapData } = useQuery({
    queryKey: ["soap", appointmentId, username],
    queryFn: () =>
      fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  const { data: longitudinalData, isLoading: loadingLongitudinal } = useQuery({
    queryKey: ["longitudinal-summary", patientId],
    queryFn: () => fetchSummaryofSummaries(patientId),
    enabled: !!patientId,
  });

  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!isLoading && summaryData) {
      setSummary(summaryData.data.full_summary_text);
    }
  }, [summaryData, isLoading]);

  useEffect(() => {
    if (appointments.length === 0 && username) {
      dispatch(fetchAppointmentDetails(username));
    }
  }, [dispatch, username, appointments]);

  useEffect(() => {
    setSelectedAppointment(
      appointments.find(
        (appointment) => String(appointment.id) === String(appointmentId)
      ) || {}
    );
  }, [appointmentId, appointments]);

  if (isLoading || loadingCallHistory) {
    return <LoadingCard message="Summary’s stitching up… hang tight." />;
  }

  if (error) return <LoadingCard />;

  const reasonForVisit =
    selectedAppointment?.reason ||
    extractReasonFromSoap(soapData?.data?.soap_notes || "") ||
    "Not specified";

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> Call Summary
        </h3>

        <div className="text-sm text-neutral-700">
          <p className="mb-2">
            <span className="font-bold">Patient:</span>{" "}
            {selectedAppointment?.full_name}
          </p>

          
          <p className="mb-2 font-semibold text-gray-800">Call Time:</p>


          <p className="mb-2">
            <span className="font-bold">Start Time:</span>{" "}
            {callHistoryEntry?.startTime
              ? new Date(callHistoryEntry.startTime).toLocaleString()
              : "—"}
          </p>


          <p className="mb-2">
            <span className="font-bold">End Time:</span>{" "}
            {callHistoryEntry?.endTime
              ? new Date(callHistoryEntry.endTime).toLocaleString()
              : "—"}
          </p>


          <p className="mb-2">
            <span className="font-bold">Reason for Visit:</span>{" "}
            {reasonForVisit}
          </p>

          <p className="mb-2">
            <span className="font-bold">Summary from AI:<br /></span>{" "}
            {summary}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-6 mt-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> Longitudinal Summary
        </h3>

        {loadingLongitudinal ? (
          <LoadingCard message="Fetching longitudinal summary…" />
        ) : longitudinalData && longitudinalData.overall_summary ? (
          <SummaryOfPatient summaryDataProp={longitudinalData} />
        ) : (
          <div className="text-sm text-neutral-600">
            No longitudinal summary available for this patient.
          </div>
        )}
      </div>
    </>
  );
};

export default Summary
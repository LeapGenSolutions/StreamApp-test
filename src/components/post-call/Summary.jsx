import { useMemo } from "react";
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
import { fetchCallHistory } from "../../api/callHistory"; 

const extractReasonFromSoap = (soapText) => {
  const match = soapText.match(/Reason for Visit\s*[-–—:]?\s*(.*?)(\n|$)/i);
  return match ? match[1].trim() : null;
};

const getSummaryText = (summaryResponse) =>
  summaryResponse?.data?.full_summary_text ||
  summaryResponse?.full_summary_text ||
  summaryResponse?.summary ||
  "";

const getCallHistoryEntryForAppointment = (historyList = [], appointmentId) =>
  historyList.find(
    (entry) => String(entry.appointmentID) === String(appointmentId)
  );

const Summary = ({ appointmentId, username, patientId }) => {
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const dispatch = useDispatch();

  const appointments = useSelector((state) => state.appointments.appointments);

  const callHistoryQuery = useQuery({
    queryKey: ["call-history-summary", username, appointmentId],
    queryFn: () => fetchCallHistory([username]),  // ← fetch all calls for this provider
    enabled: !!username,
    refetchInterval: (query) => {
      const matchingEntry = getCallHistoryEntryForAppointment(
        query.state.data || [],
        appointmentId
      );

      return matchingEntry?.endTime ? false : 3000;
    },
    refetchIntervalInBackground: true,
  });

  const {
    data: callHistoryList = [],
    isLoading: loadingCallHistory,
  } = callHistoryQuery;

  const callHistoryEntry = getCallHistoryEntryForAppointment(
    callHistoryList,
    appointmentId
  );


  const summaryQuery = useQuery({
    queryKey: ["summary", appointmentId, username],
    queryFn: () =>
      fetchSummaryByAppointment(
        `${username}_${appointmentId}_summary`,
        username
      ),
    enabled: Boolean(username && appointmentId),
    refetchInterval: (query) => {
      const summaryText = getSummaryText(query.state.data);
      return summaryText ? false : 3000;
    },
    refetchIntervalInBackground: true,
  });

  const { data: summaryData, isLoading, isFetching, error } = summaryQuery;

  const { data: soapData } = useQuery({
    queryKey: ["soap", appointmentId, username],
    queryFn: () =>
      fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
    enabled: Boolean(username && appointmentId),
  });

  const { data: longitudinalData, isLoading: loadingLongitudinal } = useQuery({
    queryKey: ["longitudinal-summary", patientId],
    queryFn: () => fetchSummaryofSummaries(patientId),
    enabled: !!patientId,
  });

  const summary = useMemo(() => getSummaryText(summaryData), [summaryData]);

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

  const isSummaryPending = isLoading || (isFetching && !summary);

  if (isSummaryPending || loadingCallHistory) {
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

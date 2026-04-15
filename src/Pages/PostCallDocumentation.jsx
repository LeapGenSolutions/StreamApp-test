import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, User, Calendar as CalendarIcon, IdCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Transcript from "../components/post-call/Transcript";
import Summary from "../components/post-call/Summary";
import Soap from "../components/post-call/Soap";
import Billing from "../components/post-call/Billing";
import Reccomendations from "../components/post-call/Reccomendations";
import Clusters from "../components/post-call/Clusters";
import DoctorNotes from "../components/post-call/DoctorNotes";
import EmotionalConnect from "../components/post-call/EmotionalConnect";
import CallFeedback from "../components/post-call/PostCallFeedback";
import { fetchCallHistory, fetchDoctorsFromHistory } from "../api/callHistory";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { useAnyPermission, usePermission } from "../hooks/use-permission";

const PostCallDocumentation = ({ onSave }) => {
  const [docTab, setDocTab] = useState("summary");
  const { callId } = useParams();
  const [prevPage, setPrevPage] = useState(null);
  const dispatch = useDispatch();

  const appointments = useSelector((state) => state.appointments.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");
  const clinicName = useSelector((state) => state.me?.me?.clinicName || "");
  const currentUserEmail = useSelector((state) => state.me?.me?.email || "");
  const [resolvedUsername, setResolvedUsername] = useState(username || "");

  const canViewPostCall = usePermission("post_call.view_all", "read");
  const canViewSoap = usePermission("post_call.edit_soap_notes", "read");
  const canEditSoap = usePermission("post_call.edit_soap_notes", "write");
  const canViewBilling = usePermission("post_call.edit_billing_codes", "read");
  const canEditBilling = usePermission("post_call.edit_billing_codes", "write");
  const canViewDoctorNotes = useAnyPermission([
    { required: "post_call.add_doctor_notes", level: "read" },
    { required: "post_call.edit_doctor_notes", level: "read" },
  ]);
  const canCreateDoctorNotes = usePermission("post_call.add_doctor_notes", "write");
  const canEditDoctorNotes = usePermission("post_call.edit_doctor_notes", "write");
  const canManageFeedback = useAnyPermission([
    { required: "post_call.add_feedback", level: "write" },
    { required: "post_call.edit_feedback", level: "write" },
  ]);

  useEffect(() => {
    setResolvedUsername(username || "");
  }, [username]);

  useEffect(() => {
    if (resolvedUsername) {
      dispatch(fetchAppointmentDetails(resolvedUsername));
    }
  }, [dispatch, resolvedUsername]);

  useEffect(() => {
    let isActive = true;

    const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

    const resolveCallOwner = async () => {
      const candidateEmails = new Set(
        [
          username,
          currentUserEmail,
          selectedAppointment?.doctor_email,
          selectedAppointment?.doctorEmail,
          selectedAppointment?.userID,
        ]
          .map(normalizeEmail)
          .filter(Boolean)
      );

      try {
        if (clinicName) {
          const clinicUsers = await fetchDoctorsFromHistory(clinicName);
          (Array.isArray(clinicUsers) ? clinicUsers : []).forEach((user) => {
            const email = normalizeEmail(
              user?.doctor_email || user?.email || user?.id
            );
            if (email) {
              candidateEmails.add(email);
            }
          });
        }

        if (candidateEmails.size === 0) {
          return;
        }

        const history = await fetchCallHistory(Array.from(candidateEmails));
        const matchingEntry = (Array.isArray(history) ? history : [])
          .filter((entry) => String(entry?.appointmentID) === String(callId))
          .sort(
            (a, b) =>
              new Date(b?.endTime || b?.startTime || 0) -
              new Date(a?.endTime || a?.startTime || 0)
          )[0];

        const matchingUser = normalizeEmail(matchingEntry?.userID);

        if (isActive && matchingUser) {
          setResolvedUsername(matchingUser);
        }
      } catch {
        // Keep the route username if a better match cannot be resolved.
      }
    };

    resolveCallOwner();

    return () => {
      isActive = false;
    };
  }, [
    callId,
    clinicName,
    currentUserEmail,
    selectedAppointment?.doctor_email,
    selectedAppointment?.doctorEmail,
    selectedAppointment?.userID,
    username,
  ]);

  useEffect(() => {
    if (appointments?.length > 0) {
      const found = appointments.find((app) => String(app.id) === String(callId));
      setSelectedAppointment(found || null);
    }
  }, [appointments, callId]);

  useEffect(() => {
    document.title = "PostCallDocumentation - Seismic Connect";
    const state = window.history.state;
    if (state?.from) setPrevPage(state.from);
  }, []);

  const handleback = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/appointments");
  };

  const mrn = selectedAppointment
    ? selectedAppointment.mrn ??
      selectedAppointment.MRN ??
      selectedAppointment.patient_mrn ??
      null
    : null;

  const rawDob = selectedAppointment
    ? selectedAppointment.dob ??
      selectedAppointment.date_of_birth ??
      selectedAppointment.birthDate ??
      null
    : null;

  const dob = rawDob
    ? new Date(rawDob).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const firstName = selectedAppointment
    ? selectedAppointment.first_name ??
      selectedAppointment.firstName ??
      selectedAppointment.full_name?.split(" ")[0] ??
      null
    : null;

  const lastName = selectedAppointment
    ? selectedAppointment.last_name ??
      selectedAppointment.lastName ??
      selectedAppointment.full_name?.split(" ").slice(1).join(" ") ??
      null
    : null;

  const documentationTabs = [
    canViewPostCall && { id: "summary", label: "Summary" },
    canViewPostCall && { id: "transcript", label: "Transcript" },
    canViewSoap && { id: "soap", label: "SOAP" },
    canViewPostCall && { id: "recommendations", label: "Recommendations" },
    canViewBilling && { id: "billing", label: "Billing" },
    canViewPostCall && { id: "clusters", label: "Clusters" },
    canViewDoctorNotes && { id: "doctorNotes", label: "Doctor Notes" },
    canViewPostCall && { id: "emotionalConnect", label: "Emotional Connect" },
  ].filter(Boolean);

  useEffect(() => {
    if (documentationTabs.length === 0) {
      return;
    }

    const hasCurrentTab = documentationTabs.some((tab) => tab.id === docTab);
    if (!hasCurrentTab) {
      setDocTab(documentationTabs[0].id);
    }
  }, [docTab, documentationTabs]);

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        {prevPage !== "video-call" && (
          <button
            onClick={handleback}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </button>
        )}

        {canManageFeedback && (
          <div className="ml-auto">
            <CallFeedback username={resolvedUsername} appointmentId={callId} />
          </div>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Post-Call Documentation</CardTitle>
        </CardHeader>

        {selectedAppointment && (
          <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 mx-6 md:mx-auto md:max-w-5xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Patient Info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-gray-800">
              <p className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">MRN:</span>
                <span className="font-medium text-gray-900">{mrn ?? "—"}</span>
              </p>

              <p className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">DOB:</span>
                <span className="font-medium text-gray-900">{dob ?? "—"}</span>
              </p>

              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">First Name:</span>
                <span className="font-medium text-gray-900">{firstName ?? "—"}</span>
              </p>

              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Last Name:</span>
                <span className="font-medium text-gray-900">{lastName ?? "—"}</span>
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate(`/patients?mrn=${mrn}`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
              >
                View patient
              </button>
            </div>
          </div>
        )}

        <CardContent>
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {documentationTabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  docTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50"
                } transition`}
                onClick={() => setDocTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {docTab === "summary" && (
            <Summary
              username={resolvedUsername}
              appointmentId={callId}
              patientId={
                selectedAppointment?.patient_id ||
                selectedAppointment?.patient_Id ||
                selectedAppointment?.patientId ||
                selectedAppointment?.mrn ||
                selectedAppointment?.patient_mrn
              }
            />
          )}

          {docTab === "transcript" && (
            <Transcript username={resolvedUsername} appointmentId={callId} />
          )}

          {docTab === "soap" && (
            <Soap
              username={resolvedUsername}
              appointmentId={callId}
              appointment={selectedAppointment}
              canEdit={canEditSoap}
              canPostToAthena={canEditSoap}
            />
          )}

          {docTab === "recommendations" && (
            <Reccomendations username={resolvedUsername} appointmentId={callId} />
          )}

          {docTab === "billing" && (
            <Billing
              username={resolvedUsername}
              appointmentId={callId}
              canEdit={canEditBilling}
            />
          )}

          {docTab === "clusters" && (
            <Clusters username={resolvedUsername} appointmentId={callId} />
          )}

          {docTab === "doctorNotes" && (
            <DoctorNotes
              username={resolvedUsername}
              appointmentId={callId}
              canCreate={canCreateDoctorNotes}
              canEditExisting={canEditDoctorNotes}
            />
          )}

          {docTab === "emotionalConnect" && selectedAppointment && (
            <EmotionalConnect
              username={resolvedUsername}
              appointmentId={callId}
              appointment={selectedAppointment}
            />
          )}

        </CardContent>
      </Card>
    </>
  );
};

export default PostCallDocumentation;

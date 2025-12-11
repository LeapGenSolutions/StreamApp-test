import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Transcript from "../components/post-call/Transcript";
import Summary from "../components/post-call/Summary";
import Soap from "../components/post-call/Soap";
import Billing from "../components/post-call/Billing";
import Reccomendations from "../components/post-call/Reccomendations";
import { useParams } from "wouter";
import Clusters from "../components/post-call/Clusters";
import DoctorNotes from "../components/post-call/DoctorNotes";
import { navigate } from "wouter/use-browser-location";
import { useSearchParams } from "wouter";
import { ArrowLeft, User, Calendar as CalendarIcon, IdCard } from "lucide-react";
import EmotionalConnect from "../components/post-call/EmotionalConnect";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";

const PostCallDocumentation = ({ onSave }) => {
  const [docTab, setDocTab] = useState("summary");
  const { callId } = useParams();
  const [prevPage, setPrevPage] = useState(null);
  const dispatch = useDispatch();
  //const myEmail = useSelector((state) => state.me.me.email);
  const appointments = useSelector((state) => state.appointments.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");

  useEffect(() => {
    if (username) {
      dispatch(fetchAppointmentDetails(username));
    }
  }, [dispatch, username]);

  useEffect(() => {
    if (appointments?.length > 0) {
      const found = appointments.find(
        (app) => String(app.id) === String(callId)
      );
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

  return (
    <>
      {prevPage !== "video-call" && (
        <div className="mb-4">
          <button
            onClick={handleback}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
           text-white bg-blue-600 border border-blue-700 rounded-lg 
           hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </button>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Post-Call Documentation</CardTitle>
        </CardHeader>

        {selectedAppointment && (
          <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 mx-6 md:mx-auto md:max-w-5xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Patient Info
            </h2>

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
                <span className="font-medium text-gray-900">
                  {firstName ?? "—"}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Last Name:</span>
                <span className="font-medium text-gray-900">
                  {lastName ?? "—"}
                </span>
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
          <div className="flex space-x-2 mb-6 justify-center">
            {[
              "summary",
              "transcript",
              "SOAP",
              "recommendations",
              "billing",
              "clusters",
              "doctor notes",
              "emotional connect",
            ].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded font-medium ${
                  docTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white text-neutral-800 border border-b-0"
                } transition`}
                onClick={() => setDocTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {docTab === "summary" && (
            <Summary 
              username={username} 
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
            <Transcript username={username} appointmentId={callId} />
          )}

          {docTab === "SOAP" && (
            <Soap username={username} appointmentId={callId} />
          )}

          {docTab === "recommendations" && (
            <Reccomendations username={username} appointmentId={callId} />
          )}

          {docTab === "billing" && (
            <Billing username={username} appointmentId={callId} />
          )}

          {docTab === "clusters" && (
            <Clusters username={username} appointmentId={callId} />
          )}

          {docTab === "doctor notes" && (
            <DoctorNotes username={username} appointmentId={callId} />
          )}

          {docTab === "emotional connect" && selectedAppointment && (
            <EmotionalConnect
              username={username}
              appointmentId={callId}
              patientId={
                selectedAppointment.patient_id ||
                selectedAppointment.patient_Id
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PostCallDocumentation
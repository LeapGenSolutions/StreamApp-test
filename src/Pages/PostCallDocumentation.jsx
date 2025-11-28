import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
//import { Button } from "../components/ui/button";
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
import { ArrowLeft, Fingerprint, User } from "lucide-react"; // ADD THIS IMPORT
import EmotionalConnect from "../components/post-call/EmotionalConnect";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import PostCallFeedback from "../components/post-call/PostCallFeedback";



const PostCallDocumentation = ({ onSave }) => {
  const [docTab, setDocTab] = useState("summary");
  const { callId } = useParams();
  const [prevPage, setPrevPage] = useState(null);
  const dispatch = useDispatch();
  const myEmail = useSelector((state) => state.me.me.email);
  const appointments = useSelector((state) => state.appointments.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if ((!appointments || appointments.length === 0) && myEmail) {
        dispatch(fetchAppointmentDetails(myEmail));
        return;
    }

    if (appointments && appointments.length > 0) {
        const targetId = callId;
        const found = appointments.find(app => String(app.id) === String(targetId));
        if (found) setSelectedAppointment(found);
    }
  }, [dispatch, appointments, myEmail, callId]);

  useEffect(() => {
    document.title = "PostCallDocumentation - Seismic Connect";
    const state = window.history.state;
    if (state?.from) {
      setPrevPage(state.from);
    }
  }, []);

  // ✅ keep lowercase 'b'
  const handleback = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/appointments");
    }
  };

  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");

  // derive patient values safely for the patient info panel
  const patientId = selectedAppointment
    ? selectedAppointment.patient_id ?? selectedAppointment.patient_Id ?? selectedAppointment.patientId ?? null
    : null;
  const fullName = selectedAppointment
    ? selectedAppointment.full_name ?? selectedAppointment.fullName ?? `${selectedAppointment.first_name ?? ''} ${selectedAppointment.last_name ?? ''}`.trim()
    : null;
  const firstName = selectedAppointment
    ? selectedAppointment.first_name ?? selectedAppointment.firstName ?? fullName?.split(' ')[0] ?? null
    : null;
  const lastName = selectedAppointment
    ? selectedAppointment.last_name ?? selectedAppointment.lastName ?? fullName?.split(' ').slice(1).join(' ') ?? null
    : null;
  const ssn = selectedAppointment?.ssn ? `XXX-XX-${String(selectedAppointment.ssn).slice(-4)}` : null;

  return (
    <>
      {prevPage !== "video-call" && (
        <div className="mb-4">
          <button
            onClick={handleback} //  lowercase 'b'
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
           text-white bg-blue-600 border border-blue-700 rounded-lg 
           hover:bg-blue-700 transition-colors duration-200"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> {/* ✅ imported properly */}
            Go Back
          </button>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Post-Call Documentation</CardTitle>
        </CardHeader>
        {selectedAppointment && (
          <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 mx-6 md:mx-auto md:max-w-5xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Patient Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-gray-800">
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-500">Patient Id:</span> <span className="font-medium text-gray-900">{patientId ?? '—'}</span></p>
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-500">First Name:</span> <span className="font-medium text-gray-900">{firstName ?? '—'}</span></p>
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-500">Last Name:</span> <span className="font-medium text-gray-900">{lastName ?? '—'}</span></p>
              <p className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-500">SSN:</span> <span className="font-medium text-gray-900">{ssn ?? '—'}</span></p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
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
              "doctor feedback",
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
            <Summary username={username} appointmentId={callId} />
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
            <EmotionalConnect username={username} appointmentId={callId} patientId = {selectedAppointment.patient_id ?? selectedAppointment.patient_Id}/>
          )}

          {docTab === "doctor feedback" && (
            <PostCallFeedback username={username} appointmentId={callId} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PostCallDocumentation

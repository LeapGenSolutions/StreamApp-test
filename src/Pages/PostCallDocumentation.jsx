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


const PostCallDocumentation = ({
  onSave,
}) => {
  const [docTab, setDocTab] = useState("summary");
  const { callId } = useParams()
  const [prevPage, setPrevPage] = useState(null);

  useEffect(() => {
    document.title = "PostCallDocumentation - Seismic Connect";
    const state = window.history.state;
    if(state?.from){
      setPrevPage(state.from);
    }
  }, []);
  
  const handleback = () => {
    if(window.history.length > 1) {
      window.history.back();
    }else{
      navigate("/appointments");
    }
  }

  const searchParams = useSearchParams()[0];
  const username = searchParams.get("username");


  return (
    <>
    {prevPage !== "video-call" && <div className="mb-4">
        <button
          onClick={handleback}
          className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition"
        >
          Back
        </button>
      </div>}
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Post-Call Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6 justify-center">
          {['summary', 'transcript', 'SOAP', 'recommendations', 'billing', 'clusters', 'doctor notes'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded font-medium ${docTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-neutral-800 border border-b-0'} transition`}
              onClick={() => setDocTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {docTab === 'summary' && (
          <Summary username={username} appointmentId={callId} />
        )}

        {docTab === 'transcript' && (
          <Transcript username={username} appointmentId={callId} />
        )}
        {docTab === 'SOAP' && (
          <Soap username={username} appointmentId={callId} />
        )}

        {docTab === 'recommendations' && (
          <Reccomendations username={username} appointmentId={callId} />
        )}
        {docTab === 'billing' && (
          <Billing username={username} appointmentId={callId} />
        )}

        {docTab === 'clusters' && (
          <Clusters username={username} appointmentId={callId} />
        )}

        {docTab === 'doctor notes' && (
          <DoctorNotes username={username} appointmentId={callId} />
        )}

        <div className="flex justify-end mt-8">
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default PostCallDocumentation;
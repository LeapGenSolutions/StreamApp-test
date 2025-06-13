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



const PostCallDocumentation = ({
  onSave,
}) => {
  const [docTab, setDocTab] = useState("summary");
  const { callId } = useParams()

  useEffect(() => {
    document.title = "PostCallDocumentation - Seismic Connect";
  }, []);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Post-Call Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6 justify-center">
          {['summary', 'transcript', 'soap', 'recommendations', 'billing', 'clusters'].map(tab => (
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
          <Summary appointmentId={callId} />
        )}

        {docTab === 'transcript' && (
          <Transcript appointmentId={callId} />
        )}
        {docTab === 'soap' && (
          <Soap appointmentId={callId} />
        )}

        {docTab === 'recommendations' && (
          <Reccomendations appointmentId={callId} />
        )}
        {docTab === 'billing' && (
          <Billing appointmentId={callId} />
        )}
        {docTab === 'clusters' && (
          <Clusters appointmentId={callId} />
        )}

        <div className="flex justify-end mt-8">
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCallDocumentation;
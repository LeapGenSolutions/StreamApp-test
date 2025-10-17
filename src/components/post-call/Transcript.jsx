import { fetchTranscriptByAppointment } from "../../api/transcript";
import { useQuery } from "@tanstack/react-query";
import LoadingCard from "./LoadingCard";

const Transcript = ({ appointmentId, username }) => {


  const { data, isLoading, error } = useQuery({
    queryKey: ['transcript', appointmentId, username],
    queryFn: () => fetchTranscriptByAppointment(`${username}_${appointmentId}_transcription`, username)
  });

  let full_conversation = ""
  if (!isLoading && data) {
    full_conversation = data.data.full_conversation.split("\n").map((convo, index) => {
      const speaker = convo.split(":")[0]
      const conversation = convo.split(":")[1]
      return (
        <span key={index}>
          <strong>{speaker}:</strong>
          {conversation}
          <br />
        </span>
      )
    })
  }

  if (isLoading) {
    return <LoadingCard message="Processing clinical chatter… stay with us." />;
  }

  if(error){
    return <LoadingCard />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Call Transcript</h3>
        <div className="flex space-x-2">
        </div>
      </div>
      <div className="border rounded p-6 overflow-y-scroll text-neutral-700 max-h-[320px] whitespace-pre-wrap">
        {full_conversation}
      </div>
    </div>
  )
}

export default Transcript
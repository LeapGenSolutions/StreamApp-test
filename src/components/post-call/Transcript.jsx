import { Copy, Download } from "lucide-react"
import { Button } from "../ui/button"
import { fetchTranscriptByAppointment } from "../../api/transcript";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

const Transcript = ({ appointmentId }) => {

    const username = useSelector((state) => state.me.me.email)

    const { data, isLoading, error } = useQuery({
        queryKey: 'transcript',
        queryFn: () => fetchTranscriptByAppointment(`${username}_${appointmentId}_transcription`, username)
    });

    let full_conversation = ""
    if (!isLoading && data) {
        full_conversation = data.data.full_conversation.split("\n").map((convo) => {
            const speaker = convo.split(":")[0]
            const convseration = convo.split(":")[1]
            return (
                <>
                    <strong>{speaker}:</strong>{convseration}<br />
                </>
            )
        })
    }

    if (error) {
        return <div>Error while fetching the Transcripts....!!</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Call Transcript</h3>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
                    <Button variant="outline" size="sm"><Copy className="w-4 h-4 mr-1" /> Copy</Button>
                </div>
            </div>
            <div className="border rounded p-6 overflow-y-scroll text-neutral-700 max-h-[320px] whitespace-pre-wrap">
                {full_conversation}
            </div>
        </div>
    )
}

export default Transcript
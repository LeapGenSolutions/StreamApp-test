import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react"
import { fetchSummaryByAppointment } from "../../api/summary";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";
import LoadingCard from "./LoadingCard";

const Summary = ({ appointmentId, username }) => {

  const [selectedAppointment, setSelectedAppointment] = useState({})
  const dispatch = useDispatch()
  const appointments = useSelector((state) => state.appointments.appointments)

  const { data, isLoading, error } = useQuery({
    queryKey: ["summary", appointmentId, username],
    queryFn: () => fetchSummaryByAppointment(`${username}_${appointmentId}_summary`, username),
  })


  const [summary, setSummary] = useState("")

  useEffect(() => {
    if (!isLoading && data) {
      setSummary(data.data.full_summary_text)
    }
  }, [data, isLoading])

  useEffect(() => {
    if (appointments.length === 0 && username) {
      dispatch(fetchAppointmentDetails(username))
    }
  }, [dispatch, username, appointments])

  useEffect(() => {
    setSelectedAppointment(appointments.find((appointment) => appointment.id === appointmentId) || {})
  }, [appointmentId, appointments])

  // Handle loading state with animation and message
  if (isLoading) {
    return <LoadingCard message="Summary’s stitching up… hang tight." />;
  }

  // Error state handled in loadingCard.jsx
  if(error){
    return <LoadingCard />;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-6">
      <h3 className="font-medium text-blue-800 mb-2 flex items-center">
        <FileText className="w-5 h-5 mr-2" /> Call Summary
      </h3>
      <div className="text-sm text-neutral-700">
        <p className="mb-2"><span className="font-bold">Patient:</span> {selectedAppointment?.full_name}</p>
        <p className="mb-2"><span className="font-bold">Date & Time:</span> {new Date().toLocaleString()}</p>
        <p className="mb-2"><span className="font-bold">Reason for Visit:</span> {selectedAppointment?.reason}</p>
        <p className="mb-2"><span className="font-bold">Summary from AI:<br /></span> {summary}</p>
      </div>
    </div>
  )
}

export default Summary
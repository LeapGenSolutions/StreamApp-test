import { useEffect, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { DOCTOR_PORTAL_URL } from "../../constants";
import { FaCopy } from "react-icons/fa";
import { Link } from "wouter";

import EditAppointmentModal from "./EditAppointmentModal";
import DeleteAppointmentModal from "./DeleteAppointmentModal";
import CancelAppointmentModal from "./CancelAppointmentModal";
import { Pencil, Trash2, XCircle } from "lucide-react";
import { formatUsDate } from "../../lib/dateUtils";

const AppointmentModal = ({
  selectedAppointment,
  setSelectedAppointment,
  onAppointmentUpdated,
  onAppointmentDeleted,
}) => {
  const [joinLink, setJoinLink] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDOB, setShowDOB] = useState(false);

  useEffect(() => {
    if (selectedAppointment?.id) {
      const link = `${DOCTOR_PORTAL_URL}${selectedAppointment.id}`;
      setJoinLink(link);
      setIsOnline(false);
    }
  }, [selectedAppointment]);

  if (!selectedAppointment) return null;

 
  const rawDOB =
    selectedAppointment?.dob ||
    selectedAppointment?.date_of_birth ||
    selectedAppointment?.birthDate ||
    null;

  const formattedDOB = formatUsDate(rawDOB);

  const maskedDOB = "Hidden";


  const now = new Date();
  now.setSeconds(0, 0);

  const rawDate =
    selectedAppointment.appointment_date ||
    selectedAppointment.date ||
    selectedAppointment.appointmentDate;

  let apptDate = null;

  if (rawDate) {
    const normalized = rawDate.split("T")[0];
    apptDate = new Date(`${normalized}T00:00:00`);
  }

  let isFutureSlot = false;

  if (apptDate) {
    const apptDateTime = new Date(apptDate);

    const [h, m] = selectedAppointment.time?.split(":") || [];
    if (h && m) {
      apptDateTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }

    if (apptDate.toDateString() === now.toDateString()) {
      // Today: must check time
      isFutureSlot = apptDateTime > now;
    } else {
      // Future date
      isFutureSlot = apptDate > now;
    }
  }

  const isNotSeismified = !selectedAppointment.seismified;
  const isNotCancelled = selectedAppointment.status !== "cancelled";
  const isNotCompleted = selectedAppointment.status !== "completed";

  const canCancel =
    isFutureSlot && isNotSeismified && isNotCancelled && isNotCompleted;


  const formatTime = () => {
    try {
      if (!selectedAppointment.time) return "N/A";

      const [h, m] = selectedAppointment.time.split(":");
      const hour = parseInt(h, 10);
      const minute = m?.padStart(2, "0") || "00";
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = ((hour + 11) % 12) + 1;

      return `${displayHour}:${minute} ${ampm}`;
    } catch {
      return "N/A";
    }
  };

  const handleJoinClick = () => {
    const appt = selectedAppointment;
    setSelectedAppointment(null);

    const type = isOnline ? "online" : "inperson";

    navigate(
      `/meeting-room/${appt.id}?patient=${encodeURIComponent(appt.full_name)}&type=${type}`
    );
  };

  const handlePostCallClick = () => {
    const appt = selectedAppointment;
    setSelectedAppointment(null);

    navigate(`/post-call/${appt.id}?username=${appt.doctor_email}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md relative">

        
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Appointment Details</h1>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="text-gray-700 hover:text-blue-600 transition"
                title="Edit Appointment"
              >
                <Pencil size={20} strokeWidth={1.8} />
              </button>

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-yellow-600 hover:text-yellow-800 transition"
                  title="Cancel Appointment"
                >
                  <XCircle size={20} strokeWidth={1.8} />
                </button>
              )}

              {!selectedAppointment.seismified && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-500 hover:text-red-700 transition"
                  title="Delete Appointment"
                >
                  <Trash2 size={20} strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 text-gray-700">
            <p><span className="font-semibold">Appointment ID:</span> {selectedAppointment.id}</p>

            <p>
              <span className="font-semibold">Patient:</span>{" "}
              <Link
                to={`/patients/${selectedAppointment.patient_id}`}
                target="_blank"
                className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
              >
                {selectedAppointment.full_name}
              </Link>
            </p>

            <p><span className="font-semibold">Time:</span> {formatTime()}</p>

            <p>
              <span className="font-semibold">Seismic Status:</span>{" "}
              {selectedAppointment.seismified ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Seismified</span>
              ) : (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Not Seismified</span>
              )}
            </p>

            <p><span className="font-semibold">Status:</span> {selectedAppointment.status}</p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">DOB:</span>
              {showDOB ? (
                <>
                  <span>{formattedDOB}</span>
                  <button
                    onClick={() => setShowDOB(false)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Hide DOB
                  </button>
                </>
              ) : (
                <>
                  <span>{maskedDOB}</span>
                  <button
                    onClick={() => setShowDOB(true)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Show DOB
                  </button>
                </>
              )}
            </p>

            <p><span className="font-semibold">Doctor:</span> {selectedAppointment.doctor_name}</p>

            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-1">
                <input type="radio" checked={!isOnline} onChange={() => setIsOnline(false)} />
                <span>In-Person</span>
              </label>

              <label className="flex items-center space-x-1">
                <input type="radio" checked={isOnline} onChange={() => setIsOnline(true)} />
                <span>Online</span>
              </label>
            </div>
            {isOnline && (
              <>
                <p className="pt-2 font-semibold text-gray-700">Meeting Link:</p>
                <div className="flex w-full">
                  <input type="text" value={joinLink} readOnly className="flex-grow border border-gray-300 rounded-l-md px-4 py-2" />
                  <button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-r-md">
                    <FaCopy />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-right space-x-1">
            <button onClick={handleJoinClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">Join</button>

            <button
              onClick={handlePostCallClick}
              disabled={!selectedAppointment.seismified}
              className={`py-2 px-4 rounded font-medium ${
                selectedAppointment.seismified
                  ? "bg-zinc-600 hover:bg-zinc-700 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              Post Call Documentation
            </button>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setSelectedAppointment(updated);
            if (onAppointmentUpdated) onAppointmentUpdated(updated);
          }}
        />
      )}

      {showCancelModal && (
        <CancelAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            if (onAppointmentUpdated) {
              onAppointmentUpdated({ ...selectedAppointment, status: "cancelled" });
            }
            setSelectedAppointment(null);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            if (onAppointmentDeleted) onAppointmentDeleted(selectedAppointment);
            setSelectedAppointment(null);
          }}
        />
      )}
    </>
  );
};

export default AppointmentModal
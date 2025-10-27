import { useEffect, useState } from "react";

import { navigate } from "wouter/use-browser-location";
import { DOCTOR_PORTAL_URL } from "../../constants";
import { FaCopy } from "react-icons/fa";
import { Link } from "wouter";

const AppointmentModal = ({ selectedAppointment, setSelectedAppointment }) => {
  const [joinLink, setJoinLink] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (selectedAppointment) {
      const link = `${DOCTOR_PORTAL_URL}${selectedAppointment.id}`;
      setJoinLink(link);
      setIsOnline(true);
    }
  }, [selectedAppointment]);
  if (!selectedAppointment) return null;

  const handleJoinClick = () => {
    setSelectedAppointment(null);
    navigate(`/meeting-room/${selectedAppointment.id}?patient=${selectedAppointment.full_name}`);
  };

  const handlePostCallClick = () => {
    setSelectedAppointment(null);
    navigate(`/post-call/${selectedAppointment.id}?username=${selectedAppointment.doctor_email}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Appointment Details
        </h1>
        <div className="space-y-2 text-gray-700">
          <p>
            <span className="font-semibold">Appointment ID:</span>{" "}
            {selectedAppointment.id}
          </p>
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
          <p>
            <span className="font-semibold">Time:</span>{" "}
            {(() => {
                const [hourStr, minuteStr] = selectedAppointment.time.split(":");
                const hour = parseInt(hourStr, 10);
                const minute = minuteStr.padStart(2, "0");
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayHour = ((hour + 11) % 12) + 1; // converts 0 → 12, 13 → 1, etc.
                return `${displayHour}:${minute} ${ampm}`;
            })()}
          </p>
          <p>
            <span className="font-semibold">Seismic Status:</span>{" "}
            {selectedAppointment.seismified ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                Seismified
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                Not Seismified
              </span>
            )}
          </p>
          <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedAppointment.status}
          </p>
          <p>
            <span className="font-semibold">SSN:</span>{" "}
            {selectedAppointment.ssn}
          </p>
          <p>
            <span className="font-semibold">Doctor:</span>{" "}
            {selectedAppointment.doctor_name}
          </p>

          {/* Radio buttons */}
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="apptType"
                value="online"
                checked={isOnline}
                onChange={() => setIsOnline(true)}
              />
              <span>Online</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="apptType"
                value="inperson"
                checked={!isOnline}
                onChange={() => setIsOnline(false)}
              />
              <span>In-Person</span>
            </label>
          </div>

          {/* Meeting Link visible only if Online is selected */}
          {isOnline && (
            <>
              <p className="pt-2 font-semibold text-gray-700">Meeting Link:</p>
              <div className="flex w-full">
                <input
                  type="text"
                  value={joinLink}
                  readOnly
                  className="flex-grow border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-r-md"
                >
                  <FaCopy className="inline-block mr-1" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 text-right space-x-1">
          <button
            onClick={handleJoinClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Join
          </button>
          <button
            onClick={handlePostCallClick}
            disabled={!selectedAppointment.seismified}
            title={
              !selectedAppointment.seismified
                ? "Ready when your call wraps up — Artifacts awaken after your call"
                : "All Seismified — let’s go! Docs are live!"
            }
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
    </div>)
}

export default AppointmentModal
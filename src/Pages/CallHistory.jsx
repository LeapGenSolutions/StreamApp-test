import { useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink, CalendarDays, Clock, User } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery } from "@tanstack/react-query";
import { fetchCallHistory } from "../api/callHistory";
import { useDispatch, useSelector } from "react-redux";
import { bgColors } from "../constants/colors";
import { fetchDoctors } from "../redux/doctors-actions";

// --- Utility helpers ---
const getColorForDoctor = (userID) => {
  let hash = 0;
  for (let i = 0; i < userID.length; i++) {
    hash = userID.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
};

const normalizeDate = (d) => new Date(new Date(d).toDateString());

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
};

// --- Card component ---
const CallHistoryCard = ({ entry }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex justify-between items-start flex-wrap gap-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-gray-800">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <span className="font-semibold">Patient Name:</span> {entry.patientName}
      </div>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <span className="font-semibold">Dr Name:</span> {entry.fullName}
      </div>
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-500" />
        <span className="font-semibold">Date:</span> {entry.startTime?.split("T")[0]}
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="font-semibold">Start Time:</span>{" "}
        {entry.startTime
          ? new Date(entry.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""}
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="font-semibold">End Time:</span>{" "}
        {entry.endTime
          ? new Date(entry.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""}
      </div>
    </div>
    <div className="flex-shrink-0 mt-2 md:mt-0">
      <button
        onClick={() =>
          navigate(`/post-call/${entry.appointmentID}?username=${entry.userID}`)
        }
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  </div>
);

function CallHistory() {
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const doctorsCallHistoryData = useSelector((state) => state.doctors?.doctors || []);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const myEmail = useSelector((state) => state.me.me.email);

  // --- Fetch doctors list ---
  useEffect(() => {
    if (doctorsCallHistoryData.length === 0) {
      dispatch(fetchDoctors());
    }
  }, [dispatch, doctorsCallHistoryData.length]);

  const { data: callHistoryData } = useQuery({
    queryKey: ["call-history", selectedDoctors],
    queryFn: () => fetchCallHistory(selectedDoctors),
    enabled: selectedDoctors.length > 0,
  });

  useEffect(() => {
    if (doctorsCallHistoryData) {
      setAllDoctors(doctorsCallHistoryData);
    }
  }, [doctorsCallHistoryData]);

  useEffect(() => {
    if (myEmail) setSelectedDoctors([myEmail]);
  }, [myEmail]);

  // --- Dropdown close on outside click ---
  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setShowDoctorDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- Filtering logic (exact normalized match) ---
  const applyFilters = (patientValue = patientSearch, dataSource = callHistoryData) => {
    if (!dataSource) return;

    // Remove invisible/unicode/space characters
    const normalize = (text) =>
      text
        ?.toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .trim();

    const query = normalize(patientValue);

    let filtered = dataSource.filter((item) => {
      if (!item.patientName || item.patientName.toLowerCase() === "unknown")
        return false;

      const cleanName = normalize(item.patientName);
      const doctorMatch =
        selectedDoctors.length === 0 || selectedDoctors.includes(item.userID);

      const date = normalizeDate(item.startTime);
      const dateMatch =
        (!startDate || date >= normalizeDate(startDate)) &&
        (!endDate || date <= normalizeDate(endDate));

      // Exact normalized match only
      const patientMatch = !query ? true : cleanName === query;

      return doctorMatch && patientMatch && dateMatch;
    });

    // Sort newest first
    filtered.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    setFilteredData(filtered);
  };

  // --- Initial filter once data loads ---
  useEffect(() => {
    if (callHistoryData && callHistoryData.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callHistoryData]);

  // --- Submit: fetch fresh data then filter ---
  const handleSubmit = async () => {
    try {
      const freshData = await fetchCallHistory(selectedDoctors);
      applyFilters(patientSearch, freshData);
    } catch (err) {
      console.error("Error refetching call history:", err);
    }
  };

  const handleReset = async () => {
    setStartDate(null);
    setEndDate(null);
    setPatientSearch("");
    try {
      const freshData = await fetchCallHistory(selectedDoctors);
      applyFilters("", freshData);
    } catch (err) {
      console.error("Error resetting filters:", err);
    }
  };

  // --- Dropdown helpers ---
  const getDropdownLabel = () =>
    !selectedDoctors.length
      ? "Dr Name"
      : selectedDoctors.length === allDoctors.length
      ? "All Doctors"
      : `${selectedDoctors.length} selected`;

  const toggleDoctor = (id) =>
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  // --- Allow Enter key to trigger filter ---
  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const freshData = await fetchCallHistory(selectedDoctors);
      applyFilters(patientSearch, freshData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Call History Overview
        </h1>
        <p className="text-sm text-gray-500">
          Review previous consultations filtered by doctor, date, and patient.
        </p>
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Doctor dropdown */}
        <div className="flex flex-col">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDoctorDropdown((prev) => !prev)}
              className="flex items-center justify-between w-52 h-10 border border-gray-300 rounded-md px-4 text-sm bg-white shadow-sm hover:border-blue-500"
            >
              <span>{getDropdownLabel()}</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            {showDoctorDropdown && (
              <div className="absolute mt-2 w-64 border rounded-md bg-white shadow-lg max-h-80 overflow-y-auto z-50">
                <div className="p-2 sticky top-0 bg-white z-10">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search doctor"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div
                  className="px-3 py-2 border-b text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    setSelectedDoctors(
                      selectedDoctors.length === allDoctors.length
                        ? []
                        : allDoctors.map((d) => d.userID)
                    )
                  }
                >
                  {selectedDoctors.length === allDoctors.length
                    ? "Unselect All"
                    : "Select All"}
                </div>
                {allDoctors
                  .filter((doc) =>
                    doc?.fullName
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((doc) => {
                    const initials = getInitials(doc.fullName);
                    const color = getColorForDoctor(doc.userID);
                    return (
                      <label
                        key={doc.userID}
                        className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDoctors.includes(doc.userID)}
                          onChange={() => toggleDoctor(doc.userID)}
                          className="mr-3 accent-blue-600"
                        />
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-white font-semibold text-xs mr-3 ${color}`}
                        >
                          {initials}
                        </span>
                        <span className="text-gray-800">{doc.fullName}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-col">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(dates) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
            isClearable
            placeholderText="Select date range"
            className="h-10 border border-gray-300 rounded-md px-4 text-sm w-64"
          />
        </div>

        {/* Patient Search */}
        <input
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search patient name"
          className="h-10 border rounded-md px-4 text-sm w-64"
        />

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            className="h-10 bg-blue-600 text-white px-5 rounded-md text-sm hover:bg-blue-700"
          >
            Submit
          </button>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* --- Results --- */}
      <div className="space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((entry) => (
            <CallHistoryCard key={entry.appointmentID} entry={entry} />
          ))
        ) : (
          <div className="p-6 border border-gray-200 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
            No past video calls found. Try adjusting your filters above.
          </div>
        )}
      </div>
    </div>
  );
}

export default CallHistory

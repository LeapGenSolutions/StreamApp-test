import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AppointmentModal from "./AppointmentModal";
import CustomToolbar from "./CustomToolbar";
import { fetchAppointmentsByDoctorEmails, checkAppointments } from "../../api/callHistory";
import CreateAppointmentModal from "./CreateAppointmentModal";
import { useSelector } from "react-redux";
import CreateBulkAppointments from "./createBulkAppointments";

import { getColorFromName } from "../../constants/colors";

function capitalizeFirst(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const AppointmentCalendar = ({ onAdd, onAddBulk }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [doctorColorMap, setDoctorColorMap] = useState({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);

  const [currentView, setCurrentView] = useState("day");

  const loggedInDoctor = useSelector((state) => state.me.me);
  const allDoctors = useSelector((state) => state.doctors.doctors || []);

  useEffect(() => {
    if (onAdd) onAdd(() => setShowCreateModal(true));
    if (onAddBulk) onAddBulk(() => setShowBulkCreateModal(true));
  }, [onAdd, onAddBulk]);

  // Removed conflicting auto-select effect; DoctorMultiSelect handles this.

  const applySeismified = async (list) => {
    const ids = (Array.isArray(list) ? list : [])
      .map((a) => a?.id)
      .filter(Boolean);

    if (ids.length === 0) return list || [];

    try {
      const result = await checkAppointments(ids);
      const found = result?.found || [];

      return (list || []).map((a) => ({
        ...a,
        seismified: found.includes(a.id),
      }));
    } catch {
      return (list || []).map((a) => ({
        ...a,
        seismified: false,
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
      const userClinicForComparison = normalize(loggedInDoctor?.clinicName);
      const userClinicForApi = (loggedInDoctor?.clinicName || "").replace(/\s+/g, " ").trim();

      // If we are strictly filtering by clinic, we might not require selectedDoctors
      // But preserving existing logic: fetch for selected doctors, THEN filter by clinic

      if (selectedDoctors.length === 0 && !userClinicForComparison) {
        setAppointments([]);
        return;
      }

      // Pass clinicName to the API fetcher (if it supports it) or just fetch and filter client-side

      // Fetch all doctors from Redux to find matches for the clinic
      // We need to access the full list of doctors to filter by clinic
      // However, `rawDoctors` is not available in this scope. 
      // We should use `useSelector` to get `state.doctors.doctors`.

      // NOTE: This logic requires `allDoctors` to be available. 
      // I need to add `const allDoctors = useSelector((state) => state.doctors.doctors);` at top of component.

      // NOTE: Removed logic that auto-fetched all clinic doctors.
      // Now strictly respects `selectedDoctors` passed from parent/dropdown.
      let doctorsToFetch = selectedDoctors;

      console.log("DEBUG: AppointmentCalendar - selectedDoctors:", selectedDoctors);
      console.log("DEBUG: AppointmentCalendar - doctorsToFetch:", doctorsToFetch);

      const data = await fetchAppointmentsByDoctorEmails(doctorsToFetch, userClinicForApi);
      console.log("DEBUG: fetched data type:", typeof data, "isArray:", Array.isArray(data));
      console.log("DEBUG: fetched data sample:", data);

      let flatData = data;
      // Handle potential nested structure if data is array of day-objects
      if (Array.isArray(data) && data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
        console.log("DEBUG: Detected nested data structure, flattening...");
        flatData = data.flatMap(day => day.data || []);
      } else if (!Array.isArray(data) && data.data && Array.isArray(data.data)) {
        // Handle single object wrapper
        console.log("DEBUG: Detected single object wrapper, extracting data...");
        flatData = data.data;
      }

      const merged = await applySeismified(flatData);

      // console.log("DEBUG: AppointmentCalendar - loggedInDoctor.clinicName:", loggedInDoctor?.clinicName);

      // Create a Set of selected doctor emails for efficient lookup (normalized)
      const selectedDoctorEmails = new Set(
        selectedDoctors.map(email => (email || "").trim().toLowerCase())
      );

      const filtered = merged.filter(appt => {
        // 1. Filter by Clinic Name (Security/Scope)
        if (userClinicForComparison) {
          const apptClinic = normalize(
            appt.clinicName ||
            appt.details?.clinicName ||
            appt.original_json?.clinicName ||
            appt.original_json?.details?.clinicName
          );
          if (apptClinic !== userClinicForComparison) return false;
        } else {
          // Strict filter for legacy users (must have no clinic)
          if (appt.clinicName && appt.clinicName.trim() !== "") return false;
        }

        // 2. Filter by Selected Doctors (View preference)
        // If selectedDoctors is empty, we might show nothing or everything? 
        // Logic above says if empty -> return [], so we assume selectedDoctors has entries here.
        if (selectedDoctorEmails.size > 0) {
          const apptDoctorEmail = (appt.doctor_email || appt.doctorEmail || "").trim().toLowerCase();
          if (!selectedDoctorEmails.has(apptDoctorEmail)) return false;
        }

        return true;
      });

      setAppointments(filtered);
    };

    fetchData();
  }, [selectedDoctors, loggedInDoctor, allDoctors]);

  const events = appointments.map((appt) => {
    const doctorKey = (appt.doctor_email || appt.doctorEmail || "").trim().toLowerCase();
    const color = doctorColorMap[doctorKey] || getColorFromName(doctorKey);

    const [hours, minutes] = appt.time.split(":").map(Number);

    const start = new Date(`${appt.appointment_date}T00:00:00`);
    start.setHours(hours, minutes, 0);

    const end = new Date(start.getTime() + 30 * 60000);

    const seismicLabel = appt.seismified ? "Seismified" : "Not Seismified";

    return {
      title: `${appt.full_name} (${capitalizeFirst(appt.status)} • ${seismicLabel})`,
      start,
      end,
      allDay: false,
      color: color || "#4B5563",
      ...appt,
    };
  });

  const eventPropGetter = (event) => {
    let className = "";
    if (event.animate === "success") className = "appointment-pulse-success";
    if (event.animate === "fade") className = "fade-out";

    return {
      className,
      style: {
        backgroundColor: event.color,
        color: "white",
        borderRadius: "4px",
        border: "none",
        padding: "2px 4px",
      },
    };
  };

  /* ------------------------------------------------------------------
    EVENT CELL WITH RADIO ICON + VIEW-SPECIFIC LAYOUT + STATUS CAPITALIZATION
  ------------------------------------------------------------------ */
  const EventCell = ({ event, currentView }) => {
    const status = capitalizeFirst(event.status || "Unknown");
    const startTime = format(event.start, "h:mm");
    const endTime = format(event.end, "h:mm a");
    const timeRange = `${startTime} – ${endTime}`;

    const seismiText = event.seismified ? "Seismified" : "Not Seismified";
    const icon = event.seismified ? "◉" : "○";

    const tooltip = `${event.full_name} • ${status} • ${seismiText}\n${timeRange}`;

    if (currentView === "day") {
      return (
        <div title={tooltip}>
          <span style={{ marginRight: 6 }}>{icon}</span>
          <b>{event.full_name}</b>
          <span style={{ marginLeft: 6 }}>({seismiText})</span>
          <div style={{ fontSize: "11px", opacity: 0.9 }}>{timeRange}</div>
        </div>
      );
    }

    if (currentView === "week") {
      return (
        <div title={tooltip}>
          <span style={{ marginRight: 6 }}>{icon}</span>
          <b>{event.full_name}</b>
        </div>
      );
    }

    if (currentView === "month") {
      return (
        <div title={tooltip}>
          <span style={{ marginRight: 6 }}>{icon}</span>
          {event.full_name}
        </div>
      );
    }

    return (
      <div title={tooltip}>
        <span style={{ marginRight: 6 }}>{icon}</span>
        <b>{event.full_name}</b>
      </div>
    );
  };

  const handleDoctorUpdate = useCallback((ids, doctorList) => {
    setSelectedDoctors(ids);

    const colorMap = {};
    doctorList.forEach((doc) => {
      if (doc.email) {
        colorMap[doc.email.toLowerCase()] = doc.color;
      }
    });

    setDoctorColorMap(colorMap);
  }, []);

  const handleAppointmentUpdated = useCallback((updated) => {
    const [hours, minutes] = updated.time.split(":").map(Number);

    const start = new Date(`${updated.appointment_date}T00:00:00`);
    start.setHours(hours, minutes, 0);

    const end = new Date(start.getTime() + 30 * 60000);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === updated.id
          ? {
            ...a,
            ...updated,
            start,
            end,
            animate: "success",
          }
          : a
      )
    );
  }, []);

  const handleAppointmentDeleted = useCallback((deleted) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === deleted.id ? { ...a, animate: "fade" } : a
      )
    );

    setTimeout(() => {
      setAppointments((prev) => prev.filter((a) => a.id !== deleted.id));
    }, 200);
  }, []);

  const { components } = useMemo(() => ({
    components: {
      event: (props) => <EventCell {...props} currentView={currentView} />,
      toolbar: (props) => (
        <CustomToolbar
          {...props}
          selectedDoctors={selectedDoctors}
          onDoctorUpdate={handleDoctorUpdate}
          onAddAppointment={() => setShowCreateModal(true)}
          onAddBulkAppointment={() => setShowBulkCreateModal(true)}
        />
      ),
    }
  }), [currentView, selectedDoctors, handleDoctorUpdate]);
  // Note: dependencies are a bit tricky. CustomToolbar uses setDropdownOpen, setShowCreateModal etc.
  // These are state setters, so stable.
  // We include handleDoctorUpdate which is now a stable callback.

  return (
    <div style={{ height: "650px", margin: "20px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="day"
        view={currentView}
        onView={(v) => setCurrentView(v)}
        views={["day", "week", "month", "agenda"]}
        dayLayoutAlgorithm="no-overlap"
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectEvent={(event) => setSelectedAppointment(event)}
        eventPropGetter={eventPropGetter}
        formats={{
          eventTimeRangeFormat: () => "",
          eventTimeRangeStartFormat: () => "",
          eventTimeRangeEndFormat: () => "",
        }}
        components={components}
      />

      {selectedAppointment && (
        <AppointmentModal
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          onAppointmentUpdated={handleAppointmentUpdated}
          onAppointmentDeleted={handleAppointmentDeleted}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          username={loggedInDoctor?.email}
          doctorName={loggedInDoctor?.name}
          doctorSpecialization={loggedInDoctor?.specialization || "General"}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (newAppointment) => {
            setShowCreateModal(false);

            if (newAppointment) {
              const [updated] = await applySeismified([newAppointment]);

              const [hours, minutes] = updated.time.split(":").map(Number);
              const start = new Date(`${updated.appointment_date}T00:00:00`);
              start.setHours(hours, minutes, 0);
              const end = new Date(start.getTime() + 30 * 60000);

              const doctorKey = (updated.doctor_email || "").toLowerCase();
              const eventColor = doctorColorMap[doctorKey] || "#E5E7EB";

              const newEvent = {
                title: `${updated.full_name} (${updated.status} • ${updated.seismified ? "Seismified" : "Not Seismified"
                  })`,
                start,
                end,
                allDay: false,
                color: eventColor,
                ...updated,
              };

              setAppointments((prev) => [...prev, newEvent]);
            }
          }}
        />
      )}

      {showBulkCreateModal && (
        <CreateBulkAppointments
          onClose={() => setShowBulkCreateModal(false)}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar
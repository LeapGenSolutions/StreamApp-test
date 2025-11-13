import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AppointmentModal from "./AppointmentModal";
import CustomToolbar from "./CustomToolbar";
import { fetchAppointmentsByDoctorEmails, checkAppointments } from "../../api/callHistory";
import CreateAppointmentModal from "./CreateAppointmentModal";
import { useSelector } from "react-redux"; 

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const AppointmentCalendar = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [doctorColorMap, setDoctorColorMap] = useState({});
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  

  const loggedInDoctor = useSelector((state) => state.me.me);

  // add: seismified helper
  const applySeismified = async (list) => {
    const ids = (Array.isArray(list) ? list : []).map(a => a?.id).filter(Boolean);
    if (ids.length === 0) return list || [];
    try {
      const result = await checkAppointments(ids); // { found: [], notFound: [] }
      const found = result?.found || [];
      return (list || []).map(a => ({ ...a, seismified: found.includes(a.id) }));
    } catch (e) {
      console.error("Seismified check failed:", e);
      return (list || []).map(a => ({ ...a, seismified: false }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (selectedDoctors.length === 0) {
        setAppointments([]);
        return;
      }
      const data = await fetchAppointmentsByDoctorEmails(selectedDoctors);
      const merged = await applySeismified(data); // attach seismified flags
      setAppointments(merged);
    };
    fetchData();
  }, [selectedDoctors]);

  const events = appointments.map((appt) => {
    const doctorKey = (appt.doctor_email || "").trim().toLowerCase();
    const color = doctorColorMap[doctorKey];
    const [hours, minutes] = appt.time.split(":").map(Number);

    const start = new Date(
      new Date(appt.appointment_date + " CST").setHours(hours, minutes, 0)
    );
    const end = new Date(start.getTime() + 30 * 60000);

    const seismicLabel = appt.seismified ? "Seismified" : "Not Seismified";

    return {
      title: `${appt.full_name} (${appt.status} • ${seismicLabel})`, // include labels
      start,
      end,
      allDay: false,
      color: color || "#E5E7EB",
      ...appt,
    };
  });

  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      color: "white",
      borderRadius: "4px",
      border: "none",
      padding: "2px 4px",
    },
  });

  // add: custom cell with single time line + radio icon
  const EventCell = ({ event }) => {
    const icon = event.seismified ? "◉" : "○";
    const time = `${format(event.start, "h:mm")}–${format(event.end, "h:mm a")}`;
    return (
      <div
        title={`${event.full_name} • ${event.status || "Unknown"} • ${
          event.seismified ? "Seismified" : "Not Seismified"
        }`}
      >
        <span style={{ marginRight: 6 }}>{icon}</span>
        <span style={{ marginRight: 8 }}>{time}</span>
        <span>{`${event.full_name} (${event.status || "Unknown"} • ${
          event.seismified ? "Seismified" : "Not Seismified"
        })`}</span>
      </div>
    );
  };

  const handleDoctorUpdate = (ids, doctorList) => {
    setSelectedDoctors(ids);
    const colorMap = {};
    doctorList.forEach((doc) => {
      if (doc.email) {
        colorMap[doc.email.toLowerCase()] = doc.color;
      }
    });
    setDoctorColorMap(colorMap);
  };

  return (
    <div style={{ height: "600px", margin: "20px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="day"
        views={["day", "week", "agenda"]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={(event) => setSelectedAppointment(event)}
        eventPropGetter={eventPropGetter}
        // add: prevent double time display
        formats={{
          eventTimeRangeFormat: () => "",
          eventTimeRangeStartFormat: () => "",
          eventTimeRangeEndFormat: () => "",
        }}
        components={{
          event: EventCell,
          toolbar: (props) => (
            <CustomToolbar
              {...props}
              selectedDoctors={selectedDoctors}
              onDoctorUpdate={handleDoctorUpdate}
              isDropdownOpen={isDropdownOpen}
              setDropdownOpen={setDropdownOpen}
              onAddAppointment={() => setShowCreateModal(true)}
            />
          ),
        }}
      />

      {/* Existing Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
        />
      )}

      {/* New Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          username={loggedInDoctor?.email}
          doctorName={loggedInDoctor?.name}
          doctorSpecialization={loggedInDoctor?.specialization || "General"}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newAppointment) => {
            setShowCreateModal(false);

            if (newAppointment) {
              const [hours, minutes] = newAppointment.time.split(":").map(Number);
              const start = new Date(newAppointment.appointment_date + " CST");
              start.setHours(hours, minutes, 0);
              const end = new Date(start.getTime() + 30 * 60000);

              const newEvent = {
                title: `${newAppointment.full_name} (${newAppointment.status})`,
                start,
                end,
                allDay: false,
                color: "#22c55e",
                seismified: false, // optimistic default
                ...newAppointment,
              };

              setAppointments((prev) => [...prev, newEvent]);
            }

            if (selectedDoctors.length > 0) {
              fetchAppointmentsByDoctorEmails(selectedDoctors)
                .then(applySeismified) // ensure seismified flags after refresh
                .then((data) => setAppointments(data));
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AppointmentModal from "./AppointmentModal";
import CustomToolbar from "./CustomToolbar";
import { fetchAppointmentsByDoctorEmails, checkAppointments } from "../../api/callHistory";

const locales = { 
  "en-US": enUS,
};

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

  useEffect(() => {
    const fetchData = async () => {
      if (selectedDoctors.length === 0) {
        setAppointments([]);
        return;
      }

      // Fetch appointments for selected doctors
      const data = await fetchAppointmentsByDoctorEmails(selectedDoctors);
      const appointmentIDs = data.map((appt) => appt.id);

      // Check Seismified status from backend
      let seismifiedIDs = [];
      try {
        const result = await checkAppointments(appointmentIDs);
        seismifiedIDs = result?.found || [];
      } catch (error) {
        console.error("Seismified check failed:", error);
      }

      // Add seismified flag to each appointment
      const updatedData = data.map((appt) => ({
        ...appt,
        seismified: seismifiedIDs.includes(appt.id),
      }));

      setAppointments(updatedData);
    };

    fetchData();
  }, [selectedDoctors]);

  const events = appointments.map((appt) => {
    const doctorKey = (appt.doctor_email || "").trim().toLowerCase();
    const color = doctorColorMap[doctorKey];
    const start = new Date(`${appt.appointment_date}T${appt.time}:00`);
    const end = new Date(start.getTime() + 30 * 60000);

    const seismicLabel = appt.seismified ? "Seismified" : "Not Seismified";
    const statusLabel = appt.status || "Unknown";

    return {
      title: `${appt.full_name} (${statusLabel} • ${seismicLabel})`,
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

  const EventCell = ({ event }) => {
    // neutral "radio" icon: filled = seismified, hollow = not
    const icon = event.seismified ? "◉" : "○";
    const time =
      `${format(event.start, "h:mm")}–${format(event.end, "h:mm a")}`;

    // single line: icon + time + your existing title
    return (
      <div title={`${event.full_name} • ${event.status || "Unknown"} • ${event.seismified ? "Seismified" : "Not Seismified"}`}>
        <span style={{ marginRight: 6 }}>{icon}</span>
        <span style={{ marginRight: 8 }}>{time}</span>
        <span>{`${event.full_name} (${event.status || "Unknown"} • ${event.seismified ? "Seismified" : "Not Seismified"})`}</span>
      </div>
    );
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
        formats={{
          eventTimeRangeFormat: () => "",
          eventTimeRangeStartFormat: () => "",
          eventTimeRangeEndFormat: () => "",
        }}
        style={{ height: 500 }}
        onSelectEvent={(event) => { 
          setSelectedAppointment(event);
        }}
        eventPropGetter={eventPropGetter}
        components={{
          event: EventCell,
          toolbar: (props) => (
            <CustomToolbar
              {...props}
              selectedDoctors={selectedDoctors}
              onDoctorUpdate={handleDoctorUpdate}
              isDropdownOpen={isDropdownOpen}
              setDropdownOpen={setDropdownOpen}
            />
          ),
        }}
      />
      {selectedAppointment && (
        <AppointmentModal
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar
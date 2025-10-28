import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AppointmentModal from "./AppointmentModal";
import CustomToolbar from "./CustomToolbar";
import { fetchAppointmentsByDoctorEmails } from "../../api/callHistory";

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
      const data = await fetchAppointmentsByDoctorEmails(selectedDoctors);
      setAppointments(data);
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

    return {
      title: `${appt.full_name} (${appt.status})`,
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
        onSelectEvent={(event) => {
          setSelectedAppointment(event);
        }}
        eventPropGetter={eventPropGetter}
        components={{
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
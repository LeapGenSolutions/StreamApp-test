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
import CreateBulkAppointments from "./createBulkAppointments";

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
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);

  const loggedInDoctor = useSelector((state) => state.me.me);

  useEffect(() => {
    if (onAdd) onAdd(() => setShowCreateModal(true));
    if (onAddBulk) onAddBulk(() => setShowBulkCreateModal(true));
  }, [onAdd, onAddBulk]);

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
      if (selectedDoctors.length === 0) {
        setAppointments([]);
        return;
      }

      const data = await fetchAppointmentsByDoctorEmails(selectedDoctors);
      const merged = await applySeismified(data);
      setAppointments(merged);
    };

    fetchData();
  }, [selectedDoctors]);

  const events = appointments.map((appt) => {
    const doctorKey = (appt.doctor_email || "").trim().toLowerCase();
    const color = doctorColorMap[doctorKey];

    const [hours, minutes] = appt.time.split(":").map(Number);

    const start = new Date(`${appt.appointment_date}T00:00:00`);
    start.setHours(hours, minutes, 0);

    const end = new Date(start.getTime() + 30 * 60000);

    const seismicLabel = appt.seismified ? "Seismified" : "Not Seismified";

    return {
      title: `${appt.full_name} (${appt.status} • ${seismicLabel})`,
      start,
      end,
      allDay: false,
      color: color || "#E5E7EB",
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

  const EventCell = ({ event }) => {
    const icon = event.seismified ? "◉" : "○";
    const time = `${format(event.start, "h:mm")}–${format(event.end, "h:mm a")}`;

    return (
      <div title={`${event.full_name} • ${event.status}`}>
        <span style={{ marginRight: 6 }}>{icon}</span>
        <span style={{ marginRight: 8 }}>{time}</span>
        <span>
          {`${event.full_name} (${event.status} • ${
            event.seismified ? "Seismified" : "Not Seismified"
          })`}
        </span>
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


  const handleAppointmentUpdated = (updated) => {
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
  };

  const handleAppointmentDeleted = (deleted) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === deleted.id ? { ...a, animate: "fade" } : a
      )
    );

    setTimeout(() => {
      setAppointments((prev) => prev.filter((a) => a.id !== deleted.id));
    }, 200);
  };

  return (
    <div style={{ height: "650px", margin: "20px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="week"
        views={["day", "week", "month", "agenda"]}
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
              onAddBulkAppointment={() => setShowBulkCreateModal(true)}
            />
          ),
        }}
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
                title: `${updated.full_name} (${updated.status} • ${
                  updated.seismified ? "Seismified" : "Not Seismified"
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
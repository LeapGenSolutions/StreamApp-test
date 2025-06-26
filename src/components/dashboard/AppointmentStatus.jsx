import { format, parseISO } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FaCheckCircle, FaClock, FaHourglassHalf, FaUserTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";
import { APPOINTMENT_STATUS_COLORS } from "../../constants/colors";

const STATUS_CARDS = [
  {
    key: "completed",
    label: "Completed",
    color: "#D1FADF",
    text: "#039855",
    icon: <FaCheckCircle className="text-green-500" />,
  },
  {
    key: "inProgress",
    label: "In Progress",
    color: "#E0F2FE",
    text: "#2563EB",
    icon: <FaClock className="text-blue-500" />,
  },
  {
    key: "waiting",
    label: "Waiting",
    color: "#FEF9C3",
    text: "#EAB308",
    icon: <FaHourglassHalf className="text-yellow-500" />,
  },
  {
    key: "noShow",
    label: "No-Show",
    color: "#FEE2E2",
    text: "#EF4444",
    icon: <FaUserTimes className="text-red-500" />,
  },
];

const AppointmentStatus = ({ date }) => {
  
  const loggedInDoctor = useSelector((state) => state.me.me);
  const [isLoading, setIsLoading] = useState(true);
  const appointments = useSelector((state) => state.appointments.appointments);
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    waiting: 0,
    noShow: 0
  });
  const DoctorEmail = loggedInDoctor?.email;

  // Get today's date in local timezone (yyyy-MM-dd)
  const today = date || new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    if(appointments?.length === 0 && DoctorEmail) {
      dispatch(fetchAppointmentDetails(DoctorEmail));
    }
  }, [dispatch, appointments, DoctorEmail]);

  useEffect(() => {
    setIsLoading(true);
    const todayAppointments = appointments.filter((app) => {
          let appDate = app.date;
          if (typeof appDate === 'string') {
            try {
              appDate = format(parseISO(appDate), 'yyyy-MM-dd');
            } catch {
              appDate = app.date;
            }
          }
          return (
            appDate === today &&
            app.doctorId === loggedInDoctor?.id &&
            app.status !== 'cancelled'
          );
        });
    
    const completed = todayAppointments.filter(app => app.status === 'completed').length || 0;
    const inProgress = todayAppointments.filter(app => app.status === 'in-progress').length || 0;
    const waiting = todayAppointments.filter(app => app.status === 'waiting').length || 0;
    const noShow = todayAppointments.filter(app => app.status === 'no-show').length || 0;
    setStats({
      completed,
      inProgress,
      waiting,
      noShow
    });
    setIsLoading(false);
  }, [appointments, today, loggedInDoctor?.id]);
  
  

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 min-h-[220px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
        </div>
        <div className="h-32 w-full bg-neutral-200 rounded-full"></div>
      </div>
    );
  }

  const completed = stats?.completed || 0;
  const inProgress = stats?.inProgress || 0;
  const waiting = stats?.waiting || 0;
  const noShow = stats?.noShow || 0;

  const data = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Waiting", value: waiting },
    { name: "No-Show", value: noShow },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800">Status Overview</div>
        <div className="bg-green-100 p-2 rounded-full">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#22C55E" opacity="0.15"/><path d="M12 8v4l3 2" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-6">
        {STATUS_CARDS.map((card, idx) => (
          <div key={card.key} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: card.color }}>
            <div className="flex items-center gap-2 font-medium" style={{ color: card.text }}>
              {card.icon}
              {card.label}
            </div>
            <div className="text-lg font-bold" style={{ color: card.text }}>
              {data[idx].value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={APPOINTMENT_STATUS_COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppointmentStatus;


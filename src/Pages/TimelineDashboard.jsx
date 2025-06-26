import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PageNavigation } from "../components/ui/page-navigation";
import {
  Clock,
  Calendar,
  User,
  Video,
  MapPin,
  CheckCircle,
  AlertCircle,
  HourglassIcon,
  UserX,
  Activity
} from "lucide-react";
import './TimelineDashboard.css';
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { format, parseISO } from "date-fns";

export function TimelineDashboard() {
  const isLoading = false;
  const loggedInDoctor = useSelector((state) => state.me.me);
  const appointments = useSelector((state) => state.appointments.appointments);
  const dispatch = useDispatch();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [time, setTime] = useState(new Date("2025-06-23").toLocaleTimeString());
  const [dashboardData, setDashBoard] = useState({
    todaysAppointments: 0,
    statusCounts: { completed: 0, waiting: 0 },
    providers: []
  });

  useEffect(() => {
    if (appointments?.length === 0 && loggedInDoctor?.email) {
      dispatch(fetchAppointmentDetails(loggedInDoctor.email));
    }
  }, [dispatch, appointments, loggedInDoctor?.email]);
  

  useEffect(() => { 
    const today = new Date().toLocaleDateString("en-CA");
    const todaysAppointmentsFiltered = appointments.filter((app) => {
      let appDate = app.appointment_date;
      if (typeof appDate === 'string') {
        try {
          appDate = format(parseISO(appDate), 'yyyy-MM-dd');
        } catch {
          appDate = app.date;
        }
      }
      return (
        appDate === today &&
        (app.doctorId === loggedInDoctor?.id) &&
        app.status !== 'cancelled'
      );
    });
    
    setTodayAppointments(todaysAppointmentsFiltered);

    const completed = todaysAppointmentsFiltered.filter(app => app.status === 'completed' && app.time < time).length;
    const waiting = todaysAppointmentsFiltered.filter(app => 
      (app.status === 'waiting' || app.status === "in-progress") && app.time < time
    ).length;

    const providers = Array.from(new Set(todaysAppointmentsFiltered.map(app => app.providerName || app.doctorName)))
      .map(name => ({ name }));

    setDashBoard({
      todaysAppointments: todaysAppointmentsFiltered.length,
      statusCounts: { completed, waiting },
      providers
    });
  }, [appointments, loggedInDoctor, time]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="timeline-dashboard">
        <div className="timeline-skeleton">
          <div className="timeline-skeleton-line w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="timeline-skeleton-circle"></div>
                <div className="flex-1 space-y-2">
                  <div className="timeline-skeleton-line"></div>
                  <div className="timeline-skeleton-line w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "waiting":
        return <HourglassIcon className="w-5 h-5 text-yellow-600" />;
      case "no-show":
        return <UserX className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="timeline-dashboard">
      <PageNavigation 
        title="Timeline Dashboard"
        subtitle="View and manage today's appointments"
        showDate={true}
      />

      <div className="timeline-stats-grid">
        <Card className="timeline-stat-card blue">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.todaysAppointments || 0}
                </p>
                <p className="timeline-stat-label">Today's Total</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card green">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.statusCounts.completed || 0}
                </p>
                <p className="timeline-stat-label">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card yellow">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.statusCounts.waiting || 0}
                </p>
                <p className="timeline-stat-label">Waiting</p>
              </div>
              <HourglassIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="timeline-stat-card purple">
          <CardContent className="p-6">
            <div className="timeline-stat-content">
              <div>
                <p className="timeline-stat-number">
                  {dashboardData?.providers.length || 0}
                </p>
                <p className="timeline-stat-label">Active Providers</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="timeline-main-card">
        <CardContent className="p-6">
          <div className="timeline-header">
            <h2 className="timeline-title">Today's Schedule Timeline</h2>
          </div>

          <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-items">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="timeline-item">
                  <div className={`timeline-dot ${appointment.status.replace('-', '-')}`}>
                    {getStatusIcon(appointment.status)}
                  </div>

                  <Card className="timeline-appointment-card">
                    <CardContent className="p-4">
                      <div className="timeline-appointment-header">
                        <div className="timeline-appointment-meta">
                          <div className="timeline-time">{appointment.time}</div>
                          <Badge className={`timeline-status-badge ${appointment.status.replace('-', '-')}`}>
                            {appointment.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="timeline-type-badge">
                            {appointment.type === "virtual" ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            <span>{appointment.type}</span>
                          </Badge>
                        </div>
                        <div className="timeline-duration">
                          {appointment?.duration !== null ? "--" : appointment?.duration + "min" }
                        </div>
                      </div>

                      <div className="timeline-appointment-details">
                        <div className="timeline-detail-section">
                          <p className="timeline-detail-label">Patient</p>
                          <p className="timeline-detail-value">{appointment.full_name}</p>
                        </div>
                        <div className="timeline-detail-section">
                          <p className="timeline-detail-label">Provider</p>
                          <p className="timeline-detail-value">{appointment.doctor_name}</p>
                          <p className="timeline-detail-subtitle">{appointment.specialization}</p>
                        </div>
                      </div>

                      {appointment.status === "in-progress" && (
                        <div className="timeline-active-session">
                          <div className="timeline-active-indicator">
                            <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                            <span className="timeline-active-text">Currently in session</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimelineDashboard;

import { useEffect } from "react";
import WelcomeCard from "../components/dashboard/WelcomeCard";
import AppointmentStats from "../components/dashboard/AppointmentStats";
import AppointmentStatus from "../components/dashboard/AppointmentStatus";
import ProviderWorkload from "../components/dashboard/ProviderWorkload";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { useDispatch, useSelector } from "react-redux";

function Dashboard() {
  const dispatch = useDispatch()
  const myEmail = useSelector((state) => state.me.me.email)
  const appointments = useSelector((state) => state.appointments.appointments)

  useEffect(() => {
    if (appointments?.length === 0 && myEmail) {
      dispatch(fetchAppointmentDetails(myEmail));
    }
  }, [dispatch, appointments, myEmail])

  useEffect(() => {
    document.title = "Dashboard - Seismic Connect";
  }, []);

  return (
    <div className="space-y-6">
      <WelcomeCard />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppointmentStats />
        <AppointmentStatus />
        <ProviderWorkload />
      </div>
    </div>
  );
}

export default Dashboard;

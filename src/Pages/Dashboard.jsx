import { useEffect } from "react";
import WelcomeCard from "../components/dashboard/WelcomeCard";
import AppointmentStats from "../components/dashboard/AppointmentStats";
import AppointmentStatus from "../components/dashboard/AppointmentStatus";
import ProviderWorkload from "../components/dashboard/ProviderWorkload";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { useDispatch, useSelector } from "react-redux";

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Dashboard() {
  const dispatch = useDispatch();
  const loggedInDoctor = useSelector((state) => state.me.me);
  const myEmail = loggedInDoctor?.email;
  const todayISO = toISODate(new Date());

  useEffect(() => {
    if (myEmail) {
      dispatch(fetchAppointmentDetails(myEmail, loggedInDoctor?.clinicName));
    }
  }, [dispatch, myEmail, loggedInDoctor?.clinicName]);

  useEffect(() => {
    document.title = "Dashboard - Seismic Connect";
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <WelcomeCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppointmentStats date={todayISO} />
        <AppointmentStatus date={todayISO} />
        <ProviderWorkload date={todayISO} />
      </div>
    </div>
  );
}

export default Dashboard;

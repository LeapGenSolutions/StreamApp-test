import { useEffect } from "react";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { PageNavigation } from "../components/ui/page-navigation";


function Appointments() {
 useEffect(() => {
   document.title = "Appointments - Seismic Connect";
 }, []);


 const dispatch = useDispatch();
 const myEmail = useSelector((state) => state.me.me.email);
 const appointments = useSelector((state) => state.appointments.appointments);


 const hasFetchedOnce = useSelector(
   (state) => state.appointments.hasFetchedOnce
 );


 useEffect(() => {
   // existing condition + minimal guard added
   if (!appointments?.length && myEmail && !hasFetchedOnce) {
     dispatch(fetchAppointmentDetails(myEmail));
   }
 }, [dispatch, appointments, myEmail, hasFetchedOnce]);


 return (
   <div className="space-y-6 px-4">
     <PageNavigation
       title="Appointments"
       subtitle="Manage all appointments and schedules"
       showBackButton={true}
     />


     <AppointmentCalendar />
   </div>
 );
}


export default Appointments
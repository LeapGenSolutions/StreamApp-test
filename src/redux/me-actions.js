import { myActions } from "./me-slice";
import { fetchDoctorsFromHistory } from "../api/callHistory";

const setMyDetails = (details) => {
  return async (dispatch) => {
    const email = details.email?.toLowerCase();

    // fetch doctor metadata from doctors container
    let doctors = [];
    try {
      doctors = await fetchDoctorsFromHistory();
    } catch (err) {
      console.error("Failed to load doctor metadata:", err);
    }

    // find doctor by email
    const doctorDoc = doctors.find(
      (doc) =>
        doc.doctor_email?.toLowerCase() === email ||
        doc.id?.toLowerCase() === email
    );

    // store final doctor metadata into Redux
    if(doctorDoc?.profileComplete===true){
      dispatch( 
        myActions.setMyself({
          ...details,
          email,

          doctor_name: doctorDoc?.doctor_name || doctorDoc?.firstName + " " + doctorDoc?.lastName,
          doctor_id: doctorDoc?.doctor_id || doctorDoc?.id,
          doctor_email: doctorDoc?.doctor_email,
          specialization: doctorDoc?.specialization || doctorDoc?.specialty,
          given_name: doctorDoc?.firstName + " " + doctorDoc?.lastName,
          family_name: doctorDoc?.firstName + " " + doctorDoc?.lastName,
          name: doctorDoc?.firstName + " " + doctorDoc?.lastName,
          fullName: doctorDoc?.firstName + " " + doctorDoc?.lastName,
          role:[ doctorDoc?.role],
          roles:[ doctorDoc?.roles],
          specialty: doctorDoc?.specialty || doctorDoc?.specialization,
        })
      );
    }else{
      dispatch(
        myActions.setMyself({
          ...details,
          email,

          doctor_name: doctorDoc?.doctor_name,
          doctor_id: doctorDoc?.doctor_id,
          doctor_email: doctorDoc?.doctor_email,
          specialization: doctorDoc?.specialization,
        })
      );
    }
  };
};

export default setMyDetails;
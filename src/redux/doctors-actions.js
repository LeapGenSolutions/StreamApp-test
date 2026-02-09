import { fetchDoctorsFromHistory } from '../api/callHistory';
import { doctorsActions } from './doctors-slice';

export const fetchDoctors = (clinicName) => {
  return async (dispatch) => {
    try {
      const doctorsData = await fetchDoctorsFromHistory(clinicName);

      // Strict Isolation for Legacy Users (No clinicName)
      // If no clinicName is provided (legacy user), we must ONLY show other doctors
      // who also have NO clinicName.
      let filteredDoctors = doctorsData;
      if (!clinicName) {
        filteredDoctors = doctorsData.filter(doc => !doc.clinicName || doc.clinicName.trim() === "");
      }

      dispatch(doctorsActions.setDoctorsFromHistory(filteredDoctors));
    } catch (error) {
      throw new Error('Could not fetch doctors from history!');
    }
  };
};

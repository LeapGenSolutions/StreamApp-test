import { fetchDoctorsFromHistory } from '../api/callHistory';
import { doctorsActions } from './doctors-slice';

export const fetchDoctors = () => {
  return async (dispatch) => {
    try {
      const doctorsData = await fetchDoctorsFromHistory();
      dispatch(doctorsActions.setDoctorsFromHistory(doctorsData));
    } catch (error) {
      throw new Error('Could not fetch doctors from history!');
    }
  };
};

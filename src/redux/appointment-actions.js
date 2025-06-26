import { BACKEND_URL } from "../constants";
import { appointmentActions } from "./appointment-slice";

export const fetchAppointmentDetails = (email) => {
    return async (dispatch) => {
        const fetchAppointments = async () => {
            const response = await fetch(
                `${BACKEND_URL}api/appointments/${email}`
            );

            if (!response.ok) {
                throw new Error('Could not fetch appointment data!');
            }

            const data = await response.json();
            return data
        }

        try {
            const appointmentData = await fetchAppointments()
            dispatch(appointmentActions.setAppointments(appointmentData))
        } catch (error) {
            throw new Error('Could not fetch appointment data!');
        }
    }
}
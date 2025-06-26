import { BACKEND_URL } from "../constants";
import { patientActions } from "./patients-slice";

export const fetchPatientsDetails = () => {
    return async (dispatch) => {
        const fetchPatients = async () => {
            const response = await fetch(
                `${BACKEND_URL}/api/patients`
            );

            if (!response.ok) {
                throw new Error('Could not fetch appointment data!');
            }

            const data = await response.json();

            return data;
        }

        try {
            const patientsData = await fetchPatients()
            dispatch(patientActions.setPatients(patientsData))
        } catch (error) {
            throw new Error('Could not fetch appointment data!');
        }
    }
}
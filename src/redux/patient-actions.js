import { BACKEND_URL } from "../constants";
import { patientActions } from "./patients-slice";

export const fetchPatientsDetails = (clinicName) => {
    return async (dispatch) => {
        const fetchPatients = async () => {
            let url = `${BACKEND_URL}/api/patients`;
            if (clinicName) {
                url += `?clinicName=${encodeURIComponent(clinicName)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Could not fetch appointment data!');
            }

            const data = await response.json();

            // Strict Isolation for Legacy Users (No clinicName)
            if (!clinicName) {
                // The backend returns ALL patients if no clinicName is sent.
                // We must filter client-side to keep only those with NO clinicName.
                return data.filter(p => !p.clinicName || p.clinicName.trim() === "");
            }

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
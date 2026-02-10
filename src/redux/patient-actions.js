import { BACKEND_URL } from "../constants";
import { patientActions } from "./patients-slice";


export const fetchPatientsDetails = (clinicName) => {
    return async (dispatch) => {
        try {
            const trimmedClinic = clinicName ? clinicName.replace(/\s+/g, " ").trim() : "";
            let url = `${BACKEND_URL}/api/patients`;
            if (trimmedClinic) {
                url += `?clinicName=${encodeURIComponent(trimmedClinic)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Could not fetch appointment data!');
            }

            const data = await response.json();

            // Strict Isolation for Legacy Users (No clinicName)
            if (!trimmedClinic) {
                // The backend returns ALL patients if no clinicName is sent.
                // We must filter client-side to keep only those with NO clinicName.
                const filteredData = data.filter(p => !p.clinicName || p.clinicName.trim() === "");
                dispatch(patientActions.setPatients(filteredData));
                return filteredData;
            }

            dispatch(patientActions.setPatients(data));
            return data;

            return data;
        }

        catch (error) {
            console.error("Error fetching patients:", error);
            throw error;
        }


    }
}
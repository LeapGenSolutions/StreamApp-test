import { patientActions } from "./patients-slice";

export const fetchPatientsDetails = () => {
    return async (dispatch) => {
        const fetchPatients = async () => {
            const response = await fetch(
                'https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/api/patients'
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
import { BACKEND_URL } from "../constants";

export const fetchDoctorNotesByAppointment = async (apptId, userID) => {
    const response = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}?userID=${userID}`);
    if (!response.ok) {
        throw new Error("Failed to fetch doctor notes");
    }
    return response.json();
}

export const updateDoctorNotesByAppointment = async (apptId, noteData) => {
    const checkResponse = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}?userID=${noteData.userID}`);
    if (!checkResponse.ok) {
        // If the notes do not exist, we can create them
        const createResponse = await fetch(`${BACKEND_URL}api/doctor-notes/${apptId}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData)
            }
        );
        if (!createResponse.ok) {
            throw new Error("Failed to create doctor notes");
        }
        return createResponse.json();
    }
    const response = await fetch(
        `${BACKEND_URL}api/doctor-notes/${apptId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(noteData)
        }
    );
    if(!response.ok) {
        throw new Error("Failed to update doctor notes");
    }
    return response.json();
}
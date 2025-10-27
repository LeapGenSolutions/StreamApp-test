import { BACKEND_URL } from "../constants";

export const createAppointment = async (userID, appointmentData) => {

    const response = await fetch(`${BACKEND_URL}api/appointments/${userID}/custom/appointment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentData)
    });
    if (!response.ok) {
        throw new Error("Failed to create appointment");
    }
    return response.json();
};

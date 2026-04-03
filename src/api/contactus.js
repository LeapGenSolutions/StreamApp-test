import { BACKEND_URL } from "../constants";

export const sendemail = async (data) => {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/contact-us/${data.email}/email`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error("Failed to send email");
        }

        const result = await response.json();
        return result; //

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};
export const submitticket = async (data) => {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/contact-us/${data.email}/ticket`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error("Failed to submit ticket");
        }

        const result = await response.json();
        return result; //

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};
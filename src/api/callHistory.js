import { BACKEND_URL } from "../constants";

export const insertCallHistory = async (apptId, userID) => {
    const response = await fetch(`${BACKEND_URL}/api/call-history/${apptId}`,
        {
            method: "POST",
            body: JSON.stringify({ userID }),
            headers: { 'Content-Type': 'application/json' },
        }
    );
    if (!response.ok) {
        console.log("New call History not inserted. Call history and id might exist");
    }
};
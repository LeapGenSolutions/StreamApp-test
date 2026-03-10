import { BACKEND_URL } from "../constants";

const encode = (val) => encodeURIComponent((val || "").toLowerCase());

export const postImaging = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/imaging`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postVisitReason error:", error);
        throw error;
    }
};

export const postLab = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/lab`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postLab error:", error);
        throw error;
    }
};

export const postProcedure = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/procedure`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postProcedure error:", error);
        throw error;
    }
};

export const postOther = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/other`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postOther error:", error);
        throw error;
    }
};

export const postPatientInfo = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/patientinfo`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postPatientInfo error:", error);
        throw error;
    }
};

export const postPrescription = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/prescription`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postPrescription error:", error);
        throw error;
    }
};

export const postReferral = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/referral`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postReferral error:", error);
        throw error;
    }
};

export const postVaccine = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/vaccine`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postVaccine error:", error);
        throw error;
    }
};

export const postDME = async (doctorEmail, appointmentId, data, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        data = { ...data, practiceId };
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/dme`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postDME error:", error);
        throw error;
    }
};

export const postAllOrders = async (doctorEmail, appointmentId, orders, practiceId) => {
    try {
        const encodedEmail = encode(doctorEmail);
        const response = await fetch(
            `${BACKEND_URL}api/orders/${encodedEmail}/encounters/${appointmentId}/orders/all`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceId,
                    orders,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.error("postAllOrders error:", error);
        throw error;
    }
};
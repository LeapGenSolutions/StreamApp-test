import { BACKEND_URL } from "../constants";

const encode = (val) => encodeURIComponent((val || "").toLowerCase());

export const postVisitReason = async (doctorEmail, appointmentId, note, practiceID) => {
	try {
		const encodedEmail = encode(doctorEmail);

		const response = await fetch(
			`${BACKEND_URL}api/athena/${encodedEmail}/encounters/${appointmentId}/visit-reason`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note, practiceID }),
			}
		);

		return await response.json();
	} catch (error) {
		console.error("postVisitReason error:", error);
		throw error;
	}
};

export const putPhysicalExam = async (doctorEmail, appointmentId, note, practiceID) => {
	try {
		const encodedEmail = encode(doctorEmail);

		const response = await fetch(
			`${BACKEND_URL}api/athena/${encodedEmail}/encounters/${appointmentId}/physical-exam`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note, practiceID }),
			}
		);

		return await response.json();
	} catch (error) {
		console.error("putPhysicalExam error:", error);
		throw error;
	}
};

export const putHPI = async (doctorEmail, appointmentId, note, practiceID) => {
	try {
		const encodedEmail = encode(doctorEmail);

		const response = await fetch(
			`${BACKEND_URL}api/athena/${encodedEmail}/encounters/${appointmentId}/hpi`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note, practiceID }),
			}
		);

		return await response.json();
	} catch (error) {
		console.error("putHPI error:", error);
		throw error;
	}
};

export const putReviewOfSystems = async (doctorEmail, appointmentId, note, practiceID) => {
	try {
		const encodedEmail = encode(doctorEmail);

		const response = await fetch(
			`${BACKEND_URL}api/athena/${encodedEmail}/encounters/${appointmentId}/review-of-systems`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note, practiceID }),
			}
		);

		return await response.json();
	} catch (error) {
		console.error("putReviewOfSystems error:", error);
		throw error;
	}
};

export const putAssessment = async (doctorEmail, appointmentId, note, practiceID) => {
	try {
		const encodedEmail = encode(doctorEmail);

		const response = await fetch(
			`${BACKEND_URL}api/athena/${encodedEmail}/encounters/${appointmentId}/assessment`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note, practiceID }),
			}
		);

		return await response.json();
	} catch (error) {
		console.error("putAssessment error:", error);
		throw error;
	}
};


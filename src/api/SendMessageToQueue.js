import { BACKEND_URL } from "../constants";

const sendMessageToQueue = async (apptId,userId) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/end-call/${apptId}?username=${userId}`, 
      {
        method:"POST",
        body: JSON.stringify({ "userId": userId }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    await response.json();
  } catch (error) {
    console.error('Error Sending message to Queue:', error);
  }
};

export default sendMessageToQueue
import { BACKEND_URL } from "../constants";

const getUserToken = async (userId) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/get-token`, 
      {
        method:"POST",
        body: JSON.stringify({ "userId": userId }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const data = await response.json();
    return data.token
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};

export default getUserToken
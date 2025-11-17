import { BACKEND_URL } from "../constants"; 

export const fetchEmotionalEmpathy = async (appId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/emotional-connect/emotional-empathy/${userID}/${appId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch emotional empathy data");
  }
  return response.json();
};

export const fetchLongitudinalSentiment = async (appId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/emotional-connect/longitudinal-sentiment/${userID}/${appId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch longitudinal sentiment data");
  }
  return response.json();
};

export const fetchSentimentAnalysis = async (appId, userID) => {
  const response = await fetch(`${BACKEND_URL}api/emotional-connect/sentiment_analysis/${userID}/${appId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch sentiment analysis");
  }
  return response.json();
};

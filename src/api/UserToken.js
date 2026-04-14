import { BACKEND_URL } from "../constants";

const PROD_TOKEN_BACKEND_URL =
  "https://seismicdockerbackend-test-e0ducsgtggh7ftat.centralus-01.azurewebsites.net/";

const isLocalTokenBackend = (url = "") =>
  url.includes("localhost:8080") || url.includes("127.0.0.1:8080");

const requestUserToken = async (baseUrl, userId) => {
  const response = await fetch(`${baseUrl}get-token`, {
    method: "POST",
    body: JSON.stringify({ userId }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || `Token request failed (${response.status})`);
  }

  const data = await response.json();
  return data.token;
};

const getUserToken = async (userId) => {
  try {
    return await requestUserToken(BACKEND_URL, userId);
  } catch (error) {
    const shouldTryProdFallback =
      isLocalTokenBackend(BACKEND_URL) &&
      PROD_TOKEN_BACKEND_URL !== BACKEND_URL &&
      /stream api key|stream api secret|failed to fetch|token request failed/i.test(
        error?.message || ""
      );

    if (shouldTryProdFallback) {
      try {
        return await requestUserToken(PROD_TOKEN_BACKEND_URL, userId);
      } catch (fallbackError) {
        console.error("Error fetching fallback token:", fallbackError);
        throw fallbackError;
      }
    }

    console.error('Error fetching token:', error);
    const message =
      error?.message === "Failed to fetch"
        ? `Unable to reach Stream token service at ${BACKEND_URL}get-token`
        : error?.message || "Unable to fetch Stream token";
    throw new Error(message);
  }
};

export default getUserToken

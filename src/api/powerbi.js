import { BACKEND_URL, POWERBI_API_BASE_URL, SOS_URL } from "../constants";
import { resolveVbcRequestScope, withAuthHeaders } from "./auth";

const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location?.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const isLoopbackUrl = (value = "") => {
  const text = String(value || "").trim().toLowerCase();
  return text.includes("localhost") || text.includes("127.0.0.1");
};

const envApiBase = String(process.env.REACT_APP_POWERBI_API_BASE_URL || "").trim();
const resolvedEnvApiBase =
  envApiBase && (!isLoopbackUrl(envApiBase) || isLocalhost()) ? envApiBase : "";
const configuredPowerBiBase = String(POWERBI_API_BASE_URL || "").trim();

const BASE = (
  resolvedEnvApiBase ||
  configuredPowerBiBase ||
  SOS_URL ||
  BACKEND_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;
const apiForBase = (base, path) =>
  `${String(base || "").trim().replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const normalizePowerBiScope = ({
  appointmentId,
  date,
  metric,
  patientName,
  reportId,
  doctorEmail,
  doctorId,
  clinicId,
} = {}) => {
  const scope = resolveVbcRequestScope({ doctorEmail, doctorId, clinicId });

  return {
    appointmentId: hasValue(appointmentId) ? String(appointmentId).trim() : "",
    date: hasValue(date) ? String(date).trim() : "",
    metric: hasValue(metric) ? String(metric).trim() : "",
    patientName: hasValue(patientName) ? String(patientName).trim() : "",
    reportId: hasValue(reportId) ? String(reportId).trim() : "",
    doctorEmail: hasValue(scope.doctorEmail) ? normalizeEmail(scope.doctorEmail) : "",
    doctorId: hasValue(scope.doctorId) ? String(scope.doctorId).trim() : "",
    clinicId: hasValue(scope.clinicId) ? String(scope.clinicId).trim() : "",
  };
};

export const getPowerBiEmbedConfigUrl = ({
  appointmentId,
  date,
  metric,
  patientName,
  reportId,
  doctorEmail,
  doctorId,
  clinicId,
} = {}) => {
  const scope = normalizePowerBiScope({
    appointmentId,
    date,
    metric,
    patientName,
    reportId,
    doctorEmail,
    doctorId,
    clinicId,
  });

  const query = new URLSearchParams();
  if (hasValue(scope.appointmentId)) query.set("appointmentId", scope.appointmentId);
  if (hasValue(scope.date)) query.set("date", scope.date);
  if (hasValue(scope.metric)) query.set("metric", scope.metric);
  if (hasValue(scope.patientName)) {
    query.set("patientName", scope.patientName);
    query.set("patient", scope.patientName);
  }
  if (hasValue(scope.reportId)) query.set("reportId", scope.reportId);
  if (hasValue(scope.doctorEmail)) query.set("doctorEmail", scope.doctorEmail);
  if (hasValue(scope.doctorId)) query.set("doctorId", scope.doctorId);
  if (hasValue(scope.clinicId)) query.set("clinicId", scope.clinicId);

  const queryString = query.toString();
  return api(`/api/powerbi/embed-config${queryString ? `?${queryString}` : ""}`);
};

export const fetchPowerBiEmbedConfig = async (params = {}, { signal } = {}) => {
  const normalized = normalizePowerBiScope(params);
  const primaryUrl = getPowerBiEmbedConfigUrl(normalized);

  const endpointVariants = (url) => [
    url,
    url.replace("/api/powerbi/embed-config", "/api/powerbi/embedConfig"),
    url.replace("/api/powerbi/embed-config", "/api/powerbi/embed_config"),
  ];

  const endpoints = [...endpointVariants(primaryUrl)];

  const shouldTryConfiguredFallback =
    configuredPowerBiBase &&
    !primaryUrl.startsWith(configuredPowerBiBase.replace(/\/+$/, ""));

  if (shouldTryConfiguredFallback) {
    const queryString = primaryUrl.includes("?") ? primaryUrl.split("?").slice(1).join("?") : "";
    const fallbackUrl = `${apiForBase(configuredPowerBiBase, "/api/powerbi/embed-config")}${
      queryString ? `?${queryString}` : ""
    }`;
    endpoints.push(...endpointVariants(fallbackUrl));
  }

  let lastError = null;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        signal,
        headers: withAuthHeaders(),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text().catch(() => "");
        const message =
          contentType.includes("text/html") && text
            ? text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240)
            : text;

        const error = new Error(message || `Failed with status ${response.status}`);
        error.status = response.status;
        error.url = url;
        lastError = error;
        continue;
      }

      const payload = await response.json();
      if (payload && typeof payload === "object") {
        payload._requestUrl = url;
      }
      return payload;
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch Power BI embed config");
};

export const getSessionAuthToken = () => {
  if (typeof window === "undefined") return "";

  const authToken = (sessionStorage.getItem("authToken") || "").trim();
  if (authToken) return authToken;

  const bypassToken = (sessionStorage.getItem("bypassToken") || "").trim();
  if (bypassToken) return bypassToken;

  return "";
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const normalizeToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");

const flattenValues = (value) =>
  Array.isArray(value)
    ? value.flatMap((entry) => flattenValues(entry))
    : hasValue(value)
    ? [value]
    : [];

const decodeJwtClaims = (token = "") => {
  const payload = String(token || "").split(".")[1];
  if (!payload) return {};

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    const claims = JSON.parse(decodedPayload);
    return claims && typeof claims === "object" ? claims : {};
  } catch {
    return {};
  }
};

const getAccessLevelFromClaims = (claims = {}) => {
  const roleTokens = [
    ...flattenValues(claims.roles),
    ...flattenValues(claims.role),
    ...flattenValues(claims.scope),
    ...flattenValues(claims.scp),
    ...flattenValues(claims.accessLevel),
  ]
    .map((value) => normalizeToken(value))
    .filter(Boolean);

  const hasClinicRole = roleTokens.some((token) =>
    ["clinic", "practice", "facility", "admin", "manager", "lead", "director"].some(
      (keyword) => token.includes(keyword)
    )
  );
  const hasDoctorRole = roleTokens.some((token) =>
    ["doctor", "provider", "physician", "clinician", "seismicdoctors"].some(
      (keyword) => token.includes(keyword)
    )
  );

  if (hasClinicRole) return "clinic";
  if (hasDoctorRole) return "doctor";

  return hasValue(
    pickFirst(
      claims.preferred_username,
      claims.email,
      claims.upn,
      claims.unique_name,
      claims.doctor_email,
      claims.provider_email
    )
  )
    ? "doctor"
    : "clinic";
};

export const getSessionAuthClaims = () => decodeJwtClaims(getSessionAuthToken());

export const getSessionAuthScope = () => {
  const claims = getSessionAuthClaims();

  return {
    claims,
    doctorEmail: normalizeEmail(
      pickFirst(
        claims.preferred_username,
        claims.email,
        claims.upn,
        claims.unique_name,
        claims.doctor_email,
        claims.provider_email
      )
    ),
    doctorId: String(
      pickFirst(
        claims.doctor_id,
        claims.doctorId,
        claims.provider_id,
        claims.providerId,
        claims.oid,
        claims.sub
      ) || ""
    ).trim(),
    clinicId: String(
      pickFirst(
        claims.practice_id,
        claims.practiceId,
        claims.clinic_id,
        claims.clinicId,
        claims.facility_id,
        claims.facilityId,
        claims.athena_practice_id
      ) || ""
    ).trim(),
    clinicName: String(
      pickFirst(
        claims.practice_name,
        claims.practiceName,
        claims.clinic_name,
        claims.clinicName,
        claims.facility_name,
        claims.facilityName
      ) || ""
    ).trim(),
    accessLevel: getAccessLevelFromClaims(claims),
  };
};

export const resolveVbcRequestScope = ({
  doctorEmail = "",
  doctorId = "",
  clinicId = "",
  clinicName = "",
} = {}) => {
  const sessionScope = getSessionAuthScope();

  return {
    ...sessionScope,
    doctorEmail: normalizeEmail(doctorEmail || sessionScope.doctorEmail),
    doctorId: String(doctorId || sessionScope.doctorId || "").trim(),
    clinicId: String(clinicId || sessionScope.clinicId || "").trim(),
    clinicName: String(clinicName || sessionScope.clinicName || "").trim(),
  };
};

export const withAuthHeaders = (headers = {}) => {
  const token = getSessionAuthToken();
  if (!token) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};

import { BACKEND_URL } from "../constants";

const BASE = (BACKEND_URL || "").replace(/\/+$/, "");
const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;

async function parseResponse(response, defaultMessage) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || defaultMessage);
  }

  return data;
}

function buildHeaders(headers = {}) {
  const nextHeaders = { ...headers };
  const backendToken =
    typeof window !== "undefined"
      ? sessionStorage.getItem("backendToken")
      : null;

  if (backendToken) {
    nextHeaders.Authorization = `Bearer ${backendToken}`;
  }

  return nextHeaders;
}

async function request(path, options = {}, defaultMessage = "RBAC request failed") {
  const response = await fetch(api(path), {
    ...options,
    headers: buildHeaders(options.headers),
  });
  return parseResponse(response, defaultMessage);
}

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function manageRbacOverrides(payload) {
  return request(
    "/api/rbac/manage",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to update RBAC overrides"
  );
}

export async function fetchRoles(clinicName) {
  return request(
    withQuery("/api/rbac/roles", { clinicName }),
    {},
    "Failed to fetch RBAC roles"
  );
}

export async function fetchRole(roleId, clinicName) {
  return request(
    withQuery(`/api/rbac/roles/${encodeURIComponent(roleId)}`, { clinicName }),
    {},
    "Failed to fetch RBAC role"
  );
}

export async function fetchRegistrationRoles(clinicName) {
  return request(
    `/api/rbac/roles/registration/${encodeURIComponent(clinicName)}`,
    {},
    "Failed to fetch registration roles"
  );
}

export async function createRole(payload) {
  return request(
    "/api/rbac/roles",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to create RBAC role"
  );
}

export async function updateRole(roleId, payload) {
  return request(
    `/api/rbac/roles/${encodeURIComponent(roleId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to update RBAC role"
  );
}

export async function deleteRole(roleId, payload = {}) {
  const { clinicName, replacementRoleName } = payload;
  return request(
    withQuery(`/api/rbac/roles/${encodeURIComponent(roleId)}`, { clinicName }),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clinicName,
        replacementRoleName,
      }),
    },
    "Failed to delete RBAC role"
  );
}

export async function assignRole(payload) {
  return request(
    "/api/rbac/users/assign-role",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to assign RBAC role"
  );
}

export async function fetchPendingApprovals() {
  return request(
    "/api/approvals/pending",
    {},
    "Failed to fetch pending approvals"
  );
}

export async function approveUser(userId) {
  return request(
    `/api/approvals/${encodeURIComponent(userId)}/approve`,
    {
      method: "PUT",
    },
    "Failed to approve user"
  );
}

export async function rejectUser(userId) {
  return request(
    `/api/approvals/${encodeURIComponent(userId)}/reject`,
    {
      method: "PUT",
    },
    "Failed to reject user"
  );
}

export async function fetchInvitations() {
  return request(
    "/api/invitations",
    {},
    "Failed to fetch invitations"
  );
}

export async function sendInvitation(payload) {
  return request(
    "/api/invitations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Failed to send invitation"
  );
}

export async function revokeInvitation(invitationId) {
  return request(
    `/api/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
    },
    "Failed to revoke invitation"
  );
}

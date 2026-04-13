const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

let mockProfileData = {
  id: "user-123",
  firstName: "Jane",
  middleName: "Marie",
  lastName: "Doe",
  primaryEmail: "jane.doe@seismicconnect.com",
  secondaryEmail: "dr.jane.doe@gmail.com",
  role: "Doctor",
  accountType: "Clinic",
  npiNumber: "1234567890",
  specialty: "Cardiology",
  subSpecialty: "Interventional Cardiology",
  statesOfLicense: ["California", "New York"],
  licenseNumber: "MD9876543",
  clinicName: "Seismic Health Partners",
  clinicAddress: "123 Heartbeat Way, San Francisco, CA 94105",
  clinicId: "",
  lastLogin: "2026-04-02T14:30:00Z",
  notifications: {
    email: true,
    sms: false,
  },
  usageSettings: {
    weeklyDigest: true,
    appointmentReminders: true,
  },
  timeZone: "America/Los_Angeles",
  security: {
    authenticationMethod: "Single sign-on",
    passwordManagedBy: "Clinic identity provider",
    sessionProtection: "Audit-safe controls enabled",
  },
  agreements: {
    terms: {
      title: "Terms & Conditions",
      acceptedOn: "2025-01-15T09:00:00Z",
      version: "v2.3",
      status: "Accepted",
    },
    privacy: {
      title: "Privacy Policy",
      acceptedOn: "2025-01-15T09:00:00Z",
      version: "v4.1",
      status: "Accepted",
    },
    ai: {
      title: "AI Usage Acknowledgement",
      acceptedOn: "2025-03-20T11:45:00Z",
      version: "v1.8",
      status: "Accepted",
    },
    clinical: {
      title: "Clinical Responsibility Acknowledgement",
      acceptedOn: "2025-01-15T09:00:00Z",
      version: "v3.0",
      status: "Accepted",
    },
  },
};

let mockClinicMembers = [
  {
    id: "cm-1",
    name: "Jane Doe",
    role: "Doctor",
    email: "jane.doe@seismicconnect.com",
    isMe: true,
  },
  {
    id: "cm-2",
    name: "John Smith",
    role: "Doctor",
    email: "john.smith@seismicconnect.com",
    isMe: false,
  },
  {
    id: "cm-3",
    name: "Alice Johnson",
    role: "Nurse Practitioner",
    email: "alice.np@seismicconnect.com",
    isMe: false,
  },
  {
    id: "cm-4",
    name: "Bob Williams",
    role: "Staff",
    email: "bob.admin@seismicconnect.com",
    isMe: false,
  },
  {
    id: "cm-5",
    name: "Mia Patel",
    role: "Staff",
    email: "mia.operations@seismicconnect.com",
    isMe: false,
  },
];

let accessGrantRecords = [
  {
    memberId: "cm-3",
    scopes: ["appointments", "patient_details"],
    grantedAt: "2026-03-25T09:30:00Z",
    grantedBy: "user-123",
    lastUpdatedAt: "2026-03-25T09:30:00Z",
  },
];

let auditLogRecords = [
  {
    id: "audit-1",
    action: "Granted",
    memberId: "cm-3",
    byUserId: "user-123",
    scopes: ["appointments", "patient_details"],
    timestamp: "2026-03-25T09:30:00Z",
  },
];

const mergeProfile = (current, updates) => ({
  ...current,
  ...updates,
  notifications: updates.notifications
    ? { ...current.notifications, ...updates.notifications }
    : current.notifications,
  usageSettings: updates.usageSettings
    ? { ...current.usageSettings, ...updates.usageSettings }
    : current.usageSettings,
  security: updates.security
    ? { ...current.security, ...updates.security }
    : current.security,
  agreements: updates.agreements
    ? { ...current.agreements, ...updates.agreements }
    : current.agreements,
});

const getMemberById = (memberId) =>
  mockClinicMembers.find((member) => member.id === memberId);

const createAuditRecord = ({ action, memberId, scopes }) => {
  const timestamp = new Date().toISOString();
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    memberId,
    byUserId: mockProfileData.id,
    scopes,
    timestamp,
  };

  auditLogRecords = [entry, ...auditLogRecords];

  const label = `[AUDIT LOG] PHI Access ${action}`;
  console.group(`%c${label}`, "color: #1d4ed8; font-weight: bold;");
  console.log("Action:", action);
  console.log("Granted By User ID:", mockProfileData.id);
  console.log("Target User ID:", memberId);
  console.log("Scope:", scopes.join(", "));
  console.log("Timestamp:", timestamp);
  console.groupEnd();

  return entry;
};

const enrichGrantRecord = (record) => {
  const member = getMemberById(record.memberId);
  if (!member) {
    return null;
  }

  return {
    ...clone(member),
    scopes: [...record.scopes],
    grantedAt: record.grantedAt,
    lastUpdatedAt: record.lastUpdatedAt || record.grantedAt,
  };
};

export const fetchProfileData = async () => {
  await delay(450);
  return clone(mockProfileData);
};

export const updateProfileData = async (updatedFields) => {
  await delay(600);

  const candidateProfile = mergeProfile(mockProfileData, updatedFields);
  const nextSecondaryEmail = String(
    candidateProfile.secondaryEmail ?? mockProfileData.secondaryEmail ?? ""
  ).trim();
  const nextSpecialty = String(candidateProfile.specialty ?? "").trim();
  const nextLicenseNumber = String(candidateProfile.licenseNumber ?? "").trim();

  if (nextSecondaryEmail && !isValidEmail(nextSecondaryEmail)) {
    throw new Error("Enter a valid secondary email address.");
  }

  if (!nextSpecialty) {
    throw new Error("Specialty is required.");
  }

  if (!nextLicenseNumber) {
    throw new Error("License number is required.");
  }

  mockProfileData = mergeProfile(mockProfileData, {
    ...candidateProfile,
    secondaryEmail: nextSecondaryEmail,
    specialty: nextSpecialty,
    licenseNumber: nextLicenseNumber,
  });

  return { success: true, data: clone(mockProfileData) };
};

export const fetchClinicMembers = async () => {
  await delay(350);
  return clone(mockClinicMembers);
};

export const fetchGrantedAccess = async () => {
  await delay(250);
  return accessGrantRecords.map(enrichGrantRecord).filter(Boolean);
};

export const fetchAccessAuditLog = async () => {
  await delay(250);

  return auditLogRecords.map((entry) => {
    const member = getMemberById(entry.memberId);
    return {
      ...clone(entry),
      memberName: member?.name || "Unknown user",
      memberRole: member?.role || "Unknown role",
    };
  });
};

export const grantAccessToMember = async (memberId, scopes = []) => {
  await delay(500);

  const member = getMemberById(memberId);
  if (!member || member.isMe) {
    throw new Error("Only clinic members can be granted access.");
  }

  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new Error("Select at least one access type before granting access.");
  }

  if (accessGrantRecords.some((record) => record.memberId === memberId)) {
    throw new Error("Access has already been granted to this clinic member.");
  }

  const timestamp = new Date().toISOString();

  accessGrantRecords.push({
    memberId,
    scopes: [...new Set(scopes)],
    grantedAt: timestamp,
    grantedBy: mockProfileData.id,
    lastUpdatedAt: timestamp,
  });

  createAuditRecord({
    action: "Granted",
    memberId,
    scopes: [...new Set(scopes)],
  });

  return { success: true };
};

export const modifyAccessForMember = async (memberId, scopes = []) => {
  await delay(450);

  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new Error("Select at least one access type before saving changes.");
  }

  const record = accessGrantRecords.find((entry) => entry.memberId === memberId);
  if (!record) {
    throw new Error("This clinic member does not currently have access.");
  }

  record.scopes = [...new Set(scopes)];
  record.lastUpdatedAt = new Date().toISOString();

  createAuditRecord({
    action: "Modified",
    memberId,
    scopes: [...record.scopes],
  });

  return { success: true };
};

export const revokeAccessFromMember = async (memberId) => {
  await delay(450);

  const record = accessGrantRecords.find((entry) => entry.memberId === memberId);
  if (!record) {
    throw new Error("This clinic member does not currently have access.");
  }

  accessGrantRecords = accessGrantRecords.filter((entry) => entry.memberId !== memberId);

  createAuditRecord({
    action: "Revoked",
    memberId,
    scopes: [...record.scopes],
  });

  return { success: true };
};

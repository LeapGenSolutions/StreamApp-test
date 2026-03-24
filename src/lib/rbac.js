const ROLE_ALIASES = {
  doctor: "Doctor",
  np: "Nurse Practitioner",
  "nurse practitioner": "Nurse Practitioner",
  nurse_practitioner: "Nurse Practitioner",
  staff: "Staff",
  bo: "Staff",
  "back office": "Staff",
  "staff (back office)": "Staff",
  su: "SU",
  "super admin": "SU",
  seismicdoctors: "SeismicDoctors",
  "seismic doctors": "SeismicDoctors",
};

export const ACCESS_HIERARCHY = {
  none: 0,
  read: 1,
  write: 2,
};

export const SYSTEM_ROLES = ["Doctor", "Nurse Practitioner", "Staff", "SU"];
export const FULL_ACCESS_ROLES = ["SeismicDoctors"];

export const PERMISSION_CATALOG = {
  "dashboard.view_appointments": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "dashboard.start_video_call": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "dashboard.todays_schedule": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "dashboard.status_overview": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "dashboard.provider_workload": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "chatbot.access": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "appointments.select_providers": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "appointments.add": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "appointments.modify": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "appointments.delete": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "appointments.patient_reports": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "appointments.join_call": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "appointments.post_call_doc": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "video_call.upcoming": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "video_call.start": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "video_call.add": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "video_call.history": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "video_call.post_call_doc": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "post_call.view_all": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "post_call.edit_soap_notes": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "post_call.edit_billing_codes": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "post_call.add_doctor_notes": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "post_call.edit_doctor_notes": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "post_call.add_feedback": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "post_call.edit_feedback": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "patients.info": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "patients.clinical_summary": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "patients.upcoming_appointment": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "patients.join_call": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "none",
  },
  "patients.previous_calls": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "write",
  },
  "patients.post_call_doc": {
    Doctor: "write",
    "Nurse Practitioner": "write",
    Staff: "read",
  },
  "reports.billing_analytics": {
    Doctor: "write",
    "Nurse Practitioner": "none",
    Staff: "none",
  },
  "reports.billing_history": {
    Doctor: "write",
    "Nurse Practitioner": "none",
    Staff: "none",
  },
  "reports.estimated_billing": {
    Doctor: "write",
    "Nurse Practitioner": "none",
    Staff: "none",
  },
  "settings.ehr_integration": {
    Doctor: "write",
    "Nurse Practitioner": "read",
    Staff: "read",
  },
  "settings.payment_billing": {
    Doctor: "write",
    "Nurse Practitioner": "none",
    Staff: "none",
  },
  "admin.manage_rbac": {
    Doctor: "none",
    "Nurse Practitioner": "none",
    Staff: "none",
  },
};

export function normalizeRole(input) {
  const rawValue = Array.isArray(input) ? input.find(Boolean) : input;

  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  return ROLE_ALIASES[rawValue.trim().toLowerCase()] || rawValue;
}

export function isValidPermissionLevel(level) {
  return Object.prototype.hasOwnProperty.call(ACCESS_HIERARCHY, level);
}

export function buildPermissionsMap(permissionSource = {}) {
  return Object.keys(PERMISSION_CATALOG).reduce((acc, permissionKey) => {
    const level = permissionSource?.[permissionKey];
    acc[permissionKey] = isValidPermissionLevel(level) ? level : "none";
    return acc;
  }, {});
}

export function buildFullAccessPermissions() {
  return Object.keys(PERMISSION_CATALOG).reduce((acc, permissionKey) => {
    acc[permissionKey] = "write";
    return acc;
  }, {});
}

export function getBasePermissionsForRole(role, customRolePermissions = null) {
  const normalizedRole = normalizeRole(role);

  if (FULL_ACCESS_ROLES.includes(normalizedRole)) {
    return buildFullAccessPermissions();
  }

  if (SYSTEM_ROLES.includes(normalizedRole)) {
    return Object.fromEntries(
      Object.entries(PERMISSION_CATALOG).map(([permissionKey, defaults]) => [
        permissionKey,
        defaults[normalizedRole] || "none",
      ])
    );
  }

  return buildPermissionsMap(customRolePermissions);
}

export function computeEffectivePermissions(
  role,
  customPermissions,
  customRolePermissions = null
) {
  const basePermissions = getBasePermissionsForRole(role, customRolePermissions);

  const overrides = customPermissions?.overrides || {};
  Object.entries(overrides).forEach(([permissionKey, overrideLevel]) => {
    if (
      Object.prototype.hasOwnProperty.call(PERMISSION_CATALOG, permissionKey) &&
      isValidPermissionLevel(overrideLevel)
    ) {
      basePermissions[permissionKey] = overrideLevel;
    }
  });

  return basePermissions;
}

export function getPermissionLevel(effectivePermissions, permissionKey) {
  return effectivePermissions?.[permissionKey] || "none";
}

export function hasPermission(effectivePermissions, permissionKey, requiredLevel = "read") {
  const currentLevel = getPermissionLevel(effectivePermissions, permissionKey);
  return ACCESS_HIERARCHY[currentLevel] >= ACCESS_HIERARCHY[requiredLevel];
}

export function hasAnyPermission(effectivePermissions, checks = []) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return true;
  }

  return checks.some((check) =>
    hasPermission(
      effectivePermissions,
      check.required,
      check.level || "read"
    )
  );
}

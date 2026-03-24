import { myActions } from "./me-slice";
import { fetchDoctorsFromHistory } from "../api/callHistory";
import { fetchRoles } from "../api/rbac";
import {
  computeEffectivePermissions,
  normalizeRole,
  SYSTEM_ROLES,
} from "../lib/rbac";

const asRoleList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.roles)) {
    return value.roles;
  }

  return [];
};

const setMyDetails = (details) => {
  return async (dispatch) => {
    const email = details.email?.toLowerCase();

    // fetch doctor metadata from doctors container
    let doctors = [];
    try {
      doctors = await fetchDoctorsFromHistory();
      //console.log("DEBUG: setMyDetails - Fetched doctors:", doctors);
    } catch (err) {
      console.error("Failed to load doctor metadata:", err);
    }

    // find doctor by email
    const doctorDoc = doctors.find(
      (doc) =>
        doc.doctor_email?.toLowerCase() === email ||
        doc.id?.toLowerCase() === email
    );

    const normalizedRole = normalizeRole(doctorDoc?.role || details.role || details.roles);
    let customRolePermissions = null;

    if (normalizedRole && !SYSTEM_ROLES.includes(normalizedRole)) {
      try {
        const roles = asRoleList(await fetchRoles(doctorDoc?.clinicName || ""));
        const matchedRole = roles.find(
          (roleDoc) => normalizeRole(roleDoc?.roleName) === normalizedRole
        );
        customRolePermissions = matchedRole?.permissions || null;
      } catch (err) {
        console.error("Failed to load custom roles for current user:", err);
      }
    }

    const fullName =
      [doctorDoc?.firstName, doctorDoc?.lastName].filter(Boolean).join(" ") ||
      details.name ||
      details.given_name ||
      details.email?.split("@")[0] ||
      "";

    const payload = {
      ...details,
      email,
      doctor_name: doctorDoc?.doctor_name || fullName,
      doctor_id: doctorDoc?.doctor_id || doctorDoc?.id,
      doctor_email: doctorDoc?.doctor_email || email,
      specialization: doctorDoc?.specialization || doctorDoc?.specialty,
      given_name: fullName,
      family_name: doctorDoc?.lastName || details.family_name,
      name: fullName,
      fullName,
      role: normalizedRole,
      roles: Array.isArray(doctorDoc?.roles)
        ? doctorDoc.roles
        : normalizedRole
        ? [normalizedRole]
        : [],
      specialty: doctorDoc?.specialty || doctorDoc?.specialization,
      clinicName: doctorDoc?.clinicName || "",
      profileComplete: doctorDoc?.profileComplete,
      customPermissions: doctorDoc?.customPermissions || null,
      effectivePermissions: computeEffectivePermissions(
        normalizedRole,
        doctorDoc?.customPermissions,
        customRolePermissions
      ),
    };

    //console.log("DEBUG: setMyDetails - Matched doctor:", doctorDoc, "for email:", email);

    //console.log("DEBUG: setMyDetails - Matched doctor:", doctorDoc, "for email:", email);

    // store final doctor metadata into Redux
    if (doctorDoc?.profileComplete === true) {
      dispatch(myActions.setMyself(payload));
      //console.log("DEBUG: setMyDetails - Dispatching with clinicName:", doctorDoc?.clinicName);
    } else {
      dispatch(myActions.setMyself(payload));
    }

    return payload;
  };
};

export default setMyDetails;

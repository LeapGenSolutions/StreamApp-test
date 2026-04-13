import { myActions } from "./me-slice";
import { fetchDoctorsFromHistory } from "../api/callHistory";
import { fetchRoles } from "../api/rbac";
import {
  computeEffectivePermissions,
  normalizeRole,
  SYSTEM_ROLES,
} from "../lib/rbac";
import { resolveUserNameParts } from "../lib/userName";

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
    const emailHandle = details.email?.split("@")[0] || "";

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

    const { firstName, lastName, fullName } = resolveUserNameParts({
      firstName: doctorDoc?.firstName,
      lastName: doctorDoc?.lastName,
      fullName: details.name,
      given_name: details.given_name,
      family_name: details.family_name,
      doctor_name: doctorDoc?.doctor_name,
    });
    const resolvedFullName = fullName || emailHandle;

    const payload = {
      ...details,
      email,
      doctor_name: doctorDoc?.doctor_name || resolvedFullName,
      doctor_id: doctorDoc?.doctor_id || doctorDoc?.id,
      doctor_email: doctorDoc?.doctor_email || email,
      specialization: doctorDoc?.specialization || doctorDoc?.specialty,
      given_name: firstName || details.given_name || emailHandle,
      family_name: lastName || details.family_name,
      name: resolvedFullName,
      fullName: resolvedFullName,
      role: normalizedRole,
      roles: Array.isArray(doctorDoc?.roles)
        ? doctorDoc.roles
        : normalizedRole
        ? [normalizedRole]
        : [],
      specialty: doctorDoc?.specialty || doctorDoc?.specialization,
      clinicName: doctorDoc?.clinicName || "",
      profileComplete: doctorDoc?.profileComplete,
      approvalStatus: doctorDoc?.approvalStatus || (doctorDoc?.profileComplete ? "approved" : null),
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

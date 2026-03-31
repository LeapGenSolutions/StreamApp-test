import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";
import { PageNavigation } from "../components/ui/page-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { fetchDoctorsFromHistory } from "../api/callHistory";
import {
  approveUser,
  assignRole,
  createRole,
  deleteRole,
  fetchInvitations,
  fetchPendingApprovals,
  fetchRoles,
  manageRbacOverrides,
  rejectUser,
  revokeInvitation,
  sendInvitation,
  updateRole,
} from "../api/rbac";
import {
  ACCESS_HIERARCHY,
  buildPermissionsMap,
  computeEffectivePermissions,
  getBasePermissionsForRole,
  getPermissionLevel,
  normalizeRole,
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
} from "../lib/rbac";
import { useToast } from "../hooks/use-toast";
import { usePermission } from "../hooks/use-permission";

const SECTION_LABELS = {
  dashboard: "Dashboard",
  chatbot: "Chatbot",
  appointments: "Appointments",
  video_call: "Video Call",
  post_call: "Post-Call Documentation",
  patients: "Patients",
  reports: "Reports",
  settings: "Settings",
  admin: "Admin",
};

const ACCESS_BADGE_STYLES = {
  write: "bg-blue-50 text-blue-700 border-blue-200",
  read: "bg-slate-100 text-slate-700 border-slate-300",
  none: "bg-slate-50 text-slate-500 border-slate-200",
};

const ACCESS_LABELS = {
  write: "Read + Write",
  read: "Read Only",
  none: "No Access",
};

const MANAGED_SYSTEM_ROLES = SYSTEM_ROLES.filter((role) => role !== "SU");
const OVERRIDE_OPTIONS = ["write", "read", "none"];
const TAB_OPTIONS = [
  { id: "permissions", label: "User Permissions" },
  { id: "roles", label: "Role Management" },
  { id: "approvals", label: "Pending Approvals" },
  // { id: "invites", label: "Invite Users" },
];

const SYSTEM_ROLE_METADATA = {
  Doctor: {
    type: "system",
    baseRoleClonedFrom: "",
    showInRegistration: true,
    skipNpiValidation: false,
  },
  "Nurse Practitioner": {
    type: "system",
    baseRoleClonedFrom: "",
    showInRegistration: true,
    skipNpiValidation: false,
  },
  Staff: {
    type: "system",
    baseRoleClonedFrom: "",
    showInRegistration: true,
    skipNpiValidation: true,
  },
};

const LABEL_ACRONYMS = {
  ehr: "EHR",
  soap: "SOAP",
  rbac: "RBAC",
  npi: "NPI",
  ai: "AI",
};

const formatPermissionLabel = (permissionKey) => {
  const [, action = permissionKey] = permissionKey.split(".");
  return action
    .split("_")
    .map((part) => {
      const normalizedPart = part.toLowerCase();
      if (LABEL_ACRONYMS[normalizedPart]) {
        return LABEL_ACRONYMS[normalizedPart];
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
};

const normalizeSearch = (value) =>
  (value || "").toLowerCase().replace(/\s+/g, " ").trim();

const normalizeClinicName = (value) =>
  (value || "").replace(/\s+/g, " ").trim().toLowerCase();

const getUserRole = (user) => normalizeRole(user.role) || "Unassigned";

const getUserKey = (user) => user.userId || user.id;

const getDisplayName = (user) =>
  user.doctor_name ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email ||
  user.id;

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getRoleAccessLevel = (roleName, permissionKey, rolePermissionsByName = {}) => {
  const basePermissions =
    rolePermissionsByName[roleName] || getBasePermissionsForRole(roleName);

  return getPermissionLevel(basePermissions, permissionKey);
};

const formatAccessLabel = (level) => ACCESS_LABELS[level] || level || "No Access";

const formatAccessCountSummary = (levels = []) => {
  const counts = levels.reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(counts)
    .sort((a, b) => ACCESS_HIERARCHY[b] - ACCESS_HIERARCHY[a])
    .map((level) => `${counts[level]} user${counts[level] === 1 ? "" : "s"}: ${formatAccessLabel(level)}`)
    .join(" | ");
};

const getOverrideOptionsForPermission = (permissionKey) => {
  if (permissionKey === "admin.manage_rbac") {
    return ["write", "read", "none"];
  }

  const permissionDefaults = PERMISSION_CATALOG[permissionKey] || {};
  const supportedLevels = new Set(
    Object.values(permissionDefaults).filter((level) => level && level !== "none")
  );

  const orderedLevels = ["write", "read"].filter((level) =>
    supportedLevels.has(level)
  );

  return [...orderedLevels, "none"];
};

const getMeaningfulOverrideChoices = (options, selectedLevels = []) => {
  if (selectedLevels.length === 0) {
    return options.map((level) => ({
      level,
      changedCount: 0,
      totalCount: 0,
    }));
  }

  const totalCount = selectedLevels.length;

  return options
    .map((level) => ({
      level,
      changedCount: selectedLevels.filter((entry) => entry.level !== level).length,
      totalCount,
    }))
    .filter((choice) => choice.changedCount > 0);
};

const isCurrentLoggedInUser = (user, loggedInEmail) => {
  if (!loggedInEmail) {
    return false;
  }

  const userEmail = (user.doctor_email || user.email || user.id || "")
    .trim()
    .toLowerCase();

  return userEmail === loggedInEmail;
};

const asRoleList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.roles)) {
    return value.roles;
  }

  return [];
};

const getRolePayload = (value, fallback) =>
  value?.role || value?.data || value?.resource || fallback;

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const createRoleDraft = (baseRole = "Staff", permissionsByRole = {}) => {
  const normalizedBaseRole = normalizeRole(baseRole) || "Staff";

  return {
    id: "",
    roleName: "",
    description: "",
    type: "custom",
    baseRoleClonedFrom: normalizedBaseRole,
    showInRegistration: false,
    skipNpiValidation: normalizedBaseRole === "Staff",
    permissions: {
      ...(permissionsByRole[normalizedBaseRole] ||
        getBasePermissionsForRole(normalizedBaseRole)),
    },
  };
};

const createRoleDraftFromDoc = (roleDoc) => {
  const normalizedRoleName = normalizeRole(roleDoc?.roleName) || roleDoc?.roleName || "";

  return {
    id: roleDoc?.id || "",
    roleName: normalizedRoleName,
    description: roleDoc?.description || "",
    type: roleDoc?.type || "custom",
    baseRoleClonedFrom: normalizeRole(roleDoc?.baseRoleClonedFrom) || "",
    showInRegistration: Boolean(roleDoc?.showInRegistration),
    skipNpiValidation: Boolean(roleDoc?.skipNpiValidation),
    permissions: buildPermissionsMap(
      roleDoc?.permissions || getBasePermissionsForRole(normalizedRoleName)
    ),
  };
};

const buildRolePermissionsByName = (roleDocs = []) =>
  roleDocs.reduce((acc, roleDoc) => {
    const roleName = normalizeRole(roleDoc?.roleName);
    if (!roleName) {
      return acc;
    }

    acc[roleName] = buildPermissionsMap(roleDoc.permissions);
    return acc;
  }, {});

const buildRoleInventory = (roleDocs = [], users = []) => {
  const roleMap = new Map();

  MANAGED_SYSTEM_ROLES.forEach((roleName) => {
    roleMap.set(roleName, {
      id: roleName.toLowerCase().replace(/\s+/g, "-"),
      roleName,
      description: `${roleName} system role`,
      permissions: getBasePermissionsForRole(roleName),
      ...SYSTEM_ROLE_METADATA[roleName],
      isActive: true,
    });
  });

  roleDocs.forEach((roleDoc) => {
    const roleName = normalizeRole(roleDoc?.roleName);
    if (!roleName) {
      return;
    }

    const existingRole = roleMap.get(roleName) || {};
    const nextRole = {
      ...existingRole,
      ...roleDoc,
      roleName,
      type: roleDoc?.type || existingRole.type || "custom",
      permissions: buildPermissionsMap(
        roleDoc?.permissions ||
          existingRole.permissions ||
          getBasePermissionsForRole(roleName)
      ),
      showInRegistration:
        roleDoc?.showInRegistration ?? existingRole.showInRegistration ?? false,
      skipNpiValidation:
        roleDoc?.skipNpiValidation ?? existingRole.skipNpiValidation ?? false,
      isActive: roleDoc?.isActive ?? existingRole.isActive ?? true,
    };

    roleMap.set(roleName, nextRole);
  });

  const userCounts = users.reduce((acc, user) => {
    const roleName = getUserRole(user);
    acc[roleName] = (acc[roleName] || 0) + 1;
    return acc;
  }, {});

  return Array.from(roleMap.values())
    .map((role) => ({
      ...role,
      userCount: userCounts[role.roleName] || 0,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "system" ? -1 : 1;
      }

      return a.roleName.localeCompare(b.roleName, undefined, {
        sensitivity: "base",
      });
    });
};

function RBACManagement() {
  const loggedInClinicName = useSelector((state) => state.me?.me?.clinicName || "");
  const loggedInEmail = useSelector((state) =>
    (state.me?.me?.email || "").trim().toLowerCase()
  );
  const canWriteAdminSettings = usePermission("admin.manage_rbac", "write");
  const [activeTab, setActiveTab] = useState("permissions");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rolesError, setRolesError] = useState("");
  const [approvalsError, setApprovalsError] = useState("");
  const [invitationsError, setInvitationsError] = useState("");
  const [refreshingApprovals, setRefreshingApprovals] = useState(false);
  const [draftLevels, setDraftLevels] = useState({});
  const [selectedAssignmentRole, setSelectedAssignmentRole] = useState("");
  const [assigningRole, setAssigningRole] = useState(false);
  const [savingPermissionKey, setSavingPermissionKey] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState("");
  const [rejectingUserId, setRejectingUserId] = useState("");
  const [revokingInvitationId, setRevokingInvitationId] = useState("");
  const [deletingRoleId, setDeletingRoleId] = useState("");
  const [rolePendingDelete, setRolePendingDelete] = useState(null);
  const [approvalPendingReject, setApprovalPendingReject] = useState(null);
  const [deleteReplacementRole, setDeleteReplacementRole] = useState("");
  const [editorMode, setEditorMode] = useState("");
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    roleName: "",
  });
  const [roleForm, setRoleForm] = useState(() => createRoleDraft());
  const [collapsedSections, setCollapsedSections] = useState(() =>
    Object.keys(SECTION_LABELS).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {})
  );
  const [collapsedRoleSections, setCollapsedRoleSections] = useState(() =>
    Object.keys(SECTION_LABELS).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {})
  );
  const { toast } = useToast();

  const showReadOnlyToast = () => {
    toast({
      title: "Read-only access",
      description:
        "You can review admin settings, but only users with write access can make changes.",
    });
  };

  useEffect(() => {
    document.title = "Admin Settings - Seismic Connect";
  }, []);

  const permissionSections = useMemo(() => {
    return Object.keys(PERMISSION_CATALOG).reduce((acc, permissionKey) => {
      const sectionKey = permissionKey.split(".")[0];
      if (!acc[sectionKey]) {
        acc[sectionKey] = [];
      }
      acc[sectionKey].push(permissionKey);
      return acc;
    }, {});
  }, []);

  const roleInventory = useMemo(() => buildRoleInventory(roles, users), [roles, users]);

  const rolePermissionsByName = useMemo(
    () =>
      roleInventory.reduce((acc, role) => {
        acc[role.roleName] = buildPermissionsMap(role.permissions);
        return acc;
      }, {}),
    [roleInventory]
  );

  const availableRoleOptions = useMemo(
    () =>
      roleInventory
        .filter((role) => role.isActive !== false)
        .map((role) => role.roleName),
    [roleInventory]
  );

  const deleteReplacementRoleOptions = useMemo(() => {
    const pendingRoleName = normalizeRole(rolePendingDelete?.roleName);

    return roleInventory
      .filter((role) => {
        if (role.isActive === false) {
          return false;
        }

        return normalizeRole(role.roleName) !== pendingRoleName;
      })
      .map((role) => role.roleName);
  }, [roleInventory, rolePendingDelete]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setLoadError("");
      setRolesError("");
      setApprovalsError("");
      setInvitationsError("");

      try {
        const [
          usersResult,
          rolesResult,
          approvalsResult,
          invitationsResult,
        ] = await Promise.allSettled([
          fetchDoctorsFromHistory(loggedInClinicName || undefined),
          fetchRoles(loggedInClinicName || ""),
          fetchPendingApprovals(),
          fetchInvitations(),
        ]);

        if (usersResult.status !== "fulfilled") {
          throw usersResult.reason;
        }

        const loadedRoles =
          rolesResult.status === "fulfilled" ? asRoleList(rolesResult.value) : [];

        if (rolesResult.status !== "fulfilled") {
          setRolesError(
            rolesResult.reason?.message ||
              "Role endpoints are not available yet. Custom roles will show once the backend is deployed."
          );
        }

        if (approvalsResult.status !== "fulfilled") {
          setApprovalsError(
            approvalsResult.reason?.message ||
              "Pending approvals could not be loaded right now."
          );
        }

        if (invitationsResult.status !== "fulfilled") {
          setInvitationsError(
            invitationsResult.reason?.message ||
              "Invitations could not be loaded right now."
          );
        }

        const normalizedClinicName = normalizeClinicName(loggedInClinicName);
        const rolePermissions = buildRolePermissionsByName(loadedRoles);

        const normalizedUsers = (Array.isArray(usersResult.value) ? usersResult.value : [])
          .filter((user) => {
            if (normalizedClinicName) {
              return normalizeClinicName(user.clinicName) === normalizedClinicName;
            }

            const userEmail = (user.doctor_email || user.email || user.id || "")
              .trim()
              .toLowerCase();
            return userEmail === loggedInEmail;
          })
          .map((user) => {
            const roleName = getUserRole(user);

            return {
              ...user,
              role: roleName,
              effectivePermissions: computeEffectivePermissions(
                roleName,
                user.customPermissions,
                rolePermissions[roleName] || null
              ),
            };
          })
          .sort((a, b) =>
            getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
              sensitivity: "base",
            })
          );

        setRoles(loadedRoles);
        setUsers(normalizedUsers);
        setPendingApprovals(
          approvalsResult.status === "fulfilled" && Array.isArray(approvalsResult.value)
            ? approvalsResult.value
            : []
        );
        setInvitations(
          invitationsResult.status === "fulfilled" && Array.isArray(invitationsResult.value)
            ? invitationsResult.value
            : []
        );
      } catch (error) {
        setLoadError(error?.message || "Failed to load users for RBAC management.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [loggedInClinicName, loggedInEmail]);

  const filteredUsers = useMemo(() => {
    const manageableUsers = users.filter(
      (user) => !isCurrentLoggedInUser(user, loggedInEmail)
    );
    const query = normalizeSearch(search);
    if (!query) {
      return manageableUsers;
    }

    return manageableUsers.filter((user) => {
      const haystack = [getDisplayName(user), user.email, user.role]
        .filter(Boolean)
        .join(" ");

      return normalizeSearch(haystack).includes(query);
    });
  }, [loggedInEmail, search, users]);

  const groupedUsers = useMemo(() => {
    return filteredUsers.reduce((acc, user) => {
      const key = user.role;
      if (!acc[key]) {
        acc[key] = {
          role: user.role,
          users: [],
        };
      }

      acc[key].users.push(user);
      return acc;
    }, {});
  }, [filteredUsers]);

  const selectedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          selectedUserIds.includes(getUserKey(user)) &&
          !isCurrentLoggedInUser(user, loggedInEmail)
      ),
    [loggedInEmail, selectedUserIds, users]
  );

  const selectedRoleSummary = useMemo(() => {
    return Array.from(new Set(selectedUsers.map((user) => user.role)));
  }, [selectedUsers]);

  const customRoleCount = useMemo(
    () => roleInventory.filter((role) => role.type !== "system" && role.isActive !== false).length,
    [roleInventory]
  );

  const usersOnCustomRoles = useMemo(
    () =>
      users.filter((user) => !MANAGED_SYSTEM_ROLES.includes(normalizeRole(user.role))).length,
    [users]
  );

  useEffect(() => {
    setSelectedUserIds((current) =>
      current.filter((userId) =>
        users.some(
          (user) =>
            getUserKey(user) === userId &&
            !isCurrentLoggedInUser(user, loggedInEmail)
        )
      )
    );
  }, [loggedInEmail, users]);

  const toggleUser = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const toggleRoleUsers = (roleUserIds) => {
    setSelectedUserIds((current) => {
      const normalizedCurrent = new Set(current);
      const everySelected = roleUserIds.every((id) => normalizedCurrent.has(id));

      if (everySelected) {
        return current.filter((id) => !roleUserIds.includes(id));
      }

      roleUserIds.forEach((id) => normalizedCurrent.add(id));
      return Array.from(normalizedCurrent);
    });
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const toggleRoleSection = (sectionKey) => {
    setCollapsedRoleSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const refreshUsersSnapshot = async () => {
    try {
      const fetchedUsers = await fetchDoctorsFromHistory(loggedInClinicName || undefined);
      const normalizedClinicName = normalizeClinicName(loggedInClinicName);
      const rolePermissions = buildRolePermissionsByName(roles);

      const normalizedUsers = (Array.isArray(fetchedUsers) ? fetchedUsers : [])
        .filter((user) => {
          if (normalizedClinicName) {
            return normalizeClinicName(user.clinicName) === normalizedClinicName;
          }

          const userEmail = (user.doctor_email || user.email || user.id || "")
            .trim()
            .toLowerCase();
          return userEmail === loggedInEmail;
        })
        .map((user) => {
          const roleName = getUserRole(user);

          return {
            ...user,
            role: roleName,
            effectivePermissions: computeEffectivePermissions(
              roleName,
              user.customPermissions,
              rolePermissions[roleName] || null
            ),
          };
        })
        .sort((a, b) =>
          getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
            sensitivity: "base",
          })
        );

      setUsers(normalizedUsers);
    } catch (error) {
      toast({
        title: "Failed to refresh users",
        description:
          error?.message || "User lists could not be refreshed right now.",
      });
    }
  };

  const applyOverride = async (permissionKey) => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    const nextLevel = draftLevels[permissionKey];

    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Choose one or more users before applying an override.",
      });
      return;
    }

    if (!nextLevel) {
      toast({
        title: "Select an override level",
        description: "Choose the user-specific access level before applying it.",
      });
      return;
    }

    setSavingPermissionKey(permissionKey);

    try {
      await manageRbacOverrides({
        userIds: selectedUsers.map((user) => user.userId || user.id),
        overrides: {
          [permissionKey]: nextLevel,
        },
      });

      const timestamp = new Date().toISOString();
      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (!selectedUserIds.includes(getUserKey(user))) {
            return user;
          }

          const customPermissions = {
            ...(user.customPermissions || {}),
            overrides: {
              ...(user.customPermissions?.overrides || {}),
              [permissionKey]: nextLevel,
            },
            lastUpdatedAt: timestamp,
          };

          return {
            ...user,
            customPermissions,
            effectivePermissions: computeEffectivePermissions(
              user.role,
              customPermissions,
              rolePermissionsByName[user.role] || null
            ),
          };
        })
      );

      toast({
        title: "Override applied",
        description: `${formatPermissionLabel(permissionKey)} set to ${nextLevel} for ${selectedUsers.length} user(s).`,
      });

      setDraftLevels((current) => ({
        ...current,
        [permissionKey]: "",
      }));
    } catch (error) {
      toast({
        title: "Failed to save override",
        description: error?.message || "The RBAC backend endpoint is not available yet.",
      });
    } finally {
      setSavingPermissionKey("");
    }
  };

  const applyRoleAssignment = async () => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Choose one or more users before assigning a role.",
      });
      return;
    }

    if (!selectedAssignmentRole) {
      toast({
        title: "Choose a role",
        description: "Pick a role before applying the assignment.",
      });
      return;
    }

    setAssigningRole(true);

    try {
      await assignRole({
        userIds: selectedUsers.map((user) => user.userId || user.id),
        roleName: selectedAssignmentRole,
        clinicName: loggedInClinicName || "",
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (!selectedUserIds.includes(getUserKey(user))) {
            return user;
          }

          return {
            ...user,
            role: selectedAssignmentRole,
            effectivePermissions: computeEffectivePermissions(
              selectedAssignmentRole,
              user.customPermissions,
              rolePermissionsByName[selectedAssignmentRole] || null
            ),
          };
        })
      );

      toast({
        title: "Role assigned",
        description: `${selectedAssignmentRole} applied to ${selectedUsers.length} user(s).`,
      });
    } catch (error) {
      toast({
        title: "Failed to assign role",
        description: error?.message || "The assign-role endpoint is not available yet.",
      });
    } finally {
      setAssigningRole(false);
    }
  };

  const openRoleEditor = (mode, role = null) => {
    if (!canWriteAdminSettings && mode !== "view") {
      setEditorMode("view");
      if (role) {
        setRoleForm(createRoleDraftFromDoc(role));
      }
      showReadOnlyToast();
      return;
    }

    setEditorMode(mode);

    if (mode === "create") {
      setRoleForm(createRoleDraft("Staff", rolePermissionsByName));
      return;
    }

    if (role) {
      setRoleForm(createRoleDraftFromDoc(role));
    }
  };

  const cancelRoleEditor = () => {
    setEditorMode("");
    setRoleForm(createRoleDraft("Staff", rolePermissionsByName));
  };

  const handleRoleFieldChange = (field, value) => {
    setRoleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleBaseRoleChange = (value) => {
    const nextBaseRole = normalizeRole(value) || "Staff";

    setRoleForm((current) => ({
      ...current,
      baseRoleClonedFrom: nextBaseRole,
      skipNpiValidation:
        nextBaseRole === "Staff" ? true : current.skipNpiValidation,
      permissions: {
        ...(rolePermissionsByName[nextBaseRole] ||
          getBasePermissionsForRole(nextBaseRole)),
      },
    }));
  };

  const handleRolePermissionChange = (permissionKey, level) => {
    setRoleForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permissionKey]: level,
      },
    }));
  };

  const saveRoleDefinition = async () => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    const trimmedRoleName = roleForm.roleName.trim();

    if (!trimmedRoleName) {
      toast({
        title: "Role name required",
        description: "Add a role name before saving.",
      });
      return;
    }

    setSavingRole(true);

    const payload = {
      clinicName: loggedInClinicName || "",
      roleName: trimmedRoleName,
      description: roleForm.description.trim(),
      baseRoleClonedFrom: roleForm.baseRoleClonedFrom || undefined,
      showInRegistration: roleForm.showInRegistration,
      skipNpiValidation: roleForm.skipNpiValidation,
      permissions: buildPermissionsMap(roleForm.permissions),
    };

    try {
      const fallbackRole = {
        ...payload,
        id: roleForm.id || trimmedRoleName.toLowerCase().replace(/\s+/g, "_"),
        type: roleForm.type || "custom",
        isActive: true,
      };

      const response =
        editorMode === "create"
          ? await createRole(payload)
          : await updateRole(roleForm.id, payload);

      const savedRole = createRoleDraftFromDoc(getRolePayload(response, fallbackRole));

      setRoles((currentRoles) => {
        const nextRoles = currentRoles.filter(
          (role) =>
            normalizeRole(role.roleName) !== normalizeRole(savedRole.roleName)
        );

        return [
          ...nextRoles,
          {
            ...savedRole,
            isActive: true,
          },
        ];
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (normalizeRole(user.role) !== normalizeRole(savedRole.roleName)) {
            return user;
          }

          return {
            ...user,
            effectivePermissions: computeEffectivePermissions(
              user.role,
              user.customPermissions,
              savedRole.permissions
            ),
          };
        })
      );

      toast({
        title: editorMode === "create" ? "Role created" : "Role updated",
        description: `${trimmedRoleName} is ready to use for ${loggedInClinicName || "your clinic"}.`,
      });

      cancelRoleEditor();
    } catch (error) {
      toast({
        title: "Failed to save role",
        description: error?.message || "The role management endpoint is not available yet.",
      });
    } finally {
      setSavingRole(false);
    }
  };

  const removeRoleDefinition = async () => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    if (!rolePendingDelete) {
      return;
    }

    const role = rolePendingDelete;
    const requiresReplacement = (role.userCount || 0) > 0;

    if (requiresReplacement && !deleteReplacementRole) {
      toast({
        title: "Choose a replacement role",
        description: `Assign ${role.userCount} user(s) on ${role.roleName} to another role before deleting it.`,
      });
      return;
    }

    setDeletingRoleId(role.id);

    try {
      await deleteRole(role.id, {
        clinicName: loggedInClinicName || "",
        replacementRoleName: requiresReplacement ? deleteReplacementRole : undefined,
      });

      setRoles((currentRoles) =>
        currentRoles.filter(
          (currentRole) =>
            normalizeRole(currentRole.roleName) !==
            normalizeRole(role.roleName)
        )
      );

      if (requiresReplacement) {
        setUsers((currentUsers) =>
          currentUsers.map((user) => {
            if (normalizeRole(user.role) !== normalizeRole(role.roleName)) {
              return user;
            }

            return {
              ...user,
              role: deleteReplacementRole,
              effectivePermissions: computeEffectivePermissions(
                deleteReplacementRole,
                user.customPermissions,
                rolePermissionsByName[deleteReplacementRole] || null
              ),
            };
          })
        );
      }

      if (normalizeRole(roleForm.roleName) === normalizeRole(role.roleName)) {
        cancelRoleEditor();
      }

      toast({
        title: "Role deleted",
        description: requiresReplacement
          ? `${role.roleName} has been removed and its users were reassigned to ${deleteReplacementRole}.`
          : `${role.roleName} has been removed from active custom roles.`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete role",
        description:
          error?.message || "The delete-role endpoint is not available yet.",
      });
    } finally {
      setDeletingRoleId("");
      setRolePendingDelete(null);
      setDeleteReplacementRole("");
    }
  };

  const handleApprovePendingUser = async (user) => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    setApprovingUserId(user.userId);

    try {
      const response = await approveUser(user.userId);
      const approvedUser = response?.user || {
        ...user,
        approvalStatus: "approved",
        prodAccessGranted: true,
      };

      setPendingApprovals((current) =>
        current.filter((entry) => entry.userId !== user.userId)
      );
      setUsers((current) =>
        current.map((entry) =>
          entry.userId === user.userId
            ? {
                ...entry,
                ...approvedUser,
              }
            : entry
        )
      );

      toast({
        title: "User approved",
        description: `${getDisplayName(user)} can now access the app.`,
      });
      await refreshUsersSnapshot();
    } catch (error) {
      toast({
        title: "Failed to approve user",
        description: error?.message || "Please try again.",
      });
    } finally {
      setApprovingUserId("");
    }
  };

  const handleRejectPendingUser = async (user) => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    setRejectingUserId(user.userId);

    try {
      const response = await rejectUser(user.userId);
      const rejectedUser = response?.user || {
        ...user,
        approvalStatus: "rejected",
        prodAccessGranted: false,
      };

      setPendingApprovals((current) =>
        current.filter((entry) => entry.userId !== user.userId)
      );
      setUsers((current) =>
        current.map((entry) =>
          entry.userId === user.userId
            ? {
                ...entry,
                ...rejectedUser,
              }
            : entry
        )
      );

      toast({
        title: "User rejected",
        description: `${getDisplayName(user)} no longer has a pending approval request.`,
      });
      setApprovalPendingReject(null);
      await refreshUsersSnapshot();
    } catch (error) {
      toast({
        title: "Failed to reject user",
        description: error?.message || "Please try again.",
      });
    } finally {
      setRejectingUserId("");
    }
  };

  const refreshPendingApprovals = async () => {
    setRefreshingApprovals(true);
    setApprovalsError("");

    try {
      const approvals = await fetchPendingApprovals();
      setPendingApprovals(Array.isArray(approvals) ? approvals : []);
      toast({
        title: "Pending approvals refreshed",
        description: "Latest approval requests are now shown.",
      });
    } catch (error) {
      const message =
        error?.message || "Pending approvals could not be refreshed right now.";
      setApprovalsError(message);
      toast({
        title: "Refresh failed",
        description: message,
      });
    } finally {
      setRefreshingApprovals(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    const normalizedEmail = invitationForm.email.trim().toLowerCase();
    const roleName = invitationForm.roleName;

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast({
        title: "Valid email required",
        description: "Add the teammate email before sending the invitation.",
      });
      return;
    }

    if (!roleName) {
      toast({
        title: "Role required",
        description: "Choose a role for the invited teammate.",
      });
      return;
    }

    const selectedRole = roleInventory.find(
      (role) => normalizeRole(role.roleName) === normalizeRole(roleName)
    );

    setSendingInvitation(true);

    try {
      const response = await sendInvitation({
        email: normalizedEmail,
        roleName,
        skipNpiValidation: Boolean(selectedRole?.skipNpiValidation),
      });

      if (response?.invitation) {
        setInvitations((current) => [response.invitation, ...current]);
      }

      setInvitationForm({
        email: "",
        roleName: "",
      });

      toast({
        title: "Invitation sent",
        description: `An invitation was sent to ${normalizedEmail}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error?.message || "Please check the SMTP settings and try again.",
      });
    } finally {
      setSendingInvitation(false);
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    if (!canWriteAdminSettings) {
      showReadOnlyToast();
      return;
    }

    setRevokingInvitationId(invitation.id);

    try {
      await revokeInvitation(invitation.id);
      setInvitations((current) => current.filter((entry) => entry.id !== invitation.id));
      toast({
        title: "Invitation revoked",
        description: `${invitation.invitedEmail} can no longer use that invitation.`,
      });
    } catch (error) {
      toast({
        title: "Failed to revoke invitation",
        description: error?.message || "Please try again.",
      });
    } finally {
      setRevokingInvitationId("");
    }
  };

  const isRoleReadOnly =
    !canWriteAdminSettings ||
    editorMode === "view" ||
    roleForm.type === "system" ||
    !editorMode;

  return (
    <div className="space-y-3 px-2 pb-4">
      <AlertDialog
        open={Boolean(rolePendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingRoleId) {
            setRolePendingDelete(null);
            setDeleteReplacementRole("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              {rolePendingDelete
                ? `${rolePendingDelete.roleName} will be removed from active custom roles.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rolePendingDelete ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {rolePendingDelete.userCount > 0
                  ? `${rolePendingDelete.userCount} user(s) are currently assigned to ${rolePendingDelete.roleName}. Choose a replacement role before deleting it.`
                  : "No users are currently assigned to this role, so it can be deleted immediately."}
              </div>
              {rolePendingDelete.userCount > 0 ? (
                <div className="space-y-2">
                  <label
                    htmlFor="replacement-role"
                    className="text-sm font-medium text-slate-900"
                  >
                    Reassign users to
                  </label>
                  <select
                    id="replacement-role"
                    value={deleteReplacementRole}
                    onChange={(event) => setDeleteReplacementRole(event.target.value)}
                    disabled={Boolean(deletingRoleId)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a replacement role</option>
                    {deleteReplacementRoleOptions.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName}
                      </option>
                    ))}
                  </select>
                  {deleteReplacementRoleOptions.length === 0 ? (
                    <p className="text-sm text-red-600">
                      Create another active role first so these users have somewhere to move.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingRoleId)}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={removeRoleDefinition}
              disabled={
                !canWriteAdminSettings ||
                Boolean(deletingRoleId) ||
                ((rolePendingDelete?.userCount || 0) > 0 && !deleteReplacementRole)
              }
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deletingRoleId ? "Deleting..." : "Delete role"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(approvalPendingReject)}
        onOpenChange={(open) => {
          if (!open && !rejectingUserId) {
            setApprovalPendingReject(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject pending user?</AlertDialogTitle>
            <AlertDialogDescription>
              {approvalPendingReject
                ? `${getDisplayName(approvalPendingReject)} will lose this pending request and stay blocked from app access until re-approved later.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(rejectingUserId)}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() =>
                approvalPendingReject
                  ? handleRejectPendingUser(approvalPendingReject)
                  : null
              }
              disabled={!canWriteAdminSettings || Boolean(rejectingUserId)}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {rejectingUserId ? "Rejecting..." : "Reject User"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageNavigation
        title="Admin Settings"
        subtitle={
          loggedInClinicName
            ? `Manage clinical team access, custom roles, and security permissions across ${loggedInClinicName}.`
            : "Manage your personal user record and clinical access."
        }
      />

      {!canWriteAdminSettings ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin Settings is in read-only mode for this user. Existing access can be reviewed, but it cannot be changed.
        </div>
      ) : null}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 px-2 border-b-2 font-medium text-[15px] transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "permissions" || activeTab === "roles" ? (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-blue-600" />
                Select Users
              </CardTitle>
              <Badge variant="outline">{selectedUsers.length} selected</Badge>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, role"
                className="pl-9"
              />
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <UserCog className="h-4 w-4" />
                Assign role to selected users
              </div>
              <div className="mt-3 space-y-3">
                <select
                  value={selectedAssignmentRole}
                  onChange={(event) => setSelectedAssignmentRole(event.target.value)}
                  disabled={!canWriteAdminSettings}
                  className="h-10 w-full rounded-md border border-blue-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a role</option>
                  {availableRoleOptions.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={applyRoleAssignment}
                  disabled={
                    !canWriteAdminSettings ||
                    assigningRole ||
                    selectedUsers.length === 0
                  }
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {assigningRole ? "Applying role..." : "Apply role"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Loading users...</div>
            ) : loadError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {loadError}
              </div>
            ) : users.length > 0 && filteredUsers.length === 0 && !search.trim() ? (
              <div className="text-sm text-gray-500">
                No other users are available to manage in Admin Settings.
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-sm text-gray-500">No users matched the current search.</div>
            ) : (
              <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
                {Object.values(groupedUsers)
                  .sort((a, b) => a.role.localeCompare(b.role))
                  .map((group) => {
                    const roleUserIds = group.users.map((user) => getUserKey(user));
                    const allRoleUsersSelected =
                      roleUserIds.length > 0 &&
                      roleUserIds.every((id) => selectedUserIds.includes(id));

                    return (
                      <div key={group.role} className="rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="font-medium text-gray-900">{group.role}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRoleUsers(roleUserIds)}
                            className="h-8 px-3 text-xs"
                          >
                            {allRoleUsersSelected ? "Unselect all" : "Select all"}
                          </Button>
                        </div>
                        <div className="space-y-3 p-4">
                          {group.users.map((user) => {
                            const userId = getUserKey(user);
                            return (
                              <label
                                key={userId}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                                  selectedUserIds.includes(userId)
                                    ? "border-blue-300 bg-blue-50/60 shadow-sm"
                                    : "border-transparent hover:bg-gray-50"
                                }`}
                              >
                                <Checkbox
                                  checked={selectedUserIds.includes(userId)}
                                  onCheckedChange={() => toggleUser(userId)}
                                />
                                <div className="flex bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-inner shrink-0 items-center justify-center rounded-full h-10 w-10 text-[13px] tracking-wider font-semibold">
                                  {getInitials(getDisplayName(user))}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold text-slate-800">
                                    {getDisplayName(user)}
                                  </div>
                                  <div className="truncate text-[11px] text-slate-500 font-medium">
                                    {user.email || user.id}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {rolesError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {rolesError}
            </div>
          ) : null}

          {activeTab === "permissions" ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Selected Users
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {selectedUsers.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Distinct Roles
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedRoleSummary.length > 0
                          ? selectedRoleSummary.join(", ")
                          : "None"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Override Mode
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        Bulk apply by permission
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedUsers.length === 0 ? (
                <Card className="border border-dashed border-gray-300 bg-white shadow-sm">
                  <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
                    <ShieldCheck className="mb-4 h-10 w-10 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Choose users to manage
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-gray-600">
                      Select one or more users from the left to compare their effective
                      permissions, review their role-based access, and apply
                      user-specific overrides only when needed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(permissionSections).map(([sectionKey, permissionKeys]) => (
                  <Card key={sectionKey} className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <CardTitle className="text-base">
                          {SECTION_LABELS[sectionKey] || sectionKey}
                        </CardTitle>
                        {collapsedSections[sectionKey] ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </CardHeader>
                    {!collapsedSections[sectionKey] ? (
                      <CardContent>
                        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          Update access only for the selected users. This does not change
                          the base role.
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[220px]">Permission</TableHead>
                              <TableHead>Selected Users</TableHead>
                              <TableHead className="w-[220px]">User-specific Override</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissionKeys.map((permissionKey) => {
                              const selectedLevels = selectedUsers.map((user) => {
                                const roleLevel = getRoleAccessLevel(
                                  user.role,
                                  permissionKey,
                                  rolePermissionsByName
                                );
                                const effectiveLevel = getPermissionLevel(
                                  user.effectivePermissions,
                                  permissionKey
                                );
                                const overriddenLevel =
                                  user.customPermissions?.overrides?.[permissionKey];

                                return {
                                  id: getUserKey(user),
                                  name: getDisplayName(user),
                                  role: user.role,
                                  roleLevel,
                                  level: effectiveLevel,
                                  overridden: overriddenLevel,
                                };
                              });
                              const overrideChoices = getMeaningfulOverrideChoices(
                                getOverrideOptionsForPermission(permissionKey),
                                selectedLevels
                              );
                              const selectedOverrideChoice = overrideChoices.find(
                                (choice) => choice.level === draftLevels[permissionKey]
                              );
                              const distinctSelectedAccess = Array.from(
                                new Set(selectedLevels.map((entry) => entry.level))
                              );

                              const highestAccess = selectedLevels.reduce(
                                (current, entry) => {
                                  if (!current) {
                                    return entry.level;
                                  }

                                  return ACCESS_HIERARCHY[entry.level] >
                                    ACCESS_HIERARCHY[current]
                                    ? entry.level
                                    : current;
                                },
                                null
                              );

                              return (
                                <TableRow key={permissionKey}>
                                  <TableCell className="align-top">
                                    <div className="font-medium text-gray-900">
                                      {formatPermissionLabel(permissionKey)}
                                    </div>
                                    {highestAccess ? (
                                      <>
                                        <Badge
                                          variant="outline"
                                          className={`mt-3 ${ACCESS_BADGE_STYLES[highestAccess]}`}
                                        >
                                          {distinctSelectedAccess.length > 1
                                            ? "Selected users have different access"
                                            : `Selected access: ${formatAccessLabel(highestAccess)}`}
                                        </Badge>
                                        {distinctSelectedAccess.length > 1 ? (
                                          <div className="mt-2 text-xs text-gray-500">
                                            {formatAccessCountSummary(
                                              selectedLevels.map((entry) => entry.level)
                                            )}
                                          </div>
                                        ) : null}
                                      </>
                                    ) : null}
                                  </TableCell>

                                  <TableCell className="align-top">
                                    <div className="flex flex-wrap gap-2">
                                      {selectedLevels.map((entry) => (
                                        <div
                                          key={`${permissionKey}-${entry.id}`}
                                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                        >
                                          <div className="text-xs font-medium text-gray-900">
                                            {entry.name}
                                          </div>
                                          <div className="text-[11px] text-gray-500">
                                            {entry.role}
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`mt-2 ${ACCESS_BADGE_STYLES[entry.level]}`}
                                          >
                                            Effective access: {formatAccessLabel(entry.level)}
                                          </Badge>
                                          {entry.overridden ? (
                                            <div className="mt-2 text-[11px] text-gray-500">
                                              Override applied:{" "}
                                              <span className="font-medium text-gray-700">
                                                {formatAccessLabel(entry.overridden)}
                                              </span>
                                            </div>
                                          ) : null}
                                          {entry.roleLevel !== entry.level ? (
                                            <div className="mt-1 text-[11px] text-gray-500">
                                              Role access:{" "}
                                              <span className="font-medium text-gray-700">
                                                {formatAccessLabel(entry.roleLevel)}
                                              </span>
                                            </div>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>

                                  <TableCell className="align-top">
                                    <div className="space-y-3">
                                      <select
                                        value={draftLevels[permissionKey] || ""}
                                        disabled={
                                          !canWriteAdminSettings ||
                                          overrideChoices.length === 0
                                        }
                                        title={
                                          overrideChoices.length > 0
                                            ? selectedLevels.length > 1
                                              ? "Choose bulk access update"
                                              : "Choose override level"
                                            : "No alternate override"
                                        }
                                        onChange={(event) =>
                                          setDraftLevels((current) => ({
                                            ...current,
                                            [permissionKey]: event.target.value,
                                          }))
                                        }
                                        className={`h-10 w-full rounded-md border px-3 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          overrideChoices.length === 0
                                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                            : "border-gray-300 bg-white text-gray-900"
                                        }`}
                                      >
                                        <option value="" disabled>
                                          {overrideChoices.length > 0
                                            ? selectedLevels.length > 1
                                              ? "Choose bulk update"
                                              : "Choose override level"
                                            : "No alternate override"}
                                        </option>
                                        {overrideChoices.map((choice) => (
                                          <option key={choice.level} value={choice.level}>
                                            {selectedLevels.length > 1
                                              ? `Set all to ${formatAccessLabel(choice.level)}`
                                              : `Set to ${formatAccessLabel(choice.level)}`}
                                          </option>
                                        ))}
                                      </select>
                                      {selectedOverrideChoice && selectedLevels.length > 1 ? (
                                        <p className="text-[11px] leading-5 text-gray-500">
                                          {selectedOverrideChoice.changedCount} of{" "}
                                          {selectedOverrideChoice.totalCount} selected users will
                                          change to {formatAccessLabel(selectedOverrideChoice.level)}.
                                        </p>
                                      ) : null}
                                      {overrideChoices.length === 0 ? (
                                        <p className="text-[11px] leading-5 text-gray-500">
                                          There is no other bulk access update available for the
                                          selected users on this permission.
                                        </p>
                                      ) : null}
                                      <Button
                                        onClick={() => applyOverride(permissionKey)}
                                        disabled={
                                          !canWriteAdminSettings ||
                                          savingPermissionKey === permissionKey ||
                                          !draftLevels[permissionKey] ||
                                          overrideChoices.length === 0
                                        }
                                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                      >
                                        {savingPermissionKey === permissionKey
                                          ? "Saving..."
                                          : "Apply"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    ) : null}
                  </Card>
                ))
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Total Roles
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {roleInventory.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Custom Roles
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {customRoleCount}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Users On Custom Roles
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {usersOnCustomRoles}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Clinic Roles</CardTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      System roles are read-only. Custom roles are scoped to the current clinic.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => openRoleEditor("create")}
                    disabled={!canWriteAdminSettings}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Role
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roleInventory.map((role) => (
                      <div
                        key={role.id || role.roleName}
                        className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{role.roleName}</h3>
                              <Badge variant="secondary" className="mt-2 tracking-wide text-[10px] uppercase bg-slate-100 text-slate-600 border-none">
                                {role.type === "system" ? "System Role" : "Custom Role"}
                              </Badge>
                            </div>
                            <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner">
                              <Users className="h-5 w-5" />
                            </div>
                          </div>
                          
                          <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium tracking-tight">Active Users</span>
                              <span className="font-semibold text-slate-900">{role.userCount || 0}</span>
                            </div>
                            {role.type !== "system" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium tracking-tight">Base Role</span>
                                <span className="font-medium text-slate-700">{role.baseRoleClonedFrom || "—"}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium tracking-tight">Registration</span>
                              <span className="font-medium text-slate-700">{role.showInRegistration ? "Visible" : "Hidden"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-2xl">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 bg-white border-slate-200 text-sm font-semibold hover:bg-slate-50 hover:text-blue-700 transition"
                            onClick={() =>
                              openRoleEditor(
                                role.type === "system" || !canWriteAdminSettings
                                  ? "view"
                                  : "edit",
                                role
                              )
                            }
                          >
                            {role.type === "system" || !canWriteAdminSettings ? "View Details" : "Edit Details"}
                          </Button>
                          {role.type !== "system" ? (
                            <Button
                              type="button"
                              className="px-3 shadow-none bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                              onClick={() => {
                                setRolePendingDelete(role);
                                setDeleteReplacementRole("");
                              }}
                              disabled={!canWriteAdminSettings || deletingRoleId === role.id}
                              title="Delete Role"
                            >
                              <Trash2 className="h-[18px] w-[18px]" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {editorMode === "create"
                        ? "Create Role"
                        : editorMode === "edit"
                        ? "Edit Role"
                        : editorMode === "view"
                        ? "Role Details"
                        : "Role Editor"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      {editorMode
                        ? "Define clinic-scoped role defaults, then refine permissions below."
                        : "Pick a role to edit or create a new role to start managing templates."}
                    </p>
                  </div>
                  {editorMode ? (
                    <Button type="button" variant="outline" onClick={cancelRoleEditor}>
                      Close
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {!editorMode ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      Select a role from the table or create a new one to edit permission defaults.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Role Name
                          </label>
                          <Input
                            value={roleForm.roleName}
                            onChange={(event) =>
                              handleRoleFieldChange("roleName", event.target.value)
                            }
                            disabled={isRoleReadOnly || editorMode === "edit"}
                            placeholder="Billing Specialist"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Clone From
                          </label>
                          <select
                            value={roleForm.baseRoleClonedFrom || ""}
                            onChange={(event) => handleBaseRoleChange(event.target.value)}
                            disabled={isRoleReadOnly || editorMode === "edit"}
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {availableRoleOptions.map((roleName) => (
                              <option key={roleName} value={roleName}>
                                {roleName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          value={roleForm.description}
                          onChange={(event) =>
                            handleRoleFieldChange("description", event.target.value)
                          }
                          disabled={isRoleReadOnly}
                          className="min-h-[96px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Handles billing workflows and financial reporting."
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Show In Registration
                            </div>
                            <div className="text-xs text-gray-500">
                              Allow self-registration with this role.
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={roleForm.showInRegistration}
                            onChange={(event) =>
                              handleRoleFieldChange(
                                "showInRegistration",
                                event.target.checked
                              )
                            }
                            disabled={isRoleReadOnly}
                            className="h-4 w-4"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Skip NPI Validation
                            </div>
                            <div className="text-xs text-gray-500">
                              Useful for non-clinical custom roles.
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={roleForm.skipNpiValidation}
                            onChange={(event) =>
                              handleRoleFieldChange(
                                "skipNpiValidation",
                                event.target.checked
                              )
                            }
                            disabled={isRoleReadOnly}
                            className="h-4 w-4"
                          />
                        </label>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(permissionSections).map(
                          ([sectionKey, permissionKeys]) => (
                            <div
                              key={`role-editor-${sectionKey}`}
                              className="rounded-xl border border-gray-200"
                            >
                              <button
                                type="button"
                                onClick={() => toggleRoleSection(sectionKey)}
                                className="flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-left"
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {SECTION_LABELS[sectionKey] || sectionKey}
                                </div>
                                {collapsedRoleSections[sectionKey] ? (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                              {!collapsedRoleSections[sectionKey] ? (
                                <div className="space-y-3 p-4">
                                  {permissionKeys.map((permissionKey) => (
                                    <div
                                      key={permissionKey}
                                      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-white p-3 md:grid-cols-[minmax(0,1fr)_180px]"
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {formatPermissionLabel(permissionKey)}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                          {permissionKey}
                                        </div>
                                      </div>
                                      <select
                                        value={roleForm.permissions?.[permissionKey] || "none"}
                                        onChange={(event) =>
                                          handleRolePermissionChange(
                                            permissionKey,
                                            event.target.value
                                          )
                                        }
                                        disabled={isRoleReadOnly}
                                        className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {OVERRIDE_OPTIONS.map((level) => (
                                          <option key={level} value={level}>
                                            {formatAccessLabel(level)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          )
                        )}
                      </div>

                      {!isRoleReadOnly ? (
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button type="button" variant="outline" onClick={cancelRoleEditor}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={saveRoleDefinition}
                            disabled={savingRole}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {savingRole
                              ? "Saving..."
                              : editorMode === "create"
                              ? "Create Role"
                              : "Save Changes"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      ) : activeTab === "approvals" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Pending Users
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {pendingApprovals.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Clinic
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {loggedInClinicName || "Current clinic"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Review Flow
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    Approve or reject access
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {approvalsError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {approvalsError}
            </div>
          ) : null}

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshPendingApprovals}
                disabled={refreshingApprovals}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshingApprovals ? "animate-spin" : ""}`}
                />
                {refreshingApprovals ? "Refreshing..." : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading pending approvals...</div>
              ) : pendingApprovals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                  No users are waiting for approval right now.
                </div>
              ) : (
                pendingApprovals.map((user) => (
                  <div
                    key={user.userId || user.id}
                    className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/50 to-white p-4 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500"></div>
                    <div className="flex items-center gap-4 pl-2">
                       <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[15px] font-bold text-blue-700 shadow-inner">
                         {getInitials(getDisplayName(user))}
                       </div>
                       <div>
                         <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                           {getDisplayName(user)}
                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase tracking-wider">{getUserRole(user)}</Badge>
                         </div>
                         <div className="mt-1 text-sm font-medium text-slate-600">
                           {(user.email || user.id || "").trim()}
                         </div>
                         <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                           <span>Registered {formatDateTime(user.updatedAt || user.created_at)}</span>
                           {user.invitedBy && <span>• Invited by {user.invitedBy}</span>}
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 md:pl-0 pl-16">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setApprovalPendingReject(user)}
                        disabled={
                          !canWriteAdminSettings ||
                          approvingUserId === user.userId ||
                          rejectingUserId === user.userId
                        }
                        className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold shadow-sm transition-all"
                      >
                        {rejectingUserId === user.userId ? "Rejecting..." : "Reject"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleApprovePendingUser(user)}
                        disabled={
                          !canWriteAdminSettings ||
                          approvingUserId === user.userId ||
                          rejectingUserId === user.userId
                        }
                        className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm transition-all px-6"
                      >
                        {approvingUserId === user.userId ? "Approving..." : "Approve Access"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Pending Invitations
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {invitations.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Role Options
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {availableRoleOptions.length} active roles
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Clinic
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {loggedInClinicName || "Current clinic"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {invitationsError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {invitationsError}
            </div>
          ) : null}

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Invite Team Members</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <Input
                value={invitationForm.email}
                onChange={(event) =>
                  setInvitationForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                disabled={!canWriteAdminSettings}
                placeholder="teammate@example.com"
              />
              <select
                value={invitationForm.roleName}
                onChange={(event) =>
                  setInvitationForm((current) => ({
                    ...current,
                    roleName: event.target.value,
                  }))
                }
                disabled={!canWriteAdminSettings}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a role</option>
                {availableRoleOptions.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={handleSendInvitation}
                disabled={!canWriteAdminSettings || sendingInvitation}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {sendingInvitation ? "Sending..." : "Send Invitation"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                  No active invitations have been sent yet.
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {invitation.invitedEmail}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {invitation.roleName}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Sent: {formatDateTime(invitation.createdAt)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRevokeInvitation(invitation)}
                      disabled={!canWriteAdminSettings || revokingInvitationId === invitation.id}
                    >
                      {revokingInvitationId === invitation.id ? "Revoking..." : "Revoke"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RBACManagement;

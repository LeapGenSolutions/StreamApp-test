import { useSelector } from "react-redux";
import { hasAnyPermission, hasPermission, getPermissionLevel } from "../lib/rbac";

export function usePermission(required, level = "read") {
  const effectivePermissions = useSelector(
    (state) => state.me?.me?.effectivePermissions
  );

  return hasPermission(effectivePermissions, required, level);
}

export function usePermissionLevel(required) {
  const effectivePermissions = useSelector(
    (state) => state.me?.me?.effectivePermissions
  );

  return getPermissionLevel(effectivePermissions, required);
}

export function useAnyPermission(checks = []) {
  const effectivePermissions = useSelector(
    (state) => state.me?.me?.effectivePermissions
  );

  return hasAnyPermission(effectivePermissions, checks);
}

import { Children, cloneElement, isValidElement } from "react";
import { cn } from "../../lib/utils";
import { usePermission } from "../../hooks/use-permission";

const HasPermission = ({
  required,
  level = "read",
  mode = "hide",
  fallback = null,
  children,
}) => {
  const allowed = usePermission(required, level);

  if (allowed) {
    return children;
  }

  if (mode === "disable") {
    const child = Children.only(children);

    if (isValidElement(child)) {
      return cloneElement(child, {
        disabled: true,
        "aria-disabled": true,
        className: cn(child.props.className, "pointer-events-none opacity-60"),
      });
    }
  }

  return fallback;
};

export default HasPermission;

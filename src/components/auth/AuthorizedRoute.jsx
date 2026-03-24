import { Route } from "wouter";
import { useAnyPermission } from "../../hooks/use-permission";
import AccessDenied from "./AccessDenied";

const AuthorizedRoute = ({
  path,
  component: Component,
  required,
  level = "read",
  checks,
  allow = false,
  fallback,
}) => {
  const hasAccess = useAnyPermission(
    checks || [{ required, level }]
  );

  return (
    <Route path={path}>
      {() =>
        allow || hasAccess ? (
          <Component />
        ) : (
          fallback || <AccessDenied />
        )
      }
    </Route>
  );
};

export default AuthorizedRoute;

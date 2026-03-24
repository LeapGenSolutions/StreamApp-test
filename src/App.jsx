import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import PostCallDocumentation from "./Pages/PostCallDocumentation";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./Pages/Dashboard";
import Appointments from "./Pages/Appointments";
import Patients from "./Pages/Patients";
import PatientReports from "./Pages/PatientReports";
import Reports from "./Pages/Reports";
import Settings from "./Pages/Settings";
import NotFound from "./Pages/not-found";
import VideoRecorder from "./Pages/VideoRecorder";
import AboutUs from "./Pages/AboutUs";
import Connect from "./Pages/Connect";
import ContactUs from "./Pages/ContactUs";
import Documentation from "./Pages/Documentation";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { loginRequest } from "./authConfig";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./redux/store";
import AuthPage from "./Pages/AuthPage";
import StreamVideoCoreV3 from "./Pages/StreamVideoCoreV3";
import setMyDetails from "./redux/me-actions";
import TimelineDashboard from "./Pages/TimelineDashboard";
import ChatbotWindow from "./components/chatbot/ChatbotWindow";
import BillingReports from "./Pages/BillingReports";
import BillingHistory from "./Pages/BillingHistory";
import AthenaIntegration from "./Pages/AthenaIntegration";
import PaymentBilling from "./Pages/PaymentBilling";
import RBACManagement from "./Pages/RBACManagement";
import AuthorizedRoute from "./components/auth/AuthorizedRoute";
import AccessDenied from "./components/auth/AccessDenied";
import { normalizeRole } from "./lib/rbac";

const queryClient = new QueryClient();

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT from URL token:", e);
    return null;
  }
}
function Router() {
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");
  const isPatientView = role === "patient";

  return (
    <div className="h-screen flex overflow-hidden">
      {!isPatientView && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <Switch>
            {/* Public Routes */}
            <Route path="/about" component={AboutUs} />
            <Route path="/connect" component={Connect} />
            <Route path="/contact" component={ContactUs} />
            <Route path="/documentation" component={Documentation} />
            {/* Timeline Route */}
            <Route path="/timeline" component={TimelineDashboard} />
            {/* Protected Routes */}
            <AuthorizedRoute
              path="/"
              component={Dashboard}
              required="dashboard.view_appointments"
              level="read"
            />
            <AuthorizedRoute
              path="/appointments"
              component={Appointments}
              required="appointments.select_providers"
              level="read"
            />
            <AuthorizedRoute
              path="/video-call"
              component={VideoRecorder}
              checks={[
                { required: "video_call.upcoming", level: "read" },
                { required: "video_call.history", level: "read" },
                { required: "video_call.add", level: "read" },
              ]}
            />
            <AuthorizedRoute
              path="/patients"
              component={Patients}
              required="patients.info"
              level="read"
            />
            <AuthorizedRoute
              path="/patients/:patientId"
              component={PatientReports}
              checks={[
                { required: "patients.info", level: "read" },
                { required: "patients.clinical_summary", level: "read" },
                { required: "patients.previous_calls", level: "read" },
              ]}
            />
            <AuthorizedRoute
              path="/reports"
              component={Reports}
              checks={[
                { required: "reports.billing_analytics", level: "read" },
                { required: "reports.billing_history", level: "read" },
                { required: "reports.estimated_billing", level: "read" },
              ]}
            />
            <AuthorizedRoute
              path="/reports/billing-analytics"
              component={BillingReports}
              required="reports.billing_analytics"
              level="read"
            />
            <AuthorizedRoute
              path="/reports/billing-history"
              component={BillingHistory}
              required="reports.billing_history"
              level="read"
            />
            <AuthorizedRoute
              path="/settings"
              component={Settings}
              checks={[
                { required: "settings.ehr_integration", level: "read" },
                { required: "settings.payment_billing", level: "read" },
              ]}
            />
            <AuthorizedRoute
              path="/settings/ehr-integration"
              component={AthenaIntegration}
              required="settings.ehr_integration"
              level="read"
            />
            <AuthorizedRoute
              path="/settings/payment-billing"
              component={PaymentBilling}
              required="settings.payment_billing"
              level="read"
            />
            <AuthorizedRoute
              path="/admin/rbac"
              component={RBACManagement}
              required="admin.manage_rbac"
              level="read"
            />
            <AuthorizedRoute
              path="/meeting-room/:callId"
              component={StreamVideoCoreV3}
              allow={isPatientView}
              checks={[
                { required: "appointments.join_call", level: "write" },
                { required: "patients.join_call", level: "write" },
                { required: "video_call.start", level: "write" },
              ]}
            />
            <AuthorizedRoute
              path="/post-call/:callId"
              component={PostCallDocumentation}
              required="post_call.view_all"
              level="read"
            />
            <Route component={NotFound} />
          </Switch>
          <ChatbotWindow/>
        </main>
      </div>
    </div>
  );
}

function Main() {
  const isAuthenticated = useIsAuthenticated();
  const [tokenBypass, setTokenBypass] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { instance, accounts } = useMsal();
  const dispatch = useDispatch();
  const me = useSelector((state) => state.me.me);
  const hasAppRole = Boolean(normalizeRole(me?.role));

  async function requestProfileData() {
    setIsAuthorizing(true);
    // Silently acquires an access token which is then attached to a request for MS Graph data
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      await dispatch(setMyDetails(response.idTokenClaims));
    } finally {
      setIsAuthorizing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      setIsAuthorizing(true);
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get("token");
        const storedToken = sessionStorage.getItem("bypassToken");
        const activeToken = tokenFromUrl || storedToken;

        if (activeToken) {
          if (tokenFromUrl) {
            sessionStorage.setItem("bypassToken", tokenFromUrl);
          }

          const claims = decodeJwt(activeToken);
          if (claims && isMounted) {
            await dispatch(setMyDetails(claims));
            setTokenBypass(true);
          }
          return;
        }

        if (isAuthenticated) {
          await requestProfileData();
        }
      } finally {
        if (isMounted) {
          setIsAuthorizing(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const accessDenied = (
    <AccessDenied
      title="Access pending"
      description="Your account is authenticated, but no completed Seismic app role is assigned yet."
    />
  );

  return (
    <>
      {tokenBypass ? (
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      ) : isAuthorizing && isAuthenticated ? (
        <AuthenticatedTemplate>
          <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
            Loading your access profile...
          </div>
        </AuthenticatedTemplate>
      ) : hasAppRole ? (
        <AuthenticatedTemplate>
          <QueryClientProvider client={queryClient}>
            <Router />
            <Toaster />
          </QueryClientProvider>
        </AuthenticatedTemplate>
      ) : (
        <AuthenticatedTemplate>{accessDenied}</AuthenticatedTemplate>
      )}
      {(!isAuthenticated && !tokenBypass) &&
        <UnauthenticatedTemplate>
          <AuthPage />
        </UnauthenticatedTemplate>
      }
    </>
  )
}

function App() {

  return (
    <Provider store={store}>
      <div className="App">
        <Main />
      </div>
    </Provider>
  );
}

export default App;

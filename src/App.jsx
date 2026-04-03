import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Toaster } from "./components/ui/toaster";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AuthorizedRoute from "./components/auth/AuthorizedRoute";
import AccessDenied from "./components/auth/AccessDenied";
import PostCallDocumentation from "./Pages/PostCallDocumentation";
import Dashboard from "./Pages/Dashboard";
import Appointments from "./Pages/Appointments";
import Patients from "./Pages/Patients";
import PatientReports from "./Pages/PatientReports";
import Reports from "./Pages/Reports";
import BillingReports from "./Pages/BillingReports";
import BillingHistory from "./Pages/BillingHistory";
import BillCalculation from "./Pages/BillCalculation";
import InvoicePreview from "./Pages/InvoicePreview";
import Settings from "./Pages/Settings";
import AthenaIntegration from "./Pages/AthenaIntegration";
import PaymentBilling from "./Pages/PaymentBilling";
import RBACManagement from "./Pages/RBACManagement";
import NotFound from "./Pages/not-found";
import VideoRecorder from "./Pages/VideoRecorder";
import AboutUs from "./Pages/AboutUs";
import AboutSeismic from "./Pages/AboutSeismic";
import Connect from "./Pages/Connect";
import ContactUs from "./Pages/ContactUs";
import Documentation from "./Pages/Documentation";
import AuthPage from "./Pages/AuthPage";
import StreamVideoCoreV3 from "./Pages/StreamVideoCoreV3";
import TimelineDashboard from "./Pages/TimelineDashboard";
import ChatbotWindow from "./components/chatbot/ChatbotWindow";
import { loginRequest } from "./authConfig";
import setMyDetails from "./redux/me-actions";
import { store } from "./redux/store";
import { normalizeRole } from "./lib/rbac";
import { BACKEND_URL } from "./constants";

const queryClient = new QueryClient();

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT from URL token:", error);
    return null;
  }
}

async function verifyStandaloneSession(idToken) {
  const claims = decodeJwt(idToken);
  if (!claims) {
    throw new Error("Invalid ID token");
  }

  const response = await fetch(`${BACKEND_URL}api/standalone/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken,
      email: claims.email || claims.emails?.[0] || "",
      userId: claims.sub || claims.oid || "",
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Failed to verify standalone session");
  }

  if (data?.token) {
    sessionStorage.setItem("backendToken", data.token);
  }

  return claims;
}
function Router() {
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");
  const isPatientView = role === "patient";
  const appointmentsRouteChecks = [
    { required: "appointments.select_providers", level: "read" },
    { required: "appointments.add", level: "write" },
    { required: "appointments.modify", level: "write" },
    { required: "appointments.delete", level: "write" },
    { required: "appointments.patient_reports", level: "read" },
    { required: "appointments.join_call", level: "write" },
    { required: "appointments.post_call_doc", level: "read" },
  ];
  const patientsRouteChecks = [
    { required: "patients.info", level: "read" },
    { required: "patients.clinical_summary", level: "read" },
    { required: "patients.upcoming_appointment", level: "write" },
    { required: "patients.join_call", level: "write" },
    { required: "patients.previous_calls", level: "read" },
    { required: "patients.post_call_doc", level: "read" },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {!isPatientView && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <Switch>
            <Route path="/about" component={AboutUs} />
            <Route path="/about/details" component={AboutSeismic} />
            <Route path="/connect" component={Connect} />
            <Route path="/contact" component={ContactUs} />
            <Route path="/documentation" component={Documentation} />
            <Route path="/timeline" component={TimelineDashboard} />

            <AuthorizedRoute
              path="/"
              component={Dashboard}
              allow
            />
            <AuthorizedRoute
              path="/appointments"
              component={Appointments}
              checks={appointmentsRouteChecks}
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
              checks={patientsRouteChecks}
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
              path="/billing-reports"
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
              path="/billing-history"
              component={BillingHistory}
              required="reports.billing_history"
              level="read"
            />
            <AuthorizedRoute
              path="/bill-calculation"
              component={BillCalculation}
              required="reports.estimated_billing"
              level="read"
            />
            <AuthorizedRoute
              path="/invoice/:invoiceId"
              component={InvoicePreview}
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
              path="/athena-integration"
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
              path="/payment-billing"
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
          <ChatbotWindow />
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
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const scopedToken = response.idToken || response.accessToken || "";
      if (scopedToken) {
        sessionStorage.setItem("authToken", scopedToken);
      }

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
            sessionStorage.setItem("authToken", tokenFromUrl);
          }

          try {
            const claims = await verifyStandaloneSession(activeToken);
            await dispatch(setMyDetails(claims));
            if (isMounted) {
              setTokenBypass(true);
            }
          } catch (error) {
            console.error("Standalone session verification failed:", error);
            sessionStorage.removeItem("bypassToken");
            sessionStorage.removeItem("backendToken");
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
  const registrationDenied = (
    <AccessDenied
      title="Registration incomplete"
      description="Please complete your standalone registration before opening the Seismic app."
    />
  );
  const pendingApprovalDenied = (
    <AccessDenied
      title="Approval pending"
      description="Your account is waiting for clinic administrator approval."
    />
  );
  const rejectedApprovalDenied = (
    <AccessDenied
      title="Access not approved"
      description="Your account has not been approved for Seismic app access."
    />
  );

  return (
    <>
      {tokenBypass ? (
        isAuthorizing ? (
          <div className="flex min-h-screen bg-neutral-50">
            {/* Skeleton sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-neutral-800 p-4 gap-4">
              <div className="h-10 w-32 bg-neutral-700 rounded animate-pulse" />
              <div className="space-y-3 mt-6">
                {[1,2,3,4].map(i => <div key={i} className="h-8 bg-neutral-700 rounded animate-pulse" />)}
              </div>
            </div>
            {/* Skeleton content */}
            <div className="flex-1 flex flex-col">
              <div className="h-14 bg-white border-b border-neutral-200 flex items-center px-6 gap-4">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                <div className="ml-auto h-8 w-8 bg-neutral-200 rounded-full animate-pulse" />
              </div>
              <div className="p-6 space-y-6">
                <div className="h-20 bg-white rounded-xl shadow-sm animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl shadow-sm animate-pulse" />)}
                </div>
              </div>
            </div>
          </div>
        ) : me?.profileComplete !== true ? (
          registrationDenied
        ) : me?.approvalStatus === "pending" ? (
          pendingApprovalDenied
        ) : me?.approvalStatus === "rejected" ? (
          rejectedApprovalDenied
        ) : hasAppRole ? (
          <QueryClientProvider client={queryClient}>
            <Router />
            <Toaster />
          </QueryClientProvider>
        ) : (
          accessDenied
        )
      ) : isAuthorizing && isAuthenticated ? (
        <AuthenticatedTemplate>
          <div className="flex min-h-screen bg-neutral-50">
            {/* Skeleton sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-neutral-800 p-4 gap-4">
              <div className="h-10 w-32 bg-neutral-700 rounded animate-pulse" />
              <div className="space-y-3 mt-6">
                {[1,2,3,4].map(i => <div key={i} className="h-8 bg-neutral-700 rounded animate-pulse" />)}
              </div>
            </div>
            {/* Skeleton content */}
            <div className="flex-1 flex flex-col">
              <div className="h-14 bg-white border-b border-neutral-200 flex items-center px-6 gap-4">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                <div className="ml-auto h-8 w-8 bg-neutral-200 rounded-full animate-pulse" />
              </div>
              <div className="p-6 space-y-6">
                <div className="h-20 bg-white rounded-xl shadow-sm animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl shadow-sm animate-pulse" />)}
                </div>
              </div>
            </div>
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

      {!isAuthenticated && !tokenBypass && (
        <UnauthenticatedTemplate>
          <AuthPage />
        </UnauthenticatedTemplate>
      )}
    </>
  );
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

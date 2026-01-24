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
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/store";
import AuthPage from "./Pages/AuthPage";
import StreamVideoCoreV3 from "./Pages/StreamVideoCoreV3";
import setMyDetails from "./redux/me-actions";
import TimelineDashboard from "./Pages/TimelineDashboard";
import ChatbotWindow from "./components/chatbot/ChatbotWindow";

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

  return (
    <div className="h-screen flex overflow-hidden">
      {role !== "patient" && <Sidebar />}
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
            <Route path="/" component={Dashboard} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/video-call" component={VideoRecorder} />
            <Route path="/patients" component={Patients} />
            <Route path="/patients/:patientId" component={PatientReports} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/meeting-room/:callId" component={StreamVideoCoreV3} />
            <Route path="/post-call/:callId" component={PostCallDocumentation} />
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
  const [tokenBypass, setTokenBypass] = useState(false)
  const { instance, accounts } = useMsal();
  const [hasRole, setHasRole] = useState(false)
  const dispatch = useDispatch()

  const queryClient = new QueryClient();

  function requestProfileData() {
    // Silently acquires an access token which is then attached to a request for MS Graph data
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        dispatch(setMyDetails(response.idTokenClaims))
        if (response.idTokenClaims.roles && response.idTokenClaims.roles.includes("SeismicDoctors")) {
          setHasRole(true)
        }
      });
  }

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = queryParams.get("token");
    const storedToken = sessionStorage.getItem("bypassToken");
    const activeToken = tokenFromUrl || storedToken;
    if (activeToken) {
      if (tokenFromUrl) {
        sessionStorage.setItem("bypassToken", tokenFromUrl);
      }
      const claims = decodeJwt(activeToken);
      if (claims) {
        const rolesFromToken = claims.roles || claims["roles"] || claims["role"] || [];
        const normalizedRoles = Array.isArray(rolesFromToken)
          ? rolesFromToken
          : [rolesFromToken].filter(Boolean);

        dispatch(setMyDetails(claims));
        if (normalizedRoles.includes("SeismicDoctors")) {
          setHasRole(true);
        }
      }
      setTokenBypass(true);
    } else if (isAuthenticated) {
      requestProfileData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])
  return (
    <>
      {hasRole || tokenBypass ? <AuthenticatedTemplate>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </AuthenticatedTemplate> :
        <AuthenticatedTemplate>
          Sign is successful but you dont previlaged role to view this app. Try contacting your admin
        </AuthenticatedTemplate>
      }
            {(!isAuthenticated && !tokenBypass) &&
        <UnauthenticatedTemplate>
          <AuthPage />
        </UnauthenticatedTemplate>
      }
      {tokenBypass && 
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>}
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

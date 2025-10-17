import { Link, useLocation } from "wouter";
import {
  LogOut,
  Calendar,
  Video,
  Users,
  FileText,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import Logo from "../../assets/Logo";        // Seismic Connect logo

const Sidebar = () => {
  const [location] = useLocation();
  const { instance, accounts } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect({
      account: accounts[0],
      postLogoutRedirectUri: "/",
    });
  };

  const isActive = (path) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-64 bg-neutral-800 text-white h-screen flex flex-col shadow-lg flex-shrink-0 justify-between">
      {/* --- Top: Product + Partner Branding --- */}
      <div>
        <div className="p-4 border-b border-neutral-700 flex flex-col items-center gap-2">
          {/* Seismic Connect logo + name */}
          <div className="flex items-center gap-2">
            <Logo size="medium" />
            <h1 className="text-xl font-semibold">Seismic Connect</h1>
          </div>
        </div>

        {/* --- Navigation Links --- */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Main
          </div>

          <Link href="/">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </div>
          </Link>

          <Link href="/appointments">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/appointments")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Appointments
            </div>
          </Link>

          <Link href="/video-call">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/video-call")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Video className="w-5 h-5 mr-3" />
              Video Call
            </div>
          </Link>

          <Link href="/patients">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/patients")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Patients
            </div>
          </Link>

          <div className="px-4 mt-6 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Administration
          </div>

          <Link href="/reports">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/reports")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Reports
            </div>
          </Link>

          <Link href="/settings">
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/settings")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </div>
          </Link>
        </nav>
      </div>

      {/* --- Bottom: Logout Only --- */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded hover:bg-neutral-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar
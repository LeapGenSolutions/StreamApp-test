import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LogOut,
  Calendar,
  Video,
  Users,
  FileText,
  Settings,
  LayoutDashboard,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import Logo from "../../assets/Logo"; // Seismic Connect logo
import { useAnyPermission, usePermission } from "../../hooks/use-permission";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { instance, accounts } = useMsal();
  const sidebarRef = useRef(null);
  const canViewDashboard = true;
  const canViewAppointments = useAnyPermission([
    { required: "appointments.select_providers", level: "read" },
    { required: "appointments.add", level: "write" },
    { required: "appointments.modify", level: "write" },
    { required: "appointments.delete", level: "write" },
    { required: "appointments.patient_reports", level: "read" },
    { required: "appointments.join_call", level: "write" },
    { required: "appointments.post_call_doc", level: "read" },
  ]);
  const canViewVideoCall = useAnyPermission([
    { required: "video_call.upcoming", level: "read" },
    { required: "video_call.history", level: "read" },
    { required: "video_call.add", level: "read" },
  ]);
  const canViewPatients = useAnyPermission([
    { required: "patients.info", level: "read" },
    { required: "patients.clinical_summary", level: "read" },
    { required: "patients.upcoming_appointment", level: "write" },
    { required: "patients.join_call", level: "write" },
    { required: "patients.previous_calls", level: "read" },
    { required: "patients.post_call_doc", level: "read" },
  ]);
  const canViewReports = useAnyPermission([
    { required: "reports.billing_analytics", level: "read" },
    { required: "reports.billing_history", level: "read" },
    { required: "reports.estimated_billing", level: "read" },
  ]);
  const canViewSettings = useAnyPermission([
    { required: "settings.ehr_integration", level: "read" },
    { required: "settings.payment_billing", level: "read" },
  ]);
  const canManageRbac = usePermission("admin.manage_rbac", "read");
  const hasAdminLinks = canViewReports || canViewSettings || canManageRbac;

  // Default: open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768; // desktop => open, mobile => closed
  });

  // When user is on the video/meeting routes we want a compact icons-only sidebar
  const isMeetingCompact = (() => {
    const pathname = location || "";
    return pathname.startsWith("/meeting-room");
  })();

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const handleLogout = () => {
    instance.logoutRedirect({
      account: accounts[0],
      postLogoutRedirectUri: "/",
    });

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const isActive = (path) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Handle breakpoint change only
  useEffect(() => {
    if (typeof window === "undefined") return;

    let prevIsDesktop = window.innerWidth >= 768;

    const handleResize = () => {
      const nowIsDesktop = window.innerWidth >= 768;
      if (prevIsDesktop !== nowIsDesktop) {
        setIsOpen(nowIsDesktop);
        prevIsDesktop = nowIsDesktop;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click outside (mobile only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (e) => {
      if (window.innerWidth >= 768 || !isOpen) return;
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={sidebarRef}
      data-sidebar
      className={`bg-neutral-800 text-white w-full flex flex-col justify-between shadow-lg flex-shrink-0 transition-all duration-300 z-30
        ${
          isMeetingCompact
            ? "h-screen md:w-16 md:h-screen" // compact icons-only during meeting
            : isOpen
            ? "h-screen md:w-64 md:h-screen" // when open: full height on mobile + desktop
            : "h-auto md:w-20 md:h-screen"   // when closed: icon rail on desktop, compact header on mobile
        }`}
    >
      <div className="flex-1 flex flex-col min-h-0">

        {/* Mobile header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-700 md:hidden">
          <button onClick={toggleSidebar} className="p-2 rounded hover:bg-neutral-700">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="small" />
            <h1 className="text-lg font-semibold">Seismic Connect</h1>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex border-b border-neutral-700">
          {isOpen && !isMeetingCompact ? (
            // OPEN: original clean layout
            <div className="flex items-center p-4 gap-3 w-full">
              <button onClick={toggleSidebar} className="p-2 rounded hover:bg-neutral-700">
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex gap-3 cursor-pointer" onClick={() => navigate("/")}>
                <Logo size="medium" />
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-semibold">Seismic</span>
                  <span className="text-xl font-semibold">Connect</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-2">
              <Logo size="small" />
              <button onClick={toggleSidebar} className="p-1 rounded hover:bg-neutral-700">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* --- Navigation Links (hidden when collapsed) --- */}
        <nav
          className={`border-t border-neutral-700 md:border-t-0 w-full flex-1 overflow-y-auto pb-4 md:py-4 min-h-0
          ${isOpen || isMeetingCompact ? "block" : "hidden md:block"}`}
        >
          <div className={`${isMeetingCompact || !isOpen ? "hidden" : "px-4 mt-4 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider"}`}>
            Main
          </div>

          {canViewDashboard && (
            <Link href="/">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Dashboard" : undefined}
                aria-label="Dashboard"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <LayoutDashboard className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Dashboard</span>
              </div>
            </Link>
          )}

          {canViewAppointments && (
            <Link href="/appointments">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Appointments" : undefined}
                aria-label="Appointments"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/appointments") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <Calendar className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Appointments</span>
              </div>
            </Link>
          )}

          {canViewVideoCall && (
            <Link href="/video-call">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Video Call" : undefined}
                aria-label="Video Call"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/video-call") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <Video className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Video Call</span>
              </div>
            </Link>
          )}

          {canViewPatients && (
            <Link href="/patients">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Patients" : undefined}
                aria-label="Patients"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/patients") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <Users className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Patients</span>
              </div>
            </Link>
          )}

          {hasAdminLinks && (
            <div className={`${isMeetingCompact || !isOpen ? 'hidden' : 'px-4 mt-6 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider'}`}>
              Administration
            </div>
          )}

          {canViewReports && (
            <Link href="/reports">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Billing Reports" : undefined}
                aria-label="Billing Reports"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/reports") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <FileText className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Billing Reports</span>
              </div>
            </Link>
          )}

          {canViewSettings && (
            <Link href="/settings">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Settings" : undefined}
                aria-label="Settings"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/settings") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <Settings className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Settings</span>
              </div>
            </Link>
          )}

          {canManageRbac && (
            <Link href="/admin/rbac">
              <div
                onClick={handleNavClick}
                title={!isOpen ? "Admin Settings" : undefined}
                aria-label="Admin Settings"
                className={`flex items-center py-3 cursor-pointer
                  ${isOpen ? "px-4" : "justify-center"}
                  ${isActive("/admin/rbac") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
              >
                <ShieldCheck className={`w-5 h-5 ${isMeetingCompact || !isOpen ? 'mx-auto' : 'mr-3'}`} />
                <span className={`${isMeetingCompact || !isOpen ? 'hidden' : ''}`}>Admin Settings</span>
              </div>
            </Link>
          )}
        </nav>
      </div>

      {/* --- Bottom: Logout --- */}
      {!isMeetingCompact && (
        <div className={`border-t border-neutral-700 md:block ${isOpen ? "p-4" : "p-3"}`}>
          <button
            onClick={handleLogout}
            title={!isOpen ? "Logout" : undefined}
            aria-label="Logout"
            className={`flex items-center justify-center w-full text-sm font-medium text-white bg-neutral-700 rounded hover:bg-neutral-600 ${
              isOpen ? "px-4 py-2" : "px-0 py-2"
            }`}
          >
            <LogOut className={`w-4 h-4 ${isOpen ? "mr-2" : ""}`} />
            <span className={isOpen ? "" : "hidden"}>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar

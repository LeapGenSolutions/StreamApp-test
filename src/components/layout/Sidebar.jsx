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
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import Logo from "../../assets/Logo"; // Seismic Connect logo

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { instance, accounts } = useMsal();
  const sidebarRef = useRef(null);

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
            : "h-auto md:w-10 md:h-screen"   // when closed: auto height on mobile, full height on desktop
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
          ${isOpen || isMeetingCompact ? "block" : "hidden"}`}
        >
          <div className={`${isMeetingCompact ? "hidden" : "px-4 mt-4 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider"}`}>
            Main
          </div>

          <Link href="/">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Dashboard" : undefined}
              aria-label="Dashboard"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <LayoutDashboard className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Dashboard</span>
            </div>
          </Link>

          <Link href="/appointments">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Appointments" : undefined}
              aria-label="Appointments"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/appointments") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <Calendar className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Appointments</span>
            </div>
          </Link>

          <Link href="/video-call">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Video Call" : undefined}
              aria-label="Video Call"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/video-call") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <Video className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Video Call</span>
            </div>
          </Link>

          <Link href="/patients">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Patients" : undefined}
              aria-label="Patients"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/patients") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <Users className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Patients</span>
            </div>
          </Link>

          <div className={`${isMeetingCompact ? 'hidden' : 'px-4 mt-6 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider'}`}>
            Administration
          </div>

          <Link href="/reports">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Billing Reports" : undefined}
              aria-label="Billing Reports"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/reports") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <FileText className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Billing Reports</span>
            </div>
          </Link>

          <Link href="/settings">
            <div
              onClick={handleNavClick}
              title={!isOpen ? "Settings" : undefined}
              aria-label="Settings"
              className={`flex items-center py-3 cursor-pointer
                ${isOpen ? "px-4" : "justify-center"}
                ${isActive("/settings") ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-700"}`}
            >
              <Settings className={`w-5 h-5 ${isMeetingCompact ? 'mx-auto' : 'mr-3'}`} />
              <span className={`${isMeetingCompact ? 'hidden' : ''}`}>Settings</span>
            </div>
          </Link>
        </nav>
      </div>

      {/* --- Bottom: Logout Only (hide when sidebar closed on both mobile + desktop) --- */}
      {isOpen && !isMeetingCompact && (
        <div className="p-4 border-t border-neutral-700 md:block">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded hover:bg-neutral-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar
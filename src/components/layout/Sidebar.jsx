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
import Logo from "../../assets/Logo";        // Seismic Connect logo

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { instance, accounts } = useMsal();

  // ref to detect clicks outside sidebar
  const sidebarRef = useRef(null);

  // Default: open on desktop (>=768px), closed on mobile (<768px)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768; // desktop => open, mobile => closed
  });

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const handleLogout = () => {
    instance.logoutRedirect({
      account: accounts[0],
      postLogoutRedirectUri: "/",
    });

    // Auto-close only on mobile after logout
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const isActive = (path) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Close the menu on nav click – but only on mobile
  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Keep sidebar in sync ONLY when crossing mobile/desktop breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return;

    let previousIsDesktop = window.innerWidth >= 768;

    const handleResize = () => {
      const nowIsDesktop = window.innerWidth >= 768;

      // Only react if we crossed the breakpoint
      if (previousIsDesktop !== nowIsDesktop) {
        setIsOpen(nowIsDesktop); // open on desktop, close on mobile
        previousIsDesktop = nowIsDesktop;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click-outside handler for mobile (no overlay, no dimming)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (event) => {
      // Only care on mobile & when open
      if (window.innerWidth >= 768 || !isOpen) return;

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`bg-neutral-800 text-white w-full flex flex-col justify-between shadow-lg flex-shrink-0 transition-all duration-300 z-30
        ${
          isOpen
            ? "h-screen md:w-64 md:h-screen" // when open: full height on mobile + desktop
            : "h-auto md:w-10 md:h-screen"   // when closed: auto height on mobile, full height on desktop
        }`}
    >
      {/* ---- HEADER + NAV WRAPPER (takes all available height) ---- */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* --- Mobile Top Bar (always shows hamburger) --- */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-700 md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-neutral-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Logo size="small" />
            <h1 className="text-lg font-semibold">Seismic Connect</h1>
          </div>
        </div>

        {/* --- Desktop Header (different layout when collapsed vs open) --- */}
        <div className="hidden md:flex border-b border-neutral-700">
          {isOpen ? (
            // OPEN: original clean layout
            <div className="flex items-center p-4 gap-3 w-full">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded hover:bg-neutral-700"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div
                className="flex items-stretch gap-3 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <div className="flex items-center">
                  <Logo size="medium" />
                </div>

                <div className="flex flex-col justify-between leading-tight">
                  <span className="text-xl font-semibold">Seismic</span>
                  <span className="text-xl font-semibold">Connect</span>
                </div>
              </div>
            </div>
          ) : (
            // COLLAPSED: logo on top, hamburger below
            <div className="flex flex-col items-center justify-center w-full py-3 gap-2">
              <div
                className="cursor-pointer flex items-center justify-center"
                onClick={() => navigate("/")}
              >
                <Logo size="small" />
              </div>

              <button
                onClick={toggleSidebar}
                className="p-1 rounded hover:bg-neutral-700"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* --- Navigation Links (hidden when collapsed) --- */}
        <nav
          className={`border-t border-neutral-700 md:border-t-0 w-full flex-1 overflow-y-auto pb-4 md:py-4 min-h-0
          ${isOpen ? "block" : "hidden"}`}
        >
          <div className="px-4 mt-4 mb-3 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Main
          </div>

          <Link href="/">
            <div
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
              className={`flex items-center px-4 py-3 cursor-pointer ${
                isActive("/reports")
                  ? "text-white bg-blue-600"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Billing Reports
            </div>
          </Link>

          <Link href="/settings">
            <div
              onClick={handleNavClick}
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

      {/* --- Bottom: Logout Only (hide when sidebar closed on both mobile + desktop) --- */}
      {isOpen && (
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
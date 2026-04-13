import { useState, useRef, useEffect } from "react";
import { Bell, User, Settings, ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "wouter";
import { normalizeRole } from "../../lib/rbac";
import { resolveUserNameParts } from "../../lib/userName";

const Header = () => {
  const [location] = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = useSelector((state) => state.me.me);
  const displayRole = normalizeRole(user?.role) || "Staff";
  const { firstName, fullName } = resolveUserNameParts(user || {});

  const isActive = (path) => location === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = fullName || "User";
  const initials = firstName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">

        {/* --- Left Navigation --- */}
        <nav
          className="
            order-2 sm:order-1
            flex items-center gap-1
            whitespace-nowrap overflow-x-auto
            max-w-full
            flex-1 min-w-0
          "
        >
          <Link
            href="/documentation"
            className={`px-2 sm:px-3 py-1 text-sm sm:text-base cursor-pointer transition-colors ${isActive("/documentation")
              ? "font-bold underline underline-offset-4 text-black"
              : "text-neutral-600 hover:text-black"
              }`}
          >
            Documentation
          </Link>

          <Link
            href="/connect"
            className={`px-2 sm:px-3 py-1 text-sm sm:text-base transition-colors ${isActive("/connect")
              ? "font-bold underline underline-offset-4 text-black"
              : "text-neutral-600 hover:text-black"
              }`}
          >
            Connect
          </Link>

          <Link
            href="/about"
            className={`px-2 sm:px-3 py-1 text-sm sm:text-base transition-colors ${isActive("/about")
              ? "font-bold underline underline-offset-4 text-black"
              : "text-neutral-600 hover:text-black"
              }`}
          >
            About Us
          </Link>

          <Link
            href="/contact"
            className={`px-2 sm:px-3 py-1 text-sm sm:text-base transition-colors ${isActive("/contact")
              ? "font-bold underline underline-offset-4 text-black"
              : "text-neutral-600 hover:text-black"
              }`}
          >
            Support
          </Link>
        </nav>

        {/* --- Right: Bell + Avatar --- */}
        <div className="order-1 sm:order-2 flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* Clinic Name */}
          {user?.clinicName && (
            <span className="hidden sm:block text-sm font-medium text-neutral-500">
              {user.clinicName}
            </span>
          )}

          {/* Bell Icon */}
          <button className="p-1.5 sm:p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Clickable Avatar */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full focus:outline-none hover:opacity-80 transition-opacity"
              aria-label="Open profile menu"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-blue-100">
                  {initials}
                </div>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
                      <p className="text-xs text-blue-600 font-medium">{displayRole}</p>
                      {user?.email && (
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    href="/profile-settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

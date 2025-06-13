import { Bell, Search } from "lucide-react";
import { useSelector } from "react-redux";

const Header = () => {

  const user = useSelector((state)=>state.me.me)

  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-neutral-800">
            Healthcare Dashboard
          </h1>
          {role !== "patient" && (
            <div className="hidden md:flex items-center ml-6 space-x-4">
              <div
                className="text-sm text-primary-500 font-medium cursor-pointer"
                onClick={() => (window.location.href = "/")}
              >
                Overview
              </div>
              <div
                className="text-sm text-neutral-500 hover:text-neutral-800 cursor-pointer"
                onClick={() => (window.location.href = "/appointments")}
              >
                Appointments
              </div>
              <div
                className="text-sm text-neutral-500 hover:text-neutral-800 cursor-pointer"
                onClick={() => (window.location.href = "/patients")}
              >
                Patients
              </div>
              <div
                className="text-sm text-neutral-500 hover:text-neutral-800 cursor-pointer"
                onClick={() => (window.location.href = "/reports")}
              >
                Reports
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64 text-sm"
            />
            <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-2.5" />
          </div>

          <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full">
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-sm">
                  {user?.given_name?.charAt(0) || "U"}
                </div>
              )}
              <div className="ml-2">
                <p className="text-sm font-medium text-neutral-800">
                  {user?.given_name || "Loading..."}
                </p>
                <p className="text-xs text-neutral-500">
                  {user?.specialty || user?.role || "Staff"}
                </p>
              </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

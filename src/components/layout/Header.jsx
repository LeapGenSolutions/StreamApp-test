import { Bell, Search, MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import SalesModal from "./SalesModal";

const Header = () => {
  const [location] = useLocation();
  const [showSalesModal, setShowSalesModal] = useState(false);

  const user = useSelector((state) => state.me.me)

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-1">
          <Link href="/documentation">
            <a href="!#" className={`px-3 py-1 text-base font-normal transition-colors ${location === "/documentation" ? "font-bold underline underline-offset-4 text-black" : "text-neutral-600 hover:text-black"}`}>Documentation</a>
          </Link>
          <Link href="/connect">
            <a href="!#" className={`px-3 py-1 text-base font-normal transition-colors ${location === "/connect" ? "font-bold underline underline-offset-4 text-black" : "text-neutral-600 hover:text-black"}`}>Connect</a>
          </Link>
          <Link href="/about">
            <a href="!#" className={`px-3 py-1 text-base font-normal transition-colors ${location === "/about" ? "font-bold underline underline-offset-4 text-black" : "text-neutral-600 hover:text-black"}`}>About Us</a>
          </Link>
          <Link href="/contact">
            <a href="!#" className={`px-3 py-1 text-base font-normal transition-colors ${location === "/contact" ? "font-bold underline underline-offset-4 text-black" : "text-neutral-600 hover:text-black"}`}>Contact Us</a>
          </Link>
        </nav>
        <button
          className="ml-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          onClick={() => setShowSalesModal(true)}
        >
          <MessageSquare className="w-4 h-4" />
          Contact Sales
        </button>
        <div className="flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-8 pr-3 py-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 w-40 text-sm transition"
              style={{ minWidth: 0 }}
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-2 top-2.5" />
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
      {showSalesModal && (
        <SalesModal onClose={() => setShowSalesModal(false)} />
      )}
    </header>
  );
};

export default Header;

import { FaBars, FaBell, FaUserCircle } from "react-icons/fa";
import { useSelector } from "react-redux";

const Navbar = ({ onMenuClick }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left — Hamburger for mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Page title — hidden on mobile */}
      <div className="hidden lg:block">
        <p className="text-gray-500 text-sm">
          Welcome back,{" "}
          <span className="font-semibold text-gray-800">{user?.name}</span> 👋
        </p>
      </div>

      {/* Right — Notification + Profile */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition">
          <FaBell className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800 leading-none">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

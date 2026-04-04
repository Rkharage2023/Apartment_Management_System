import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaHome,
  FaMoneyBill,
  FaExclamationCircle,
  FaBullhorn,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
  FaTrash,
  FaSignOutAlt,
  FaTimes,
  FaCity,
} from "react-icons/fa";

// Admin nav links
const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: <FaHome /> },
  { to: "/admin/societies", label: "Societies", icon: <FaCity /> },
  { to: "/admin/flats", label: "Flats", icon: <FaBuilding /> },
  { to: "/admin/billing", label: "Billing", icon: <FaMoneyBill /> },
  {
    to: "/admin/complaints",
    label: "Complaints",
    icon: <FaExclamationCircle />,
  },
  { to: "/admin/notices", label: "Notices", icon: <FaBullhorn /> },
  { to: "/admin/visitors", label: "Visitors", icon: <FaUserFriends /> },
  { to: "/admin/parking", label: "Parking", icon: <FaCar /> },
  { to: "/admin/events", label: "Events", icon: <FaCalendarAlt /> },
  { to: "/admin/waste", label: "Waste", icon: <FaTrash /> },
];

// Resident nav links
const residentLinks = [
  { to: "/resident", label: "Dashboard", icon: <FaHome /> },
  { to: "/resident/my-flat", label: "My Flat", icon: <FaBuilding /> },
  { to: "/resident/my-bills", label: "My Bills", icon: <FaMoneyBill /> },
  {
    to: "/resident/my-complaints",
    label: "Complaints",
    icon: <FaExclamationCircle />,
  },
  { to: "/resident/my-visitors", label: "Visitors", icon: <FaUserFriends /> },
  { to: "/resident/my-parking", label: "Parking", icon: <FaCar /> },
];

const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const links = user?.role === "admin" ? adminLinks : residentLinks;

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <FaBuilding className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none">
                ApartmentMS
              </h1>
              <p className="text-gray-400 text-xs mt-0.5 capitalize">
                {user?.role} Panel
              </p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin" || link.to === "/resident"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-150"
          >
            <FaSignOutAlt className="text-base" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

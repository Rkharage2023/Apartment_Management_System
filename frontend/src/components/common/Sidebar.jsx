import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import API from "../../api/axios";
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
  FaUsers,
  FaKey,
  FaLock,
} from "react-icons/fa";

// Admin nav links
const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: <FaHome /> },
  { to: "/admin/societies", label: "Societies", icon: <FaCity /> },
  { to: "/admin/flats", label: "Flats", icon: <FaBuilding /> },
  { to: "/admin/billing", label: "Billing", icon: <FaMoneyBill /> },
  { to: "/admin/complaints", label: "Complaints", icon: <FaExclamationCircle /> },
  { to: "/admin/notices", label: "Notices", icon: <FaBullhorn /> },
  { to: "/admin/visitors", label: "Visitors", icon: <FaUserFriends /> },
  { to: "/admin/parking", label: "Parking", icon: <FaCar /> },
  { to: "/admin/events", label: "Events", icon: <FaCalendarAlt /> },
  { to: "/admin/waste", label: "Waste", icon: <FaTrash /> },
  { to: "/admin/users", label: "Users", icon: <FaUsers /> },
];

// Security Guard nav links
const securityLinks = [
  { to: "/admin", label: "Dashboard", icon: <FaHome /> },
  { to: "/admin/visitors", label: "Visitors & Gate Pass", icon: <FaUserFriends /> },
  { to: "/admin/parking", label: "Parking Logs", icon: <FaCar /> },
  { to: "/admin/complaints", label: "Complaints", icon: <FaExclamationCircle /> },
  { to: "/admin/notices", label: "Notices", icon: <FaBullhorn /> },
];

// Maintenance Staff nav links
const staffLinks = [
  { to: "/admin", label: "Dashboard", icon: <FaHome /> },
  { to: "/admin/complaints", label: "Complaints & Maintenance", icon: <FaExclamationCircle /> },
  { to: "/admin/waste", label: "Waste Collection", icon: <FaTrash /> },
  { to: "/admin/notices", label: "Notices", icon: <FaBullhorn /> },
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
  { to: "/resident/notices", label: "Notices", icon: <FaBullhorn /> },
  { to: "/resident/events", label: "Events", icon: <FaCalendarAlt /> },
  { to: "/resident/my-visitors", label: "Visitors", icon: <FaUserFriends /> },
  { to: "/resident/my-parking", label: "Parking", icon: <FaCar /> },
];

const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "security"
      ? securityLinks
      : user?.role === "staff"
      ? staffLinks
      : residentLinks;

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout API call error:", err);
    }
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill all required fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      setChanging(true);
      await API.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChanging(false);
    }
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
          fixed top-0 left-0 h-screen w-64 bg-gray-900 z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-full lg:z-auto shrink-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700 shrink-0">
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
        <div className="px-6 py-4 border-b border-gray-700 shrink-0">
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
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
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

        {/* Footer Actions */}
        <div className="px-3 py-4 border-t border-gray-700 space-y-1 shrink-0">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-150"
          >
            <FaKey className="text-base text-amber-400" />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-150"
          >
            <FaSignOutAlt className="text-base" />
            Logout
          </button>
        </div>
      </aside>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaLock className="text-amber-500" /> Change Your Password
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your security credentials for account safety
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changing}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                >
                  {changing ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

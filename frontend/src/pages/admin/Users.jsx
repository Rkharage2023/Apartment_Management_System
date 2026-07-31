import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaUsers, FaPlus, FaSearch, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaUserShield, FaUserTie, FaBuilding } from "react-icons/fa";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "resident",
    flatNumber: "",
    isVerified: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = filterRole ? `?role=${filterRole}` : "";
      const res = await API.get(`/users${query}`);
      setUsers(res.data.users);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "resident",
      flatNumber: "",
      isVerified: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      password: "",
      phone: u.phone || "",
      role: u.role || "resident",
      flatNumber: u.flatNumber || "",
      isVerified: u.isVerified ?? true,
    });
    setShowModal(true);
  };

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/users/${id}/role`, { role });
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleToggleVerify = async (id) => {
    try {
      const res = await API.put(`/users/${id}/verify`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to toggle verification state");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitLoading(true);
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, formData);
        toast.success(`User "${formData.name}" updated!`);
      } else {
        await API.post(`/users`, formData);
        toast.success(`User "${formData.name}" created successfully!`);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.flatNumber?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const roleColors = {
    admin: "bg-red-100 text-red-700 border-red-200",
    resident: "bg-blue-100 text-blue-700 border-blue-200",
    security: "bg-amber-100 text-amber-700 border-amber-200",
    staff: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const roleIcons = {
    admin: <FaUserShield className="text-red-500" />,
    resident: <FaBuilding className="text-blue-500" />,
    security: <FaUserShield className="text-amber-500" />,
    staff: <FaUserTie className="text-emerald-500" />,
  };

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, resident: 0, security: 0, staff: 0 };
    users.forEach((u) => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return counts;
  }, [users]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUsers className="text-primary-600" /> Users & Staff Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage system roles, security officers, maintenance staff, and residents — {users.length} total accounts
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm hover:shadow"
        >
          <FaPlus /> Add New User / Staff
        </button>
      </div>

      {/* Summary Role Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div
            key={role}
            onClick={() => setFilterRole(filterRole === role ? "" : role)}
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              roleColors[role]
            } ${filterRole === role ? "ring-2 ring-primary-500 shadow-sm" : "hover:shadow-sm"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider">{role}s</span>
              {roleIcons[role]}
            </div>
            <p className="text-3xl font-extrabold mt-2">{count}</p>
          </div>
        ))}
      </div>

      {/* Search & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, email, phone or flat number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "admin", "resident", "security", "staff"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                filterRole === r
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
              }`}
            >
              {r === "" ? "All Roles" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No users found matching filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">User Profile</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Contact</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Flat No</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Verification</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.phone || "No phone registered"}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {u.flatNumber ? (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                          {u.flatNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold border border-transparent cursor-pointer outline-none transition ${roleColors[u.role]}`}
                      >
                        {["admin", "resident", "security", "staff"].map((r) => (
                          <option key={r} value={r}>
                            {r.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleVerify(u._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                          u.isVerified
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                        title="Click to toggle verification status"
                      >
                        {u.isVerified ? (
                          <>
                            <FaCheckCircle className="text-green-600 text-xs" /> Verified
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="text-rose-600 text-xs" /> Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingUser ? "Edit User Account" : "Create New User / Staff Account"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingUser
                  ? "Update profile details, permissions, and roles."
                  : "Provision a new resident, security guard, or maintenance staff profile."}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@apartment.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="resident">Resident</option>
                    <option value="security">Security Guard</option>
                    <option value="staff">Maintenance Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Flat / Unit Number</label>
                  <input
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    placeholder="e.g. A-102"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isVerified" className="text-xs font-medium text-gray-700">
                  Mark Account as Verified & Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                >
                  {submitLoading ? "Saving..." : editingUser ? "Update User" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Users;

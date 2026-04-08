import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaUsers } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = filterRole ? `?role=${filterRole}` : "";
      const res = await API.get(`${API_URL}/users${query}`);
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

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`${API_URL}/users/${id}/role`, { role });
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`${API_URL}/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const roleColors = {
    admin: "bg-red-100 text-red-600",
    resident: "bg-blue-100 text-blue-600",
    security: "bg-yellow-100 text-yellow-600",
    staff: "bg-green-100 text-green-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all system users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "admin", "resident", "security", "staff"].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filterRole === r
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
            }`}
          >
            {r === "" ? "All" : r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Phone
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Flat
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Joined
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.phone || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.flatNumber || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u._id, e.target.value)
                        }
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleColors[u.role]}`}
                      >
                        {["admin", "resident", "security", "staff"].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Users;

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaUserFriends, FaBan } from "react-icons/fa";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterPurpose) query += `purpose=${filterPurpose}&`;
      if (filterStatus) query += `approvalStatus=${filterStatus}`;
      const res = await API.get(`/visitors${query}`);
      setVisitors(res.data.visitors);
    } catch (error) {
      toast.error("Failed to fetch visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [filterPurpose, filterStatus]);

  const handleBlacklist = async (id) => {
    if (!window.confirm("Blacklist this visitor?")) return;
    try {
      await API.put(`/visitors/${id}/blacklist`);
      toast.success("Visitor blacklisted");
      fetchVisitors();
    } catch (error) {
      toast.error("Failed to blacklist");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this visitor record?")) return;
    try {
      await API.delete(`/visitors/${id}`);
      toast.success("Visitor deleted");
      fetchVisitors();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const purposeColors = {
    guest: "bg-blue-100 text-blue-600",
    delivery: "bg-yellow-100 text-yellow-600",
    maintenance: "bg-orange-100 text-orange-600",
    cab: "bg-purple-100 text-purple-600",
    medical: "bg-red-100 text-red-600",
    other: "bg-gray-100 text-gray-600",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-600",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visitors</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track all visitor entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Purpose</option>
          {["guest", "delivery", "maintenance", "cab", "medical", "other"].map(
            (p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ),
          )}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          {["pending", "approved", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-12">
            <FaUserFriends className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No visitors found</p>
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
                    Phone
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Purpose
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Host
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Flat
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Entry
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Exit
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visitors.map((v) => (
                  <tr
                    key={v._id}
                    className={`hover:bg-gray-50 transition ${v.isBlacklisted ? "bg-red-50" : ""}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {v.name}
                      {v.isBlacklisted && (
                        <span className="ml-2 text-xs text-red-500 font-medium">
                          🚫 Blacklisted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{v.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${purposeColors[v.purpose]}`}
                      >
                        {v.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{v.host?.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {v.flat?.flatNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {v.entryTime ? (
                        new Date(v.entryTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {v.exitTime ? (
                        new Date(v.exitTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[v.approvalStatus]}`}
                      >
                        {v.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!v.isBlacklisted && (
                          <button
                            onClick={() => handleBlacklist(v._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Blacklist"
                          >
                            <FaBan />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          Delete
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
    </DashboardLayout>
  );
};

export default Visitors;

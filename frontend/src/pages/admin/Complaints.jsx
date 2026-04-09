import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaExclamationCircle } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterPriority) query += `priority=${filterPriority}`;
      const res = await API.get(`/complaints${query}`);
      setComplaints(res.data.complaints);
    } catch (error) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus, filterPriority]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/complaints/${id}/status`, { status });
      toast.success(`Complaint marked as ${status}`);
      fetchComplaints();
      setShowDetailModal(false);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleAddComment = async (id) => {
    if (!comment.trim()) return;
    try {
      await API.put(`/complaints/${id}/comment`, { comment });
      toast.success("Comment added");
      setComment("");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const priorityColors = {
    low: "bg-green-100 text-green-600",
    medium: "bg-yellow-100 text-yellow-600",
    high: "bg-orange-100 text-orange-600",
    critical: "bg-red-100 text-red-600",
  };

  const statusColors = {
    open: "bg-blue-100 text-blue-600",
    in_progress: "bg-yellow-100 text-yellow-600",
    resolved: "bg-green-100 text-green-600",
    closed: "bg-gray-100 text-gray-600",
    escalated: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage resident complaints
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          {["open", "in_progress", "resolved", "closed", "escalated"].map(
            (s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ),
          )}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Priority</option>
          {["low", "medium", "high", "critical"].map((p) => (
            <option key={p} value={p}>
              {p}
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
        ) : complaints.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationCircle className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Resident
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Priority
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
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {c.title}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.raisedBy?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {c.category}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[c.priority]}`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[c.status]}`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelected(c);
                            setShowDetailModal(true);
                          }}
                          className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition font-medium"
                        >
                          View
                        </button>
                        {c.status === "open" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(c._id, "in_progress")
                            }
                            className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition font-medium"
                          >
                            Start
                          </button>
                        )}
                        {c.status === "in_progress" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(c._id, "resolved")
                            }
                            className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {selected.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {selected.category} • {selected.priority} priority
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-600 mt-1">
                  {selected.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Raised By</p>
                  <p className="text-gray-600">{selected.raisedBy?.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Flat</p>
                  <p className="text-gray-600">{selected.flat?.flatNumber}</p>
                </div>
              </div>

              {/* Add Comment */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Add Comment
                </p>
                <div className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => handleAddComment(selected._id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Close
                </button>
                {selected.status !== "resolved" &&
                  selected.status !== "closed" && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(selected._id, "resolved")
                      }
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Complaints;

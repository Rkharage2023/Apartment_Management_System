import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaExclamationCircle, FaUser, FaCalendarAlt } from "react-icons/fa";

const STATUS_FLOW = [
  {
    value: "open",
    label: "Open",
    color: "bg-blue-100 text-blue-600 border-blue-200",
    activeColor: "bg-blue-600 text-white",
    description: "Complaint received, not started",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
    activeColor: "bg-yellow-500 text-white",
    description: "Being worked on",
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "bg-green-100 text-green-600 border-green-200",
    activeColor: "bg-green-600 text-white",
    description: "Issue fixed, awaiting resident feedback",
  },
  {
    value: "closed",
    label: "Closed",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    activeColor: "bg-gray-600 text-white",
    description: "Resident rated and closed",
  },
  {
    value: "escalated",
    label: "Escalated",
    color: "bg-red-100 text-red-600 border-red-200",
    activeColor: "bg-red-600 text-white",
    description: "Needs urgent attention",
  },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterPriority) query += `priority=${filterPriority}&`;
      if (filterCategory) query += `category=${filterCategory}`;
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
  }, [filterStatus, filterPriority, filterCategory]);

  const handleStatusUpdate = async (id, status) => {
    try {
      setStatusUpdating(true);
      await API.put(`/complaints/${id}/status`, { status });
      toast.success(`Complaint marked as ${status.replace("_", " ")}`);

      // Update selected complaint locally
      setSelected((prev) => ({
        ...prev,
        status,
        resolvedAt: status === "resolved" ? new Date() : prev.resolvedAt,
        closedAt: status === "closed" ? new Date() : prev.closedAt,
        escalatedAt: status === "escalated" ? new Date() : prev.escalatedAt,
      }));

      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddComment = async (id) => {
    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      await API.put(`/complaints/${id}/comment`, { comment });
      toast.success("Comment added");
      setComment("");
      fetchComplaints();

      // Refresh selected complaint
      const res = await API.get(`/complaints/${id}`);
      setSelected(res.data.complaint);
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleViewComplaint = async (complaint) => {
    try {
      // Fetch fresh full complaint with all populated fields
      const res = await API.get(`/complaints/${complaint._id}`);
      setSelected(res.data.complaint);
      setShowDetailModal(true);
    } catch (error) {
      setSelected(complaint);
      setShowDetailModal(true);
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

  const currentStatusIndex = STATUS_FLOW.findIndex(
    (s) => s.value === selected?.status,
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and resolve resident complaints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Total: {complaints.length}
          </span>
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
          {STATUS_FLOW.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
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
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {[
            "plumbing",
            "electrical",
            "lift",
            "security",
            "cleaning",
            "parking",
            "noise",
            "internet",
            "other",
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Status Summary Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FLOW.map((s) => {
          const count = complaints.filter((c) => c.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() =>
                setFilterStatus(filterStatus === s.value ? "" : s.value)
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                filterStatus === s.value
                  ? s.activeColor + " border-transparent"
                  : s.color
              }`}
            >
              {s.label}: {count}
            </button>
          );
        })}
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
                    Flat
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
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800 max-w-48">
                      <p className="truncate">{c.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.raisedBy?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-600 truncate max-w-24">
                          {c.raisedBy?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.flat?.flatNumber || "—"}
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
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewComplaint(c)}
                        className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition font-medium"
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Full Detail + Status Management Modal */}
      {showDetailModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[selected.priority]}`}
                    >
                      {selected.priority} priority
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {selected.category}
                    </span>
                    {selected.rating && (
                      <span className="text-xs text-yellow-500">
                        {"⭐".repeat(selected.rating)} Rated
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setComment("");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ✅ Status Progress Bar */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Status Management
                </p>

                {/* Progress Steps */}
                <div className="flex items-center mb-4">
                  {["open", "in_progress", "resolved", "closed"].map(
                    (step, index) => {
                      const stepIndex = [
                        "open",
                        "in_progress",
                        "resolved",
                        "closed",
                      ].indexOf(selected.status);
                      const isCompleted = index < stepIndex;
                      const isCurrent = index === stepIndex;
                      const stepInfo = STATUS_FLOW.find(
                        (s) => s.value === step,
                      );

                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                                isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : isCurrent
                                    ? "bg-primary-600 border-primary-600 text-white"
                                    : "bg-white border-gray-300 text-gray-400"
                              }`}
                            >
                              {isCompleted ? "✓" : index + 1}
                            </div>
                            <p
                              className={`text-xs mt-1 font-medium ${
                                isCurrent
                                  ? "text-primary-600"
                                  : isCompleted
                                    ? "text-green-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {stepInfo?.label}
                            </p>
                          </div>
                          {index < 3 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 ${
                                index < stepIndex
                                  ? "bg-green-400"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* ✅ All Status Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusUpdate(selected._id, s.value)}
                      disabled={statusUpdating || selected.status === s.value}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition disabled:cursor-not-allowed ${
                        selected.status === s.value
                          ? s.activeColor +
                            " border-transparent opacity-100 ring-2 ring-offset-1 ring-gray-400"
                          : s.color + " hover:opacity-80 disabled:opacity-50"
                      }`}
                    >
                      {statusUpdating && selected.status !== s.value ? (
                        <span className="flex items-center justify-center gap-1">
                          <svg
                            className="animate-spin h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          ...
                        </span>
                      ) : (
                        <>
                          {selected.status === s.value && "✓ "}
                          {s.label}
                        </>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Current:{" "}
                  <span className="font-medium capitalize">
                    {selected.status?.replace("_", " ")}
                  </span>{" "}
                  —{" "}
                  {
                    STATUS_FLOW.find((s) => s.value === selected.status)
                      ?.description
                  }
                </p>
              </div>

              {/* Complaint Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Complaint Info
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="font-medium text-gray-700 capitalize">
                        {selected.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[selected.priority]}`}
                      >
                        {selected.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Raised On</span>
                      <span className="font-medium text-gray-700">
                        {new Date(selected.createdAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                    {selected.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Resolved</span>
                        <span className="font-medium text-gray-700">
                          {new Date(selected.resolvedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    )}
                    {selected.escalatedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Escalated</span>
                        <span className="font-medium text-red-600">
                          {new Date(selected.escalatedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Resident Info
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                      {selected.raisedBy?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {selected.raisedBy?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selected.raisedBy?.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Flat</span>
                      <span className="font-medium text-gray-700">
                        {selected.flat?.flatNumber || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-700">
                        {selected.raisedBy?.phone || "—"}
                      </span>
                    </div>
                    {selected.assignedTo && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assigned To</span>
                        <span className="font-medium text-gray-700">
                          {selected.assignedTo?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Description
                </p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              </div>

              {/* Resident Feedback */}
              {selected.rating && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Resident Feedback
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400">
                      {"⭐".repeat(selected.rating)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {selected.rating}/5
                    </span>
                  </div>
                  {selected.feedback && (
                    <p className="text-sm text-gray-600 italic">
                      "{selected.feedback}"
                    </p>
                  )}
                </div>
              )}

              {/* Comments */}
              {selected.comments?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Comments ({selected.comments.length})
                  </p>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selected.comments.map((c, i) => (
                      <div
                        key={i}
                        className="flex gap-3 bg-gray-50 rounded-xl p-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                          {c.commentedBy?.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold text-gray-700">
                              {c.commentedBy?.name || "Admin"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(c.commentedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{c.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Add Comment
                </p>
                <div className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment(selected._id);
                    }}
                    placeholder="Write an update or note..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => handleAddComment(selected._id)}
                    className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setComment("");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Complaints;

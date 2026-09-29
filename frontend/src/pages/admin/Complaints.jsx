import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaExclamationCircle, FaUserTie, FaUserCog, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const STATUS_FLOW = [
  {
    value: "open",
    label: "Open",
    color: "bg-blue-100 text-blue-600 border-blue-200",
    activeColor: "bg-blue-600 text-white",
    description: "Complaint received, awaiting assignment",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-amber-100 text-amber-600 border-amber-200",
    activeColor: "bg-amber-500 text-white",
    description: "Assigned & actively being resolved by staff",
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    activeColor: "bg-emerald-600 text-white",
    description: "Resolution complete, awaiting resident feedback",
  },
  {
    value: "closed",
    label: "Closed",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    activeColor: "bg-gray-600 text-white",
    description: "Feedback recorded & closed",
  },
  {
    value: "escalated",
    label: "Escalated",
    color: "bg-rose-100 text-rose-600 border-rose-200",
    activeColor: "bg-rose-600 text-white",
    description: "Escalated to management due to delay",
  },
];

const Complaints = () => {
  const { user } = useSelector((state) => state.auth);
  const [complaints, setComplaints] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");

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

  const fetchStaffMembers = async () => {
    try {
      const res = await API.get("/users?role=staff");
      setStaffMembers(res.data.users || []);
    } catch (error) {}
  };

  useEffect(() => {
    fetchComplaints();
    fetchStaffMembers();
  }, [filterStatus, filterPriority, filterCategory]);

  const handleStatusUpdate = async (id, status) => {
    try {
      setStatusUpdating(true);
      await API.put(`/complaints/${id}/status`, { status });
      toast.success(`Complaint marked as ${status.replace("_", " ")}`);

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

  const handleAssignStaff = async (id) => {
    if (!selectedStaffId) {
      toast.error("Please select a maintenance staff member");
      return;
    }
    try {
      const res = await API.put(`/complaints/${id}/assign`, { userId: selectedStaffId });
      toast.success(res.data.message || "Staff assigned successfully");
      setSelected(res.data.complaint);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign staff");
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

      const res = await API.get(`/complaints/${id}`);
      setSelected(res.data.complaint);
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleViewComplaint = async (complaint) => {
    try {
      const res = await API.get(`/complaints/${complaint._id}`);
      setSelected(res.data.complaint);
      setSelectedStaffId(res.data.complaint?.assignedTo?._id || "");
      setShowDetailModal(true);
    } catch (error) {
      setSelected(complaint);
      setSelectedStaffId(complaint?.assignedTo?._id || "");
      setShowDetailModal(true);
    }
  };

  const priorityColors = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-rose-100 text-rose-700 font-bold",
  };

  const statusColors = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-700",
    escalated: "bg-rose-100 text-rose-700",
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationCircle className="text-primary-600" /> Complaints & Helpdesk
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track resident issues, assign maintenance staff, and manage service SLAs
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
          Total Helpdesk Tickets: {complaints.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Priorities</option>
          {["low", "medium", "high", "critical"].map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Categories</option>
          {["plumbing", "electrical", "lift", "security", "cleaning", "parking", "noise", "internet", "other"].map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Status Summary Pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FLOW.map((s) => {
          const count = complaints.filter((c) => c.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "" : s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterStatus === s.value ? s.activeColor + " border-transparent" : s.color
              }`}
            >
              {s.label}: {count}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationCircle className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No complaints found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="text-left px-6 py-4">Title & Issue</th>
                  <th className="text-left px-6 py-4">Resident</th>
                  <th className="text-left px-6 py-4">Flat No</th>
                  <th className="text-left px-6 py-4">Assigned Staff</th>
                  <th className="text-left px-6 py-4">Priority</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800 max-w-48">
                      <p className="truncate">{c.title}</p>
                      <p className="text-xs text-gray-400 font-normal capitalize">{c.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.raisedBy?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-700 font-medium truncate max-w-24">
                          {c.raisedBy?.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {c.flat?.flatNumber ? (
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                          {c.flat.flatNumber}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {c.assignedTo ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <FaUserTie /> {c.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${priorityColors[c.priority]}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${statusColors[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewComplaint(c)}
                        className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition font-semibold"
                      >
                        Manage & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Detail + Staff Assignment Modal */}
      {showDetailModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${priorityColors[selected.priority]}`}>
                    {selected.priority} priority
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{selected.category}</span>
                </div>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setComment(""); }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Staff Assignment Section — Only Admin can assign */}
              {user?.role === "admin" ? (
                <div className="bg-primary-50/60 border border-primary-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaUserCog /> Assign Maintenance Staff
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-- Select Staff Officer --</option>
                      {staffMembers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.role.toUpperCase()}) — {s.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignStaff(selected._id)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs flex items-center justify-between">
                  <span className="font-semibold text-gray-500">Assigned Staff Member:</span>
                  <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <FaUserTie className="text-primary-600" />
                    {selected.assignedTo?.name || "Unassigned"}
                  </span>
                </div>
              )}

              {/* Status Management */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Status Management</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusUpdate(selected._id, s.value)}
                      disabled={statusUpdating || selected.status === s.value}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                        selected.status === s.value
                          ? s.activeColor + " border-transparent ring-2 ring-offset-1 ring-gray-400"
                          : s.color + " hover:opacity-80 disabled:opacity-50"
                      }`}
                    >
                      {selected.status === s.value && "✓ "}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complaint & Resident Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                  <p className="font-bold text-gray-500 uppercase tracking-wide">Ticket Metadata</p>
                  <div className="flex justify-between"><span className="text-gray-500">Category:</span><span className="font-semibold text-gray-800 capitalize">{selected.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Raised On:</span><span className="font-semibold text-gray-800">{new Date(selected.createdAt).toLocaleDateString("en-IN")}</span></div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                  <p className="font-bold text-gray-500 uppercase tracking-wide">Resident Contact</p>
                  <p className="font-bold text-gray-800 text-sm">{selected.raisedBy?.name}</p>
                  <p className="text-gray-500">{selected.raisedBy?.email}</p>
                  <p className="text-gray-500">Flat: {selected.flat?.flatNumber || "N/A"}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                  {selected.description}
                </div>
              </div>

              {/* Comments Section */}
              {selected.comments?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Activity & Comments</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selected.comments.map((c, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-800">{c.commentedBy?.name || "Admin"}</span>
                          <span className="text-gray-400">{new Date(c.commentedAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        <p className="text-gray-600">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Comment */}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Post progress update or note..."
                  className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => handleAddComment(selected._id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Complaints;

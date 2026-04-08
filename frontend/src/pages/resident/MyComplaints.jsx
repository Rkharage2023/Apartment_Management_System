import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaExclamationCircle } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "plumbing",
    priority: "medium",
    society: "",
    flat: "",
  });

  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    feedback: "",
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const res = await API.get(`${API_URL}/complaints/my-complaints${query}`);
      setComplaints(res.data.complaints);
    } catch (error) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocietiesAndFlats = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        API.get(`${API_URL}/societies`),
        API.get(`${API_URL}/flats/my-flat`).catch(() => ({
          data: { flat: null },
        })),
      ]);
      setSocieties(sRes.data.societies);
      if (fRes.data.flat) {
        setFlats([fRes.data.flat]);
        setFormData((prev) => ({
          ...prev,
          society: fRes.data.flat.society?._id || "",
          flat: fRes.data.flat._id || "",
        }));
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchComplaints();
    fetchSocietiesAndFlats();
  }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.description ||
      !formData.society ||
      !formData.flat
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await API.post(`${API_URL}/complaints`, formData);
      toast.success("Complaint raised successfully");
      setShowModal(false);
      setFormData((prev) => ({
        ...prev,
        title: "",
        description: "",
        category: "plumbing",
        priority: "medium",
      }));
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to raise complaint");
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await API.put(
        `${API_URL}/complaints/${selectedComplaint._id}/feedback`,
        feedbackData,
      );
      toast.success("Feedback submitted successfully");
      setShowFeedbackModal(false);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    }
  };

  const statusColors = {
    open: "bg-blue-100 text-blue-600",
    in_progress: "bg-yellow-100 text-yellow-600",
    resolved: "bg-green-100 text-green-600",
    closed: "bg-gray-100 text-gray-600",
    escalated: "bg-red-100 text-red-600",
  };

  const priorityColors = {
    low: "bg-green-100 text-green-600",
    medium: "bg-yellow-100 text-yellow-600",
    high: "bg-orange-100 text-orange-600",
    critical: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">
            Raise and track your complaints
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Raise Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "open", "in_progress", "resolved", "closed", "escalated"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filterStatus === s
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
              }`}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </button>
          ),
        )}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FaExclamationCircle className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No complaints found</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-primary-600 text-sm font-medium hover:underline"
          >
            Raise your first complaint
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-gray-800">{c.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[c.priority]}`}
                    >
                      {c.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[c.status]}`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{c.description}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span className="capitalize">Category: {c.category}</span>
                    <span>
                      Raised:{" "}
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    {c.resolvedAt && (
                      <span>
                        Resolved:{" "}
                        {new Date(c.resolvedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned To */}
              {c.assignedTo && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">
                    Assigned to:{" "}
                    <span className="font-medium text-gray-600">
                      {c.assignedTo.name}
                    </span>
                  </p>
                </div>
              )}

              {/* Rating */}
              {c.rating && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    Your Rating: {"⭐".repeat(c.rating)}
                  </p>
                </div>
              )}

              {/* Feedback Button */}
              {c.status === "resolved" && !c.rating && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setShowFeedbackModal(true);
                    }}
                    className="text-sm text-primary-600 font-medium hover:underline"
                  >
                    Rate & Close this complaint →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raise Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Raise a Complaint
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief title of the issue"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {["low", "medium", "high", "critical"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Society & Flat auto-filled */}
              {formData.society && (
                <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  ✅ Society and flat auto-filled from your profile
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  Raise Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Rate Resolution
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedComplaint.title}
              </p>
            </div>
            <form onSubmit={handleFeedback} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setFeedbackData({ ...feedbackData, rating: r })
                      }
                      className={`text-3xl transition ${
                        feedbackData.rating >= r
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {feedbackData.rating}/5 stars
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  value={feedbackData.feedback}
                  onChange={(e) =>
                    setFeedbackData({
                      ...feedbackData,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="How was the resolution experience?"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyComplaints;

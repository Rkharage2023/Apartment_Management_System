import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaBullhorn, FaEdit, FaTrash } from "react-icons/fa";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    society: "",
    expiresAt: "",
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notices");
      setNotices(res.data.notices);
    } catch (error) {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get("/societies");
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  useEffect(() => {
    fetchNotices();
    fetchSocieties();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "general",
      priority: "medium",
      society: "",
      expiresAt: "",
    });
    setEditData(null);
  };

  const handleOpenModal = (notice = null) => {
    if (notice) {
      setEditData(notice);
      setFormData({
        title: notice.title,
        description: notice.description,
        category: notice.category,
        priority: notice.priority,
        society: notice.society?._id || "",
        expiresAt: notice.expiresAt
          ? new Date(notice.expiresAt).toISOString().split("T")[0]
          : "",
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.society) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editData) {
        await API.put(`/notices/${editData._id}`, formData);
        toast.success("Notice updated");
      } else {
        await API.post("/notices", formData);
        toast.success("Notice created");
      }
      setShowModal(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await API.delete(`/notices/${id}`);
      toast.success("Notice deleted");
      fetchNotices();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const priorityColors = {
    low: "bg-green-100 text-green-600",
    medium: "bg-yellow-100 text-yellow-600",
    high: "bg-red-100 text-red-600",
  };

  const categoryColors = {
    general: "bg-blue-100 text-blue-600",
    urgent: "bg-red-100 text-red-600",
    maintenance: "bg-orange-100 text-orange-600",
    rules: "bg-purple-100 text-purple-600",
    event: "bg-green-100 text-green-600",
    other: "bg-gray-100 text-gray-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
          <p className="text-gray-500 text-sm mt-1">Manage society notices</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Notice
        </button>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FaBullhorn className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No notices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((n) => (
            <div
              key={n._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[n.category]}`}
                  >
                    {n.category}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[n.priority]}`}
                  >
                    {n.priority}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(n)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{n.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {n.description}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleDateString("en-IN")}
                </span>
                <span className="text-xs text-gray-400">
                  {n.acknowledgedBy?.length || 0} acknowledged
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editData ? "Edit Notice" : "Add Notice"}
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
                  placeholder="Notice title"
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
                  placeholder="Notice details..."
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
                      "general",
                      "urgent",
                      "maintenance",
                      "rules",
                      "event",
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
                    {["low", "medium", "high"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Society *
                </label>
                <select
                  value={formData.society}
                  onChange={(e) =>
                    setFormData({ ...formData, society: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Society</option>
                  {societies.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  {editData ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Notices;

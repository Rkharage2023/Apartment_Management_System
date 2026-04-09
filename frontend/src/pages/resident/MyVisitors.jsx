import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaUserFriends } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const MyVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [myFlat, setMyFlat] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    purpose: "guest",
    society: "",
    flat: "",
    vehicleNumber: "",
    note: "",
  });

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/visitors/my-visitors`);
      setVisitors(res.data.visitors);
    } catch (error) {
      toast.error("Failed to fetch visitors");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyFlat = async () => {
    try {
      const res = await API.get(`/flats/my-flat`);
      const flat = res.data.flat;
      setMyFlat(flat);
      setFormData((prev) => ({
        ...prev,
        society: flat.society?._id || "",
        flat: flat._id || "",
      }));
    } catch (error) {}
  };

  useEffect(() => {
    fetchVisitors();
    fetchMyFlat();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.purpose) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await API.post(`/visitors`, formData);
      toast.success("Visitor pre-approved successfully");
      setShowModal(false);
      setFormData((prev) => ({
        ...prev,
        name: "",
        phone: "",
        purpose: "guest",
        vehicleNumber: "",
        note: "",
      }));
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add visitor");
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

  const purposeEmojis = {
    guest: "👤",
    delivery: "📦",
    maintenance: "🔧",
    cab: "🚕",
    medical: "🏥",
    other: "❓",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Visitors</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pre-approve and track visitors
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Visitor
        </button>
      </div>

      {/* Visitors List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FaUserFriends className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No visitors yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-primary-600 text-sm font-medium hover:underline"
          >
            Pre-approve a visitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visitors.map((v) => (
            <div
              key={v._id}
              className={`bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition ${
                v.isBlacklisted ? "border-red-200 bg-red-50" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                    {purposeEmojis[v.purpose]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.phone}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${purposeColors[v.purpose]}`}
                >
                  {v.purpose}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                {v.vehicleNumber && <p>🚗 {v.vehicleNumber}</p>}
                {v.note && <p>📝 {v.note}</p>}
                <p>
                  📅{" "}
                  {new Date(v.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex gap-3 text-xs text-gray-400">
                  {v.entryTime && (
                    <span>
                      In:{" "}
                      {new Date(v.entryTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {v.exitTime && (
                    <span>
                      Out:{" "}
                      {new Date(v.exitTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    v.approvalStatus === "approved"
                      ? "bg-green-100 text-green-600"
                      : v.approvalStatus === "rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {v.approvalStatus}
                </span>
              </div>

              {v.isBlacklisted && (
                <p className="text-xs text-red-500 font-medium mt-2">
                  🚫 This visitor is blacklisted
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Pre-approve Visitor
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visitor Name *
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[
                    "guest",
                    "delivery",
                    "maintenance",
                    "cab",
                    "medical",
                    "other",
                  ].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleNumber: e.target.value })
                  }
                  placeholder="MH10AB1234 (optional)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Coming for dinner (optional)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {myFlat && (
                <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  ✅ Visiting Flat {myFlat.flatNumber}
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
                  Pre-approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyVisitors;

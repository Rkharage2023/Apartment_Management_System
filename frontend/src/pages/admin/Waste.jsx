import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";

const Waste = () => {
  const [logs, setLogs] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [formData, setFormData] = useState({
    society: "",
    date: "",
    wasteType: "mixed",
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterDate) query += `date=${filterDate}`;
      const res = await API.get(`/waste${query}`);
      setLogs(res.data.logs);
    } catch (error) {
      toast.error("Failed to fetch waste logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (societyId, date) => {
    if (!societyId) return;
    try {
      let query = `?society=${societyId}`;
      if (date) query += `&date=${date}`;
      const res = await API.get(`/waste/analytics${query}`);
      setAnalytics(res.data);
    } catch (error) {}
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get("/societies");
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  useEffect(() => {
    fetchLogs();
    fetchSocieties();
  }, [filterStatus, filterDate]);

  const handleGenerateSchedule = async (e) => {
    e.preventDefault();
    if (!formData.society || !formData.date) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const res = await API.post("/waste", formData);
      toast.success(res.data.message);
      setShowModal(false);
      fetchLogs();
      fetchAnalytics(formData.society, formData.date);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate schedule",
      );
    }
  };

  const handleMarkMissed = async (id) => {
    try {
      await API.put(`/waste/${id}/miss`, { missedReason: "Marked by admin" });
      toast.success("Marked as missed");
      fetchLogs();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this log?")) return;
    try {
      await API.delete(`/waste/${id}`);
      toast.success("Log deleted");
      fetchLogs();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-600",
    collected: "bg-green-100 text-green-600",
    missed: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Waste Collection</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track daily waste collection
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Generate Schedule
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total",
              value: analytics.total,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Collected",
              value: analytics.collected,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Missed",
              value: analytics.missed,
              color: "bg-red-50 text-red-600",
            },
            {
              label: "Rate",
              value: analytics.collectionRate,
              color: "bg-purple-50 text-purple-600",
            },
          ].map((a) => (
            <div key={a.label} className={`rounded-2xl p-4 ${a.color}`}>
              <p className="text-2xl font-bold">{a.value}</p>
              <p className="text-sm font-medium mt-1">{a.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          {["pending", "collected", "missed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FaTrash className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No waste logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Flat
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Resident
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Collected By
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
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {l.flat?.flatNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {l.resident?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(l.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {l.wasteType}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {l.collectedBy?.name || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[l.status]}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {l.status === "pending" && (
                          <button
                            onClick={() => handleMarkMissed(l._id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-medium"
                          >
                            Miss
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(l._id)}
                          className="text-xs px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition font-medium"
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

      {/* Generate Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Generate Waste Schedule
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Creates logs for all occupied flats
              </p>
            </div>
            <form onSubmit={handleGenerateSchedule} className="p-6 space-y-4">
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
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waste Type
                </label>
                <select
                  value={formData.wasteType}
                  onChange={(e) =>
                    setFormData({ ...formData, wasteType: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {["dry", "wet", "hazardous", "recyclable", "mixed"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </div>
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
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Waste;

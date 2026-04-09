import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaMoneyBill, FaCheck } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [formData, setFormData] = useState({
    flat: "",
    society: "",
    resident: "",
    billType: "maintenance",
    amount: "",
    dueDate: "",
    month: "",
    note: "",
  });

  const [bulkData, setBulkData] = useState({
    society: "",
    month: "",
    billType: "maintenance",
    dueDate: "",
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterMonth) query += `month=${filterMonth}`;
      const res = await API.get(`/billing${query}`);
      setBills(res.data.bills);
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get(`/societies`);
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  useEffect(() => {
    fetchBills();
    fetchSocieties();
  }, [filterStatus, filterMonth]);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (
      !formData.flat ||
      !formData.society ||
      !formData.resident ||
      !formData.amount
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await API.post(`/billing`, {
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success("Bill created successfully");
      setShowModal(false);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create bill");
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    if (!bulkData.society || !bulkData.month || !bulkData.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const res = await API.post(`/billing/generate-bulk`, bulkData);
      toast.success(res.data.message);
      setShowBulkModal(false);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk generation failed");
    }
  };

  const handlePayCash = async (id) => {
    if (!window.confirm("Mark this bill as paid via cash?")) return;
    try {
      await API.put(`/billing/${id}/pay-cash`);
      toast.success("Bill marked as paid");
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark paid");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await API.delete(`/billing/${id}`);
      toast.success("Bill deleted");
      fetchBills();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const statusColors = {
    unpaid: "bg-yellow-100 text-yellow-600",
    paid: "bg-green-100 text-green-600",
    overdue: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage bills and payments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 border border-primary-600 text-primary-600 hover:bg-primary-50 px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <FaPlus /> Bulk Generate
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <FaPlus /> Create Bill
          </button>
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
          {["unpaid", "paid", "overdue"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by month e.g. April-2026"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12">
            <FaMoneyBill className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No bills found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Resident
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Flat
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Month
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Due Date
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
                {bills.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {b.resident?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {b.flat?.flatNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {b.billType}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.month}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ₹{b.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(b.dueDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {b.status !== "paid" && (
                          <button
                            onClick={() => handlePayCash(b._id)}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition"
                            title="Mark as Paid"
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(b._id)}
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

      {/* Create Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Bill</h2>
            </div>
            <form onSubmit={handleCreateBill} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat ID *
                </label>
                <input
                  value={formData.flat}
                  onChange={(e) =>
                    setFormData({ ...formData, flat: e.target.value })
                  }
                  placeholder="MongoDB Flat ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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
                  Resident ID *
                </label>
                <input
                  value={formData.resident}
                  onChange={(e) =>
                    setFormData({ ...formData, resident: e.target.value })
                  }
                  placeholder="MongoDB User ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Type
                  </label>
                  <select
                    value={formData.billType}
                    onChange={(e) =>
                      setFormData({ ...formData, billType: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[
                      "maintenance",
                      "water",
                      "electricity",
                      "parking",
                      "amenity",
                      "other",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="2000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <input
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    placeholder="April-2026"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
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
                  placeholder="Optional note"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Bulk Generate Bills
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Auto generate bills for all occupied flats
              </p>
            </div>
            <form onSubmit={handleBulkGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Society *
                </label>
                <select
                  value={bulkData.society}
                  onChange={(e) =>
                    setBulkData({ ...bulkData, society: e.target.value })
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
                  Bill Type
                </label>
                <select
                  value={bulkData.billType}
                  onChange={(e) =>
                    setBulkData({ ...bulkData, billType: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {["maintenance", "water", "electricity", "parking"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month *
                </label>
                <input
                  value={bulkData.month}
                  onChange={(e) =>
                    setBulkData({ ...bulkData, month: e.target.value })
                  }
                  placeholder="April-2026"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={bulkData.dueDate}
                  onChange={(e) =>
                    setBulkData({ ...bulkData, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  Generate Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Billing;

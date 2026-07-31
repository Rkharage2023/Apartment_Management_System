import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaMoneyBill, FaCheck, FaHistory, FaExclamationTriangle } from "react-icons/fa";

// Convert "2026-07" (input[type=month] value) → "July-2026" (DB format)
const formatMonthLabel = (val) => {
  if (!val) return "";
  const [year, month] = val.split("-");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${monthNames[parseInt(month, 10) - 1]}-${year}`;
};

// Convert "July-2026" back to "2026-07" for the input default value
const labelToMonthInput = (label) => {
  if (!label) return "";
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [name, year] = label.split("-");
  const idx = monthNames.indexOf(name);
  if (idx === -1 || !year) return "";
  return `${year}-${String(idx + 1).padStart(2, "0")}`;
};

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    paidBills: 0,
    unpaidBills: 0,
    overdueBills: 0,
  });
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bills");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // stored as "2026-07"

  const [formData, setFormData] = useState({
    flat: "",
    society: "",
    resident: "",
    billType: "maintenance",
    amount: "",
    dueDate: "",
    month: "",      // stored as "2026-07" for the input
    note: "",
  });

  const [bulkData, setBulkData] = useState({
    society: "",
    month: "",      // stored as "2026-07" for the input
    billType: "maintenance",
    dueDate: "",
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      // Convert "2026-07" picker value → "July-2026" for backend filter
      if (filterMonth) query += `month=${formatMonthLabel(filterMonth)}`;
      const res = await API.get(`/billing${query}`);
      setBills(res.data.bills);
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/billing/stats");
      setStats(res.data);
    } catch (error) {}
  };

  const fetchPaymentHistory = async () => {
    try {
      const res = await API.get("/billing/payments/history");
      setPayments(res.data.payments);
    } catch (error) {}
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get("/societies");
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  const fetchFlats = async () => {
    try {
      const res = await API.get("/flats");
      setFlats(res.data.flats);
    } catch (error) {}
  };

  const fetchResidents = async () => {
    try {
      const res = await API.get("/users?role=resident");
      setResidents(res.data.users);
    } catch (error) {}
  };

  useEffect(() => {
    fetchBills();
    fetchStats();
    fetchPaymentHistory();
    fetchSocieties();
    fetchFlats();
    fetchResidents();
  }, [filterStatus, filterMonth]);

  const handleFlatChange = (flatId) => {
    const selectedFlat = flats.find((f) => f._id === flatId);
    if (selectedFlat) {
      const societyId = selectedFlat.society?._id || selectedFlat.society || "";
      const residentId =
        selectedFlat.owner?._id ||
        selectedFlat.owner ||
        selectedFlat.tenant?._id ||
        selectedFlat.tenant ||
        "";

      const amount =
        formData.billType === "maintenance"
          ? selectedFlat.maintenanceCharge || ""
          : formData.billType === "parking"
            ? selectedFlat.monthlyRent || ""
            : "";

      setFormData((prev) => ({
        ...prev,
        flat: flatId,
        society: societyId,
        resident: residentId,
        amount: amount || prev.amount,
      }));
    } else {
      setFormData((prev) => ({ ...prev, flat: flatId }));
    }
  };

  const handleBillTypeChange = (billType) => {
    const selectedFlat = flats.find((f) => f._id === formData.flat);
    let amount = formData.amount;

    if (selectedFlat) {
      if (billType === "maintenance") {
        amount = selectedFlat.maintenanceCharge || "";
      } else if (billType === "parking") {
        amount = selectedFlat.monthlyRent || "";
      }
    }

    setFormData((prev) => ({ ...prev, billType, amount }));
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!formData.flat) { toast.error("Please select a flat"); return; }
    if (!formData.resident) { toast.error("This flat has no owner/tenant assigned. Cannot bill."); return; }
    if (!formData.amount || Number(formData.amount) <= 0) { toast.error("Please enter a valid amount"); return; }
    if (!formData.month) { toast.error("Please select a billing month"); return; }
    if (!formData.dueDate) { toast.error("Please select a due date"); return; }

    try {
      setSubmitting(true);
      await API.post("/billing", {
        ...formData,
        amount: Number(formData.amount),
        month: formatMonthLabel(formData.month), // convert to "July-2026"
      });
      toast.success("Bill created successfully!");
      setShowModal(false);
      setFormData({ flat: "", society: "", resident: "", billType: "maintenance", amount: "", dueDate: "", month: "", note: "" });
      fetchBills();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    if (!bulkData.society) { toast.error("Please select a society"); return; }
    if (!bulkData.month) { toast.error("Please select a billing month"); return; }
    if (!bulkData.dueDate) { toast.error("Please select a due date"); return; }
    try {
      setSubmitting(true);
      const res = await API.post("/billing/generate-bulk", {
        ...bulkData,
        month: formatMonthLabel(bulkData.month), // convert to "July-2026"
      });
      toast.success(res.data.message);
      if (res.data.skipped && res.data.skipped !== "None") {
        toast(`Skipped (already billed): ${res.data.skipped}`, { icon: "⚠️" });
      }
      setShowBulkModal(false);
      setBulkData({ society: "", month: "", billType: "maintenance", dueDate: "" });
      fetchBills();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk generation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayCash = async (id) => {
    if (!window.confirm("Mark this bill as paid via cash?")) return;
    try {
      await API.put(`/billing/${id}/pay-cash`);
      toast.success("Bill marked as paid");
      fetchBills();
      fetchStats();
      fetchPaymentHistory();
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
      fetchStats();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const statusColors = {
    unpaid: "bg-amber-100 text-amber-700 border-amber-200",
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const selectedFlatDetails = flats.find((f) => f._id === formData.flat);
  const selectedResidentDetails = residents.find((r) => r._id === formData.resident);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaMoneyBill className="text-primary-600" /> Billing & Revenue Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate invoices, track resident payments, and monitor society revenue
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
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-xs"
          >
            <FaPlus /> Single Bill
          </button>
        </div>
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">₹{(stats.totalCollected || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.paidBills || 0} paid invoices</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Pending</p>
          <p className="text-2xl font-black text-amber-800 mt-1">₹{(stats.totalPending || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-amber-600 mt-1">{stats.unpaidBills || 0} unpaid invoices</p>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue Bills</p>
          <p className="text-2xl font-black text-rose-800 mt-1">{stats.overdueBills || 0}</p>
          <p className="text-xs text-rose-600 mt-1">Action required</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Issued</p>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats.totalBills || 0}</p>
          <p className="text-xs text-blue-600 mt-1">All time records</p>
        </div>
      </div>

      {/* Tab Controls & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("bills")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "bills" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Invoices ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeTab === "payments" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaHistory /> Payment Log ({payments.length})
          </button>
        </div>

        {activeTab === "bills" && (
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* Content Table Views */}
      {activeTab === "bills" ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <FaMoneyBill className="text-gray-300 text-5xl mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bills found matching filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                  <tr>
                    <th className="text-left px-6 py-4">Resident</th>
                    <th className="text-left px-6 py-4">Flat No</th>
                    <th className="text-left px-6 py-4">Bill Type</th>
                    <th className="text-left px-6 py-4">Month</th>
                    <th className="text-left px-6 py-4">Amount</th>
                    <th className="text-left px-6 py-4">Due Date</th>
                    <th className="text-left px-6 py-4">Status</th>
                    <th className="text-left px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bills.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                            {b.resident?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800">{b.resident?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{b.flat?.flatNumber || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{b.billType}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{b.month}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-900">₹{b.amount?.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(b.dueDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${statusColors[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {b.status !== "paid" && (
                            <button
                              onClick={() => handlePayCash(b._id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Mark as Paid via Cash"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(b._id)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
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
      ) : (
        /* Payment History Log Tab */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="text-gray-300 text-5xl mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payment history recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                  <tr>
                    <th className="text-left px-6 py-4">Resident</th>
                    <th className="text-left px-6 py-4">Flat No</th>
                    <th className="text-left px-6 py-4">Amount</th>
                    <th className="text-left px-6 py-4">Payment Method</th>
                    <th className="text-left px-6 py-4">Txn Ref ID</th>
                    <th className="text-left px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{p.resident?.name || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{p.flat?.flatNumber || "N/A"}</td>
                      <td className="px-6 py-4 font-extrabold text-emerald-600">₹{p.amount?.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.razorpayPaymentId || `PAY_${p._id.slice(-6)}`}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Create New Bill</h2>
              <p className="text-xs text-gray-500 mt-0.5">Generate single maintenance, water, or parking invoice.</p>
            </div>
            <form onSubmit={handleCreateBill} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bill Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["maintenance", "water", "electricity", "parking", "amenity", "other"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleBillTypeChange(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition capitalize ${
                        formData.billType === t
                          ? "border-primary-600 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Flat *</label>
                <select
                  value={formData.flat}
                  onChange={(e) => handleFlatChange(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Occupied Flat --</option>
                  {flats.map((f) => (
                    <option key={f._id} value={f._id}>
                      Flat {f.flatNumber} (Block {f.block}) — {f.owner?.name || f.tenant?.name || "Occupied"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="2500"
                    min="1"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Month *</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {formData.month && (
                    <p className="text-xs text-primary-600 mt-1 font-medium">
                      → {formatMonthLabel(formData.month)}
                    </p>
                  )}
                </div>
              </div>

              {/* Resident warning */}
              {formData.flat && !formData.resident && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-xs font-semibold">
                  <FaExclamationTriangle />
                  This flat has no owner or tenant assigned. Assign a resident to the flat first before billing.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData({ flat: "", society: "", resident: "", billType: "maintenance", amount: "", dueDate: "", month: "", note: "" }); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.resident}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Bulk Generate Bills</h2>
              <p className="text-xs text-gray-500 mt-0.5">Generate invoices automatically for all occupied society flats.</p>
            </div>
            <form onSubmit={handleBulkGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Society *</label>
                <select
                  value={bulkData.society}
                  onChange={(e) => setBulkData({ ...bulkData, society: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Society --</option>
                  {societies.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Month *</label>
                  <input
                    type="month"
                    value={bulkData.month}
                    onChange={(e) => setBulkData({ ...bulkData, month: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {bulkData.month && (
                    <p className="text-xs text-primary-600 mt-1 font-medium">
                      → {formatMonthLabel(bulkData.month)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={bulkData.dueDate}
                    onChange={(e) => setBulkData({ ...bulkData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowBulkModal(false); setBulkData({ society: "", month: "", billType: "maintenance", dueDate: "" }); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Generating..." : "Generate All Bills"}
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

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaUserFriends, FaBan, FaSignOutAlt, FaSignInAlt, FaSearch, FaTrash, FaPlus, FaCheck, FaTimes } from "react-icons/fa";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [walkinData, setWalkinData] = useState({
    name: "",
    phone: "",
    purpose: "guest",
    society: "",
    flat: "",
    host: "",
    vehicleNumber: "",
    note: "",
  });

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

  const fetchDependencies = async () => {
    try {
      const [socRes, flatRes, resRes] = await Promise.all([
        API.get("/societies"),
        API.get("/flats"),
        API.get("/users?role=resident"),
      ]);
      setSocieties(socRes.data.societies || []);
      setFlats(flatRes.data.flats || []);
      setResidents(resRes.data.users || []);

      if (socRes.data.societies?.length > 0) {
        setWalkinData((prev) => ({ ...prev, society: socRes.data.societies[0]._id }));
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchVisitors();
    fetchDependencies();
  }, [filterPurpose, filterStatus]);

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinData.name || !walkinData.phone || !walkinData.society || !walkinData.flat || !walkinData.host) {
      toast.error("Please fill all required fields");
      return;
    }
    const cleanPhone = walkinData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    try {
      await API.post("/visitors/walkin", { ...walkinData, phone: cleanPhone });
      toast.success("Walk-in visitor registered and auto-approved");
      setShowWalkinModal(false);
      setWalkinData({
        name: "",
        phone: "",
        purpose: "guest",
        society: societies[0]?._id || "",
        flat: "",
        host: "",
        vehicleNumber: "",
        note: "",
      });
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register walk-in visitor");
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/visitors/${id}/approve`);
      toast.success("Visitor gate pass approved");
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/visitors/${id}/reject`);
      toast.success("Visitor gate pass rejected");
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Rejection failed");
    }
  };

  const handleCheckIn = async (v) => {
    if (v.approvalStatus !== "approved") {
      toast.error("Pending gate pass visitor cannot be checked in. Please approve first.");
      return;
    }
    try {
      await API.put(`/visitors/${v._id}/checkin`);
      toast.success("Visitor checked in");
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await API.put(`/visitors/${id}/checkout`);
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-out failed");
    }
  };

  const handleBlacklist = async (id) => {
    if (!window.confirm("Blacklist this visitor? Entry will be strictly denied.")) return;
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
    guest: "bg-blue-100 text-blue-700 border-blue-200",
    delivery: "bg-amber-100 text-amber-700 border-amber-200",
    maintenance: "bg-purple-100 text-purple-700 border-purple-200",
    cab: "bg-indigo-100 text-indigo-700 border-indigo-200",
    medical: "bg-rose-100 text-rose-700 border-rose-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase();
    return visitors.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.flat?.flatNumber?.toLowerCase().includes(q) ||
        v.host?.name?.toLowerCase().includes(q)
    );
  }, [visitors, searchQuery]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUserFriends className="text-primary-600" /> Visitor & Gate Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time gate pass monitoring, visitor check-in/check-out logs, and blacklist controls
          </p>
        </div>
        <button
          onClick={() => setShowWalkinModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-xs"
        >
          <FaPlus /> Register Walk-In Visitor
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search visitor by name, phone, flat, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
          />
        </div>

        <select
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Visit Reasons</option>
          {["guest", "delivery", "maintenance", "cab", "medical", "other"].map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
        >
          <option value="">All Approval Status</option>
          {["pending", "approved", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="text-center py-12">
            <FaUserFriends className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No visitor logs found matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="text-left px-6 py-4">Visitor</th>
                  <th className="text-left px-6 py-4">Phone</th>
                  <th className="text-left px-6 py-4">Purpose</th>
                  <th className="text-left px-6 py-4">Host Resident</th>
                  <th className="text-left px-6 py-4">Flat</th>
                  <th className="text-left px-6 py-4">In / Out Logs</th>
                  <th className="text-left px-6 py-4">Gate Pass</th>
                  <th className="text-left px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVisitors.map((v) => (
                  <tr
                    key={v._id}
                    className={`hover:bg-gray-50/80 transition ${v.isBlacklisted ? "bg-rose-50/50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                        {v.name}
                        {v.isBlacklisted && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                            Blacklisted
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{v.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize ${purposeColors[v.purpose]}`}>
                        {v.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{v.host?.name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                        {v.flat?.flatNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>
                        <span className="text-gray-400">In: </span>
                        {v.entryTime ? (
                          <span className="font-semibold text-emerald-700">
                            {new Date(v.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-gray-300">Pending</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400">Out: </span>
                        {v.exitTime ? (
                          <span className="font-semibold text-rose-700">
                            {new Date(v.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-gray-300">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${statusColors[v.approvalStatus]}`}>
                        {v.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {v.approvalStatus === "pending" && !v.isBlacklisted && (
                          <>
                            <button
                              onClick={() => handleApprove(v._id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Approve Visitor Gate Pass"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleReject(v._id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Reject Visitor Gate Pass"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {!v.entryTime && !v.isBlacklisted && (
                          <button
                            onClick={() => handleCheckIn(v)}
                            className={`p-1.5 rounded-lg transition ${
                              v.approvalStatus === "approved"
                                ? "text-blue-600 hover:bg-blue-50"
                                : "text-gray-400 hover:bg-gray-100"
                            }`}
                            title={
                              v.approvalStatus === "approved"
                                ? "Check In Visitor"
                                : "Pending Approval — Click to check in or approve first"
                            }
                          >
                            <FaSignInAlt />
                          </button>
                        )}
                        {v.entryTime && !v.exitTime && (
                          <button
                            onClick={() => handleCheckOut(v._id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Check Out Visitor"
                          >
                            <FaSignOutAlt />
                          </button>
                        )}
                        {!v.isBlacklisted && (
                          <button
                            onClick={() => handleBlacklist(v._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Blacklist Visitor"
                          >
                            <FaBan />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Record"
                        >
                          <FaTrash />
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
      {/* Walk-In Visitor Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Register Walk-In Visitor</h2>
            <form onSubmit={handleWalkinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Visitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={walkinData.name}
                  onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={walkinData.phone}
                    onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Purpose *</label>
                  <select
                    value={walkinData.purpose}
                    onChange={(e) => setWalkinData({ ...walkinData, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {["guest", "delivery", "maintenance", "cab", "medical", "other"].map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Society *</label>
                <select
                  required
                  value={walkinData.society}
                  onChange={(e) => setWalkinData({ ...walkinData, society: e.target.value, flat: "", host: "" })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {societies.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Flat *</label>
                  <select
                    required
                    value={walkinData.flat}
                    onChange={(e) => {
                      const selectedFlatId = e.target.value;
                      const selectedFlat = flats.find((f) => f._id === selectedFlatId);
                      const defaultHost = selectedFlat?.currentTenant?._id || selectedFlat?.owner?._id || walkinData.host;
                      setWalkinData({
                        ...walkinData,
                        flat: selectedFlatId,
                        host: defaultHost,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Flat</option>
                    {flats
                      .filter((f) => !walkinData.society || f.society?._id === walkinData.society || f.society === walkinData.society)
                      .map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.flatNumber} ({f.block})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Host Resident *</label>
                  <select
                    required
                    value={walkinData.host}
                    onChange={(e) => setWalkinData({ ...walkinData, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Host</option>
                    {residents.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vehicle No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={walkinData.vehicleNumber}
                    onChange={(e) => setWalkinData({ ...walkinData, vehicleNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Notes / Item Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Package"
                    value={walkinData.note}
                    onChange={(e) => setWalkinData({ ...walkinData, note: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Check In Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Visitors;

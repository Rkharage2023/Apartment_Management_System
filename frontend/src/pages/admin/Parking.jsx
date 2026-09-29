import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaCar,
  FaBolt,
  FaUserCheck,
  FaTrash,
  FaParking,
  FaSearch,
  FaTimes,
  FaUndo,
  FaFilter,
} from "react-icons/fa";

const Parking = () => {
  const [slots, setSlots] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSociety, setFilterSociety] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    society: "",
    slotNumber: "",
    slotType: "four_wheeler",
    monthlyCharge: "",
    isEVCharging: false,
    note: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    _id: "",
    slotNumber: "",
    vehicleNumber: "",
    vehicleType: "four_wheeler",
    isEVCharging: false,
    detailsSubmitted: false,
    monthlyCharge: 0,
    note: "",
  });

  const handleOpenEdit = (slot) => {
    setEditData({
      _id: slot._id,
      slotNumber: slot.slotNumber,
      vehicleNumber: slot.vehicleNumber || "",
      vehicleType: slot.vehicleType || "four_wheeler",
      isEVCharging: slot.isEVCharging || false,
      detailsSubmitted: slot.detailsSubmitted || false,
      monthlyCharge: slot.monthlyCharge || 0,
      note: slot.note || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/parking/${editData._id}`, editData);
      toast.success("Parking slot updated successfully");
      setShowEditModal(false);
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update slot");
    }
  };

  const [assignData, setAssignData] = useState({
    userId: "",
    flatId: "",
    vehicleNumber: "",
    vehicleType: "",
  });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/parking`);
      setSlots(res.data.slots || []);
    } catch (error) {
      toast.error("Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get(`/societies`);
      const list = res.data.societies || [];
      setSocieties(list);
      if (list.length > 0) {
        setFormData((prev) => ({ ...prev, society: prev.society || list[0]._id }));
      }
    } catch (error) {}
  };

  const fetchFlats = async () => {
    try {
      const res = await API.get(`/flats`);
      setFlats(res.data.flats || []);
    } catch (error) {}
  };

  const fetchResidents = async () => {
    try {
      const res = await API.get(`/users?role=resident`);
      setResidents(res.data.users || []);
    } catch (error) {}
  };

  useEffect(() => {
    fetchSlots();
    fetchSocieties();
    fetchFlats();
    fetchResidents();
  }, []);

  // Client-side filtering logic so summary counts are accurate
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchesStatus = !filterStatus || s.status === filterStatus;
      const matchesType = !filterType || s.slotType === filterType;
      const matchesSociety =
        !filterSociety || (s.society?._id || s.society) === filterSociety;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.slotNumber?.toLowerCase().includes(q) ||
        s.assignedTo?.name?.toLowerCase().includes(q) ||
        s.flat?.flatNumber?.toLowerCase().includes(q) ||
        s.vehicleNumber?.toLowerCase().includes(q) ||
        s.society?.name?.toLowerCase().includes(q);

      return matchesStatus && matchesType && matchesSociety && matchesSearch;
    });
  }, [slots, filterStatus, filterType, filterSociety, searchQuery]);

  const isAnyFilterActive = Boolean(
    filterStatus || filterType || filterSociety || searchQuery
  );

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterType("");
    setFilterSociety("");
    setSearchQuery("");
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!formData.society || !formData.slotNumber || !formData.slotType) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await API.post(`/parking`, {
        ...formData,
        monthlyCharge: Number(formData.monthlyCharge),
      });
      toast.success("Parking slot created");
      setShowModal(false);
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create slot");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignData.userId || !assignData.flatId) {
      toast.error("Please select both resident and flat");
      return;
    }
    try {
      await API.put(`/parking/${selectedSlot._id}/assign`, assignData);
      toast.success("Slot assigned successfully");
      setShowAssignModal(false);
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assign failed");
    }
  };

  const handleUnassign = async (id) => {
    if (!window.confirm("Unassign this slot?")) return;
    try {
      await API.put(`/parking/${id}/unassign`);
      toast.success("Slot unassigned");
      fetchSlots();
    } catch (error) {
      toast.error("Unassign failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await API.delete(`/parking/${id}`);
      toast.success("Slot deleted");
      fetchSlots();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleFlatSelect = (flatId) => {
    const selectedFlat = flats.find((f) => f._id === flatId);
    if (selectedFlat) {
      const ownerOrTenantId = selectedFlat.owner?._id || selectedFlat.owner || selectedFlat.tenant?._id || selectedFlat.tenant || "";
      setAssignData((prev) => ({
        ...prev,
        flatId,
        userId: ownerOrTenantId || prev.userId,
      }));
    } else {
      setAssignData((prev) => ({ ...prev, flatId }));
    }
  };

  const statusColors = {
    available: "bg-emerald-100 text-emerald-700 border-emerald-200",
    occupied: "bg-blue-100 text-blue-700 border-blue-200",
    reserved: "bg-amber-100 text-amber-700 border-amber-200",
    maintenance: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaParking className="text-primary-600" /> Parking Allotments
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage society parking slots, EV charging stations, and resident vehicle allotments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-xs"
        >
          <FaPlus /> Add New Slot
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Available Slots</p>
          <p className="text-3xl font-extrabold text-emerald-800 mt-1">
            {slots.filter((s) => s.status === "available").length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Occupied</p>
          <p className="text-3xl font-extrabold text-blue-800 mt-1">
            {slots.filter((s) => s.status === "occupied").length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">EV Stations</p>
          <p className="text-3xl font-extrabold text-purple-800 mt-1">
            {slots.filter((s) => s.isEVCharging).length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Slots</p>
          <p className="text-3xl font-extrabold text-gray-800 mt-1">{slots.length}</p>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search by slot no, resident, flat, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-gray-500">
            Showing {filteredSlots.length} of {slots.length} slots
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 font-semibold pr-2">
            <FaFilter className="text-primary-600" /> Filters:
          </div>

          {/* Society Filter */}
          <select
            value={filterSociety}
            onChange={(e) => setFilterSociety(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Societies</option>
            {societies.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize"
          >
            <option value="">All Statuses</option>
            {["available", "occupied", "reserved", "maintenance"].map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Slot Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
          >
            <option value="">All Slot Types</option>
            {["two_wheeler", "four_wheeler", "ev", "visitor"].map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {isAnyFilterActive && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition ml-auto"
            >
              <FaUndo className="text-xs" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-12">
            <FaCar className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No parking slots found matching criteria</p>
            {isAnyFilterActive && (
              <button
                onClick={handleClearFilters}
                className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="text-left px-6 py-4">Slot No</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-left px-6 py-4">Assigned Resident</th>
                  <th className="text-left px-6 py-4">Flat No</th>
                  <th className="text-left px-6 py-4">Vehicle Number</th>
                  <th className="text-left px-6 py-4">EV Charging</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSlots.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{s.slotNumber}</td>
                    <td className="px-6 py-4 text-gray-700 capitalize font-medium">{s.slotType.replace("_", " ")}</td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">
                      {s.assignedTo?.name || <span className="text-gray-400 font-normal italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{s.flat?.flatNumber || "—"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{s.vehicleNumber || "—"}</td>
                    <td className="px-6 py-4">
                      {s.isEVCharging ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                          <FaBolt className="text-purple-600" /> EV Ready
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize border ${statusColors[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold"
                        >
                          Edit
                        </button>
                        {s.status === "available" ? (
                          <button
                            onClick={() => {
                              setSelectedSlot(s);
                              setAssignData({ userId: "", flatId: "", vehicleNumber: "", vehicleType: "" });
                              setShowAssignModal(true);
                            }}
                            className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition font-semibold"
                          >
                            Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnassign(s._id)}
                            className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition font-semibold"
                          >
                            Unassign
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition font-semibold"
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

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Add Parking Slot</h2>
            </div>
            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Society *</label>
                <select
                  value={formData.society}
                  onChange={(e) => setFormData({ ...formData, society: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Number *</label>
                  <input
                    value={formData.slotNumber}
                    onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })}
                    placeholder="P-101"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Type *</label>
                  <select
                    value={formData.slotType}
                    onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="four_wheeler">Four Wheeler</option>
                    <option value="two_wheeler">Two Wheeler</option>
                    <option value="ev">EV Station</option>
                    <option value="visitor">Visitor Slot</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="evCharging"
                  checked={formData.isEVCharging}
                  onChange={(e) => setFormData({ ...formData, isEVCharging: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="evCharging" className="text-xs font-semibold text-gray-700">
                  Equipped with EV Fast Charger
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal — with Dropdowns */}
      {showAssignModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Assign Slot {selectedSlot.slotNumber}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Select flat and resident for allotment</p>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Flat *</label>
                <select
                  value={assignData.flatId}
                  onChange={(e) => handleFlatSelect(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Flat --</option>
                  {flats.map((f) => (
                    <option key={f._id} value={f._id}>
                      Flat {f.flatNumber} (Block {f.block}) — {f.owner?.name || f.tenant?.name || "Occupied"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Resident *</label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Resident --</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle License Plate Number</label>
                <input
                  value={assignData.vehicleNumber}
                  onChange={(e) => setAssignData({ ...assignData, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
                >
                  Confirm Allotment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Slot Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Edit Slot {editData.slotNumber}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Admin Update Vehicle & Parking Details</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleUpdateSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Plate Number</label>
                <input
                  value={editData.vehicleNumber}
                  onChange={(e) => setEditData({ ...editData, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                  <select
                    value={editData.vehicleType}
                    onChange={(e) => setEditData({ ...editData, vehicleType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="four_wheeler">Four Wheeler</option>
                    <option value="two_wheeler">Two Wheeler</option>
                    <option value="ev">Electric Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Charge (₹)</label>
                  <input
                    type="number"
                    value={editData.monthlyCharge}
                    onChange={(e) => setEditData({ ...editData, monthlyCharge: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.isEVCharging}
                    onChange={(e) => setEditData({ ...editData, isEVCharging: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-xs font-semibold text-gray-700">EV Fast Charging Ready</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.detailsSubmitted}
                    onChange={(e) => setEditData({ ...editData, detailsSubmitted: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="text-xs font-semibold text-amber-800">Lock Resident Edits (Details Submitted)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note / Admin Remarks</label>
                <input
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                  placeholder="Special instructions or notes"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Parking;

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaCar } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const Parking = () => {
  const [slots, setSlots] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    society: "",
    slotNumber: "",
    slotType: "four_wheeler",
    monthlyCharge: "",
    isEVCharging: false,
    note: "",
  });

  const [assignData, setAssignData] = useState({
    userId: "",
    flatId: "",
    vehicleNumber: "",
    vehicleType: "",
  });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterType) query += `slotType=${filterType}`;
      const res = await API.get(`/parking${query}`);
      setSlots(res.data.slots);
    } catch (error) {
      toast.error("Failed to fetch slots");
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
    fetchSlots();
    fetchSocieties();
  }, [filterStatus, filterType]);

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
      toast.error("Please provide userId and flatId");
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

  const statusColors = {
    available: "bg-green-100 text-green-600",
    occupied: "bg-blue-100 text-blue-600",
    reserved: "bg-yellow-100 text-yellow-600",
    maintenance: "bg-red-100 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Parking</h1>
          <p className="text-gray-500 text-sm mt-1">Manage parking slots</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Slot
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          {["available", "occupied", "reserved", "maintenance"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          {["two_wheeler", "four_wheeler", "ev", "visitor"].map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <FaCar className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No parking slots found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Slot
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Assigned To
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Vehicle
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Charge
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    EV
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
                {slots.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {s.slotNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {s.slotType.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {s.assignedTo?.name || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {s.vehicleNumber || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₹{s.monthlyCharge}
                    </td>
                    <td className="px-6 py-4">{s.isEVCharging ? "✅" : "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {s.status === "available" ? (
                          <button
                            onClick={() => {
                              setSelectedSlot(s);
                              setShowAssignModal(true);
                            }}
                            className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition font-medium"
                          >
                            Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnassign(s._id)}
                            className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition font-medium"
                          >
                            Unassign
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s._id)}
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

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Add Parking Slot
              </h2>
            </div>
            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Number *
                  </label>
                  <input
                    value={formData.slotNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, slotNumber: e.target.value })
                    }
                    placeholder="P-01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Type *
                  </label>
                  <select
                    value={formData.slotType}
                    onChange={(e) =>
                      setFormData({ ...formData, slotType: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {["two_wheeler", "four_wheeler", "ev", "visitor"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t.replace("_", " ")}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Charge
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyCharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyCharge: e.target.value,
                      })
                    }
                    placeholder="500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="evCharging"
                    checked={formData.isEVCharging}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isEVCharging: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600"
                  />
                  <label
                    htmlFor="evCharging"
                    className="text-sm font-medium text-gray-700"
                  >
                    EV Charging
                  </label>
                </div>
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
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Assign Slot {selectedSlot?.slotNumber}
              </h2>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID *
                </label>
                <input
                  value={assignData.userId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, userId: e.target.value })
                  }
                  placeholder="MongoDB User ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat ID *
                </label>
                <input
                  value={assignData.flatId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, flatId: e.target.value })
                  }
                  placeholder="MongoDB Flat ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    value={assignData.vehicleNumber}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        vehicleNumber: e.target.value,
                      })
                    }
                    placeholder="MH10AB1234"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <input
                    value={assignData.vehicleType}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        vehicleType: e.target.value,
                      })
                    }
                    placeholder="Car"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  Assign
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

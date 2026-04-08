import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaUserPlus,
} from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const Flats = () => {
  const [flats, setFlats] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [assignData, setAssignData] = useState({
    userId: "",
    assignAs: "owner",
  });
  const [formData, setFormData] = useState({
    society: "",
    flatNumber: "",
    block: "A",
    floor: "",
    type: "2BHK",
    monthlyRent: "",
    maintenanceCharge: "",
    parkingSlot: "",
  });

  const fetchFlats = async () => {
    try {
      setLoading(true);
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const res = await API.get(`${API_URL}/flats${query}`);
      setFlats(res.data.flats);
    } catch (error) {
      toast.error("Failed to fetch flats");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await API.get(`${API_URL}/societies`);
      setSocieties(res.data.societies);
    } catch (error) {}
  };

  useEffect(() => {
    fetchFlats();
    fetchSocieties();
  }, [filterStatus]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      society: "",
      flatNumber: "",
      block: "A",
      floor: "",
      type: "2BHK",
      monthlyRent: "",
      maintenanceCharge: "",
      parkingSlot: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.society || !formData.flatNumber || !formData.floor) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await API.post(`${API_URL}/flats`, {
        ...formData,
        floor: Number(formData.floor),
        monthlyRent: Number(formData.monthlyRent),
        maintenanceCharge: Number(formData.maintenanceCharge),
      });
      toast.success("Flat created successfully");
      setShowModal(false);
      resetForm();
      fetchFlats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this flat?")) return;
    try {
      await API.delete(`${API_URL}/flats/${id}`);
      toast.success("Flat deleted");
      fetchFlats();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignData.userId) {
      toast.error("Please provide user ID");
      return;
    }
    try {
      await API.put(`${API_URL}/flats/${selectedFlat._id}/assign`, assignData);
      toast.success("User assigned successfully");
      setShowAssignModal(false);
      fetchFlats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assign failed");
    }
  };

  const statusColors = {
    vacant: "bg-green-100 text-green-600",
    occupied: "bg-blue-100 text-blue-600",
    under_maintenance: "bg-yellow-100 text-yellow-600",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Flats</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all flats</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Flat
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "vacant", "occupied", "under_maintenance"].map((s) => (
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
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : flats.length === 0 ? (
          <div className="text-center py-12">
            <FaBuilding className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No flats found</p>
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
                    Block/Floor
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Owner
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Rent
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
                {flats.map((f) => (
                  <tr key={f._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {f.flatNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      Block {f.block} / Floor {f.floor}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{f.type}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {f.owner?.name || f.tenant?.name || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₹{f.monthlyRent}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[f.status]}`}
                      >
                        {f.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedFlat(f);
                            setShowAssignModal(true);
                          }}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition"
                          title="Assign Resident"
                        >
                          <FaUserPlus />
                        </button>
                        <button
                          onClick={() => handleDelete(f._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
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

      {/* Add Flat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Add Flat</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Society *
                </label>
                <select
                  name="society"
                  value={formData.society}
                  onChange={handleChange}
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
                    Flat Number *
                  </label>
                  <input
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleChange}
                    placeholder="A-101"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block
                  </label>
                  <input
                    name="block"
                    value={formData.block}
                    onChange={handleChange}
                    placeholder="A"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor *
                  </label>
                  <input
                    name="floor"
                    type="number"
                    value={formData.floor}
                    onChange={handleChange}
                    placeholder="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent
                  </label>
                  <input
                    name="monthlyRent"
                    type="number"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    placeholder="12000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance
                  </label>
                  <input
                    name="maintenanceCharge"
                    type="number"
                    value={formData.maintenanceCharge}
                    onChange={handleChange}
                    placeholder="2000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parking Slot
                </label>
                <input
                  name="parkingSlot"
                  value={formData.parkingSlot}
                  onChange={handleChange}
                  placeholder="P-01"
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
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
                >
                  Create Flat
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
                Assign Resident to {selectedFlat?.flatNumber}
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
                  placeholder="Paste MongoDB User ID here"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign As
                </label>
                <select
                  value={assignData.assignAs}
                  onChange={(e) =>
                    setAssignData({ ...assignData, assignAs: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="owner">Owner</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
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

export default Flats;

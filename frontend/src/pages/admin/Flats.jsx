import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaBuilding, FaUserPlus } from "react-icons/fa";

const Flats = () => {
  const [flats, setFlats] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [residents, setResidents] = useState([]);
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
      const res = await API.get(`/flats${query}`);
      setFlats(res.data.flats);
    } catch (error) {
      toast.error("Failed to fetch flats");
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

  const fetchResidents = async () => {
    try {
      const res = await API.get("/users?role=resident");
      setResidents(res.data.users);
    } catch (error) {}
  };

  useEffect(() => {
    fetchFlats();
    fetchSocieties();
    fetchResidents();
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
      await API.post("/flats", {
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
      await API.delete(`/flats/${id}`);
      toast.success("Flat deleted");
      fetchFlats();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleOpenAssign = (flat) => {
    setSelectedFlat(flat);
    setAssignData({ userId: "", assignAs: "owner" });
    setShowAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignData.userId) {
      toast.error("Please select a resident");
      return;
    }
    try {
      await API.put(`/flats/${selectedFlat._id}/assign`, assignData);
      toast.success("Resident assigned successfully");
      setShowAssignModal(false);
      fetchFlats();
      fetchResidents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assign failed");
    }
  };

  const handleUnassign = async (flatId, assignAs) => {
    if (!window.confirm(`Remove ${assignAs} from this flat?`)) return;
    try {
      await API.put(`/flats/${flatId}/unassign`, { assignAs });
      toast.success(`${assignAs} removed`);
      fetchFlats();
      fetchResidents();
    } catch (error) {
      toast.error("Unassign failed");
    }
  };

  const statusColors = {
    vacant: "bg-green-100 text-green-600",
    occupied: "bg-blue-100 text-blue-600",
    under_maintenance: "bg-yellow-100 text-yellow-600",
  };

  // Filter residents who don't have a flat assigned yet
  const unassignedResidents = residents.filter((r) => !r.flatNumber);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Flats</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all flats — {flats.length} total
          </p>
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
                    Tenant
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
                    <td className="px-6 py-4">
                      {f.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                            {f.owner.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {f.owner.name}
                            </p>
                            <button
                              onClick={() => handleUnassign(f._id, "owner")}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          No owner
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {f.tenant ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                            {f.tenant.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {f.tenant.name}
                            </p>
                            <button
                              onClick={() => handleUnassign(f._id, "tenant")}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          No tenant
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ₹{f.monthlyRent?.toLocaleString()}
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
                          onClick={() => handleOpenAssign(f)}
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

      {/* ✅ Assign Modal with Dropdown */}
      {showAssignModal && selectedFlat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                Assign Resident to Flat {selectedFlat.flatNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select a resident from the list below
              </p>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {/* Assign As */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign As *
                </label>
                <div className="flex gap-3">
                  {["owner", "tenant"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setAssignData({ ...assignData, assignAs: type })
                      }
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition capitalize ${
                        assignData.assignAs === type
                          ? "border-primary-500 bg-primary-50 text-primary-600"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resident Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Resident *
                </label>
                {unassignedResidents.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">
                      No unassigned residents found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      All residents have flats assigned
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {unassignedResidents.map((r) => (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() =>
                          setAssignData({ ...assignData, userId: r._id })
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                          assignData.userId === r._id
                            ? "bg-primary-50 border-l-4 border-l-primary-500"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {r.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {r.email}
                          </p>
                        </div>
                        {r.phone && (
                          <p className="text-xs text-gray-400 flex-shrink-0">
                            {r.phone}
                          </p>
                        )}
                        {assignData.userId === r._id && (
                          <span className="text-primary-600 text-xs font-medium flex-shrink-0">
                            ✓ Selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Resident Preview */}
              {assignData.userId && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-medium">
                    ✅ Assigning{" "}
                    <span className="font-bold">
                      {residents.find((r) => r._id === assignData.userId)?.name}
                    </span>{" "}
                    as{" "}
                    <span className="capitalize font-bold">
                      {assignData.assignAs}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold">
                      Flat {selectedFlat.flatNumber}
                    </span>
                  </p>
                </div>
              )}

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
                  disabled={!assignData.userId}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Resident
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

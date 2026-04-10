import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaCity } from "react-icons/fa";

const Societies = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    totalFlats: "",
    totalBlocks: "",
    amenities: "",
  });

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/societies`);
      setSocieties(res.data.societies);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch societies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      totalFlats: "",
      totalBlocks: "",
      amenities: "",
    });
    setEditData(null);
  };

  const handleOpenModal = (society = null) => {
    if (society) {
      setEditData(society);
      setFormData({
        name: society.name,
        street: society.address.street,
        city: society.address.city,
        state: society.address.state,
        pincode: society.address.pincode,
        totalFlats: society.totalFlats,
        totalBlocks: society.totalBlocks,
        amenities: society.amenities.join(", "),
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.street || !formData.totalFlats) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: formData.name,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      totalFlats: Number(formData.totalFlats),
      totalBlocks: Number(formData.totalBlocks),
      amenities: formData.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };

    try {
      if (editData) {
        await API.put(`/societies/${editData._id}`, payload);
        toast.success("Society updated successfully");
      } else {
        await API.post(`/societies`, payload);
        toast.success("Society created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchSocieties();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this society?"))
      return;
    try {
      await API.delete(`/societies/${id}`);
      toast.success("Society deleted successfully");
      fetchSocieties();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Societies</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all registered societies
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FaPlus /> Add Society
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : societies.length === 0 ? (
          <div className="text-center py-12">
            <FaCity className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-500">No societies found</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-3 text-primary-600 text-sm font-medium hover:underline"
            >
              Create your first society
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Address
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Flats
                  </th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">
                    Blocks
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
                {societies.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {s.address.city}, {s.address.state}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s.totalFlats}</td>
                    <td className="px-6 py-4 text-gray-600">{s.totalBlocks}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(s)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editData ? "Edit Society" : "Add Society"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Society Name *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Green Valley Society"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street *
                  </label>
                  <input
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="123 MG Road"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Sangli"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="416416"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Flats *
                  </label>
                  <input
                    name="totalFlats"
                    type="number"
                    value={formData.totalFlats}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Blocks
                  </label>
                  <input
                    name="totalBlocks"
                    type="number"
                    value={formData.totalBlocks}
                    onChange={handleChange}
                    placeholder="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma separated)
                </label>
                <input
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  placeholder="Gym, Pool, Parking, Garden"
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

export default Societies;

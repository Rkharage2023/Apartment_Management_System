import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaUser,
  FaCar,
  FaSwimmingPool,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaPaperPlane,
  FaInfoCircle,
} from "react-icons/fa";

const MyFlat = () => {
  const [flat, setFlat] = useState(null);
  const [vacantFlats, setVacantFlats] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available"); // "available" | "requests"

  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedFlatForReq, setSelectedFlatForReq] = useState(null);
  const [requestData, setRequestData] = useState({
    requestAs: "tenant",
    vehicleType: "four_wheeler",
    vehicleDetails: "",
    note: "",
  });

  const fetchMyFlat = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/flats/my-flat`);
      setFlat(res.data.flat);
    } catch (error) {
      setFlat(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchVacantFlats = async () => {
    try {
      const res = await API.get("/flats?status=vacant");
      setVacantFlats(res.data.flats || []);
    } catch (error) {
      toast.error("Failed to load available flats");
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await API.get("/flats/requests/my-requests");
      setMyRequests(res.data.requests || []);
    } catch (error) {}
  };

  useEffect(() => {
    fetchMyFlat();
    fetchVacantFlats();
    fetchMyRequests();
  }, []);

  const handleOpenRequestModal = (vFlat) => {
    setSelectedFlatForReq(vFlat);
    setRequestData({
      requestAs: "tenant",
      vehicleType: "four_wheeler",
      vehicleDetails: "",
      note: "",
    });
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlatForReq) return;

    try {
      await API.post("/flats/request", {
        flatId: selectedFlatForReq._id,
        ...requestData,
      });
      toast.success("Flat allocation request submitted successfully!");
      setShowRequestModal(false);
      fetchMyRequests();
      fetchVacantFlats();
      setActiveTab("requests");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    }
  };

  const statusColors = {
    vacant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    occupied: "bg-blue-100 text-blue-700 border-blue-200",
    under_maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  };

  const reqStatusBadges = {
    pending: {
      bg: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <FaHourglassHalf className="text-amber-600" />,
      label: "Pending Admin Approval",
    },
    approved: {
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <FaCheckCircle className="text-emerald-600" />,
      label: "Approved & Assigned",
    },
    rejected: {
      bg: "bg-rose-100 text-rose-800 border-rose-200",
      icon: <FaTimesCircle className="text-rose-600" />,
      label: "Request Rejected",
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* If Flat is Assigned */}
      {flat ? (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaBuilding className="text-primary-600" /> My Assigned Flat
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Your registered flat details, society amenities, and owner/tenant info
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flat Info Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Details */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                      <FaBuilding className="text-primary-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        Flat {flat.flatNumber}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Block {flat.block} • Floor {flat.floor}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold border capitalize ${
                      statusColors[flat.status]
                    }`}
                  >
                    {flat.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Flat Type", value: flat.type },
                    { label: "Block", value: `Block ${flat.block}` },
                    { label: "Floor", value: `Floor ${flat.floor}` },
                    {
                      label: "Monthly Rent",
                      value: `₹${flat.monthlyRent?.toLocaleString()}`,
                    },
                    {
                      label: "Maintenance",
                      value: `₹${flat.maintenanceCharge?.toLocaleString()}`,
                    },
                    {
                      label: "Parking Slot",
                      value: flat.parkingSlot || "Not assigned",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100/80">
                      <p className="text-xs text-gray-400 font-medium mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Society Details */}
              {flat.society && (
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary-500" />
                    Society Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Society Name</span>
                      <span className="text-sm font-medium text-gray-800">
                        {flat.society.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Address</span>
                      <span className="text-sm font-medium text-gray-800 text-right">
                        {flat.society.address?.street}, {flat.society.address?.city}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500">State</span>
                      <span className="text-sm font-medium text-gray-800">
                        {flat.society.address?.state} -{" "}
                        {flat.society.address?.pincode}
                      </span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {flat.society.amenities?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FaSwimmingPool className="text-primary-500" />
                        Society Amenities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {flat.society.amenities.map((a, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Owner Info */}
              {flat.owner && (
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaUser className="text-primary-500" />
                    Owner
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                      {flat.owner.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {flat.owner.name}
                      </p>
                      <p className="text-xs text-gray-400">{flat.owner.email}</p>
                    </div>
                  </div>
                  {flat.owner.phone && (
                    <p className="text-xs text-gray-600">📞 {flat.owner.phone}</p>
                  )}
                </div>
              )}

              {/* Tenant Info */}
              {flat.tenant && (
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaUser className="text-emerald-500" />
                    Tenant
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                      {flat.tenant.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {flat.tenant.name}
                      </p>
                      <p className="text-xs text-gray-400">{flat.tenant.email}</p>
                    </div>
                  </div>
                  {flat.tenant.phone && (
                    <p className="text-xs text-gray-600">📞 {flat.tenant.phone}</p>
                  )}
                </div>
              )}

              {/* Parking Info */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaCar className="text-primary-500" />
                  Parking Slot
                </h3>
                {flat.parkingSlot ? (
                  <div className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100">
                    <p className="text-2xl font-bold text-primary-600">
                      {flat.parkingSlot}
                    </p>
                    <p className="text-xs text-primary-500 font-medium mt-1">Assigned Slot</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No parking slot assigned
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* If No Flat Assigned — Show Allocation & Request Portal */
        <div className="space-y-6">
          {/* Top Banner Notice */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                <FaBuilding className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Flat Allocation & Request Portal</h2>
                <p className="text-primary-100 text-sm mt-1 max-w-2xl">
                  You currently have no flat assigned to your account. Browse available vacant flats below, submit your vehicle details, and send an allotment request directly to the Admin.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "available"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FaBuilding /> Available Vacant Flats ({vacantFlats.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "requests"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FaPaperPlane /> My Allocation Requests ({myRequests.length})
            </button>
          </div>

          {/* TAB 1: Available Vacant Flats */}
          {activeTab === "available" && (
            <div>
              {vacantFlats.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <FaBuilding className="text-gray-300 text-5xl mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold text-lg">No Vacant Flats Available</p>
                  <p className="text-gray-400 text-sm mt-1">
                    All flats in society are currently occupied. Please check back later or contact admin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {vacantFlats.map((vFlat) => (
                    <div
                      key={vFlat._id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full uppercase tracking-wider">
                            Vacant
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                            {vFlat.type}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          Flat {vFlat.flatNumber}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-primary-500" />
                          {vFlat.society?.name || "Society"} • Block {vFlat.block} • Floor {vFlat.floor}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl mb-4">
                          <div>
                            <span className="text-gray-400 block">Rent</span>
                            <span className="font-bold text-gray-800">
                              ₹{vFlat.monthlyRent?.toLocaleString() || "0"}/mo
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Maintenance</span>
                            <span className="font-bold text-gray-800">
                              ₹{vFlat.maintenanceCharge?.toLocaleString() || "0"}/mo
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-gray-100">
                            <span className="text-gray-400">Parking Slot: </span>
                            <span className="font-semibold text-primary-600">
                              {vFlat.parkingSlot || "Auto-assigned"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenRequestModal(vFlat)}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm py-2.5 rounded-xl transition shadow-xs"
                      >
                        <FaPaperPlane /> Request Flat Allotment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Submitted Requests */}
          {activeTab === "requests" && (
            <div>
              {myRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <FaPaperPlane className="text-gray-300 text-5xl mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold text-lg">No Requests Submitted Yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Select a vacant flat from the "Available Vacant Flats" tab to request allotment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => {
                    const badge = reqStatusBadges[req.status] || reqStatusBadges.pending;
                    return (
                      <div
                        key={req._id}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center shrink-0">
                            <FaBuilding className="text-primary-600 text-xl" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-gray-800 text-lg">
                                Flat {req.flat?.flatNumber || "N/A"}
                              </h3>
                              <span className="text-xs px-2.5 py-0.5 bg-gray-100 font-semibold rounded-md text-gray-600 capitalize">
                                Requesting as {req.requestAs}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {req.society?.name} • Block {req.flat?.block} • Floor {req.flat?.floor} • Rent ₹{req.flat?.monthlyRent?.toLocaleString()}/mo
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                              {req.vehicleDetails && (
                                <span>
                                  🚘 <strong>Vehicle Info:</strong> {req.vehicleDetails} ({req.vehicleType?.replace("_", " ")})
                                </span>
                              )}
                              {req.note && (
                                <span>
                                  📝 <strong>Note:</strong> {req.note}
                                </span>
                              )}
                            </div>

                            {req.adminNote && (
                              <p className="text-xs text-gray-500 mt-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                                💬 <strong>Admin Response:</strong> {req.adminNote}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end justify-center">
                          <span
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-1">
                            Requested on {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedFlatForReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Request Flat {selectedFlatForReq.flatNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedFlatForReq.society?.name} • Block {selectedFlatForReq.block} • ₹{selectedFlatForReq.monthlyRent?.toLocaleString()}/month
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                {selectedFlatForReq.type}
              </span>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Request As */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Request Allocation As *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["tenant", "owner"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRequestData({ ...requestData, requestAs: role })}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition capitalize ${
                        requestData.requestAs === role
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-2xs"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={requestData.vehicleType}
                  onChange={(e) => setRequestData({ ...requestData, vehicleType: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="four_wheeler">Four-Wheeler (Car)</option>
                  <option value="two_wheeler">Two-Wheeler (Bike / Scooter)</option>
                  <option value="both">Both (Car & Bike)</option>
                  <option value="none">No Vehicle</option>
                </select>
              </div>

              {/* Vehicle Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Vehicle Information / Registration No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Honda City - MH12AB1234"
                  value={requestData.vehicleDetails}
                  onChange={(e) => setRequestData({ ...requestData, vehicleDetails: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Additional Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Move-In Notes / Message to Admin
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Moving in next week with family, requesting 1 parking slot."
                  value={requestData.note}
                  onChange={(e) => setRequestData({ ...requestData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-700 flex items-start gap-2">
                <FaInfoCircle className="text-primary-500 text-sm mt-0.5 shrink-0" />
                <p>
                  Submitting this request will send your profile and vehicle details to the Admin for approval. Upon approval, Flat {selectedFlatForReq.flatNumber} will be assigned to you.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-xs"
                >
                  <FaPaperPlane /> Send Request to Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyFlat;

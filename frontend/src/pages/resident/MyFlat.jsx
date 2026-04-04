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
} from "react-icons/fa";

const MyFlat = () => {
  const [flat, setFlat] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMyFlat = async () => {
    try {
      setLoading(true);
      const res = await API.get("/flats/my-flat");
      setFlat(res.data.flat);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch flat details",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFlat();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!flat) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <FaBuilding className="text-gray-300 text-6xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">
            No Flat Assigned
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Contact your admin to assign a flat to your account
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors = {
    vacant: "bg-green-100 text-green-600",
    occupied: "bg-blue-100 text-blue-600",
    under_maintenance: "bg-yellow-100 text-yellow-600",
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Flat</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your flat details and information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flat Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                className={`text-sm px-3 py-1.5 rounded-full font-medium ${
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
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                    Amenities
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-primary-500" />
                Owner
              </h3>
              <div className="flex items-center gap-3 mb-4">
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
                <p className="text-sm text-gray-600">📞 {flat.owner.phone}</p>
              )}
            </div>
          )}

          {/* Tenant Info */}
          {flat.tenant && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-green-500" />
                Tenant
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
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
                <p className="text-sm text-gray-600">📞 {flat.tenant.phone}</p>
              )}
            </div>
          )}

          {/* Parking Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCar className="text-primary-500" />
              Parking
            </h3>
            {flat.parkingSlot ? (
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {flat.parkingSlot}
                </p>
                <p className="text-xs text-primary-400 mt-1">Assigned Slot</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No parking slot assigned
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyFlat;

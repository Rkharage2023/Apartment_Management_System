import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaCar, FaBolt } from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const MyParking = () => {
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMySlot = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/parking/my-slot`);
      setSlot(res.data.slot);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Failed to fetch parking slot");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySlot();
  }, []);

  const slotTypeColors = {
    two_wheeler: "bg-blue-50 text-blue-600 border-blue-100",
    four_wheeler: "bg-green-50 text-green-600 border-green-100",
    ev: "bg-purple-50 text-purple-600 border-purple-100",
    visitor: "bg-yellow-50 text-yellow-600 border-yellow-100",
  };

  const slotTypeIcons = {
    two_wheeler: "🏍️",
    four_wheeler: "🚗",
    ev: "⚡",
    visitor: "🅿️",
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Parking</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your assigned parking slot details
        </p>
      </div>

      {!slot ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <FaCar className="text-gray-300 text-6xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">
            No Parking Slot Assigned
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Contact your admin to assign a parking slot
          </p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Main Slot Card */}
          <div
            className={`rounded-2xl border-2 p-8 ${slotTypeColors[slot.slotType]}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1">
                  Your Parking Slot
                </p>
                <h2 className="text-4xl font-bold">{slot.slotNumber}</h2>
              </div>
              <div className="text-6xl">{slotTypeIcons[slot.slotType]}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium capitalize">
                {slot.slotType.replace("_", " ")}
              </span>
              {slot.isEVCharging && (
                <span className="flex items-center gap-1 text-sm font-medium bg-white bg-opacity-50 px-3 py-1 rounded-full">
                  <FaBolt className="text-yellow-500" />
                  EV Charging Available
                </span>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Slot Details
            </h3>
            <div className="space-y-3">
              {[
                { label: "Slot Number", value: slot.slotNumber },
                {
                  label: "Slot Type",
                  value: slot.slotType.replace("_", " "),
                },
                {
                  label: "Monthly Charge",
                  value: `₹${slot.monthlyCharge?.toLocaleString()}`,
                },
                {
                  label: "EV Charging",
                  value: slot.isEVCharging ? "Available ⚡" : "Not Available",
                },
                {
                  label: "Vehicle Number",
                  value: slot.vehicleNumber || "Not registered",
                },
                {
                  label: "Vehicle Type",
                  value: slot.vehicleType || "Not specified",
                },
                {
                  label: "Society",
                  value: slot.society?.name || "—",
                },
                {
                  label: "Status",
                  value: slot.status,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {slot.note && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-yellow-700 mb-1">Note</p>
              <p className="text-sm text-yellow-600">{slot.note}</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyParking;

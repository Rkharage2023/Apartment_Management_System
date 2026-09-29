import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaCar, FaBolt, FaLock } from "react-icons/fa";

const MyParking = () => {
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: "",
    vehicleType: "four_wheeler",
    isEVCharging: false,
    note: "",
  });
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);

  const [requestData, setRequestData] = useState({
    slotId: "",
    vehicleNumber: "",
    vehicleType: "four_wheeler",
  });

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      const res = await API.get("/parking/available");
      setAvailableSlots(res.data.slots);
    } catch (error) {
      toast.error("Failed to load available slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleOpenRequest = () => {
    fetchAvailableSlots();
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.slotId || !requestData.vehicleNumber) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitLoading(true);
      await API.put(`/parking/${requestData.slotId}/request`, {
        vehicleNumber: requestData.vehicleNumber,
        vehicleType: requestData.vehicleType,
      });
      toast.success("Parking slot booked successfully!");
      setShowRequestModal(false);
      setRequestData({ slotId: "", vehicleNumber: "", vehicleType: "four_wheeler" });
      fetchMySlot();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVehicleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleData.vehicleNumber) {
      toast.error("Please enter vehicle plate number");
      return;
    }
    try {
      setVehicleSubmitting(true);
      const res = await API.put("/parking/my-slot/vehicle-info", vehicleData);
      toast.success(res.data.message || "Vehicle details submitted & locked!");
      fetchMySlot();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit vehicle details");
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm("Are you sure you want to release your parking slot? This action cannot be undone.")) return;
    try {
      setReleaseLoading(true);
      await API.put(`/parking/${slot._id}/release`);
      toast.success("Parking slot released successfully");
      setSlot(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Release failed");
    } finally {
      setReleaseLoading(false);
    }
  };

  const fetchMySlot = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/parking/my-slot`);
      setSlot(res.data.slot);
      if (res.data.slot) {
        setVehicleData({
          vehicleNumber: res.data.slot.vehicleNumber || "",
          vehicleType: res.data.slot.vehicleType || "four_wheeler",
          isEVCharging: res.data.slot.isEVCharging || false,
          note: res.data.slot.note || "",
        });
      }
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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FaCar className="text-gray-300 text-6xl mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700">
            No Parking Slot Assigned
          </h2>
          <p className="text-gray-400 mt-2 text-sm max-w-sm text-center">
            You don't have an assigned parking space yet. You can request a slot directly online.
          </p>
          <button
            onClick={handleOpenRequest}
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Request Parking Slot
          </button>
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

          {/* Form to submit details if not yet submitted */}
          {!slot.detailsSubmitted ? (
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-800">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <FaCar className="text-xl text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">
                    Submit Vehicle & Parking Information
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please provide your vehicle details for slot allocation record.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 flex items-start gap-2">
                <FaLock className="text-base mt-0.5 text-amber-700 shrink-0" />
                <div>
                  <strong className="font-bold">Important Notice:</strong> Once you submit your vehicle information, it will be permanently locked. Only the Society Admin can modify these details afterwards.
                </div>
              </div>

              <form onSubmit={handleVehicleInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-AB-1234"
                    value={vehicleData.vehicleNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        vehicleNumber: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vehicle Type *
                    </label>
                    <select
                      value={vehicleData.vehicleType}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          vehicleType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="four_wheeler">🚗 4-Wheeler Car</option>
                      <option value="two_wheeler">🏍️ 2-Wheeler Bike</option>
                      <option value="ev">⚡ Electric Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      EV Charging Facility
                    </label>
                    <select
                      value={vehicleData.isEVCharging ? "yes" : "no"}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          isEVCharging: e.target.value === "yes",
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="no">No (Standard Parking)</option>
                      <option value="yes">Yes ⚡ (EV Charging Needed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Additional Remarks / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Preferred timing or special request"
                    value={vehicleData.note}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, note: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={vehicleSubmitting}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {vehicleSubmitting ? "Submitting..." : "Submit & Lock Vehicle Details"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2 font-medium">
                <FaLock className="text-base text-emerald-700 shrink-0" />
                <span>Vehicle details submitted & locked. Only Society Admin can modify.</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 font-semibold rounded-full text-emerald-800">
                Verified
              </span>
            </div>
          )}

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
                  value: slot.vehicleType ? slot.vehicleType.replace("_", " ") : "Not specified",
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

          {/* Release Slot Button */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-2">Vacate Parking Slot</h3>
            <p className="text-xs text-gray-400 mb-3">
              If you no longer need this slot, you can release it so another resident can use it.
            </p>
            <button
              onClick={handleRelease}
              disabled={releaseLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
            >
              {releaseLoading ? "Releasing..." : "Release My Slot"}
            </button>
          </div>
        </div>
      )}

      {/* Request Parking Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
              <h2 className="text-lg font-bold">Request Parking Slot</h2>
              <p className="text-xs text-primary-100 mt-1">
                Select an available slot and enter vehicle details
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              {/* Slot Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Select Parking Slot *
                </label>
                {slotsLoading ? (
                  <p className="text-sm text-gray-400">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                    ⚠️ No available parking slots found in this society.
                  </div>
                ) : (
                  <select
                    value={requestData.slotId}
                    onChange={(e) =>
                      setRequestData({ ...requestData, slotId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a slot</option>
                    {availableSlots.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.slotNumber} — {s.slotType.replace("_", " ")} (₹{s.monthlyCharge}/mo) {s.isEVCharging ? "⚡ EV" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-AB-1234"
                  value={requestData.vehicleNumber}
                  onChange={(e) =>
                    setRequestData({ ...requestData, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={requestData.vehicleType}
                  onChange={(e) =>
                    setRequestData({ ...requestData, vehicleType: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="four_wheeler">🚗 4-Wheeler</option>
                  <option value="two_wheeler">🏍️ 2-Wheeler</option>
                  <option value="ev">⚡ Electric Vehicle</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !requestData.slotId}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? "Booking..." : "Book Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyParking;

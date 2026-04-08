import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import { useSelector } from "react-redux";
import API from "../../api/axios";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

import {
  FaBuilding,
  FaMoneyBill,
  FaExclamationCircle,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
  FaBullhorn,
  FaCheckCircle,
} from "react-icons/fa";

const ResidentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [flat, setFlat] = useState(null);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [parkingSlot, setParkingSlot] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [
          flatRes,
          billsRes,
          complaintsRes,
          visitorsRes,
          noticesRes,
          eventsRes,
          parkingRes,
        ] = await Promise.allSettled([
          API.get(`${API_URL}/flats/my-flat`),
          API.get(`${API_URL}/billing/my-bills`),
          API.get(`${API_URL}/complaints/my-complaints`),
          API.get(`${API_URL}/visitors/my-visitors`),
          API.get(`${API_URL}/notices`),
          API.get(`${API_URL}/events`),
          API.get("/parking/my-slot"),
        ]);

        if (flatRes.status === "fulfilled") setFlat(flatRes.value.data.flat);
        if (billsRes.status === "fulfilled")
          setBills(billsRes.value.data.bills);
        if (complaintsRes.status === "fulfilled")
          setComplaints(complaintsRes.value.data.complaints);
        if (visitorsRes.status === "fulfilled")
          setVisitors(visitorsRes.value.data.visitors);
        if (noticesRes.status === "fulfilled")
          setNotices(noticesRes.value.data.notices);
        if (eventsRes.status === "fulfilled")
          setEvents(eventsRes.value.data.events);
        if (parkingRes.status === "fulfilled")
          setParkingSlot(parkingRes.value.data.slot);
      } catch (error) {
        console.error("Resident dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const unpaidBills = bills.filter((b) => b.status !== "paid");
  const unpaidAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const openComplaints = complaints.filter(
    (c) => c.status === "open" || c.status === "in_progress",
  );
  const upcomingEvents = events.filter((e) => e.status === "upcoming");

  const statusColors = {
    open: "bg-blue-100 text-blue-600",
    in_progress: "bg-yellow-100 text-yellow-600",
    resolved: "bg-green-100 text-green-600",
    closed: "bg-gray-100 text-gray-600",
    escalated: "bg-red-100 text-red-600",
  };

  const billStatusColors = {
    paid: "bg-green-100 text-green-600",
    unpaid: "bg-yellow-100 text-yellow-600",
    overdue: "bg-red-100 text-red-600",
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Flat Info Banner */}
      {flat ? (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm mb-1">Your Flat</p>
              <h2 className="text-3xl font-bold">Flat {flat.flatNumber}</h2>
              <p className="text-primary-200 mt-1">
                {flat.type} • Block {flat.block} • Floor {flat.floor}
              </p>
              <p className="text-primary-200 text-sm mt-1">
                {flat.society?.name}
              </p>
            </div>
            <div className="text-right">
              <FaBuilding className="text-white text-5xl opacity-30" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-500">
            <div>
              <p className="text-primary-200 text-xs">Monthly Rent</p>
              <p className="text-white font-semibold">
                ₹{flat.monthlyRent?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">Maintenance</p>
              <p className="text-white font-semibold">
                ₹{flat.maintenanceCharge?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">Parking</p>
              <p className="text-white font-semibold">
                {flat.parkingSlot || "N/A"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 mb-6">
          <p className="text-yellow-700 font-medium">⚠️ No flat assigned yet</p>
          <p className="text-yellow-600 text-sm mt-1">
            Contact your admin to assign a flat to your account
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Bills"
          value={unpaidBills.length}
          icon={<FaMoneyBill />}
          color="yellow"
          subtitle={`₹${unpaidAmount.toLocaleString()} due`}
        />
        <StatCard
          title="Open Complaints"
          value={openComplaints.length}
          icon={<FaExclamationCircle />}
          color="red"
          subtitle={`${complaints.length} total`}
        />
        <StatCard
          title="My Visitors"
          value={visitors.length}
          icon={<FaUserFriends />}
          color="green"
          subtitle="All time"
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={<FaCalendarAlt />}
          color="purple"
          subtitle="RSVP available"
        />
      </div>

      {/* Parking & Notices Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Parking Card */}
        <div
          className={`rounded-2xl p-6 border-2 ${
            parkingSlot
              ? "bg-green-50 border-green-100"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <FaCar
              className={`text-xl ${parkingSlot ? "text-green-600" : "text-gray-400"}`}
            />
            <h3 className="font-semibold text-gray-800">My Parking</h3>
          </div>
          {parkingSlot ? (
            <>
              <p className="text-4xl font-bold text-green-600 mb-1">
                {parkingSlot.slotNumber}
              </p>
              <p className="text-sm text-green-500 capitalize">
                {parkingSlot.slotType.replace("_", " ")}
              </p>
              {parkingSlot.vehicleNumber && (
                <p className="text-xs text-gray-500 mt-2">
                  🚗 {parkingSlot.vehicleNumber}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No slot assigned</p>
          )}
        </div>

        {/* Active Notices */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaBullhorn className="text-primary-500" />
            <h3 className="font-semibold text-gray-800">Active Notices</h3>
            <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full ml-auto">
              {notices.length}
            </span>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No active notices
            </p>
          ) : (
            <div className="space-y-2">
              {notices.slice(0, 3).map((n) => (
                <div
                  key={n._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.priority === "high"
                        ? "bg-red-500"
                        : n.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {n.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bills & Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Bills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              My Recent Bills
            </h3>
            {unpaidBills.length > 0 && (
              <span className="text-xs text-red-500 font-medium">
                ₹{unpaidAmount.toLocaleString()} due
              </span>
            )}
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No bills yet
            </p>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map((b) => (
                <div
                  key={b._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {b.billType}
                    </p>
                    <p className="text-xs text-gray-400">{b.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      ₹{b.amount?.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${billStatusColors[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              My Complaints
            </h3>
            <span className="text-xs text-primary-600 font-medium">
              {openComplaints.length} active
            </span>
          </div>
          {complaints.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No complaints raised
            </p>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {c.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${statusColors[c.status]}`}
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaCalendarAlt className="text-primary-500" />
            <h3 className="font-semibold text-gray-800">Upcoming Events</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((e) => (
              <div
                key={e._id}
                className="bg-primary-50 rounded-xl p-4 border border-primary-100"
              >
                <p className="font-semibold text-gray-800 mb-1">{e.title}</p>
                <p className="text-xs text-gray-500 mb-2 capitalize">
                  {e.category}
                </p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>📍 {e.venue}</p>
                  <p>
                    📅{" "}
                    {new Date(e.eventDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p>
                    🕐 {e.startTime} — {e.endTime}
                  </p>
                  <p>👥 {e.rsvpList?.length || 0} going</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ResidentDashboard;

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import API from "../../api/axios";
import {
  FaBuilding,
  FaMoneyBill,
  FaExclamationCircle,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
  FaTrash,
  FaBullhorn,
  FaCity,
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalFlats: 0,
    vacantFlats: 0,
    occupiedFlats: 0,
    totalSocieties: 0,
    totalBills: 0,
    unpaidBills: 0,
    paidBills: 0,
    overdueBills: 0,
    totalBillAmount: 0,
    unpaidAmount: 0,
    openComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    escalatedComplaints: 0,
    todayVisitors: 0,
    pendingVisitors: 0,
    totalParkingSlots: 0,
    availableSlots: 0,
    upcomingEvents: 0,
    activeNotices: 0,
    wasteCollectionRate: "0%",
  });

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        flatsRes,
        societiesRes,
        billsRes,
        complaintsRes,
        visitorsRes,
        parkingRes,
        eventsRes,
        noticesRes,
        wasteRes,
      ] = await Promise.allSettled([
        API.get("/flats"),
        API.get("/societies"),
        API.get("/billing"),
        API.get("/complaints"),
        API.get("/visitors"),
        API.get("/parking"),
        API.get("/events?status=upcoming"),
        API.get("/notices"),
        API.get(
          "/waste/analytics?" +
            (societiesRes?.value?.data?.societies?.[0]?._id
              ? `society=${societiesRes.value.data.societies[0]._id}`
              : "society=none"),
        ),
      ]);

      // Process Flats
      if (flatsRes.status === "fulfilled") {
        const flats = flatsRes.value.data.flats;
        setStats((prev) => ({
          ...prev,
          totalFlats: flats.length,
          vacantFlats: flats.filter((f) => f.status === "vacant").length,
          occupiedFlats: flats.filter((f) => f.status === "occupied").length,
        }));
      }

      // Process Societies
      if (societiesRes.status === "fulfilled") {
        setStats((prev) => ({
          ...prev,
          totalSocieties: societiesRes.value.data.societies.length,
        }));
      }

      // Process Bills
      if (billsRes.status === "fulfilled") {
        const bills = billsRes.value.data.bills;
        const unpaid = bills.filter((b) => b.status === "unpaid");
        const overdue = bills.filter((b) => b.status === "overdue");
        const paid = bills.filter((b) => b.status === "paid");
        const unpaidAmount = [...unpaid, ...overdue].reduce(
          (sum, b) => sum + b.amount,
          0,
        );
        setStats((prev) => ({
          ...prev,
          totalBills: bills.length,
          unpaidBills: unpaid.length,
          paidBills: paid.length,
          overdueBills: overdue.length,
          unpaidAmount,
        }));
        setRecentBills(bills.slice(0, 5));
      }

      // Process Complaints
      if (complaintsRes.status === "fulfilled") {
        const complaints = complaintsRes.value.data.complaints;
        setStats((prev) => ({
          ...prev,
          openComplaints: complaints.filter((c) => c.status === "open").length,
          inProgressComplaints: complaints.filter(
            (c) => c.status === "in_progress",
          ).length,
          resolvedComplaints: complaints.filter((c) => c.status === "resolved")
            .length,
          escalatedComplaints: complaints.filter(
            (c) => c.status === "escalated",
          ).length,
        }));
        setRecentComplaints(complaints.slice(0, 5));
      }

      // Process Visitors
      if (visitorsRes.status === "fulfilled") {
        const visitors = visitorsRes.value.data.visitors;
        const today = new Date().toDateString();
        const todayVisitors = visitors.filter(
          (v) => new Date(v.createdAt).toDateString() === today,
        );
        setStats((prev) => ({
          ...prev,
          todayVisitors: todayVisitors.length,
          pendingVisitors: visitors.filter(
            (v) => v.approvalStatus === "pending",
          ).length,
        }));
        setRecentVisitors(visitors.slice(0, 5));
      }

      // Process Parking
      if (parkingRes.status === "fulfilled") {
        const slots = parkingRes.value.data.slots;
        setStats((prev) => ({
          ...prev,
          totalParkingSlots: slots.length,
          availableSlots: slots.filter((s) => s.status === "available").length,
        }));
      }

      // Process Events
      if (eventsRes.status === "fulfilled") {
        setStats((prev) => ({
          ...prev,
          upcomingEvents: eventsRes.value.data.count,
        }));
      }

      // Process Notices
      if (noticesRes.status === "fulfilled") {
        setStats((prev) => ({
          ...prev,
          activeNotices: noticesRes.value.data.count,
        }));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch waste analytics separately after societies load
  const fetchWasteAnalytics = async (societyId) => {
    if (!societyId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await API.get(
        `/waste/analytics?society=${societyId}&date=${today}`,
      );
      setStats((prev) => ({
        ...prev,
        wasteCollectionRate: res.data.collectionRate || "0%",
      }));
    } catch (error) {}
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [
          flatsRes,
          societiesRes,
          billsRes,
          complaintsRes,
          visitorsRes,
          parkingRes,
          eventsRes,
          noticesRes,
        ] = await Promise.allSettled([
          API.get("/flats"),
          API.get("/societies"),
          API.get("/billing"),
          API.get("/complaints"),
          API.get("/visitors"),
          API.get("/parking"),
          API.get("/events"),
          API.get("/notices"),
        ]);

        const newStats = { ...stats };

        if (flatsRes.status === "fulfilled") {
          const flats = flatsRes.value.data.flats;
          newStats.totalFlats = flats.length;
          newStats.vacantFlats = flats.filter(
            (f) => f.status === "vacant",
          ).length;
          newStats.occupiedFlats = flats.filter(
            (f) => f.status === "occupied",
          ).length;
        }

        if (societiesRes.status === "fulfilled") {
          const societies = societiesRes.value.data.societies;
          newStats.totalSocieties = societies.length;

          // Fetch waste analytics for first society
          if (societies.length > 0) {
            fetchWasteAnalytics(societies[0]._id);
          }
        }

        if (billsRes.status === "fulfilled") {
          const bills = billsRes.value.data.bills;
          newStats.totalBills = bills.length;
          newStats.unpaidBills = bills.filter(
            (b) => b.status === "unpaid",
          ).length;
          newStats.paidBills = bills.filter((b) => b.status === "paid").length;
          newStats.overdueBills = bills.filter(
            (b) => b.status === "overdue",
          ).length;
          newStats.unpaidAmount = bills
            .filter((b) => b.status !== "paid")
            .reduce((sum, b) => sum + b.amount, 0);
          setRecentBills(bills.slice(0, 5));
        }

        if (complaintsRes.status === "fulfilled") {
          const complaints = complaintsRes.value.data.complaints;
          newStats.openComplaints = complaints.filter(
            (c) => c.status === "open",
          ).length;
          newStats.inProgressComplaints = complaints.filter(
            (c) => c.status === "in_progress",
          ).length;
          newStats.resolvedComplaints = complaints.filter(
            (c) => c.status === "resolved",
          ).length;
          newStats.escalatedComplaints = complaints.filter(
            (c) => c.status === "escalated",
          ).length;
          setRecentComplaints(complaints.slice(0, 5));
        }

        if (visitorsRes.status === "fulfilled") {
          const visitors = visitorsRes.value.data.visitors;
          const today = new Date().toDateString();
          newStats.todayVisitors = visitors.filter(
            (v) => new Date(v.createdAt).toDateString() === today,
          ).length;
          newStats.pendingVisitors = visitors.filter(
            (v) => v.approvalStatus === "pending",
          ).length;
          setRecentVisitors(visitors.slice(0, 4));
        }

        if (parkingRes.status === "fulfilled") {
          const slots = parkingRes.value.data.slots;
          newStats.totalParkingSlots = slots.length;
          newStats.availableSlots = slots.filter(
            (s) => s.status === "available",
          ).length;
        }

        if (eventsRes.status === "fulfilled") {
          const events = eventsRes.value.data.events;
          newStats.upcomingEvents = events.filter(
            (e) => e.status === "upcoming",
          ).length;
        }

        if (noticesRes.status === "fulfilled") {
          newStats.activeNotices = noticesRes.value.data.count;
        }

        setStats(newStats);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const priorityColors = {
    low: "bg-green-100 text-green-600",
    medium: "bg-yellow-100 text-yellow-600",
    high: "bg-orange-100 text-orange-600",
    critical: "bg-red-100 text-red-600",
  };

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
          <p className="text-gray-500 text-sm">Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live overview —{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Row 1 — Society & Flats */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Society Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Societies"
            value={stats.totalSocieties}
            icon={<FaCity />}
            color="blue"
            subtitle="Registered societies"
          />
          <StatCard
            title="Total Flats"
            value={stats.totalFlats}
            icon={<FaBuilding />}
            color="purple"
            subtitle={`${stats.occupiedFlats} occupied`}
          />
          <StatCard
            title="Vacant Flats"
            value={stats.vacantFlats}
            icon={<FaBuilding />}
            color="green"
            subtitle="Available to assign"
          />
          <StatCard
            title="Parking Slots"
            value={stats.totalParkingSlots}
            icon={<FaCar />}
            color="orange"
            subtitle={`${stats.availableSlots} available`}
          />
        </div>
      </div>

      {/* Row 2 — Billing */}
      <div className="mb-3 mt-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Billing Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Bills"
            value={stats.totalBills}
            icon={<FaMoneyBill />}
            color="blue"
            subtitle="All time"
          />
          <StatCard
            title="Paid Bills"
            value={stats.paidBills}
            icon={<FaMoneyBill />}
            color="green"
            subtitle="Cleared"
          />
          <StatCard
            title="Unpaid Bills"
            value={stats.unpaidBills}
            icon={<FaMoneyBill />}
            color="yellow"
            subtitle={`₹${stats.unpaidAmount?.toLocaleString()} due`}
          />
          <StatCard
            title="Overdue Bills"
            value={stats.overdueBills}
            icon={<FaMoneyBill />}
            color="red"
            subtitle="Past due date"
          />
        </div>
      </div>

      {/* Row 3 — Complaints, Visitors, Events */}
      <div className="mb-6 mt-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Activity Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Open Complaints"
            value={stats.openComplaints}
            icon={<FaExclamationCircle />}
            color="red"
            subtitle={`${stats.escalatedComplaints} escalated`}
          />
          <StatCard
            title="Today's Visitors"
            value={stats.todayVisitors}
            icon={<FaUserFriends />}
            color="green"
            subtitle={`${stats.pendingVisitors} pending`}
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<FaCalendarAlt />}
            color="purple"
            subtitle="Scheduled events"
          />
          <StatCard
            title="Active Notices"
            value={stats.activeNotices}
            icon={<FaBullhorn />}
            color="orange"
            subtitle="Published notices"
          />
        </div>
      </div>

      {/* Waste Collection Rate Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <FaTrash className="text-white text-xl" />
          </div>
          <div>
            <p className="text-white font-semibold">
              Today's Waste Collection Rate
            </p>
            <p className="text-green-100 text-sm">
              Based on all occupied flats
            </p>
          </div>
        </div>
        <p className="text-4xl font-bold text-white">
          {stats.wasteCollectionRate}
        </p>
      </div>

      {/* Complaint Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Complaint Status Breakdown
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Open",
                value: stats.openComplaints,
                color: "bg-blue-500",
              },
              {
                label: "In Progress",
                value: stats.inProgressComplaints,
                color: "bg-yellow-500",
              },
              {
                label: "Resolved",
                value: stats.resolvedComplaints,
                color: "bg-green-500",
              },
              {
                label: "Escalated",
                value: stats.escalatedComplaints,
                color: "bg-red-500",
              },
            ].map((item) => {
              const total =
                stats.openComplaints +
                stats.inProgressComplaints +
                stats.resolvedComplaints +
                stats.escalatedComplaints;
              const percent =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{item.label}</span>
                    <span>
                      {item.value} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flat Occupancy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Flat Occupancy
          </h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${
                    stats.totalFlats > 0
                      ? (stats.occupiedFlats / stats.totalFlats) * 100
                      : 0
                  } 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalFlats > 0
                    ? Math.round((stats.occupiedFlats / stats.totalFlats) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-400">Occupied</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              {
                label: "Occupied",
                value: stats.occupiedFlats,
                color: "bg-blue-500",
              },
              {
                label: "Vacant",
                value: stats.vacantFlats,
                color: "bg-green-500",
              },
              {
                label: "Under Maintenance",
                value:
                  stats.totalFlats - stats.occupiedFlats - stats.vacantFlats,
                color: "bg-yellow-500",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-gray-600 flex-1">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Visitors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Recent Visitors
          </h3>
          {recentVisitors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No visitors today
            </p>
          ) : (
            <div className="space-y-3">
              {recentVisitors.map((v) => (
                <div
                  key={v._id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {v.purpose === "guest"
                      ? "👤"
                      : v.purpose === "delivery"
                        ? "📦"
                        : v.purpose === "maintenance"
                          ? "🔧"
                          : "🚗"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {v.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Flat {v.flat?.flatNumber} • {v.purpose}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      v.approvalStatus === "approved"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {v.approvalStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Complaints & Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Recent Complaints
            </h3>
            <span className="text-xs text-primary-600 font-medium">
              {stats.openComplaints} open
            </span>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No complaints found
            </p>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.raisedBy?.name} • Flat {c.flat?.flatNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[c.priority]}`}
                    >
                      {c.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[c.status]}`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Recent Bills
            </h3>
            <span className="text-xs text-red-500 font-medium">
              ₹{stats.unpaidAmount?.toLocaleString()} pending
            </span>
          </div>
          {recentBills.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No bills found
            </p>
          ) : (
            <div className="space-y-3">
              {recentBills.map((b) => (
                <div
                  key={b._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {b.resident?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.billType} • {b.month}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
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
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

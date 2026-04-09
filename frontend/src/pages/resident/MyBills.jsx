import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaMoneyBill,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_URL = "https://apartment-backend.onrender.com/api/v1";

const MyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      let query = "?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterMonth) query += `month=${filterMonth}`;
      const res = await API.get(`/billing/my-bills${query}`);
      const fetchedBills = res.data.bills;
      setBills(fetchedBills);

      // Calculate summary
      setSummary({
        total: fetchedBills.length,
        paid: fetchedBills.filter((b) => b.status === "paid").length,
        unpaid: fetchedBills.filter((b) => b.status === "unpaid").length,
        overdue: fetchedBills.filter((b) => b.status === "overdue").length,
      });
    } catch (error) {
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filterStatus, filterMonth]);

  const statusColors = {
    unpaid: "bg-yellow-100 text-yellow-600",
    paid: "bg-green-100 text-green-600",
    overdue: "bg-red-100 text-red-600",
  };

  const statusIcons = {
    paid: <FaCheckCircle className="text-green-500" />,
    unpaid: <FaClock className="text-yellow-500" />,
    overdue: <FaExclamationTriangle className="text-red-500" />,
  };

  const totalDue = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Bills</h1>
        <p className="text-gray-500 text-sm mt-1">View and track your bills</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Bills",
            value: summary.total,
            color: "bg-blue-50 text-blue-600",
            icon: <FaMoneyBill />,
          },
          {
            label: "Paid",
            value: summary.paid,
            color: "bg-green-50 text-green-600",
            icon: <FaCheckCircle />,
          },
          {
            label: "Unpaid",
            value: summary.unpaid,
            color: "bg-yellow-50 text-yellow-600",
            icon: <FaClock />,
          },
          {
            label: "Overdue",
            value: summary.overdue,
            color: "bg-red-50 text-red-600",
            icon: <FaExclamationTriangle />,
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <div className="flex items-center gap-2 mb-2 text-lg">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total Due Banner */}
      {totalDue > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <div>
              <p className="font-semibold text-red-700">Outstanding Amount</p>
              <p className="text-sm text-red-500">
                You have pending bills totaling ₹{totalDue.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₹{totalDue.toLocaleString()}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          {["unpaid", "paid", "overdue"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by month e.g. April-2026"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FaMoneyBill className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500">No bills found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">
                    {statusIcons[b.status]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">
                      {b.billType} Bill
                    </p>
                    <p className="text-sm text-gray-400">
                      {b.month} • Flat {b.flat?.flatNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    ₹{b.amount?.toLocaleString()}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status]}`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span>
                  Due: {new Date(b.dueDate).toLocaleDateString("en-IN")}
                </span>
                {b.paidAt && (
                  <span>
                    Paid on: {new Date(b.paidAt).toLocaleDateString("en-IN")}
                  </span>
                )}
                {b.note && <span>Note: {b.note}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyBills;

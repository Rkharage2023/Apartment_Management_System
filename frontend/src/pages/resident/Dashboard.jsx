import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import { useSelector } from "react-redux";
import {
  FaBuilding,
  FaMoneyBill,
  FaExclamationCircle,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
} from "react-icons/fa";

const ResidentDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's your apartment overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="My Flat"
          value="A-101"
          icon={<FaBuilding />}
          color="blue"
          subtitle="2BHK — Block A"
        />
        <StatCard
          title="Pending Bills"
          value="2"
          icon={<FaMoneyBill />}
          color="yellow"
          subtitle="₹4,000 due"
        />
        <StatCard
          title="My Complaints"
          value="3"
          icon={<FaExclamationCircle />}
          color="red"
          subtitle="1 in progress"
        />
        <StatCard
          title="My Visitors"
          value="5"
          icon={<FaUserFriends />}
          color="green"
          subtitle="Today"
        />
        <StatCard
          title="Parking Slot"
          value="P-01"
          icon={<FaCar />}
          color="purple"
          subtitle="Four Wheeler"
        />
        <StatCard
          title="Upcoming Events"
          value="3"
          icon={<FaCalendarAlt />}
          color="orange"
          subtitle="Next: Holi Celebration"
        />
      </div>

      {/* Recent Bills & Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Bills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            My Recent Bills
          </h2>
          <div className="space-y-3">
            {[
              {
                type: "Maintenance",
                month: "April-2026",
                amount: 2000,
                status: "unpaid",
              },
              {
                type: "Water",
                month: "April-2026",
                amount: 500,
                status: "unpaid",
              },
              {
                type: "Maintenance",
                month: "March-2026",
                amount: 2000,
                status: "paid",
              },
              {
                type: "Parking",
                month: "March-2026",
                amount: 500,
                status: "paid",
              },
            ].map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.type}</p>
                  <p className="text-xs text-gray-400">{b.month}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    ₹{b.amount}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      b.status === "paid"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Recent Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            My Recent Complaints
          </h2>
          <div className="space-y-3">
            {[
              { title: "Water leakage", status: "open", priority: "high" },
              {
                title: "Noise from upstairs",
                status: "in_progress",
                priority: "medium",
              },
              { title: "Broken window", status: "resolved", priority: "low" },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.title}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {c.priority} priority
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.status === "open"
                      ? "bg-blue-100 text-blue-600"
                      : c.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                  }`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResidentDashboard;

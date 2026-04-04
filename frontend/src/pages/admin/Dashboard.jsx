import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import {
  FaBuilding,
  FaMoneyBill,
  FaExclamationCircle,
  FaUserFriends,
  FaCar,
  FaCalendarAlt,
  FaTrash,
  FaBullhorn,
} from "react-icons/fa";

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your society management system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Flats"
          value="50"
          icon={<FaBuilding />}
          color="blue"
          subtitle="12 vacant"
        />
        <StatCard
          title="Pending Bills"
          value="24"
          icon={<FaMoneyBill />}
          color="yellow"
          subtitle="₹48,000 due"
        />
        <StatCard
          title="Open Complaints"
          value="8"
          icon={<FaExclamationCircle />}
          color="red"
          subtitle="2 critical"
        />
        <StatCard
          title="Today's Visitors"
          value="15"
          icon={<FaUserFriends />}
          color="green"
          subtitle="3 pending approval"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Parking Slots"
          value="40"
          icon={<FaCar />}
          color="purple"
          subtitle="10 available"
        />
        <StatCard
          title="Upcoming Events"
          value="3"
          icon={<FaCalendarAlt />}
          color="orange"
          subtitle="Next: Holi Celebration"
        />
        <StatCard
          title="Waste Collected"
          value="85%"
          icon={<FaTrash />}
          color="green"
          subtitle="Today's collection rate"
        />
        <StatCard
          title="Active Notices"
          value="5"
          icon={<FaBullhorn />}
          color="blue"
          subtitle="2 urgent"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Recent Complaints
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "Water leakage",
                flat: "A-101",
                status: "open",
                priority: "high",
              },
              {
                title: "Lift not working",
                flat: "B-201",
                status: "in_progress",
                priority: "critical",
              },
              {
                title: "Noise complaint",
                flat: "A-103",
                status: "resolved",
                priority: "low",
              },
              {
                title: "Electricity issue",
                flat: "C-301",
                status: "open",
                priority: "medium",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.title}</p>
                  <p className="text-xs text-gray-400">Flat {c.flat}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.priority === "critical"
                        ? "bg-red-100 text-red-600"
                        : c.priority === "high"
                          ? "bg-orange-100 text-orange-600"
                          : c.priority === "medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                    }`}
                  >
                    {c.priority}
                  </span>
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
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Recent Bills
          </h2>
          <div className="space-y-3">
            {[
              {
                flat: "A-101",
                type: "Maintenance",
                amount: 2000,
                status: "paid",
              },
              { flat: "B-201", type: "Water", amount: 500, status: "unpaid" },
              {
                flat: "A-102",
                type: "Maintenance",
                amount: 2000,
                status: "overdue",
              },
              { flat: "C-301", type: "Parking", amount: 500, status: "paid" },
            ].map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Flat {b.flat}
                  </p>
                  <p className="text-xs text-gray-400">{b.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    ₹{b.amount}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      b.status === "paid"
                        ? "bg-green-100 text-green-600"
                        : b.status === "unpaid"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

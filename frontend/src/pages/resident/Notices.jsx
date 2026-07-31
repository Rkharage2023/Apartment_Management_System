import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FaBullhorn, FaCheckCircle } from "react-icons/fa";

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const categoryIcons = {
  general: "📢",
  urgent: "🚨",
  maintenance: "🔧",
  rules: "📋",
  event: "🎉",
  other: "📌",
};

const MyNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [acknowledging, setAcknowledging] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const query = filterCategory ? `?category=${filterCategory}` : "";
      const res = await API.get(`/notices${query}`);
      setNotices(res.data.notices);
    } catch (error) {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [filterCategory]);

  const handleAcknowledge = async (noticeId) => {
    try {
      setAcknowledging(noticeId);
      await API.put(`/notices/${noticeId}/acknowledge`);
      toast.success("Notice acknowledged ✓");
      fetchNotices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to acknowledge");
    } finally {
      setAcknowledging(null);
    }
  };

  const categories = ["", "general", "urgent", "maintenance", "rules", "event", "other"];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
          <p className="text-gray-500 text-sm mt-1">
            Society announcements and updates
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl">
          <FaBullhorn className="text-primary-500" />
          <span className="text-sm font-medium text-primary-700">
            {notices.length} Active
          </span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filterCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
            }`}
          >
            {cat === "" ? "All" : `${categoryIcons[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FaBullhorn className="text-gray-300 text-5xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No notices found</p>
          <p className="text-gray-400 text-sm mt-1">
            Your admin hasn't posted any notices yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isAcknowledged = notice.acknowledgedBy?.some(
              (a) => a.user?._id || a.user
            );

            return (
              <div
                key={notice._id}
                className={`bg-white rounded-2xl shadow-sm border p-5 transition hover:shadow-md ${
                  notice.priority === "high"
                    ? "border-red-200"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Category Icon */}
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {categoryIcons[notice.category] || "📌"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {notice.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            priorityColors[notice.priority]
                          }`}
                        >
                          {notice.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {notice.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {notice.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>
                          📅{" "}
                          {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          👤 {notice.createdBy?.name || "Admin"}
                        </span>
                        {notice.expiresAt && (
                          <span className="text-orange-400">
                            ⏳ Expires{" "}
                            {new Date(notice.expiresAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        <span>
                          ✅ {notice.acknowledgedBy?.length || 0} acknowledged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAcknowledge(notice._id)}
                      disabled={acknowledging === notice._id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        acknowledging === notice._id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      <FaCheckCircle />
                      {acknowledging === notice._id ? "..." : "Acknowledge"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyNotices;

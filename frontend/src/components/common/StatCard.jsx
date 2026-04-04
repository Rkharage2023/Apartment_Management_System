const StatCard = ({ title, value, icon, color, subtitle }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorMap[color] || colorMap.blue}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;

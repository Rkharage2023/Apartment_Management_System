import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Roles that can access admin-level routes
const ADMIN_LEVEL_ROLES = ["admin", "security", "staff"];

const PrivateRoute = ({ role }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  // Admin route guard — allow admin, security, and staff
  if (role === "admin") {
    if (!ADMIN_LEVEL_ROLES.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  // Resident route guard — strict match
  if (role === "resident") {
    if (user.role !== "resident") return <Navigate to="/login" replace />;
    return <Outlet />;
  }

  return <Outlet />;
};

export default PrivateRoute;

import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const PublicOnlyRoute = () => {
  const { user } = useSelector((state) => state.auth);

  if (user) {
    if (user.role === "admin" || user.role === "security" || user.role === "staff") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "resident") {
      return <Navigate to="/resident" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;

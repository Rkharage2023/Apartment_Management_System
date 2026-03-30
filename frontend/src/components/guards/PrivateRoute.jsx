import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function PrivateRoute() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Save intended path so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

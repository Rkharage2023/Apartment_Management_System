import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUserFromStorage } from "./features/auth/authSlice";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PrivateRoute from "./components/common/PrivateRoute";
import PublicOnlyRoute from "./components/common/PublicOnlyRoute";
import NotFound from "./pages/NotFound";
import AIChatBubble from "./components/common/AIChatBubble";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Societies from "./pages/admin/Societies";
import Flats from "./pages/admin/Flats";
import Billing from "./pages/admin/Billing";
import Complaints from "./pages/admin/Complaints";
import Notices from "./pages/admin/Notices";
import Visitors from "./pages/admin/Visitors";
import Parking from "./pages/admin/Parking";
import Events from "./pages/admin/Events";
import Waste from "./pages/admin/Waste";

// Resident Pages
import ResidentDashboard from "./pages/resident/Dashboard";
import MyFlat from "./pages/resident/MyFlat";
import MyBills from "./pages/resident/MyBills";
import MyComplaints from "./pages/resident/MyComplaints";
import MyVisitors from "./pages/resident/MyVisitors";
import MyParking from "./pages/resident/MyParking";
import MyNotices from "./pages/resident/Notices";
import MyEvents from "./pages/resident/Events";
import Users from "./pages/admin/Users";

// Root redirect based on role
const RootRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin" || user.role === "security" || user.role === "staff") {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === "resident") return <Navigate to="/resident" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Enforce single active user per browser: Sync sessions across all open tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          const updatedUser = e.newValue ? JSON.parse(e.newValue) : null;
          dispatch(setUserFromStorage(updatedUser));
          if (updatedUser) {
            if (updatedUser.role === "admin" || updatedUser.role === "security" || updatedUser.role === "staff") {
              navigate("/admin", { replace: true });
            } else if (updatedUser.role === "resident") {
              navigate("/resident", { replace: true });
            }
          } else {
            navigate("/login", { replace: true });
          }
        } catch {
          dispatch(setUserFromStorage(null));
          navigate("/login", { replace: true });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, navigate]);

  return (
    <>
      <Routes>
        {/* Root → smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Routes — ONLY accessible when NOT logged in */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Shared Management Base Route (Admin, Security, Staff) */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={["admin", "security", "staff"]} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="notices" element={<Notices />} />

          {/* Security Guard Allowed Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin", "security"]} />}>
            <Route path="visitors" element={<Visitors />} />
            <Route path="parking" element={<Parking />} />
          </Route>

          {/* Maintenance Staff Allowed Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin", "staff"]} />}>
            <Route path="waste" element={<Waste />} />
          </Route>

          {/* Strictly Admin-Only System Management Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="societies" element={<Societies />} />
            <Route path="flats" element={<Flats />} />
            <Route path="billing" element={<Billing />} />
            <Route path="events" element={<Events />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>

        {/* Resident Routes */}
        <Route path="/resident" element={<PrivateRoute allowedRoles={["resident"]} />}>
          <Route index element={<ResidentDashboard />} />
          <Route path="my-flat" element={<MyFlat />} />
          <Route path="my-bills" element={<MyBills />} />
          <Route path="my-complaints" element={<MyComplaints />} />
          <Route path="my-visitors" element={<MyVisitors />} />
          <Route path="my-parking" element={<MyParking />} />
          <Route path="notices" element={<MyNotices />} />
          <Route path="events" element={<MyEvents />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AIChatBubble />
    </>
  );
}

export default App;

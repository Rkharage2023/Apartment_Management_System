import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import PrivateRoute from "../components/guards/PrivateRoute";
import RoleGuard from "../components/guards/RoleGuard";
import Spinner from "../components/ui/Spinner";

// Lazy load every page — keeps initial bundle small
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/RegisterPage"));
const AdminDashboard = lazy(
  () => import("../features/dashboard/AdminDashboard"),
);
const ResidentDashboard = lazy(
  () => import("../features/dashboard/ResidentDashboard"),
);
const SecurityDashboard = lazy(
  () => import("../features/dashboard/SecurityDashboard"),
);
const FlatList = lazy(() => import("../features/flats/FlatList"));
const FlatDetail = lazy(() => import("../features/flats/FlatDetail"));
const BillingList = lazy(() => import("../features/billing/BillingList"));
const BillDetail = lazy(() => import("../features/billing/BillDetail"));
const ComplaintList = lazy(
  () => import("../features/complaints/ComplaintList"),
);
const RaiseComplaint = lazy(
  () => import("../features/complaints/RaiseComplaint"),
);
const ComplaintDetail = lazy(
  () => import("../features/complaints/ComplaintDetail"),
);
const EventList = lazy(() => import("../features/events/EventList"));
const ParkingMap = lazy(() => import("../features/parking/ParkingMap"));
const VisitorLog = lazy(() => import("../features/visitors/VisitorLog"));
const InviteVisitor = lazy(() => import("../features/visitors/InviteVisitor"));
const SecurityGate = lazy(() => import("../features/visitors/SecurityGate"));
const WasteDashboard = lazy(() => import("../features/waste/WasteDashboard"));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage"));

const DashboardRedirect = () => {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (role === "security") return <Navigate to="/dashboard/security" replace />;
  return <Navigate to="/dashboard/resident" replace />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner fullPage />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — inside AppLayout (sidebar + topbar) */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardRedirect />} />

              {/* Role-specific dashboards */}
              <Route
                path="/dashboard/admin"
                element={
                  <RoleGuard roles={["admin"]}>
                    <AdminDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/dashboard/resident"
                element={
                  <RoleGuard roles={["resident"]}>
                    <ResidentDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/dashboard/security"
                element={
                  <RoleGuard roles={["security"]}>
                    <SecurityDashboard />
                  </RoleGuard>
                }
              />

              {/* Flats */}
              <Route path="/flats" element={<FlatList />} />
              <Route path="/flats/:id" element={<FlatDetail />} />

              {/* Billing */}
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/:id" element={<BillDetail />} />

              {/* Complaints */}
              <Route path="/complaints" element={<ComplaintList />} />
              <Route path="/complaints/new" element={<RaiseComplaint />} />
              <Route path="/complaints/:id" element={<ComplaintDetail />} />

              {/* Events, Parking, Visitors, Waste, Profile */}
              <Route path="/events" element={<EventList />} />
              <Route path="/parking" element={<ParkingMap />} />
              <Route path="/visitors" element={<VisitorLog />} />
              <Route path="/visitors/invite" element={<InviteVisitor />} />
              <Route
                path="/gate"
                element={
                  <RoleGuard roles={["security", "admin"]}>
                    <SecurityGate />
                  </RoleGuard>
                }
              />
              <Route path="/waste" element={<WasteDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

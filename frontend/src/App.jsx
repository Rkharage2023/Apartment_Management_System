import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PrivateRoute from "./components/common/PrivateRoute";
import NotFound from "./pages/NotFound";

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

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<PrivateRoute role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="societies" element={<Societies />} />
        <Route path="flats" element={<Flats />} />
        <Route path="billing" element={<Billing />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notices" element={<Notices />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="parking" element={<Parking />} />
        <Route path="events" element={<Events />} />
        <Route path="waste" element={<Waste />} />
      </Route>

      {/* Resident Routes */}
      <Route path="/resident" element={<PrivateRoute role="resident" />}>
        <Route index element={<ResidentDashboard />} />
        <Route path="my-flat" element={<MyFlat />} />
        <Route path="my-bills" element={<MyBills />} />
        <Route path="my-complaints" element={<MyComplaints />} />
        <Route path="my-visitors" element={<MyVisitors />} />
        <Route path="my-parking" element={<MyParking />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

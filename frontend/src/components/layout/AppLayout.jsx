import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Topbar from "./Topbar";
import { useNotification } from "../../hooks/useNotification";

export default function AppLayout() {
  useNotification(); // wire up socket notifications app-wide

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 lg:px-8">
            <Outlet /> {/* page renders here */}
          </div>
        </main>

        {/* Bottom nav — mobile only, fixed at bottom */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

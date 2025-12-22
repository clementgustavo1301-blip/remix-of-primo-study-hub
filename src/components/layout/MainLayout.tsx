import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import OnboardingModal from "@/components/OnboardingModal";

const MainLayout = () => {
  return (
    <div className="min-h-screen gradient-bg-animated overflow-x-hidden">
      <OnboardingModal />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-6 top-6 bottom-6 z-50">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pb-24 lg:pb-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
};

export default MainLayout;

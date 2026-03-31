// src/app/(withDashboardLayout)/layout.jsx

import DashboardSidebar from "@/components/shared/DashboardSidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#f6f8f6] overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* pt-16 মোবাইলে ওপরের হেডারের জায়গা ছাড়ার জন্য */}
        <div className="flex-1 overflow-y-auto scroll-smooth pt-16 md:pt-4 p-0 md:p-4">
          <div className="h-full bg-white md:rounded-3xl shadow-sm border border-slate-100 overflow-y-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

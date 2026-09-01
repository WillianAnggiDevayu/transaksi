import { useEffect, useState } from "react";
import AdminAkuntanSidebar from "./components/AdminAkuntanSidebar";
import AdminAkuntanHeader from "./components/AdminAkuntanHeader";
import DashboardProcurement from "./DashboardProcurement";
import PurchaseRequestPage from "./PurchaseRequestPage";
import PurchaseOrderPage from "./PurchaseOrderPage";
import PaymentPage from "./PaymentPage";

const MENUS = {
  dashboard: "dashboard",
  purchaseRequests: "purchaseRequests",
  purchaseOrders: "purchaseOrders",
  payments: "payments",
};

function AdminAkuntanPanel({ user, onLogout }) {
  const [menu, setMenu] = useState(MENUS.dashboard);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [menu]);

  const pages = {
    dashboard: <DashboardProcurement />,
    purchaseRequests: <PurchaseRequestPage />,
    purchaseOrders: <PurchaseOrderPage />,
    payments: <PaymentPage />,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AdminAkuntanSidebar menu={menu} setMenu={setMenu} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogout={onLogout} />
      <div className="lg:pl-64">
        <AdminAkuntanHeader user={user} onOpenMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">{pages[menu]}</div></main>
      </div>
    </div>
  );
}

export default AdminAkuntanPanel;

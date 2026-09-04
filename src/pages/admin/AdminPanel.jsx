import { useState } from "react";

import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

import DashboardAdmin from "./DashboardAdmin";
import ItemPage from "./ItemPage";
import UnitPage from "./UnitPage";
import SupplierPage from "./SupplierPage";
import UserPage from "./UserPage";

import DashboardProcurement from "../admin-akuntan/DashboardProcurement";
import PurchaseRequestPage from "../admin-akuntan/PurchaseRequestPage";
import PurchaseOrderPage from "../admin-akuntan/PurchaseOrderPage";
import PaymentPage from "../admin-akuntan/PaymentPage";

const MENU = {
  dashboard: "dashboard",

  // Master Data
  items: "items",
  units: "units",
  suppliers: "suppliers",
  users: "users",

  // Procurement / Akuntansi
  procurementDashboard: "procurementDashboard",
  purchaseRequests: "purchaseRequests",
  purchaseOrders: "purchaseOrders",
  payments: "payments",
};

function AdminPanel({ user, onLogout }) {
  const [menu, setMenu] = useState(MENU.dashboard);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (nextMenu) => {
    setMenu(nextMenu);
    setMobileOpen(false);
  };

  const pages = {
    // Admin
    dashboard: <DashboardAdmin onNavigate={navigate} />,
    items: <ItemPage />,
    units: <UnitPage />,
    suppliers: <SupplierPage />,
    users: <UserPage currentUser={user} />,

    // Akuntan / Procurement
    procurementDashboard: <DashboardProcurement />,
    purchaseRequests: <PurchaseRequestPage />,
    purchaseOrders: <PurchaseOrderPage />,
    payments: <PaymentPage />,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AdminSidebar
        menu={menu}
        setMenu={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={onLogout}
      />

      <div className="lg:pl-64">
        <AdminHeader
          user={user}
          onOpenMenu={() => setMobileOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {pages[menu]}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;

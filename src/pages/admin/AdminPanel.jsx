import { useEffect, useState } from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import DashboardAdmin from "./DashboardAdmin";
import ItemPage from "./ItemPage";
import UnitPage from "./UnitPage";
import SupplierPage from "./SupplierPage";
import UserPage from "./UserPage";

const MENU = {
  dashboard: "dashboard",
  items: "items",
  units: "units",
  suppliers: "suppliers",
  users: "users",
};

function AdminPanel({ user, onLogout }) {
  const [menu, setMenu] = useState(MENU.dashboard);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [menu]);

  const page = {
    dashboard: <DashboardAdmin />,
    items: <ItemPage />,
    units: <UnitPage />,
    suppliers: <SupplierPage />,
    users: <UserPage currentUser={user} />,
  }[menu];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AdminSidebar
        menu={menu}
        setMenu={setMenu}
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
            {page}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;

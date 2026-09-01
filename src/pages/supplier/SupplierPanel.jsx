import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, ShoppingCart, LogOut, Menu, X } from "lucide-react";
import SupplierDashboard from "./SupplierDashboard";
import RequestOrder from "./RequestOrder";
import SupplierPurchaseOrder from "./SupplierPurchaseOrder";

function SupplierPanel({ user, onLogout }) {
  const [menu, setMenu] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const pages = {
    dashboard: <SupplierDashboard onNavigate={setMenu} />,
    requestOrder: <RequestOrder />,
    purchaseOrder: <SupplierPurchaseOrder />,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" aria-label="Tutup menu" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-sm font-bold text-slate-900">Purchase Management</p>
            <p className="text-[11px] text-slate-400">Supplier Panel</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Tutup sidebar"><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <NavButton active={menu === "dashboard"} onClick={() => setMenu("dashboard")} icon={<LayoutDashboard size={18} />}>Dashboard</NavButton>
          <NavButton active={menu === "requestOrder"} onClick={() => setMenu("requestOrder")} icon={<FileText size={18} />}>Request Order</NavButton>
          <NavButton active={menu === "purchaseOrder"} onClick={() => setMenu("purchaseOrder")} icon={<ShoppingCart size={18} />}>Purchase Order</NavButton>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Buka menu"><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.name || "Supplier"}</p><p className="text-[11px] capitalize text-slate-400">{user?.role || "supplier"}</p></div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{(user?.name || "SU").slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">{pages[menu]}</div></main>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, children }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{icon}{children}</button>;
}

export default SupplierPanel;

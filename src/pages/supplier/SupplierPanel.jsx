import { useEffect, useState } from "react";
import { ChevronRight, LayoutDashboard, FileText, ShoppingCart, LogOut, Menu, X } from "lucide-react";
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

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-blue-800 bg-gradient-to-br from-[#0b2a68] via-[#103987] to-[#1d55c7] text-white shadow-xl transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-36 h-80 w-80 rounded-full bg-[#071e51]/55" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-40 h-80 w-80 rounded-full bg-[#3470e8]/25" />
        <div className="relative z-10 flex items-center px-6 pb-8 pt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#4285f4] text-2xl font-bold text-white shadow-lg shadow-blue-950/25">
              P
            </div>
            <div>
              <p className="text-xl font-bold leading-tight text-white">Purchase</p>
              <p className="mt-1 whitespace-nowrap text-xs font-medium text-blue-200">Management System</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="absolute right-2 top-2 rounded-lg p-2 text-blue-100 hover:bg-white/10 lg:hidden" aria-label="Tutup sidebar"><X size={18} /></button>
        </div>

        <nav className="relative z-10 flex-1 space-y-1 p-3">
          <NavButton active={menu === "dashboard"} onClick={() => setMenu("dashboard")} icon={<LayoutDashboard size={18} />}>Dashboard</NavButton>
          <NavButton active={menu === "requestOrder"} onClick={() => setMenu("requestOrder")} icon={<FileText size={18} />}>Penawaran</NavButton>
          <NavButton active={menu === "purchaseOrder"} onClick={() => setMenu("purchaseOrder")} icon={<ShoppingCart size={18} />}>Purchase Order</NavButton>
        </nav>

        <div className="relative z-10 border-t border-white/15 p-3">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-red-500/20 hover:text-white"><LogOut size={18} /> Logout</button>
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
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active ? "bg-white text-blue-800 shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}><span className="flex flex-1 items-center gap-3">{icon}{children}</span>{active && <ChevronRight size={17} />}</button>;
}

export default SupplierPanel;

import { useState } from "react";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Ruler,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react";

const menus = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "items", label: "Barang", icon: Boxes },
  { key: "units", label: "Unit", icon: Ruler },
  { key: "suppliers", label: "Supplier", icon: Truck },
  { key: "users", label: "User", icon: UserRound },
];

const procurementMenus = [
  { key: "purchaseRequests", label: "Purchase Request", icon: ClipboardList },
  { key: "purchaseOrders", label: "Purchase Order", icon: ShoppingCart },
];

function AdminSidebar({
  menu,
  setMenu,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) {
  const procurementActive = [
    "procurementDashboard",
    "purchaseRequests",
    "purchaseOrders",
  ].includes(menu);
  const [procurementOpen, setProcurementOpen] = useState(procurementActive);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-blue-800 bg-gradient-to-br from-[#0b2a68] via-[#103987] to-[#1d55c7] text-white shadow-xl transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
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

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-2 rounded-lg p-2 text-blue-100 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="relative z-10 flex-1 space-y-1 p-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
            Master Data
          </p>

          {menus.map((item) => {
            const Icon = item.icon;
            const active = menu === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMenu(item.key)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active
                    ? "bg-white text-blue-800 shadow-sm"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={15} />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setProcurementOpen((open) => !open);
              if (!procurementOpen) setMenu("procurementDashboard");
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${procurementActive
                ? "bg-white text-blue-800 shadow-sm"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
          >
            <PackageSearch size={18} />
            <span className="flex-1">Procurement</span>
            {procurementOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {procurementOpen && (
            <div className="ml-4 space-y-1 border-l border-white/20 pl-2">
              {procurementMenus.map(({ key, label, icon: Icon }) => {
                const active = menu === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMenu(key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${active
                        ? "bg-white/20 text-white"
                        : "text-blue-200 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenu("payments")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${menu === "payments"
                ? "bg-white text-blue-800 shadow-sm"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
          >
            <CreditCard size={18} />
            <span className="flex-1">Pembayaran</span>
            {menu === "payments" && <ChevronRight size={15} />}
          </button>
        </nav>

        <div className="relative z-10 border-t border-white/15 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-red-500/20 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;

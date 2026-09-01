import { ClipboardList, CreditCard, FileText, LayoutDashboard, LogOut, ShoppingCart, X } from "lucide-react";

const menus = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "purchaseRequests", label: "Purchase Request", icon: ClipboardList },
  { key: "purchaseOrders", label: "Purchase Order", icon: ShoppingCart },
  { key: "payments", label: "Payment", icon: CreditCard },
];

function AdminAkuntanSidebar({ menu, setMenu, mobileOpen, setMobileOpen, onLogout }) {
  return <>
    {mobileOpen && <button type="button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div><p className="text-sm font-bold text-slate-900">Purchase Management</p><p className="text-[11px] text-slate-400">Admin & Akuntan</p></div>
        <button type="button" aria-label="Tutup sidebar" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><X size={18} /></button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Procurement</p>
        {menus.map(({ key, label, icon: Icon }) => {
          const active = menu === key;
          return <button key={key} type="button" onClick={() => setMenu(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={18} /><span className="flex-1">{label}</span>{active && <FileText size={14} />}</button>;
        })}
      </nav>
      <div className="border-t border-slate-200 p-3"><button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut size={18} />Logout</button></div>
    </aside>
  </>;
}
export default AdminAkuntanSidebar;

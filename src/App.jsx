import { useState } from "react";
import AuthService from "./services/AuthService";
import Login from "./pages/Login";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminAkuntanPanel from "./pages/admin-akuntan/AdminAkuntanPanel";
import SupplierPanel from "./pages/supplier/SupplierPanel";


function App() {
  const [user, setUser] = useState(() => AuthService.getUser());

  const handleLogout = async () => {
    try { await AuthService.logout(); } finally { setUser(null); }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === "admin") {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  if (user.role === "akuntan") {
    return <AdminAkuntanPanel user={user} onLogout={handleLogout} />;
  }

  if (user.role === "supplier") {
    return <SupplierPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Panel belum tersedia</h1>
        <p className="mt-2 text-sm text-slate-500">
          Panel untuk role <strong>{user.role}</strong> akan dibuat pada tahap berikutnya.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;

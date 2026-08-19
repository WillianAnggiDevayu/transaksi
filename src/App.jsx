import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LogOut,
} from "lucide-react";

import AuthService from "./services/AuthService";
import SupplierService from "./services/SupplierService";
import ItemService from "./services/ItemService";
import TransactionService from "./services/TransactionService";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Supplier from "./pages/Supplier";
import Barang from "./pages/Barang";
import Pembelian from "./pages/Pembelian";
import OfflineBanner from "./components/OfflineBanner";

function App() {
  // *USER LOGIN* // 
  const [user, setUser] = useState(null);
  // *USER LOGIN* // 
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState("dashboard");

  // *DATA* //
  // *DATA* //
  const [supplier, setSupplier] = useState([]);
  const [barang, setBarang] = useState([]);
  const [pembelian, setPembelian] = useState([]);

  // *CEK LOGIN SAAT APLIKASI DIBUKA* // 
  useEffect(() => {
    const currentUser = AuthService.getUser();

    if (currentUser && AuthService.isAuthenticated()) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
  }, []);

  // *LOAD DATA SETELAH LOGIN* // 
  useEffect(() => {
    if (!user) {
      // *CEK LOGIN SAAT APLIKASI DIBUKA* // 
      useEffect(() => {
        const currentUser = AuthService.getUser();

        if (currentUser && AuthService.isAuthenticated()) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      }, []);

      // *LOAD DATA SETELAH LOGIN* // 
      useEffect(() => {
        if (!user) {
          return;
        }

        loadData();
      }, [user]);

      // *MUAT ULANG DATA SETELAH ANTREAN OFFLINE BERHASIL DISINKRONKAN* //
      useEffect(() => {
        const handleSyncComplete = () => {
          if (user) loadData();
        };

        window.addEventListener("pms-sync-complete", handleSyncComplete);

        return () => {
          window.removeEventListener("pms-sync-complete", handleSyncComplete);
        };
      }, [user]);

      const loadData = async () => {
        try {
          const results = await Promise.allSettled([
            SupplierService.getAll(),
            ItemService.getAll(),
            TransactionService.getAll(),
          ]);
          loadData();
        }, [user]);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        SupplierService.getAll(),
        ItemService.getAll(),
        TransactionService.getAll(),
      ]);

      // SUPPLIER
      if (results[0].status === "fulfilled") {
        setSupplier(results[0].value || []);
      } else {
        console.error(
          "Gagal mengambil supplier:",
          results[0].reason
        );
      }
      // SUPPLIER
      if (results[0].status === "fulfilled") {
        setSupplier(results[0].value || []);
      } else {
        console.error(
          "Gagal mengambil supplier:",
          results[0].reason
        );
      }

      // BARANG
      if (results[1].status === "fulfilled") {
        setBarang(results[1].value || []);
      } else {
        console.error(
          "Gagal mengambil barang:",
          results[1].reason
        );
      }
      // BARANG
      if (results[1].status === "fulfilled") {
        setBarang(results[1].value || []);
      } else {
        console.error(
          "Gagal mengambil barang:",
          results[1].reason
        );
      }

      // PEMBELIAN
      if (results[2].status === "fulfilled") {
        setPembelian(results[2].value || []);
      } else {
        console.error(
          "Gagal mengambil pembelian:",
          results[2].reason
        );
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
      // PEMBELIAN
      if (results[2].status === "fulfilled") {
        setPembelian(results[2].value || []);
      } else {
        console.error(
          "Gagal mengambil pembelian:",
          results[2].reason
        );
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
  };
};

// *LOGIN BERHASIL* //
// *LOGIN BERHASIL* //
const handleLogin = (loggedUser) => {
  console.log("Login berhasil:", loggedUser);

  console.log("Login berhasil:", loggedUser);

  setUser(loggedUser);
  setMenu("dashboard");
};

// *LOGOUT* //
// *LOGOUT* //
const handleLogout = async () => {
  try {
    await AuthService.logout();
  } catch (error) {
    console.error("Logout gagal:", error);
  }

  // Hapus user dari state
  setUser(null);

  // Kosongkan data
  setSupplier([]);
  setBarang([]);
  setPembelian([]);

  setMenu("dashboard");
} catch (error) {
  console.error("Logout gagal:", error);
}

// Hapus user dari state
setUser(null);

// Kosongkan data
setSupplier([]);
setBarang([]);
setPembelian([]);

setMenu("dashboard");
  };

// *JIKA BELUM LOGIN* //
// *JIKA BELUM LOGIN* //
if (!user) {
  return <Login onLogin={handleLogin} />;
}

// *MENU STYLE* //
const menuClass = (menuName) => {
  return `group relative mb-2 flex w-full items-center gap-[13px] rounded-xl px-[10px] py-[7px] text-left text-[14px] font-medium transition-all duration-200 ${menu === menuName
    ? "bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-white shadow-[0_8px_22px_rgba(37,99,235,0.35)]"
    : "text-[#dbeafe] hover:translate-x-[3px] hover:bg-white/[0.08] hover:text-white"
    }`;
};
return <Login onLogin={handleLogin} />;
  }

// *MENU STYLE* //
const menuClass = (menuName) => {
  return `
      group
      relative
      mb-2
      flex
      w-full
      items-center
      gap-[13px]
      rounded-xl
      px-[10px]
      py-[7px]
      text-left
      text-[14px]
      font-medium
      transition-all
      duration-200

      ${menu === menuName
      ? "bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-white shadow-[0_8px_22px_rgba(37,99,235,0.35)]"
      : "text-[#dbeafe] hover:translate-x-[3px] hover:bg-white/[0.08] hover:text-white"
    }
    `;
};

const iconClass = (menuName) => {
  return `flex h-10 w-10 min-w-10 items-center justify-center rounded-[10px] transition-all duration-200 ${menu === menuName
    ? "bg-white/[0.14] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
    : "bg-white/[0.06] text-[#bfdbfe] group-hover:bg-white/[0.12] group-hover:text-white"
    }`;
};
const iconClass = (menuName) => {
  return `
      flex
      h-10
      w-10
      min-w-10
      items-center
      justify-center
      rounded-[10px]
      transition-all
      duration-200

      ${menu === menuName
      ? "bg-white/[0.14] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
      : "bg-white/[0.06] text-[#bfdbfe] group-hover:bg-white/[0.12] group-hover:text-white"
    }
    `;
};

// *DASHBOARD* //
// *DASHBOARD* //
return (
  <div className="min-h-screen bg-[#f4f7fc]">

    {/* SIDEBAR */}
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[250px] flex-col overflow-hidden bg-gradient-to-br from-[#071a4a] via-[#0b2b75] to-[#164ed8] px-[18px] py-7 text-white shadow-[5px_0_25px_rgba(0,0,0,0.12)] max-[900px]:w-[220px] max-[650px]:w-[70px] max-[650px]:px-[10px] max-[650px]:py-5">
      <aside
        className="
          fixed
          left-0
          top-0
          z-30
          flex
          h-screen
          w-[250px]
          flex-col
          overflow-hidden
          bg-gradient-to-br
          from-[#071a4a]
          via-[#0b2b75]
          to-[#164ed8]
          px-[18px]
          py-7
          text-white
          shadow-[5px_0_25px_rgba(0,0,0,0.12)]
          max-[900px]:w-[220px]
          max-[650px]:w-[70px]
          max-[650px]:px-[10px]
          max-[650px]:py-5
        "
      >

        {/* EFEK ATAS */}
        <div className="pointer-events-none absolute -left-20 -top-[150px] h-[300px] w-[300px] rounded-full bg-[#2563eb]/[0.18]" />
        {/* EFEK ATAS */}
        <div
          className="
            pointer-events-none
            absolute
            -left-20
            -top-[150px]
            h-[300px]
            w-[300px]
            rounded-full
            bg-[#2563eb]/[0.18]
          "
        />

        {/* EFEK BAWAH */}
        <div className="pointer-events-none absolute -bottom-[220px] -right-[180px] h-[350px] w-[350px] rounded-full bg-[#2563eb]/[0.15]" />
        {/* EFEK BAWAH */}
        <div
          className="
            pointer-events-none
            absolute
            -bottom-[220px]
            -right-[180px]
            h-[350px]
            w-[350px]
            rounded-full
            bg-[#2563eb]/[0.15]
          "
        />

        {/* LOGO */}
        <div className="relative z-10 mb-[55px] flex items-center gap-[14px] px-2 py-1.5 max-[650px]:justify-center">
          <div className="flex h-[52px] w-[52px] min-w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2563eb] to-[#4f8cff] text-[24px] font-bold text-white shadow-[0_8px_25px_rgba(37,99,235,0.45)]">
            <div
              className="
            relative
            z-10
            mb-[55px]
            flex
            items-center
            gap-[14px]
            px-2
            py-1.5

            max-[650px]:justify-center
          "
            >
              <div
                className="
              flex
              h-[52px]
              w-[52px]
              min-w-[52px]
              items-center
              justify-center
              rounded-[14px]
              bg-gradient-to-br
              from-[#2563eb]
              to-[#4f8cff]
              text-[24px]
              font-bold
              text-white
              shadow-[0_8px_25px_rgba(37,99,235,0.45)]">
                P
              </div>
              <div className="max-[650px]:hidden">
                <h2 className="text-[20px] font-bold leading-[1.2]">
                  <h2 className="text-[20px] font-bold leading-[1.2]">
                    Purchase
                  </h2>
                  <span className="mt-[5px] block text-[12px] text-[#bfdbfe]">
                    <span className="mt-[5px] block text-[12px] text-[#bfdbfe]">
                      Management System
                    </span>
                  </div>
              </div>

              {/* MENU TITLE */}
              <div className="relative z-10 mx-3 mb-[14px] text-[11px] font-semibold tracking-[1.5px] text-[#93c5fd] max-[650px]:hidden">
                <div
                  className="
            relative
            z-10
            mx-3
            mb-[14px]
            text-[11px]
            font-semibold
            tracking-[1.5px]
            text-[#93c5fd]
            max-[650px]:hidden">
                  MENU UTAMA
                  <div className="mt-3 h-px w-full bg-white/10" />
                </div>

                {/* DASHBOARD */}
                <button className={menuClass("dashboard")} onClick={() => setMenu("dashboard")}>
                  <button
                    className={menuClass("dashboard")}
                    onClick={() => setMenu("dashboard")}>
                    {menu === "dashboard" && (
                      <span className="absolute bottom-[10px] left-0 top-[10px] w-1 rounded-r-[5px] bg-[#67e8f9]" />
                    )}
                    <span className={iconClass("dashboard")}>
                      <LayoutDashboard size={19} />
                    </span>
                    <span className="max-[650px]:hidden">
                      Dashboard
                    </span>
                  </button>

                  {/* SUPPLIER */}
                  {(user?.role === "admin" || user?.role === "akuntan") && (
                    <button className={menuClass("supplier")} onClick={() => setMenu("supplier")}>
                      {menu === "supplier" && (
                        <span className="absolute bottom-[10px] left-0 top-[10px] w-1 rounded-r-[5px] bg-[#67e8f9]" />
                      )}
                      <span className={iconClass("supplier")}>
                        <Users size={19} />
                      </span>
                      <span className="max-[650px]:hidden">
                        Supplier
                      </span>
                    </button>
                  )}
                  {(user?.role === "admin" ||
                    user?.role === "akuntan") && (

                      <button
                        className={menuClass("supplier")}
                        onClick={() => setMenu("supplier")}
                      >

                        {menu === "supplier" && (
                          <span
                            className="
                  absolute
                  bottom-[10px]
                  left-0
                  top-[10px]
                  w-1
                  rounded-r-[5px]
                  bg-[#67e8f9]
                "
                          />
                        )}

                        <span className={iconClass("supplier")}>
                          <Users size={19} />
                        </span>
                        <span className="max-[650px]:hidden">
                          Supplier
                        </span>
                      </button>
                    )}

                  {/* BARANG */}
                  {(user?.role === "admin" || user?.role === "akuntan") && (
                    <button className={menuClass("barang")} onClick={() => setMenu("barang")}>
                      {menu === "barang" && (
                        <span className="absolute bottom-[10px] left-0 top-[10px] w-1 rounded-r-[5px] bg-[#67e8f9]" />
                      )}
                      <span className={iconClass("barang")}>
                        <Package size={19} />
                      </span>
                      <span className="max-[650px]:hidden">
                        Barang
                      </span>
                    </button>
                  )}

                  {(user?.role === "admin" ||
                    user?.role === "akuntan") && (
                      <button
                        className={menuClass("barang")}
                        onClick={() => setMenu("barang")}
                      >

                        {menu === "barang" && (
                          <span
                            className="
                  absolute
                  bottom-[10px]
                  left-0
                  top-[10px]
                  w-1
                  rounded-r-[5px]
                  bg-[#67e8f9]
                "
                          />
                        )}

                        <span className={iconClass("barang")}>
                          <Package size={19} />
                        </span>
                        <span className="max-[650px]:hidden">
                          Barang
                        </span>
                      </button>
                    )}

                  {/* PEMBELIAN */}
                  <button className={menuClass("pembelian")} onClick={() => setMenu("pembelian")}>
                    <button
                      className={menuClass("pembelian")}
                      onClick={() => setMenu("pembelian")}
                    >

                      {menu === "pembelian" && (
                        <span className="absolute bottom-[10px] left-0 top-[10px] w-1 rounded-r-[5px] bg-[#67e8f9]" />
                      )}
                      <span className={iconClass("pembelian")}>
                        <ShoppingCart size={19} />
                      </span>
                      <span className="max-[650px]:hidden">
                        Pembelian
                      </span>
                    </button>

                    {/* LOGOUT */}
                    <button onClick={handleLogout} className="group absolute bottom-[25px] left-[18px] right-[18px] z-10 flex items-center gap-[13px] rounded-xl px-[10px] py-[7px] text-left text-[14px] font-medium text-[#fecaca] transition-all duration-200 hover:translate-x-[3px] hover:bg-red-500/[0.12] hover:text-white">
                      <span className="flex h-10 w-10 min-w-10 items-center justify-center rounded-[10px] bg-white/[0.05] text-[#fecaca]">
                        <button
                          onClick={handleLogout}
                          className="
            group
            absolute
            bottom-[25px]
            left-[18px]
            right-[18px]
            z-10
            flex
            items-center
            gap-[13px]
            rounded-xl
            px-[10px]
            py-[7px]
            text-left
            text-[14px]
            font-medium
            text-[#fecaca]
            transition-all
            duration-200
            hover:translate-x-[3px]
            hover:bg-red-500/[0.12]
            hover:text-white
          "
                        >
                          <span
                            className="
              flex
              h-10
              w-10
              min-w-10
              items-center
              justify-center
              rounded-[10px]
              bg-white/[0.05]
              text-[#fecaca]
            "
                          >
                            <LogOut size={19} />
                          </span>
                          <span className="max-[650px]:hidden">
                            Logout
                          </span>

                        </button>

                      </aside>

                      {/* MAIN */}
                      <main className="min-h-screen ml-[250px] w-[calc(100%-250px)] bg-[#f4f7fc] max-[900px]:ml-[220px] max-[900px]:w-[calc(100%-220px)] max-[650px]:ml-[70px] max-[650px]:w-[calc(100%-70px)]">

                        {/* OFFLINE / PENDING SYNC BANNER */}
                        <OfflineBanner />


                        <main
                          className="
          min-h-screen
          ml-[250px]
          w-[calc(100%-250px)]
          bg-[#f4f7fc]

          max-[900px]:ml-[220px]
          max-[900px]:w-[calc(100%-220px)]

          max-[650px]:ml-[70px]
          max-[650px]:w-[calc(100%-70px)]
        "
                        >

                          {/* HEADER */}
                          <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-[#e5e7eb] bg-white px-8">

                            <header
                              className="
            sticky
            top-0
            z-20
            flex
            h-[82px]
            items-center
            justify-between
            border-b
            border-[#e5e7eb]
            bg-white
            px-8
          "
                            >

                              <div>

                                <h1 className="mb-[5px] text-[21px] font-bold text-[#0f172a]">
                                  {menu === "dashboard" && "Dashboard"}
                                  {menu === "supplier" && "Data Supplier"}
                                  {menu === "barang" && "Data Barang"}
                                  {menu === "pembelian" && "Transaksi Pembelian"}

                                  {menu === "dashboard" &&
                                    "Dashboard"}

                                  {menu === "supplier" &&
                                    "Data Supplier"}

                                  {menu === "barang" &&
                                    "Data Barang"}

                                  {menu === "pembelian" &&
                                    "Transaksi Pembelian"}

                                </h1>
                                <p className="text-[12px] text-[#64748b]">
                                  Sistem informasi pembelian
                                </p>

                              </div>

                              <div className="flex items-center gap-[11px]">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#60a5fa] text-[12px] font-bold text-white">

                                  <div
                                    className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-[#2563eb]
                to-[#60a5fa]
                text-[12px]
                font-bold
                text-white
              "
                                  >
                                    {(user?.name || "U")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div className="max-[650px]:hidden">

                                    <strong className="block text-[13px] text-[#1e293b]">
                                      {user?.name || "User"}
                                    </strong>
                                    <span className="mt-[3px] block text-[11px] text-[#64748b]">
                                      {user?.role || "User"}
                                    </span>

                                  </div>
                                </div>

                            </header>

                            {/* CONTENT */}

                            <section className="p-[30px] max-[650px]:p-[18px]">
                              {menu === "dashboard" && (
                                <Dashboard
                                  supplier={supplier}
                                  barang={barang}
                                  pembelian={pembelian}
                                  setPembelian={setPembelian}
                                />
                              )}
                              {menu === "supplier" && (
                                <Supplier
                                  supplier={supplier}
                                  setSupplier={setSupplier}
                                  user={user}
                                />
                              )}
                              {menu === "barang" && (
                                <Barang
                                  barang={barang}
                                  setBarang={setBarang}
                                  user={user}
                                />
                              )}
                              {menu === "pembelian" && (
                                <Pembelian
                                  supplier={supplier}
                                  barang={barang}
                                  setPembelian={setPembelian}
                                />
                              )}
                            </section>

                        </main>


                      </div>
                      );
}

                      export default App;
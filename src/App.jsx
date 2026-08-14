import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LogOut,
} from "lucide-react";

import "./App.css";
import Login from "./Login";

function App() {
  /* =========================================
     LOGIN
  ========================================= */

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* =========================================
     MENU
  ========================================= */

  const [menu, setMenu] = useState("dashboard");

  /* =========================================
     DATA SUPPLIER
  ========================================= */

  const [supplier, setSupplier] = useState([
    {
      id: 1,
      nama: "PT ABC Indonesia",
      telepon: "08123456789",
    },
    {
      id: 2,
      nama: "PT Sumber Makmur",
      telepon: "08234567890",
    },
  ]);

  /* =========================================
     DATA BARANG
  ========================================= */

  const [barang, setBarang] = useState([
    {
      id: 1,
      nama: "Laptop",
      harga: 7000000,
      stok: 10,
    },
    {
      id: 2,
      nama: "Keyboard",
      harga: 250000,
      stok: 25,
    },
    {
      id: 3,
      nama: "Mouse",
      harga: 150000,
      stok: 30,
    },
  ]);

  /* =========================================
     DATA PEMBELIAN
  ========================================= */

  const [pembelian, setPembelian] = useState([
    {
      id: 1,
      tanggal: "13-08-2026",
      supplier: "PT ABC Indonesia",
      total: 7250000,
    },
    {
      id: 2,
      tanggal: "12-08-2026",
      supplier: "PT Sumber Makmur",
      total: 1500000,
    },
  ]);

  /* =========================================
     FORM PEMBELIAN
  ========================================= */

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedBarang, setSelectedBarang] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [harga, setHarga] = useState("");

  /* =========================================
     FORMAT RUPIAH
  ========================================= */

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  /* =========================================
     SUBTOTAL
  ========================================= */

  const subtotal =
    Number(jumlah || 0) * Number(harga || 0);

  /* =========================================
     PILIH BARANG
     OTOMATIS MENGISI HARGA
  ========================================= */

  const handleBarangChange = (e) => {
    const barangId = e.target.value;

    setSelectedBarang(barangId);

    const dataBarang = barang.find(
      (item) => item.id === Number(barangId)
    );

    if (dataBarang) {
      setHarga(dataBarang.harga);
    } else {
      setHarga("");
    }
  };

  /* =========================================
     SIMPAN PEMBELIAN
  ========================================= */

  const handleSimpanPembelian = () => {
    if (
      !selectedSupplier ||
      !selectedBarang ||
      !jumlah ||
      !harga
    ) {
      alert("Silakan lengkapi data pembelian terlebih dahulu.");
      return;
    }

    const supplierData = supplier.find(
      (item) => item.id === Number(selectedSupplier)
    );

    const barangData = barang.find(
      (item) => item.id === Number(selectedBarang)
    );

    if (!supplierData || !barangData) {
      alert("Data supplier atau barang tidak ditemukan.");
      return;
    }

    const tanggalSekarang =
      new Date().toLocaleDateString("id-ID");

    const pembelianBaru = {
      id: pembelian.length + 1,
      tanggal: tanggalSekarang,
      supplier: supplierData.nama,
      total: subtotal,
    };

    setPembelian([
      pembelianBaru,
      ...pembelian,
    ]);

    /* Update stok barang */

    setBarang(
      barang.map((item) => {
        if (item.id === Number(selectedBarang)) {
          return {
            ...item,
            stok: item.stok - Number(jumlah),
          };
        }

        return item;
      })
    );

    /* Reset form */

    setSelectedSupplier("");
    setSelectedBarang("");
    setJumlah("");
    setHarga("");

    alert("Pembelian berhasil disimpan!");

    setMenu("dashboard");
  };

  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin keluar?"
    );

    if (yakin) {
      setIsLoggedIn(false);
      setMenu("dashboard");
    }
  };

  /* =========================================
     LOGIN PAGE
  ========================================= */

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  /* =========================================
     DASHBOARD
  ========================================= */

  return (
    <div className="app">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="logo">

          <div className="logo-icon">
            P
          </div>

          <div>
            <h2>Purchase</h2>
            <span>
              Management System
            </span>
          </div>

        </div>


        {/* MENU TITLE */}

        <div className="menu-title">
          MENU UTAMA
        </div>


        {/* DASHBOARD */}

        <button
          className={
            menu === "dashboard"
              ? "menu active"
              : "menu"
          }
          onClick={() =>
            setMenu("dashboard")
          }
        >

          <span className="menu-icon">
            <LayoutDashboard size={19} />
          </span>

          <span>
            Dashboard
          </span>

        </button>


        {/* SUPPLIER */}

        <button
          className={
            menu === "supplier"
              ? "menu active"
              : "menu"
          }
          onClick={() =>
            setMenu("supplier")
          }
        >

          <span className="menu-icon">
            <Users size={19} />
          </span>

          <span>
            Supplier
          </span>

        </button>


        {/* BARANG */}

        <button
          className={
            menu === "barang"
              ? "menu active"
              : "menu"
          }
          onClick={() =>
            setMenu("barang")
          }
        >

          <span className="menu-icon">
            <Package size={19} />
          </span>

          <span>
            Barang
          </span>

        </button>


        {/* PEMBELIAN */}

        <button
          className={
            menu === "pembelian"
              ? "menu active"
              : "menu"
          }
          onClick={() =>
            setMenu("pembelian")
          }
        >

          <span className="menu-icon">
            <ShoppingCart size={19} />
          </span>

          <span>
            Pembelian
          </span>

        </button>


        {/* LOGOUT */}

        <button
          className="menu"
          onClick={handleLogout}
          style={{
            marginTop: "25px",
          }}
        >

          <span className="menu-icon">
            <LogOut size={19} />
          </span>

          <span>
            Logout
          </span>

        </button>

      </aside>


      {/* =====================================
          MAIN
      ===================================== */}

      <main className="main">


        {/* ===================================
            HEADER
        =================================== */}

        <header className="header">

          <div>

            <h1>

              {menu === "dashboard" &&
                "Dashboard"}

              {menu === "supplier" &&
                "Data Supplier"}

              {menu === "barang" &&
                "Data Barang"}

              {menu === "pembelian" &&
                "Transaksi Pembelian"}

            </h1>

            <p>
              Sistem informasi pembelian
            </p>

          </div>


          {/* USER */}

          <div className="user">

            <div className="avatar">
              WA
            </div>

            <div>

              <strong>
                Willian Anggi
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>

        </header>


        {/* ===================================
            CONTENT
        =================================== */}

        <section className="content">


          {/* =================================
              DASHBOARD
          ================================= */}

          {menu === "dashboard" && (
            <>

              {/* WELCOME */}

              <div className="welcome">

                <h2>
                  Selamat Datang 👋
                </h2>

                <p>
                  Kelola data supplier,
                  barang, dan pembelian
                  melalui sistem ini.
                </p>

              </div>


              {/* STATISTIC */}

              <div className="cards">


                {/* SUPPLIER */}

                <div className="card">

                  <span>
                    👥
                  </span>

                  <div>

                    <p>
                      Total Supplier
                    </p>

                    <h2>
                      {supplier.length}
                    </h2>

                  </div>

                </div>


                {/* BARANG */}

                <div className="card">

                  <span>
                    📦
                  </span>

                  <div>

                    <p>
                      Total Barang
                    </p>

                    <h2>
                      {barang.length}
                    </h2>

                  </div>

                </div>


                {/* PEMBELIAN */}

                <div className="card">

                  <span>
                    🛒
                  </span>

                  <div>

                    <p>
                      Total Pembelian
                    </p>

                    <h2>
                      {pembelian.length}
                    </h2>

                  </div>

                </div>

              </div>


              {/* TABLE PEMBELIAN */}

              <div className="panel">

                <div className="panel-header">

                  <h3>
                    Transaksi Pembelian
                    Terbaru
                  </h3>

                  <button
                    className="btn-primary"
                    onClick={() =>
                      setMenu("pembelian")
                    }
                  >
                    + Pembelian Baru
                  </button>

                </div>


                <table>

                  <thead>

                    <tr>

                      <th>
                        No
                      </th>

                      <th>
                        Tanggal
                      </th>

                      <th>
                        Supplier
                      </th>

                      <th>
                        Total
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {pembelian.map(
                      (item, index) => (

                        <tr key={item.id}>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {item.tanggal}
                          </td>

                          <td>
                            {item.supplier}
                          </td>

                          <td>
                            {formatRupiah(
                              item.total
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </>
          )}


          {/* =================================
              SUPPLIER
          ================================= */}

          {menu === "supplier" && (

            <div className="panel">

              <div className="panel-header">

                <h3>
                  Daftar Supplier
                </h3>

                <button className="btn-primary">
                  + Tambah Supplier
                </button>

              </div>


              <input
                className="search"
                placeholder="Cari supplier..."
              />


              <table>

                <thead>

                  <tr>

                    <th>
                      No
                    </th>

                    <th>
                      Nama Supplier
                    </th>

                    <th>
                      No. Telepon
                    </th>

                    <th>
                      Aksi
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {supplier.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.nama}
                        </td>

                        <td>
                          {item.telepon}
                        </td>

                        <td>

                          <button
                            className="btn-edit"
                          >
                            Edit
                          </button>

                          <button
                            className="btn-delete"
                          >
                            Hapus
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* =================================
              BARANG
          ================================= */}

          {menu === "barang" && (

            <div className="panel">

              <div className="panel-header">

                <h3>
                  Daftar Barang
                </h3>

                <button className="btn-primary">
                  + Tambah Barang
                </button>

              </div>


              <input
                className="search"
                placeholder="Cari barang..."
              />


              <table>

                <thead>

                  <tr>

                    <th>
                      No
                    </th>

                    <th>
                      Nama Barang
                    </th>

                    <th>
                      Harga
                    </th>

                    <th>
                      Stok
                    </th>

                    <th>
                      Aksi
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {barang.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.nama}
                        </td>

                        <td>
                          {formatRupiah(
                            item.harga
                          )}
                        </td>

                        <td>
                          {item.stok}
                        </td>

                        <td>

                          <button
                            className="btn-edit"
                          >
                            Edit
                          </button>

                          <button
                            className="btn-delete"
                          >
                            Hapus
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* =================================
              PEMBELIAN
          ================================= */}

          {menu === "pembelian" && (

            <div className="panel">

              <div className="panel-header">

                <h3>
                  Transaksi Pembelian
                </h3>

              </div>


              <div className="form-grid">


                {/* SUPPLIER */}

                <div className="form-group">

                  <label>
                    Supplier
                  </label>

                  <select
                    value={selectedSupplier}
                    onChange={(e) =>
                      setSelectedSupplier(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Pilih Supplier
                    </option>

                    {supplier.map(
                      (item) => (

                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.nama}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* BARANG */}

                <div className="form-group">

                  <label>
                    Barang
                  </label>

                  <select
                    value={selectedBarang}
                    onChange={
                      handleBarangChange
                    }
                  >

                    <option value="">
                      Pilih Barang
                    </option>

                    {barang.map(
                      (item) => (

                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.nama}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* JUMLAH */}

                <div className="form-group">

                  <label>
                    Jumlah Beli
                  </label>

                  <input
                    type="number"
                    min="1"
                    placeholder="Masukkan jumlah"
                    value={jumlah}
                    onChange={(e) =>
                      setJumlah(
                        e.target.value
                      )
                    }
                  />

                </div>


                {/* HARGA */}

                <div className="form-group">

                  <label>
                    Harga
                  </label>

                  <input
                    type="number"
                    placeholder="Masukkan harga"
                    value={harga}
                    onChange={(e) =>
                      setHarga(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* SUBTOTAL */}

              <div className="subtotal">

                <span>
                  Subtotal
                </span>

                <strong>
                  {formatRupiah(
                    subtotal
                  )}
                </strong>

              </div>


              {/* SIMPAN */}

              <button
                className="btn-save"
                onClick={
                  handleSimpanPembelian
                }
              >
                Simpan Pembelian
              </button>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;
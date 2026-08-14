import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  LogOut,
} from "lucide-react";

import Login from "./login";
import "./App.css";

function App() {
  // LOGIN
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // MENU
  const [menu, setMenu] = useState("dashboard");

  // DATA SUPPLIER
  const [supplier] = useState([
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

  // DATA BARANG

  const [barang] = useState([
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

  // DATA PEMBELIAN
 
  const [pembelian] = useState([
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

  // FORM PEMBELIAN

  const [supplierDipilih, setSupplierDipilih] =
    useState("");

  const [tanggalPembelian, setTanggalPembelian] =
    useState("");


  // DETAIL BARANG

  const [items, setItems] = useState([
    {
      id: Date.now(),
      barangId: "",
      harga: "",
      jumlah: 0,
    },
  ]);

  // FORMAT RUPIAH

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  // PILIH BARANG

  const handleBarangChange = (index, barangId) => {
    const barangDipilih = barang.find(
      (item) => item.id === Number(barangId)
    );

    const newItems = [...items];
    newItems[index].barangId = barangId;
    if (barangDipilih) {
      newItems[index].harga = barangDipilih.harga;
    } else {
      newItems[index].harga = "";
    }
    setItems(newItems);
  };

  // UBAH DATA ITEM

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // TAMBAH BARANG

  const tambahBarang = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        barangId: "",
        harga: "",
        jumlah: 0,
      },
    ]);
  };

  // HAPUS BARANG

  const hapusBarang = (index) => {
    if (items.length === 1) {
      return;
    }
    const newItems = items.filter(
      (_, i) => i !== index
    );
    setItems(newItems);
  };

  // HITUNG SUBTOTAL

  const hitungSubtotal = (item) => {
    return (
      Number(item.harga || 0) *
      Number(item.jumlah || 0)
    );
  };

  // HITUNG TOTAL PEMBELIAN

  const totalPembelian = items.reduce(
    (total, item) => {
      return total + hitungSubtotal(item);
    },
    0
  );

  // SIMPAN PEMBELIAN

  const handleSimpanPembelian = () => {
    if (!supplierDipilih) {
      alert(
        "Silakan pilih supplier terlebih dahulu."
      );
      return;
    }

    if (!tanggalPembelian) {
      alert(
        "Silakan pilih tanggal pembelian terlebih dahulu."
      );
      return;
    }

    const adaBarangKosong = items.some(
      (item) => !item.barangId
    );

    if (adaBarangKosong) {
      alert(
        "Silakan pilih barang terlebih dahulu."
      );
      return;
    }

    alert(
      `Pembelian berhasil disimpan!\nTotal: ${formatRupiah(
        totalPembelian
      )}`
    );
  };

  // LOGIN

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  // DASHBOARD

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">
        {/* LOGO */}
        <div className="logo">
          <div className="logo-icon">
            P </div>
          <div>
            <h2>
              Purchase </h2>
            <span>
              Management System </span>
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
          className="menu logout-menu"
          onClick={() => setIsLoggedIn(false)}
        >
          <span className="menu-icon">
            <LogOut size={19} />
          </span>

          <span>
            Logout
          </span>
        </button>

      </aside>

      {/* MAIN */}
      <main className="main">

        {/* HEADER */}

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

        {/* CONTENT */}

        <section className="content">

          {/* DASHBOARD */}

          {menu === "dashboard" && (
            <>
              <div className="welcome">
                <h2>
                  Selamat Datang 👋
                </h2>
                <p>
                  Kelola data pembelian
                  melalui sistem ini.
                </p>
              </div>

              {/* CARDS */}
              <div className="cards">

                {/* TOTAL SUPPLIER */}
                <div className="card">

                  <span>
                    👥 </span>

                  <div>
                    <p>
                      Total Supplier </p>

                    <h2>
                      {supplier.length} </h2>
                  </div>
                </div>

                {/* TOTAL BARANG */}
                <div className="card">

                  <span>
                    📦 </span>

                  <div>
                    <p>
                      Total Barang</p>
                    <h2>
                      {barang.length}
                    </h2>
                  </div>
                </div>

                {/* TOTAL PEMBELIAN */}

                <div className="card">

                  <span>
                    🛒</span>
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

              {/* TRANSAKSI TERBARU */}
              <div className="panel">
                <div className="panel-header">
                  <h3>
                    Transaksi Pembelian Terbaru
                  </h3>
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

          {/* SUPPLIER */}

          {menu === "supplier" && (
            <div className="panel">
              <div className="panel-header">

                <h3>
                  Daftar Supplier
                </h3>

                <button
                  className="btn-primary"
                >
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

          {/* BARANG */}

          {menu === "barang" && (

            <div className="panel">

              <div className="panel-header">

                <h3>
                  Daftar Barang
                </h3>

                <button
                  className="btn-primary"
                >
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

          {/* PEMBELIAN */}

          {menu === "pembelian" && (

            <div className="panel">

              {/* HEADER */}

              <div className="panel-header">

                <div>

                  <h3>
                    Transaksi Pembelian
                  </h3>

                  <div className="panel-subtitle">
                    Tambahkan barang yang ingin
                    dibeli dari supplier.
                  </div>

                </div>

              </div>

              {/* SUPPLIER & TANGGAL */}

              <div className="purchase-info">

                {/* SUPPLIER */}

                <div className="form-group">

                  <label>
                    Supplier
                  </label>

                  <select
                    value={supplierDipilih}
                    onChange={(e) =>
                      setSupplierDipilih(
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

                {/* TANGGAL */}

                <div className="form-group">

                  <label>
                    Tanggal Pembelian
                  </label>

                  <input
                    type="date"
                    value={tanggalPembelian}
                    onChange={(e) =>
                      setTanggalPembelian(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* DETAIL BARANG */}

              <div className="purchase-detail">

                <div className="detail-header">

                  <div>

                    <h4>
                      Detail Barang
                    </h4>

                    <span>
                      Tambahkan satu atau
                      beberapa barang.
                    </span>

                  </div>

                  <button
                    className="btn-add-item"
                    onClick={tambahBarang}
                  >

                    <Plus size={15} />

                    Tambah Barang

                  </button>

                </div>

                {/* TABEL DETAIL */}

                <div className="purchase-table">

                  {/* HEADER TABEL */}

                  <div className="purchase-row purchase-head">

                    <div>
                      No
                    </div>

                    <div>
                      Barang
                    </div>

                    <div>
                      Harga
                    </div>

                    <div>
                      Jumlah
                    </div>

                    <div>
                      Subtotal
                    </div>

                    <div>
                      Aksi
                    </div>

                  </div>

                  {/* DATA BARANG */}

                  {items.map(
                    (item, index) => (

                      <div
                        className="purchase-row"
                        key={item.id}
                      >

                        {/* NO */}

                        <div className="row-number">
                          {index + 1}
                        </div>

                        {/* BARANG */}

                        <div>

                          <select
                            className="purchase-input"
                            value={
                              item.barangId
                            }
                            onChange={(e) =>
                              handleBarangChange(
                                index,
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Pilih Barang
                            </option>

                            {barang.map(
                              (barangItem) => (

                                <option
                                  key={
                                    barangItem.id
                                  }
                                  value={
                                    barangItem.id
                                  }
                                >
                                  {
                                    barangItem.nama
                                  }
                                </option>

                              )
                            )}

                          </select>

                        </div>

                        {/* HARGA */}

                        <div>

                          <input
                            type="number"
                            className="purchase-input"
                            placeholder="Harga"
                            value={
                              item.harga
                            }
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "harga",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        {/* JUMLAH */}

                        <div>

                          <input
                            type="number"
                            min="0"
                            className="purchase-input quantity-input"
                            value={
                              item.jumlah
                            }
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "jumlah",
                                e.target.value
                              )
                            }
                          />

                        </div>

                        {/* SUBTOTAL */}

                        <div className="item-subtotal">

                          {formatRupiah(
                            hitungSubtotal(item)
                          )}

                        </div>

                        {/* HAPUS */}

                        <div>

                          <button
                            className="btn-delete-item"
                            onClick={() =>
                              hapusBarang(index)
                            }
                            disabled={
                              items.length === 1
                            }
                            title={
                              items.length === 1
                                ? "Minimal satu barang"
                                : "Hapus barang"
                            }
                          >

                            <Trash2
                              size={14}
                            />

                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

                {/* TOTAL */}

                <div className="purchase-total">

                  <span>
                    Total Pembelian
                  </span>

                  <strong>
                    {formatRupiah(
                      totalPembelian
                    )}
                  </strong>

                </div>

                {/* SIMPAN */}

                <div className="purchase-actions">

                  <button
                    className="btn-save"
                    onClick={
                      handleSimpanPembelian
                    }
                  >
                    Simpan Pembelian
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
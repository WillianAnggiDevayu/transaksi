import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
} from "lucide-react";
import "./App.css";

function App() {
  const [menu, setMenu] = useState("dashboard");

  const supplier = [
    { id: 1, nama: "PT ABC Indonesia", telepon: "08123456789" },
    { id: 2, nama: "PT Sumber Makmur", telepon: "08234567890" },
  ];

  const barang = [
    { id: 1, nama: "Laptop", harga: 7000000, stok: 10 },
    { id: 2, nama: "Keyboard", harga: 250000, stok: 25 },
    { id: 3, nama: "Mouse", harga: 150000, stok: 30 },
  ];

  const pembelian = [
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
  ];

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">P</div>
          <div>
            <h2>Purchase</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="menu-title">MENU UTAMA</div>

        <button
  className={menu === "dashboard" ? "menu active" : "menu"}
  onClick={() => setMenu("dashboard")}
>
  <span className="menu-icon">
    <LayoutDashboard size={19} />
  </span>

  <span>Dashboard</span>
</button>
      <button
        className={menu === "supplier" ? "menu active" : "menu"}
        onClick={() => setMenu("supplier")}
      >
        <span className="menu-icon">
          <Users size={19} />
        </span>

        <span>Supplier</span>
      </button>

      <button
        className={menu === "barang" ? "menu active" : "menu"}
        onClick={() => setMenu("barang")}
      >
        <span className="menu-icon">
          <Package size={19} />
        </span>

        <span>Barang</span>
      </button>

      <button
        className={menu === "pembelian" ? "menu active" : "menu"}
        onClick={() => setMenu("pembelian")}
      >
        <span className="menu-icon">
          <ShoppingCart size={19} />
        </span>

        <span>Pembelian</span>
      </button>
      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="header">
          <div>
            <h1>
              {menu === "dashboard" && "Dashboard"}
              {menu === "supplier" && "Data Supplier"}
              {menu === "barang" && "Data Barang"}
              {menu === "pembelian" && "Transaksi Pembelian"}
            </h1>

            <p>Sistem informasi pembelian</p>
          </div>

          <div className="user">
            <div className="avatar">WA</div>
            <div>
              <strong>Willian Anggi</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <section className="content">

          {/* DASHBOARD */}
          {menu === "dashboard" && (
            <>
              <div className="welcome">
                <h2>Selamat Datang 👋</h2>
                <p>
                  Kelola data supplier, barang, dan transaksi pembelian
                  melalui sistem ini.
                </p>
              </div>

              <div className="cards">
                <div className="card">
                  <span>👥</span>
                  <div>
                    <p>Total Supplier</p>
                    <h2>{supplier.length}</h2>
                  </div>
                </div>

                <div className="card">
                  <span>📦</span>
                  <div>
                    <p>Total Barang</p>
                    <h2>{barang.length}</h2>
                  </div>
                </div>

                <div className="card">
                  <span>🛒</span>
                  <div>
                    <p>Total Pembelian</p>
                    <h2>{pembelian.length}</h2>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Transaksi Pembelian Terbaru</h3>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Tanggal</th>
                      <th>Supplier</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pembelian.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.tanggal}</td>
                        <td>{item.supplier}</td>
                        <td>{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUPPLIER */}
          {menu === "supplier" && (
            <div className="panel">
              <div className="panel-header">
                <h3>Daftar Supplier</h3>
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
                    <th>No</th>
                    <th>Nama Supplier</th>
                    <th>No. Telepon</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {supplier.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.nama}</td>
                      <td>{item.telepon}</td>
                      <td>
                        <button className="btn-edit">Edit</button>
                        <button className="btn-delete">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BARANG */}
          {menu === "barang" && (
            <div className="panel">
              <div className="panel-header">
                <h3>Daftar Barang</h3>
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
                    <th>No</th>
                    <th>Nama Barang</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {barang.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.nama}</td>
                      <td>{formatRupiah(item.harga)}</td>
                      <td>{item.stok}</td>
                      <td>
                        <button className="btn-edit">Edit</button>
                        <button className="btn-delete">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PEMBELIAN */}
          {menu === "pembelian" && (
            <div className="panel">
              <div className="panel-header">
                <h3>Transaksi Pembelian</h3>
                <button className="btn-primary">
                  + Pembelian Baru
                </button>
              </div>

              <div className="form-grid">

                <div className="form-group">
                  <label>Supplier</label>
                  <select>
                    <option>Pilih Supplier</option>
                    {supplier.map((item) => (
                      <option key={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Barang</label>
                  <select>
                    <option>Pilih Barang</option>
                    {barang.map((item) => (
                      <option key={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Jumlah Beli</label>
                  <input type="number" placeholder="Masukkan jumlah" />
                </div>

                <div className="form-group">
                  <label>Harga</label>
                  <input type="number" placeholder="Masukkan harga" />
                </div>

              </div>

              <div className="subtotal">
                <span>Subtotal</span>
                <strong>Rp 0</strong>
              </div>

              <button className="btn-save">
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
import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      alert('Username atau password salah!');
    }
  };

  return (
    <div className="login-page">

      {/* BAGIAN KIRI */}
      <div className="login-left">

        <div className="login-brand">
          <div className="login-logo">
            P
          </div>

          <div>
            <h2>Purchase Management</h2>
            <span>System</span>
          </div>
        </div>

        <div className="login-description">
          <h1>
            Kelola Pembelian
            <br />
            Lebih Mudah.
          </h1>

          <p>
            Sistem informasi pembelian untuk membantu
            mengelola data supplier, barang, dan transaksi
            pembelian secara lebih terstruktur.
          </p>
        </div>

        <div className="login-info">
          <div className="info-item">
            <strong>Supplier</strong>
            <span>Kelola data supplier</span>
          </div>

          <div className="info-item">
            <strong>Barang</strong>
            <span>Kelola data barang</span>
          </div>

          <div className="info-item">
            <strong>Pembelian</strong>
            <span>Kelola transaksi</span>
          </div>
        </div>

      </div>


      {/* BAGIAN KANAN */}
      <div className="login-right">

        <div className="login-box">

          <div className="login-header">
            <h1>Selamat Datang</h1>

            <p>
              Silakan masuk untuk melanjutkan
            </p>
          </div>


          <form onSubmit={handleSubmit}>

            <div className="login-form-group">
              <label>Username</label>

              <div className="input-wrapper">
                <span className="input-icon">
                  👤
                </span>

                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                />
              </div>
            </div>


            <div className="login-form-group">
              <label>Password</label>

              <div className="input-wrapper">
                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>


            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Lupa password?
              </button>
            </div>


            <button
              type="submit"
              className="login-button"
            >
              Masuk
              <span>→</span>
            </button>

          </form>


          <div className="login-footer">
            <span>© 2026 Purchase Management System</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
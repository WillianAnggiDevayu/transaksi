import { useState } from "react";
import { Mail, LogIn } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import AuthService from "../services/AuthService";

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await AuthService.login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc]">
      <div className="flex min-h-screen">

        {/* BAGIAN KIRI */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#071a4a] via-[#0b2b75] to-[#164ed8] lg:flex lg:flex-col lg:justify-between p-12 xl:p-16">

          {/* Background Effect */}
          <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-blue-500/10" />
          <div className="absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-blue-400/10" />
          <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl" />

          {/* BRAND */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#4f8cff] text-2xl font-bold text-white shadow-lg shadow-blue-900/40">
              P
            </div>
            <div>

              <h2 className="text-xl font-bold text-white">
                Purchase Management
              </h2>

              <p className="mt-1 text-sm text-blue-200">
                System
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="relative z-10 max-w-[540px]">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[2px] text-blue-300">
              Purchase Management System
            </p>

            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Kelola Pembelian
              <br />
              <span className="text-blue-300">
                Lebih Mudah.
              </span>
            </h1>

            <p className="mt-6 max-w-[500px] text-base leading-7 text-blue-100/80">
              Sistem informasi untuk membantu mengelola transaksi pembelian secara lebih terstruktur.
            </p>
          </div>

          {/* FITUR */}
          <div className="relative z-10 grid max-w-[560px] grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <div className="mb-3 text-sm font-semibold text-white">
                Supplier
              </div>

              <p className="text-xs leading-5 text-blue-200">
                Kelola data supplier
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <div className="mb-3 text-sm font-semibold text-white">
                Barang
              </div>
              <p className="text-xs leading-5 text-blue-200">
                Kelola data barang
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <div className="mb-3 text-sm font-semibold text-white">
                Pembelian
              </div>
              <p className="text-xs leading-5 text-blue-200">
                Kelola transaksi
              </p>
            </div>
          </div>
        </div>

        {/* BAGIAN KANAN */}

        <div className="flex w-full items-center justify-center bg-[#f8fafc] px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-[430px]">

            {/* MOBILE LOGO */}
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#4f8cff] text-2xl font-bold text-white shadow-lg">
                P
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Purchase Management
              </h2>
              <p className="text-sm text-slate-500">
                System
              </p>
            </div>

            {/* LOGIN CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_15px_40px_rgba(15,23,42,0.07)] sm:p-8">

              {/* HEADER */}
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900">
                  Selamat Datang
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Silakan login untuk melanjutkan ke sistem.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="Masukkan email"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="
                    mb-[7px]
                    block
                    text-[12px]
                    font-medium
                    text-slate-700
                  ">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      required
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        px-3
                        py-[10px]
                        pr-10
                        text-[13px]
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                      "
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        hover:text-slate-600
                      "
                    >
                      {showPassword ? (
                        <Eye size={17} />
                      ) : (
                        <EyeOff size={17} />
                      )}
                    </button>

                  </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_25px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60">
                  <LogIn size={18} />
                  {loading
                    ? "Memproses..."
                    : "Login"}
                </button>
              </form>

              {/* FOOTER */}
              <div className="mt-7 border-t border-slate-100 pt-5 text-center">
                <p className="text-[12px] text-[#8ba0c4]">
                  © 2026 Purchase Management System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

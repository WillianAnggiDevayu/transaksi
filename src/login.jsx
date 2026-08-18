import { useState } from "react";
import AuthService from "../services/AuthService";

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc] px-5">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[13px] border border-gray-200 bg-white p-[22px] shadow-[0_3px_10px_rgba(15,23,42,0.04)]">

          <div className="mb-6 border-b border-gray-200 pb-5">
            <h3 className="text-[18px] font-semibold text-slate-900">
              Login
            </h3>

            <p className="mt-1 text-[12px] text-slate-500">
              Purchase Management System
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[18px]">

            <div>
              <label className="mb-[7px] block text-[12px] font-medium text-slate-700">
                Email
              </label>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-[10px] text-[13px] text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-[7px] block text-[12px] font-medium text-slate-700">
                Password
              </label>

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-[10px] text-[13px] text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-4 py-[10px] text-[13px] font-semibold text-white shadow-[0_5px_15px_rgba(37,99,235,0.2)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Login"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
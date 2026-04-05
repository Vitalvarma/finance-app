import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../stores/authStore";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl">FinanceApp</span>
        </div>
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          Your financial data,<br />clear and in control.
        </h1>
        <p className="text-slate-400 text-lg max-w-md">
          Track income and expenses, analyse category trends, and manage your team — all in one place.
        </p>

        {/* Role legend */}
        <div className="mt-12 space-y-3">
          {[
            { role: "Viewer", desc: "View dashboard & transactions", color: "bg-gray-500" },
            { role: "Analyst", desc: "Create records & access insights", color: "bg-blue-500" },
            { role: "Admin", desc: "Full access including user management", color: "bg-purple-500" },
          ].map(({ role, desc, color }) => (
            <div key={role} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-slate-300 text-sm">
                <span className="font-medium text-white">{role}</span> — {desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel / form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">FinanceApp</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Default admin: <span className="font-mono">admin@finance.com</span> / <span className="font-mono">Admin@1234</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

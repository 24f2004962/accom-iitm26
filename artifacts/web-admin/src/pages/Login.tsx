import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "superadmin@iitm.ac.in", color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" },
  { label: "Admin", email: "admin@iitm.ac.in", color: "text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20" },
  { label: "Volunteer", email: "volunteer@iitm.ac.in", color: "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20" },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function loginAs(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("123456");
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, "123456");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f11] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CampusOps</h1>
          <p className="text-slate-500 text-sm mt-1">Admin Portal · IIT Madras BS</p>
        </div>

        <div className="bg-[#161620] border border-white/8 rounded-2xl p-6 shadow-2xl space-y-5">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={10} className="text-yellow-500" /> Quick Login (Demo)
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAs(a.email)}
                  className={`flex-1 text-[11px] font-semibold py-1.5 px-2 rounded-lg border transition-all ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-slate-600">or sign in manually</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@iitm.ac.in"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-5">
          IIT Madras BS · Hostel Management System · All demo passwords: <span className="text-slate-500">123456</span>
        </p>
      </div>
    </div>
  );
}

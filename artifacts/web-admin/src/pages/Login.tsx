import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Eye, EyeOff, AlertCircle, ChevronDown } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "superadmin@iitm.ac.in", password: "qwerty",  role: "Super Admin",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { email: "admin@iitm.ac.in",       password: "123456",  role: "Admin",         badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { email: "coordinator@iitm.ac.in", password: "123456",  role: "Coordinator",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { email: "volunteer@iitm.ac.in",   password: "123456",  role: "Volunteer",     badge: "bg-green-500/20 text-green-300 border-green-500/30" },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

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

  function fillDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowDemo(false);
    setError("");
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

        <div className="bg-[#161620] border border-white/8 rounded-2xl p-6 shadow-2xl">
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

        {/* Demo credentials */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
          >
            <span>Demo accounts</span>
            <ChevronDown size={13} className={`transition-transform ${showDemo ? "rotate-180" : ""}`} />
          </button>

          {showDemo && (
            <div className="bg-[#161620] border border-white/8 rounded-2xl overflow-hidden shadow-xl mt-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors border-b border-white/5 last:border-0 text-left group"
                >
                  <div>
                    <div className="text-xs text-slate-200 font-medium group-hover:text-white transition-colors">
                      {acc.email}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                      password: <span className="text-slate-400">{acc.password}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${acc.badge}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-4">
          IIT Madras BS · Hostel Management System
        </p>
      </div>
    </div>
  );
}

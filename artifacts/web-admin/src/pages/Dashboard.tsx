import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { StatCard, Card, Spinner, Badge } from "@/components/ui";
import {
  Users, Building2, ClipboardCheck, Activity, UserCheck,
  LogIn, Clock, AlertTriangle, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#10b981"];

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => apiFetch<any>("/reports/summary"),
    refetchInterval: 20000,
  });

  const { data: attStats } = useQuery({
    queryKey: ["att-stats"],
    queryFn: () => apiFetch<any>("/attendance/stats"),
    refetchInterval: 20000,
  });

  const { data: activeStaff } = useQuery({
    queryKey: ["active-staff"],
    queryFn: () => apiFetch<any[]>("/staff/active-list"),
    refetchInterval: 15000,
  });

  const { data: allStaff } = useQuery({
    queryKey: ["all-staff"],
    queryFn: () => apiFetch<any[]>("/staff/all"),
    refetchInterval: 30000,
  });

  const { data: hostels } = useQuery({
    queryKey: ["hostels"],
    queryFn: () => apiFetch<any[]>("/hostels"),
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["timelogs-today"],
    queryFn: () => apiFetch<any[]>("/timelogs/today"),
    refetchInterval: 20000,
  });

  const hostelsWithCount = hostels?.slice(0, 8) || [];
  const hostelBarData = hostelsWithCount.map((h: any) => ({
    name: h.name?.split(" ")[0] || h.id,
    students: h.studentCount || h.capacity || 0,
  }));

  const staffOnline = (activeStaff || []).length;
  const staffTotal = (allStaff || []).length;

  const pieData = [
    { name: "Checked In", value: attStats?.inCampus || 0 },
    { name: "Checked Out", value: attStats?.checkedOut || 0 },
    { name: "Pending", value: attStats?.pending || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={summary?.totalStudents ?? "—"}
          icon={Users}
          color="bg-purple-600"
          sub={`Across ${summary?.totalHostels ?? 0} hostels`}
        />
        <StatCard
          label="In Campus Today"
          value={attStats?.inCampus ?? "—"}
          icon={UserCheck}
          color="bg-green-600"
          sub={`Checked out: ${attStats?.checkedOut ?? 0}`}
        />
        <StatCard
          label="Staff Online"
          value={`${staffOnline}/${staffTotal}`}
          icon={Activity}
          color="bg-blue-600"
          sub="Active in last 10 min"
        />
        <StatCard
          label="Pending Check-in"
          value={attStats?.pending ?? "—"}
          icon={Clock}
          color="bg-yellow-600"
          sub="Not checked in today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Building2 size={15} className="text-purple-400" /> Students by Hostel
          </h2>
          {hostelBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hostelBarData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">Loading…</div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <ClipboardCheck size={15} className="text-green-400" /> Today's Attendance
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-400">{attStats?.inCampus ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">In Campus</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Activity size={15} className="text-blue-400" /> Active Staff ({staffOnline})
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(activeStaff || []).length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">No staff currently active</p>
            ) : (
              (activeStaff || []).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/6">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{s.name || s.email}</p>
                    <p className="text-xs text-slate-500 truncate">{s.remark || s.role}</p>
                  </div>
                  <Badge label={s.role} color="blue" />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <LogIn size={15} className="text-purple-400" /> Recent Activity
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(recentLogs || []).length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">No activity today</p>
            ) : (
              (recentLogs || []).slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/3 border border-white/6">
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity size={11} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{log.userName || log.userId}</p>
                    <p className="text-xs text-slate-500 truncate">{log.note || log.type}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 whitespace-nowrap">
                    {log.createdAt ? fmt(log.createdAt) : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {summary?.recentActivity && summary.recentActivity.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-green-400" /> System Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Announcements", value: summary?.totalAnnouncements },
              { label: "Lost Items", value: summary?.totalLostItems },
              { label: "Hostels", value: summary?.totalHostels },
              { label: "Staff Members", value: staffTotal },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-white/3 rounded-xl border border-white/6">
                <p className="text-xl font-bold text-white">{s.value ?? "—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

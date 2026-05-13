import React, { useState } from "react";
import { cn } from "./ui";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, ClipboardCheck, Building2, UserCog,
  FileText, Upload, Activity, BarChart3, PackageSearch,
  LogOut, Menu, X, ChevronRight, GraduationCap,
} from "lucide-react";

export type Page =
  | "dashboard" | "students" | "attendance" | "hostels"
  | "staff" | "lostitems" | "csv-import" | "activity-logs"
  | "reports" | "master-table" | "manage-admins";

const NAV: { id: Page; label: string; icon: React.ElementType; roles?: string[] }[] = [
  { id: "dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { id: "students",      label: "Students",        icon: Users },
  { id: "attendance",    label: "Attendance",      icon: ClipboardCheck },
  { id: "hostels",       label: "Hostels",         icon: Building2 },
  { id: "staff",         label: "Staff",           icon: UserCog },
  { id: "lostitems",     label: "Lost & Found",    icon: PackageSearch },
  { id: "master-table",  label: "Master Table",    icon: GraduationCap, roles: ["superadmin", "admin"] },
  { id: "csv-import",    label: "CSV Import",      icon: Upload, roles: ["superadmin"] },
  { id: "activity-logs", label: "Activity Logs",   icon: Activity },
  { id: "reports",       label: "Reports",         icon: BarChart3, roles: ["superadmin", "admin"] },
  { id: "manage-admins", label: "Manage Staff",    icon: FileText, roles: ["superadmin"] },
];

export default function Layout({
  page, setPage, children,
}: {
  page: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || "";
  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(role));

  function NavItem({ item }: { item: typeof NAV[0] }) {
    const active = page === item.id;
    return (
      <button
        onClick={() => { setPage(item.id); setMobileOpen(false); }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
          active
            ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent",
        )}
      >
        <item.icon size={18} className={active ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"} />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && active && <ChevronRight size={14} className="text-purple-500" />}
      </button>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full bg-[#0d0d10] border-r border-white/8",
      !mobile && (collapsed ? "w-16" : "w-60"),
      mobile && "w-72",
    )}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap size={16} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">CampusOps</p>
            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Admin Portal</p>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed((c) => !c)} className="ml-auto text-slate-500 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleNav.map((item) => <NavItem key={item.id} item={item} />)}
      </nav>

      <div className="p-3 border-t border-white/8 space-y-2">
        <div className={cn("flex items-center gap-3", collapsed && !mobile && "justify-center")}>
          <div className="w-8 h-8 bg-purple-600/30 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <span className="text-purple-400 text-xs font-bold">
              {(user?.name || "A")[0].toUpperCase()}
            </span>
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={15} />
            </button>
          )}
        </div>
        {(!collapsed || mobile) && (
          <p className="text-[9px] text-slate-700 text-center leading-tight">
            Made with ♥ by <span className="text-slate-500">Kartik Chilkoti</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f11]">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="relative flex-shrink-0"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0d0d10] md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-white">CampusOps Admin</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, downloadFile } from "@/lib/api";
import { PageHeader, Card, Table, Input, Select, Button, Badge, EmptyState, Spinner } from "@/components/ui";
import { Activity, Download, Search, RefreshCw, LogIn, LogOut, CheckSquare } from "lucide-react";

const TYPE_MAP: Record<string, [string, "purple" | "green" | "blue" | "yellow" | "gray" | "red"]> = {
  login: ["Login", "green"],
  logout: ["Logout", "gray"],
  active: ["Active", "blue"],
  inactive: ["Inactive", "gray"],
  checkin: ["Check-in", "purple"],
  checkout: ["Check-out", "blue"],
  "revoke-checkin": ["Revoke Check-in", "red"],
  "revoke-checkout": ["Revoke Check-out", "red"],
  "revoke-submit": ["Revoke Inventory", "red"],
  inventory: ["Inventory", "blue"],
  "mess-card": ["Mess Card", "yellow"],
  entry: ["Entry", "yellow"],
  assignment: ["Assignment", "purple"],
  custom: ["Custom", "gray"],
};

function formatNote(note: string | null | undefined, type: string): string {
  if (!note) return "—";
  try {
    const obj = JSON.parse(note);
    if (typeof obj !== "object" || obj === null) return note;
    if (type === "assignment") {
      const parts: string[] = [];
      const fromRole = obj.from?.role;
      const toRole = obj.to?.role;
      if (fromRole && toRole && fromRole !== toRole) {
        parts.push(`Role: ${fromRole} → ${toRole}`);
      }
      const fromHostel = obj.from?.hostelId;
      const toHostel = obj.to?.hostelId;
      if (fromHostel !== toHostel) {
        parts.push(`Hostel: ${fromHostel || "none"} → ${toHostel || "none"}`);
      }
      const fromHostels: string[] = obj.from?.assignedHostelIds || [];
      const toHostels: string[] = obj.to?.assignedHostelIds || [];
      if (JSON.stringify(fromHostels) !== JSON.stringify(toHostels)) {
        const fStr = fromHostels.length ? fromHostels.join(", ") : "none";
        const tStr = toHostels.length ? toHostels.join(", ") : "none";
        parts.push(`Hostels: ${fStr} → ${tStr}`);
      }
      if (obj.to?.area) parts.push(`Area: ${obj.to.area}`);
      return parts.length > 0 ? parts.join("  ·  ") : "Staff assignment updated";
    }
    return JSON.stringify(obj);
  } catch {
    return note;
  }
}

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [limit, setLimit] = useState(100);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["staff-logs", limit, typeFilter],
    queryFn: () => apiFetch<any[]>(`/staff/logs?limit=${limit}${typeFilter ? `&type=${typeFilter}` : ""}`),
    refetchInterval: 20000,
  });

  const filtered = logs.filter((l: any) => {
    const q = search.toLowerCase();
    return !q || l.userName?.toLowerCase().includes(q) || l.note?.toLowerCase().includes(q) || l.userId?.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Activity Logs"
        subtitle="Real-time staff activity and check-in logs"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadFile("/export/timelogs", "activity-logs.csv")}>
              <Download size={14} /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadFile("/pdf/activity-logs", "activity-logs.pdf")}>
              <Download size={14} /> PDF
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-white/8 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={setSearch} placeholder="Search by name or note…" className="pl-9" />
          </div>
          <Select value={typeFilter} onChange={setTypeFilter} className="min-w-36">
            <option value="">All Types</option>
            {Object.keys(TYPE_MAP).map((k) => <option key={k} value={k}>{TYPE_MAP[k][0]}</option>)}
          </Select>
          <Select value={String(limit)} onChange={(v) => setLimit(Number(v))} className="min-w-28">
            <option value="50">50 records</option>
            <option value="100">100 records</option>
            <option value="250">250 records</option>
            <option value="500">500 records</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-500">Live · {filtered.length} records</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size={24} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Activity} title="No activity logs" sub="Activity will appear here in real-time" />
        ) : (
          <Table headers={["Staff Member", "Type", "Note", "Hostel", "Time"]}>
            {filtered.map((log: any) => {
              const [typeLabel, typeColor] = TYPE_MAP[log.type] || [log.type, "gray" as const];
              return (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-400 text-[10px] font-bold">
                          {(log.userName || log.userId || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{log.userName || log.userId || "—"}</p>
                        <p className="text-xs text-slate-600">{log.userEmail || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge label={typeLabel} color={typeColor} /></td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate" title={formatNote(log.note, log.type)}>{formatNote(log.note, log.type)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{log.hostelName || log.hostelId || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
                    }) : "—"}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}

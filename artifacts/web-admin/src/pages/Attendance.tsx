import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, downloadFile } from "@/lib/api";
import { PageHeader, Card, Table, Select, Button, Badge, Spinner, EmptyState } from "@/components/ui";
import { ClipboardCheck, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, subDays } from "date-fns";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, hour: "2-digit", minute: "2-digit" });
}

export default function Attendance() {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [hostelFilter, setHostelFilter] = useState("");

  const { data: hostels = [] } = useQuery({ queryKey: ["hostels"], queryFn: () => apiFetch<any[]>("/hostels") });
  const { data: checkins = [], isLoading, refetch } = useQuery({
    queryKey: ["checkins", date, hostelFilter],
    queryFn: () => apiFetch<any[]>(`/checkins?date=${date}${hostelFilter ? `&hostelId=${hostelFilter}` : ""}&limit=500`),
    refetchInterval: 15000,
  });
  const { data: stats } = useQuery({
    queryKey: ["att-stats", date],
    queryFn: () => apiFetch<any>(`/attendance/stats`),
    refetchInterval: 15000,
  });

  const checkoutMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/checkins/${id}/checkout`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checkins"] }); refetch(); },
  });
  const revokeCheckoutMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/checkins/${id}/revoke-checkout`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checkins"] }); refetch(); },
  });
  const revokeCheckinMut = useMutation({
    mutationFn: (studentId: string) => apiFetch(`/checkins/${studentId}/today`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checkins"] }); refetch(); },
  });

  const inCampus = checkins.filter((c: any) => !c.checkOutTime).length;
  const checkedOut = checkins.filter((c: any) => !!c.checkOutTime).length;

  return (
    <div className="fade-in">
      <PageHeader
        title="Attendance"
        subtitle="Check-in/out tracking for all students"
        action={
          <Button variant="secondary" size="sm" onClick={() => downloadFile(`/export/attendance.csv?date=${date}`, `attendance-${date}.csv`)}>
            <Download size={14} /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "In Campus", value: inCampus, icon: CheckCircle, color: "text-green-400 bg-green-500/15" },
          { label: "Checked Out", value: checkedOut, icon: XCircle, color: "text-blue-400 bg-blue-500/15" },
          { label: "Total Today", value: checkins.length, icon: ClipboardCheck, color: "text-purple-400 bg-purple-500/15" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-white/8 flex flex-wrap gap-3 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500/60 transition-all"
          />
          <Select value={hostelFilter} onChange={setHostelFilter} className="min-w-40">
            <option value="">All Hostels</option>
            {hostels.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </Button>
          <span className="text-xs text-slate-500 ml-auto">{checkins.length} records</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size={24} /></div>
        ) : checkins.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No check-ins found" sub="No attendance records for this date/hostel" />
        ) : (
          <Table headers={["Student", "Roll", "Room", "Hostel", "Check In", "Check Out", "Status", "Actions"]}>
            {checkins.map((c: any) => {
              const checkedOutNow = !!c.checkOutTime;
              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{c.studentName || "—"}</p>
                      <p className="text-xs text-slate-500">{c.studentEmail || c.studentId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.studentRoll || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.studentRoom || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {hostels.find((h: any) => h.id === c.hostelId)?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-green-400">{fmt(c.checkInTime)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${checkedOutNow ? "text-blue-400" : "text-slate-600"}`}>
                      {fmt(c.checkOutTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={checkedOutNow ? "Checked Out" : "In Campus"}
                      color={checkedOutNow ? "blue" : "green"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {!checkedOutNow ? (
                        <button
                          onClick={() => checkoutMut.mutate(c.id)}
                          disabled={checkoutMut.isPending}
                          className="text-xs px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/25 rounded-lg transition-all disabled:opacity-50"
                        >
                          Check Out
                        </button>
                      ) : (
                        <button
                          onClick={() => revokeCheckoutMut.mutate(c.id)}
                          disabled={revokeCheckoutMut.isPending}
                          className="text-xs px-2.5 py-1 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/25 rounded-lg transition-all disabled:opacity-50"
                        >
                          Undo Out
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm("Revoke this student's check-in?")) revokeCheckinMut.mutate(c.studentId); }}
                        disabled={revokeCheckinMut.isPending}
                        className="text-xs px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </div>
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

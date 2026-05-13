import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, downloadFile } from "@/lib/api";
import { PageHeader, Card, Table, Input, Select, Button, RoleBadge, Modal, EmptyState, Badge } from "@/components/ui";
import { Users, Download, Search, Eye, Building2 } from "lucide-react";

export default function Students() {
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const [messFilter, setMessFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiFetch<{ students: any[]; total: number }>("/students?limit=5000"),
  });
  const students: any[] = studentsData?.students ?? [];

  const { data: hostels = [] } = useQuery({
    queryKey: ["hostels"],
    queryFn: () => apiFetch<any[]>("/hostels"),
  });

  const messList = [...new Set(students.map((s: any) => s.assignedMess).filter(Boolean))];

  const filtered = students.filter((s: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.roomNumber?.toLowerCase().includes(q);
    const matchHostel = !hostelFilter || s.hostelId === hostelFilter;
    const matchMess = !messFilter || s.assignedMess === messFilter;
    return matchSearch && matchHostel && matchMess;
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Students"
        subtitle={`${filtered.length} of ${students.length} students`}
        action={
          <Button variant="secondary" size="sm" onClick={() => downloadFile("/export/students.csv", "students.csv")}>
            <Download size={14} /> Export CSV
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-white/8 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={setSearch} placeholder="Search name, roll, room…" className="pl-9" />
          </div>
          <Select value={hostelFilter} onChange={setHostelFilter} className="min-w-36">
            <option value="">All Hostels</option>
            {hostels.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
          <Select value={messFilter} onChange={setMessFilter} className="min-w-32">
            <option value="">All Mess</option>
            {messList.map((m: any) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>

        <Table
          headers={["Student", "Roll No", "Room", "Hostel", "Mess", "Status", ""]}
          loading={isLoading}
          empty={filtered.length === 0 ? "No students found" : undefined}
        >
          {filtered.map((s: any) => (
            <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 text-xs font-bold">{(s.name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">{s.rollNumber || "—"}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{s.roomNumber || "—"}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{s.hostelName || hostels.find((h: any) => h.id === s.hostelId)?.name || "—"}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{s.assignedMess || "—"}</td>
              <td className="px-4 py-3">
                <Badge
                  label={s.attendanceStatus === "entered" ? "In Campus" : s.attendanceStatus === "exited" ? "Checked Out" : "Away"}
                  color={s.attendanceStatus === "entered" ? "green" : s.attendanceStatus === "exited" ? "blue" : "gray"}
                />
              </td>
              <td className="px-4 py-3">
                <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                  <Eye size={13} />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Student Profile" width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-purple-400 text-xl font-bold">{(selected.name || "?")[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{selected.name}</p>
                <p className="text-sm text-slate-400">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Roll Number", selected.rollNumber],
                ["Room", selected.roomNumber],
                ["Hostel", hostels.find((h: any) => h.id === selected.hostelId)?.name || selected.hostelId],
                ["Mess", selected.assignedMess],
                ["Phone", selected.phone || selected.contactNumber],
                ["Area", selected.area],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-white/3 rounded-xl p-3 border border-white/6">
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-200">{value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/3 rounded-xl p-3 border border-white/6 flex items-center justify-between">
              <p className="text-sm text-slate-400">Attendance Status</p>
              <Badge
                label={selected.attendanceStatus === "entered" ? "In Campus" : selected.attendanceStatus === "exited" ? "Checked Out" : "Away"}
                color={selected.attendanceStatus === "entered" ? "green" : selected.attendanceStatus === "exited" ? "blue" : "gray"}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

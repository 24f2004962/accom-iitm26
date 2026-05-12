import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, Card, Table, Input, Button, RoleBadge, Badge, Modal, Select, Spinner, EmptyState } from "@/components/ui";
import { UserCog, Plus, Search, Trash2, CheckCircle, XCircle, RefreshCw, Activity } from "lucide-react";

export default function Staff() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "123456", role: "volunteer", contactNumber: "" });
  const [createError, setCreateError] = useState("");

  const { data: staff = [], isLoading, refetch } = useQuery({
    queryKey: ["all-staff"],
    queryFn: () => apiFetch<any[]>("/staff/all"),
    refetchInterval: 15000,
  });

  const { data: activeList = [] } = useQuery({
    queryKey: ["active-staff"],
    queryFn: () => apiFetch<any[]>("/staff/active-list"),
    refetchInterval: 10000,
  });

  const activeIds = new Set((activeList as any[]).map((s: any) => s.id));

  const createMut = useMutation({
    mutationFn: (data: any) => apiFetch("/import/staff", {
      method: "POST",
      body: JSON.stringify({ rows: [{ Email: data.email, Name: data.name, Role: data.role, "Contact Number": data.contactNumber }] }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-staff"] }); setShowCreate(false); setCreateError(""); },
    onError: (e: any) => setCreateError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/students/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-staff"] }),
  });

  const filtered = staff.filter((s: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const onlineCount = filtered.filter((s: any) => activeIds.has(s.id)).length;

  return (
    <div className="fade-in">
      <PageHeader
        title="Staff"
        subtitle={`${onlineCount} online of ${filtered.length} staff`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Add Staff
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-white/8 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={setSearch} placeholder="Search by name or email…" className="pl-9" />
          </div>
          <Select value={roleFilter} onChange={setRoleFilter} className="min-w-36">
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="coordinator">Coordinator</option>
            <option value="volunteer">Volunteer</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        <Table
          headers={["Staff Member", "Role", "Status", "Hostel", "Last Active", "Actions"]}
          loading={isLoading}
          empty={filtered.length === 0 ? "No staff found" : undefined}
        >
          {filtered.map((s: any) => {
            const isOnline = activeIds.has(s.id);
            return (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-blue-400 text-xs font-bold">{(s.name || "?")[0].toUpperCase()}</span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#161620] ${isOnline ? "bg-green-400" : "bg-slate-600"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {isOnline
                      ? <><CheckCircle size={13} className="text-green-400" /><span className="text-xs text-green-400 font-medium">Online</span></>
                      : <><XCircle size={13} className="text-slate-600" /><span className="text-xs text-slate-600">Offline</span></>
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">{s.hostelName || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => confirm(`Remove ${s.name}?`) && deleteMut.mutate(s.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateError(""); }} title="Add Staff Member">
        <div className="space-y-3">
          {[
            { label: "Full Name", key: "name", placeholder: "Dr. Sharma" },
            { label: "Email", key: "email", placeholder: "sharma@iitm.ac.in" },
            { label: "Contact Number", key: "contactNumber", placeholder: "+91 98765 43210" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{label}</label>
              <Input
                value={(createForm as any)[key]}
                onChange={(v) => setCreateForm((f) => ({ ...f, [key]: v }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Role</label>
            <Select value={createForm.role} onChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}>
              <option value="volunteer">Volunteer</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </Select>
          </div>
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMut.isPending} onClick={() => createMut.mutate(createForm)}>
              Add Staff Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

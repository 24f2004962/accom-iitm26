import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, Card, Table, Button, RoleBadge, Badge, Modal, Input, Select, EmptyState, Spinner } from "@/components/ui";
import { FileText, Plus, Trash2, Check, X, RefreshCw, AlertCircle } from "lucide-react";

export default function ManageAdmins() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer", contactNumber: "", gender: "" });
  const [formError, setFormError] = useState("");

  const { data: pending = [], isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => apiFetch<any[]>("/approvals/pending"),
    refetchInterval: 30000,
  });

  const { data: staff = [], isLoading: loadingStaff, refetch: refetchStaff } = useQuery({
    queryKey: ["all-staff-manage"],
    queryFn: () => apiFetch<any[]>("/staff/all"),
    refetchInterval: 30000,
  });

  const createMut = useMutation({
    mutationFn: () => {
      if (!form.name.trim() || form.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
      if (!form.email.trim()) throw new Error("Email is required");
      if (form.password && form.password.length < 6) throw new Error("Password must be at least 6 characters");
      return apiFetch("/import/staff", {
        method: "POST",
        body: JSON.stringify({
          rows: [{
            Email: form.email.trim().toLowerCase(),
            Name: form.name.trim(),
            Role: form.role,
            "Contact Number": form.contactNumber,
            Gender: form.gender || "Other",
            Password: form.password.trim() || "123456",
          }],
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-staff-manage"] });
      setShowCreate(false);
      setFormError("");
      setForm({ name: "", email: "", password: "", role: "volunteer", contactNumber: "", gender: "" });
    },
    onError: (e: any) => setFormError(e.message),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch(`/approvals/${id}/approve`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => { refetchPending(); refetchStaff(); },
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/approvals/${id}/reject`, { method: "DELETE" }),
    onSuccess: () => refetchPending(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/students/${id}`, { method: "DELETE" }),
    onSuccess: () => refetchStaff(),
  });

  const [approveRoles, setApproveRoles] = useState<Record<string, string>>({});

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Manage Staff"
        subtitle="Create, approve, and manage staff accounts"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setShowApprovals(true); refetchPending(); }}>
              Pending Approvals {(pending as any[]).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {(pending as any[]).length}
                </span>
              )}
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Add Staff
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300">All Staff Members</h2>
          <Button variant="ghost" size="sm" onClick={() => refetchStaff()}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
        <Table
          headers={["Name", "Email", "Role", "Hostel", "Joined", "Actions"]}
          loading={loadingStaff}
          empty={(staff as any[]).length === 0 ? "No staff members found" : undefined}
        >
          {(staff as any[]).map((s: any) => (
            <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">{(s.name || "?")[0].toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{s.email}</td>
              <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
              <td className="px-4 py-3 text-xs text-slate-400">{s.hostelName || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="danger" size="sm"
                  onClick={() => confirm(`Remove ${s.name}?`) && deleteMut.mutate(s.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(""); }} title="Add Staff Member">
        <div className="space-y-3">
          {[
            { label: "Full Name", key: "name", placeholder: "Dr. Rajesh Kumar" },
            { label: "Email", key: "email", placeholder: "rajesh@iitm.ac.in" },
            { label: "Contact Number", key: "contactNumber", placeholder: "+91 98765 43210" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{label}</label>
              <Input value={(form as any)[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              Password <span className="text-slate-600 font-normal">(leave blank to use default: 123456)</span>
            </label>
            <Input
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Role</label>
            <Select value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <option value="volunteer">Volunteer</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </Select>
          </div>
          {formError && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle size={12} />{formError}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMut.isPending} onClick={() => createMut.mutate()}>Create Account</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showApprovals} onClose={() => setShowApprovals(false)} title={`Pending Approvals (${(pending as any[]).length})`} width="max-w-2xl">
        {loadingPending ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : (pending as any[]).length === 0 ? (
          <EmptyState icon={Check} title="No pending approvals" sub="All registration requests have been reviewed" />
        ) : (
          <div className="space-y-3">
            {(pending as any[]).map((p: any) => (
              <div key={p.id} className="p-4 bg-white/3 rounded-xl border border-white/8 flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-400 text-sm font-bold">{(p.name || "?")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.email} · Roll: {p.rollNumber || "—"}</p>
                  <p className="text-xs text-slate-600">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : ""}</p>
                </div>
                <Select
                  value={approveRoles[p.id] || "volunteer"}
                  onChange={(v) => setApproveRoles((r) => ({ ...r, [p.id]: v }))}
                  className="min-w-32"
                >
                  <option value="student">Student</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </Select>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => approveMut.mutate({ id: p.id, role: approveRoles[p.id] || "volunteer" })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/25 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => rejectMut.mutate(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 rounded-lg text-xs font-semibold transition-all"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, Card, EmptyState, Spinner } from "@/components/ui";
import { Building2, Users } from "lucide-react";

export default function Hostels() {
  const { data: hostels = [], isLoading } = useQuery({
    queryKey: ["hostels-detail"],
    queryFn: () => apiFetch<any[]>("/hostels"),
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiFetch<any[]>("/students?limit=1000"),
  });

  const hostelCountMap: Record<string, number> = {};
  (students as any[]).forEach((s: any) => {
    if (s.hostelId) hostelCountMap[s.hostelId] = (hostelCountMap[s.hostelId] || 0) + 1;
  });

  return (
    <div className="fade-in">
      <PageHeader title="Hostels" subtitle={`${hostels.length} hostels on campus`} />
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={24} /></div>
      ) : hostels.length === 0 ? (
        <EmptyState icon={Building2} title="No hostels found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(hostels as any[]).map((h: any) => {
            const count = hostelCountMap[h.id] || 0;
            const pct = h.capacity ? Math.round((count / h.capacity) * 100) : 0;
            return (
              <Card key={h.id} className="p-5 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{h.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{h.description || "IIT Madras BS Hostel"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1"><Users size={11} /> Students</span>
                    <span className="text-slate-200 font-semibold">{count}{h.capacity ? ` / ${h.capacity}` : ""}</span>
                  </div>
                  {h.capacity && (
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                  {h.capacity && (
                    <p className="text-xs text-slate-600">{pct}% occupied</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

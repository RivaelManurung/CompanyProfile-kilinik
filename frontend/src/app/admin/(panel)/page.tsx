"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarClock, ClipboardCheck, FileText, ListChecks } from "lucide-react";
import { statsApi } from "@/lib/admin/api";
import type { StatsResponse } from "@/lib/admin/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";

function fmtDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function OpsCard({
  label,
  value,
  context,
  href,
  severity = "neutral",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  context: string;
  href: string;
  severity?: "neutral" | "warning" | "danger" | "success";
  icon: React.ElementType;
}) {
  const styles = {
    neutral: "border-border bg-background",
    warning: "border-amber-200 bg-amber-50/70",
    danger: "border-red-200 bg-red-50/70",
    success: "border-emerald-200 bg-emerald-50/70",
  };

  return (
    <Link href={href} className="block">
      <Card className={`h-full p-5 transition-colors hover:border-primary/50 ${styles[severity]}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-normal text-foreground">{value}</p>
          </div>
          <span className="rounded-md border border-border bg-background p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{context}</p>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    statsApi.get().then(setStats).catch(() => setError(true));
  }, []);

  const chartData = useMemo(() => {
    const map = new Map((stats?.series ?? []).map((s) => [s.day, s.count]));
    const out: { day: string; label: string; count: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key, label: fmtDay(key), count: map.get(key) ?? 0 });
    }
    return out;
  }, [stats]);

  if (error) {
    return (
      <Card className="p-6">
        <p className="font-semibold text-destructive">Gagal memuat dashboard.</p>
        <p className="mt-2 text-sm text-muted-foreground">Pastikan backend API berjalan dan sesi admin masih valid.</p>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const topService = stats.busiestServices[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Clinic operations</p>
        <h2 className="text-2xl font-bold tracking-normal text-foreground">Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <OpsCard
          label="Perlu Konfirmasi"
          value={stats.totals.pending}
          context="Queue yang harus diproses receptionist."
          href="/admin/appointments?status=pending"
          severity={stats.totals.pending > 0 ? "warning" : "success"}
          icon={ClipboardCheck}
        />
        <OpsCard
          label="Jadwal Hari Ini"
          value={stats.totals.todayAppointments}
          context="Permintaan baru yang masuk hari ini."
          href="/admin/appointments?sort=created_at&direction=desc"
          icon={CalendarClock}
        />
        <OpsCard
          label="Follow-up Terlambat"
          value={stats.totals.overdueFollowUp}
          context="Pending lebih dari 24 jam."
          href="/admin/appointments?status=pending"
          severity={stats.totals.overdueFollowUp > 0 ? "danger" : "success"}
          icon={AlertTriangle}
        />
        <OpsCard
          label="Layanan Paling Diminta"
          value={topService?.service ?? "-"}
          context={topService ? `${topService.count} permintaan terakhir.` : "Belum ada data layanan."}
          href="/admin/appointments"
          icon={ListChecks}
        />
        <OpsCard
          label="Artikel Draft"
          value={stats.totals.draftArticles}
          context="Konten edukasi yang belum terbit."
          href="/admin/articles?status=draft"
          severity={stats.totals.draftArticles > 0 ? "warning" : "neutral"}
          icon={FileText}
        />
        <OpsCard
          label="Total Janji"
          value={stats.totals.appointments}
          context="Semua permintaan konsultasi tercatat."
          href="/admin/appointments"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-5">
            <h3 className="font-semibold text-foreground">Janji temu masuk</h3>
            <p className="text-sm text-muted-foreground">14 hari terakhir, untuk memantau beban admin.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" width={32} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
                  labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
                  formatter={(v) => [`${v} janji`, "Jumlah"] as [string, string]}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground">Status janji temu</h3>
          <div className="mt-5 space-y-4">
            {["pending", "confirmed", "done", "cancelled"].map((status) => {
              const found = stats.byStatus.find((s) => s.status === status);
              const count = found?.count ?? 0;
              const pct = stats.totals.appointments ? Math.round((count / stats.totals.appointments) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <StatusBadge status={status as StatsResponse["byStatus"][number]["status"]} />
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Janji temu terbaru</h3>
            <Link href="/admin/appointments" className="text-sm font-medium text-primary hover:underline">
              Lihat queue
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats.recent.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{appointment.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{appointment.service || "Belum dipilih"} · {appointment.phone}</p>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <StatusBadge status={appointment.status} />
                  <span className="hidden text-xs text-muted-foreground sm:block">{fmtDateTime(appointment.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Aktivitas terbaru</h3>
            <Link href="/admin/audit-logs" className="text-sm font-medium text-primary hover:underline">
              Audit log
            </Link>
          </div>
          {stats.recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas admin.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentActivity.map((item) => (
                <div key={item.id} className="py-3">
                  <p className="text-sm font-medium text-foreground">{item.action} · {item.resource}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.adminEmail || "system"} · {fmtDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

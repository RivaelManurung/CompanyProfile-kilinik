"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock, FileText,
  Megaphone, PenSquare, Users,
} from "lucide-react";
import { statsApi } from "@/lib/admin/api";
import type { StatsResponse } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/admin/page-header";
import { SummaryCard } from "@/components/admin/summary-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { LoadingSkeleton } from "@/components/admin/loading-state";
import { ActivityTimeline } from "@/components/admin/activity-timeline";

function fmtDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = () => {
    setError(false);
    statsApi.get().then(setStats).catch(() => setError(true));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); }, []);

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

  const confirmedCount = stats?.byStatus.find((s) => s.status === "confirmed")?.count ?? 0;
  const doneCount = stats?.byStatus.find((s) => s.status === "done")?.count ?? 0;

  const timelineItems = useMemo(() => {
    return (stats?.recentActivity ?? []).map((item) => ({
      id: item.id,
      title: item.action,
      description: `${item.resource} · ${item.adminEmail || "system"}`,
      timestamp: fmtDateTime(item.createdAt),
    }));
  }, [stats]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Dashboard"
          title="Clinic Overview"
          description="Monitor today's appointments, queue status, doctor availability, active services, and content operations."
        />
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Gagal memuat dashboard</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Pastikan backend API berjalan dan sesi admin masih valid.
            </p>
            <Button onClick={fetchStats} className="mt-4">
              Muat Ulang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <LoadingSkeleton className="h-3 w-32" />
          <LoadingSkeleton className="h-8 w-56" />
          <LoadingSkeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Clinic Overview"
        description="Monitor today's appointments, queue status, doctor availability, active services, and content operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Janji Temu Hari Ini"
          value={stats.totals.todayAppointments}
          context="Permintaan masuk hari ini"
          href="/admin/appointments"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5" />}
          label="Antrean Menunggu"
          value={stats.totals.pending}
          context="Queue yang harus diproses"
          href="/admin/appointments?status=pending"
          variant={stats.totals.pending > 0 ? "warning" : "success"}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Dikonfirmasi"
          value={confirmedCount}
          context="Janji temu terkonfirmasi"
          variant="info"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Selesai Hari Ini"
          value={doneCount}
          context="Konsultasi terselesaikan"
          variant="success"
        />
        <SummaryCard
          icon={<Users className="h-5 w-5" />}
          label="Dokter Aktif"
          value={stats.totals.doctors}
          context="Tenaga medis tersedia"
        />
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          label="Artikel Draft"
          value={stats.totals.draftArticles}
          context="Konten edukasi belum terbit"
          href="/admin/articles?status=draft"
          variant={stats.totals.draftArticles > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Operational Queue Snapshot</CardTitle>
            <CardDescription>Lima janji temu terbaru</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/appointments">
                  View All
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada janji temu.</p>
              ) : (
                stats.recent.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {appointment.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{appointment.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{appointment.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <StatusBadge status={appointment.status} />
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {fmtDateTime(appointment.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Pintasan tugas yang sering dipakai</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {[
              { href: "/admin/appointments/new", icon: CalendarClock, label: "Buat Janji Temu" },
              { href: "/admin/doctors/new", icon: Users, label: "Tambah Dokter" },
              { href: "/admin/promotions/new", icon: Megaphone, label: "Buat Promosi" },
              { href: "/admin/articles/new", icon: PenSquare, label: "Tulis Artikel" },
            ].map(({ href, icon: Icon, label }) => (
              <Button key={href} asChild variant="outline" className="h-auto justify-start py-3 font-medium">
                <Link href={href}>
                  <Icon className="text-primary" />
                  {label}
                  <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Trends</CardTitle>
            <CardDescription>14 hari terakhir &mdash; volume janji temu masuk</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                  width={32}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
                  labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
                  formatter={(v) => [`${v} janji`, "Jumlah"] as [string, string]}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Proporsi janji temu per status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["pending", "confirmed", "done", "cancelled"] as const).map((status) => {
              const found = stats.byStatus.find((s) => s.status === status);
              const count = found?.count ?? 0;
              const pct = stats.totals.appointments
                ? Math.round((count / stats.totals.appointments) * 100)
                : 0;
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <StatusBadge status={status} />
                    <span className="font-medium tabular-nums text-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Log aktivitas admin terkini</CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/audit-logs">
                Audit Log
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={timelineItems} />
        </CardContent>
      </Card>
    </div>
  );
}

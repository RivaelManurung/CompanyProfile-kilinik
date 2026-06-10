import { Card } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-muted-foreground">System</p>
      <h2 className="mt-1 text-2xl font-bold tracking-normal text-foreground">Admin Users</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        Manajemen user admin belum diaktifkan pada kontrak backend saat ini. Role dan permission sudah ditegakkan di API, sehingga halaman ini siap disambungkan ke endpoint user management berikutnya.
      </p>
    </Card>
  );
}

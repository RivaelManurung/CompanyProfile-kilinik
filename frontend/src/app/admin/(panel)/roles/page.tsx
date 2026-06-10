import { Card } from "@/components/ui/card";

export default function RolesPage() {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-muted-foreground">System</p>
      <h2 className="mt-1 text-2xl font-bold tracking-normal text-foreground">Roles & Permissions</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        Permission model backend sudah tersedia untuk super_admin, clinic_admin, receptionist, content_editor, dan viewer. UI pengelolaan role dapat ditambahkan setelah endpoint administrasi user tersedia.
      </p>
    </Card>
  );
}

import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

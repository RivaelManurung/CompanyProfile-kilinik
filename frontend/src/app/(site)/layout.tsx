import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { PatientAuthProvider } from "@/components/patient/PatientAuthProvider";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PatientAuthProvider>
      <div className="flex min-h-screen flex-col">
        <ScrollProgress />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingActions />
      </div>
    </PatientAuthProvider>
  );
}

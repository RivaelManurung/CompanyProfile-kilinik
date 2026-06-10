import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { Home, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/70 to-white" />
      <div className="bg-dots absolute inset-0 -z-10 opacity-40" />
      <Container className="text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-glow">
          <Stethoscope className="h-8 w-8" />
        </span>
        <p className="mt-8 font-display text-7xl font-extrabold text-gradient sm:text-8xl">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/" size="lg">
            <Home className="h-5 w-5" /> Kembali ke Beranda
          </Button>
        </div>
      </Container>
    </section>
  );
}

import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { site } from "@/lib/site";

export function CTA() {
  return (
    <section className="py-20 lg:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-dark px-7 py-14 shadow-card sm:px-14 sm:py-16 lg:px-16">
            {/* restrained texture — a hairline grid, no floating blobs */}
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_top_left,#000,transparent_70%)]" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm font-semibold tracking-wide text-primary-300">
                  Siap membantu Anda
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  Kesehatan Anda tidak perlu menunggu.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
                  Jadwalkan konsultasi hari ini. Tim kami siap mendampingi Anda
                  mendapatkan perawatan terbaik, kapan pun dibutuhkan.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <Button href="/buat-janji" variant="white" size="lg" className="w-full justify-between sm:w-auto">
                  Buat Janji Sekarang
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`}
                  external
                  size="lg"
                  className="w-full justify-between bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20 sm:w-auto"
                >
                  Chat WhatsApp
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <a
                  href={`tel:${site.phone}`}
                  className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                  {site.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

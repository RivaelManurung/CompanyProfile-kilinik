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
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 px-7 py-14 text-center shadow-lift sm:px-16 sm:py-20">
            <div className="bg-dots absolute inset-0 opacity-20" />
            <div className="animate-blob absolute -left-10 -top-10 h-56 w-56 bg-white/10 blur-2xl" />
            <div className="animate-blob absolute -bottom-10 -right-10 h-64 w-64 bg-accent-300/20 blur-2xl [animation-delay:-5s]" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                Kesehatan Anda tidak bisa menunggu
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100/90">
                Jadwalkan konsultasi hari ini. Tim kami siap membantu Anda mendapatkan perawatan
                terbaik, kapan pun Anda membutuhkannya.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button href="/kontak" variant="white" size="lg">
                  Buat Janji Sekarang
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`}
                  external
                  size="lg"
                  className="bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat WhatsApp
                </Button>
              </div>
              <a
                href={`tel:${site.phone}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-100 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                Atau telepon {site.phoneDisplay}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

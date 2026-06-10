"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Star, ShieldCheck, Clock, HeartPulse, Stethoscope } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { slides } from "@/lib/data";
import { site } from "@/lib/site";

const AUTOPLAY = 6000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY);
    return () => clearInterval(t);
  }, [paused, index]);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* Background decor */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/70 via-white to-white" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]" />
      <div className="animate-blob absolute -left-24 top-20 -z-10 h-72 w-72 bg-primary-200/40 blur-3xl" />
      <div className="animate-blob absolute -right-16 top-40 -z-10 h-80 w-80 bg-accent-200/40 blur-3xl [animation-delay:-4s]" />

      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-soft ring-1 ring-ink-100"
          >
            <span className="flex -space-x-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-5 w-5 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 ring-2 ring-white" />
              ))}
            </span>
            Dipercaya 120.000+ pasien
            <span className="flex items-center gap-0.5 text-warning">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-semibold text-ink-800">4.9</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-4xl font-extrabold leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl"
          >
            Perawatan kesehatan{" "}
            <span className="text-gradient">berstandar global</span>{" "}
            untuk keluarga Indonesia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500"
          >
            Dari konsultasi, vaksinasi, hingga medical check-up — semua dalam satu klinik
            dengan dokter berpengalaman dan teknologi terkini.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button href="/kontak" size="lg">
              Buat Janji Sekarang
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="/layanan" variant="outline" size="lg">
              Lihat Layanan
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-4"
          >
            {[
              { icon: ShieldCheck, label: "Layanan cashless asuransi" },
              { icon: Clock, label: "Buka 7 hari seminggu" },
              { icon: HeartPulse, label: "Dokter & spesialis lengkap" },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-ink-600">
                <I className="h-5 w-5 text-primary-500" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: promo card carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Floating stat cards */}
          <motion.div
            className="animate-float absolute -left-4 top-8 z-20 hidden rounded-2xl bg-white p-3.5 shadow-lift ring-1 ring-ink-100 sm:flex sm:items-center sm:gap-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-bold text-ink-900">45+ Dokter</p>
              <p className="text-xs text-ink-500">Umum & spesialis</p>
            </div>
          </motion.div>

          <motion.div
            className="animate-float absolute -right-4 bottom-10 z-20 hidden rounded-2xl bg-white p-3.5 shadow-lift ring-1 ring-ink-100 sm:flex sm:items-center sm:gap-3 [animation-delay:-3s]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-bold text-ink-900">98% Puas</p>
              <p className="text-xs text-ink-500">Kepuasan pasien</p>
            </div>
          </motion.div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-1 shadow-lift sm:aspect-[5/5]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.85rem] bg-dark">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {/* Real photo background (painted first = behind) */}
                  <Image
                    src={slide.image}
                    alt={slide.eyebrow}
                    fill
                    priority={slide.id === slides[0].id}
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className="object-cover"
                  />
                  {/* Readability overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/85 to-dark/45" />
                  <div className="bg-dots absolute inset-0 opacity-20" />

                  {/* Content (above the image + overlays) */}
                  <div className="relative z-10 flex h-full flex-col justify-between p-7 sm:p-9">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
                        {slide.badge}
                      </span>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-white/15 backdrop-blur-sm">
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-accent-300">
                        {slide.eyebrow}
                      </p>
                      <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                        {slide.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-primary-100/90">
                        {slide.subtitle}
                      </p>
                      <Button href={slide.href} variant="white" size="sm" className="mt-6">
                        {slide.cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className="group relative h-2 rounded-full transition-all"
                style={{ width: i === index ? 32 : 8 }}
              >
                <span
                  className={`block h-full w-full rounded-full transition-colors ${
                    i === index ? "bg-primary-600" : "bg-ink-200 group-hover:bg-ink-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

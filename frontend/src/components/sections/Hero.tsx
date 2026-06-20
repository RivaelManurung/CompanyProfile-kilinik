"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShieldCheck, Clock, Stethoscope, Award } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Background decorations - subtle, warm and clinical, no floating blobs */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/40 via-white to-white" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_70%)]" />

      <Container className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        
        {/* Left Column: Premium Healthcare Visual Block */}
        <div className="relative order-2 lg:order-1 lg:pr-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[420px] lg:max-w-none"
          >
            {/* Main Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-ink-200/40 bg-white p-2 shadow-card sm:aspect-[1/1] lg:aspect-[4/5]">
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-ink-50">
                <Image
                  src="/hero/doctor-patient-consult.png"
                  alt="Dokter SehatNusantara berkonsultasi secara hangat dengan pasien"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-[center_25%] transition-transform duration-700 hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/20 via-transparent to-transparent" />
              </div>
            </div>

            {/* Floating Card 1: Accreditation Badge (Top Right) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
              className="absolute -top-4 -right-2 z-25 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lift border border-ink-100/80"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Award className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent-700">Akreditasi</p>
                <p className="text-xs font-bold text-ink-900 leading-tight">Paripurna Kemenkes</p>
              </div>
            </motion.div>

            {/* Floating Card 2: Doctors On Duty Panel (Bottom Left) */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.55, ease: "easeOut" }}
              className="absolute -bottom-5 -left-4 z-25 hidden sm:flex items-center gap-3.5 rounded-3xl bg-white p-4 shadow-lift border border-ink-100/80 max-w-[250px]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Stethoscope className="h-5.5 w-5.5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-ink-900 leading-tight">Dokter Siaga Hari Ini</p>
                <p className="mt-1 text-xs text-ink-500 leading-normal">8 dokter umum & spesialis siap melayani.</p>
              </div>
            </motion.div>

            {/* Floating Card 3: Experience/Patient count (Bottom Right) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.55, ease: "easeOut" }}
              className="absolute bottom-6 -right-4 z-25 hidden sm:flex items-center gap-3.5 rounded-2xl bg-dark px-4.5 py-3 shadow-lift text-white"
            >
              <div className="flex -space-x-1.5">
                {["AP", "YK", "SR"].map((init, i) => (
                  <span
                    key={i}
                    className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold border-2 border-dark"
                  >
                    {init}
                  </span>
                ))}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white leading-none">45+ Dokter</p>
                <p className="mt-1 text-[9px] text-primary-200/70 font-medium">Aktif & Berpengalaman</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column: Copy and CTA Actions */}
        <div className="order-1 lg:order-2 flex flex-col justify-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="self-start inline-flex items-center gap-2 rounded-full bg-primary-50/70 px-3.5 py-1.5 text-xs font-semibold text-primary-800 border border-primary-100/50"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
            Klinik Pratama Rawat Jalan
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-4xl font-extrabold leading-[1.1] text-ink-900 sm:text-5xl lg:text-5xl xl:text-[3.25rem] tracking-tight"
          >
            Perawatan kesehatan yang terasa dekat, aman, dan terarah.
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-500"
          >
            SehatNusantara membantu pasien mendapatkan layanan klinis yang jelas, nyaman, dan berstandar — dari konsultasi pertama hingga tindak lanjut perawatan.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              href="/buat-janji"
              size="lg"
              className="hover:-translate-y-0.5 hover:shadow-lift transition-all duration-300 ease-out"
            >
              Buat Janji Temu
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="#layanan" variant="outline" size="lg">
              Lihat Layanan
            </Button>
          </motion.div>

          {/* Trust strip details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="mt-10 pt-8 border-t border-ink-100 flex flex-col sm:flex-row sm:items-center gap-x-8 gap-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-600">
              <Clock className="h-4 w-4 text-primary-500 shrink-0" />
              <span>Buka Setiap Hari (08.00 - 20.00 WIB)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-600">
              <ShieldCheck className="h-4 w-4 text-primary-500 shrink-0" />
              <span>Menerima 30+ Mitra Asuransi</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
              <span className="flex items-center text-warning shrink-0">
                <Star className="h-3.5 w-3.5 fill-current" />
              </span>
              <span className="font-bold text-ink-900">4.9 / 5.0</span>
              <span className="text-ink-400 font-normal">dari 12K+ pasien</span>
            </div>
          </motion.div>
        </div>

      </Container>
    </section>
  );
}

import Image from "next/image";
import { CalendarCheck } from "lucide-react";
import type { Doctor } from "@/lib/data";
import { Button } from "./Button";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-2 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
        <Image
          src={doctor.image}
          alt={`Foto ${doctor.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
        {/* gradient + specialty chip */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950/70 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
          {doctor.experience}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-primary-600/90 px-3 py-1 text-xs font-semibold text-white shadow-soft backdrop-blur">
          {doctor.specialty}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-ink-900">{doctor.name}</h3>
        <p className="mt-1 text-sm font-medium text-primary-600">{doctor.specialty}</p>
        <Button href="/kontak" variant="outline" size="sm" className="mt-4 w-full">
          <CalendarCheck className="h-4 w-4" />
          Buat Janji
        </Button>
      </div>
    </div>
  );
}

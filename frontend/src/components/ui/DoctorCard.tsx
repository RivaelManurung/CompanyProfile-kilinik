import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface DoctorCardData {
  slug: string;
  name: string;
  specialty: string;
  experience: string;
  image: string;
  initials: string;
}

export function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <Link
      href="/buat-janji"
      className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-100">
        {doctor.image ? (
          <Image
            src={doctor.image}
            alt={`Foto ${doctor.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-50 font-display text-3xl font-bold text-primary-300">
            {doctor.initials}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/55 via-ink-950/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-primary-700 shadow-soft backdrop-blur">
          {doctor.experience}
        </span>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <h3 className="text-base font-bold leading-snug tracking-tight">
            {doctor.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-white/80">
            {doctor.specialty}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-semibold text-ink-700">Buat janji</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { locations } from "@/lib/data";
import { ClinicMap } from "./ClinicMap";

export function Locations() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Lokasi Kami"
          title="Empat lokasi strategis di Jakarta"
          description="Temukan klinik Sehat Nusantara terdekat di Jakarta Pusat dan Jakarta Selatan."
        />

        <Stagger className="mt-14 grid gap-5 md:grid-cols-2">
          {locations.map((loc) => (
            <StaggerItem key={loc.slug}>
              <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative h-40 overflow-hidden">
                  <ClinicMap
                    locations={[loc]}
                    zoom={15}
                    className="h-full w-full rounded-none border-none shadow-none"
                  />
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
                    <MapPin className="h-3.5 w-3.5" />
                    {loc.area}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-ink-900">{loc.name}</h3>
                  <ul className="mt-4 flex-1 space-y-3 text-sm text-ink-600">
                    <li className="flex gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                      {loc.address}
                    </li>
                    <li className="flex gap-3">
                      <Clock className="h-4 w-4 shrink-0 text-primary-500" />
                      {loc.hours}
                    </li>
                    <li className="flex gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-primary-500" />
                      {loc.phone}
                    </li>
                  </ul>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.position.lat},${loc.position.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    <Navigation className="h-4 w-4" />
                    Lihat di peta
                  </a>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

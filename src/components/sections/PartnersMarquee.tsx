import { Container } from "@/components/ui/Container";
import { partners } from "@/lib/data";

export function PartnersMarquee() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-ink-100 bg-surface-muted py-10">
      <Container>
        <p className="mb-7 text-center text-sm font-medium uppercase tracking-[0.16em] text-ink-400">
          Bekerja sama dengan mitra asuransi terpercaya
        </p>
      </Container>
      <div className="relative mask-fade-x overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-12 pr-12">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="whitespace-nowrap text-xl font-bold text-ink-300 transition-colors hover:text-primary-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

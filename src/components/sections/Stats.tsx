import { Container } from "@/components/ui/Container";
import { Counter } from "@/components/ui/Counter";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { stats } from "@/lib/data";

export function Stats() {
  return (
    <section className="relative overflow-hidden bg-dark py-20 lg:py-24">
      <div className="bg-dots absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

      <Container className="relative">
        <Stagger className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-white sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm font-medium text-primary-100/70 sm:text-base">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

import { Hero } from "@/components/sections/Hero";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";
import { Services } from "@/components/sections/Services";
import { Stats } from "@/components/sections/Stats";
import { WhyChoose } from "@/components/sections/WhyChoose";
import { Doctors } from "@/components/sections/Doctors";
import { Locations } from "@/components/sections/Locations";
import { Promotions } from "@/components/sections/Promotions";
import { Testimonials } from "@/components/sections/Testimonials";
import { Articles } from "@/components/sections/Articles";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <PartnersMarquee />
      <Services />
      <Stats />
      <WhyChoose />
      <Doctors />
      <Promotions />
      <Locations />
      <Testimonials />
      <Articles />
      <CTA />
    </>
  );
}

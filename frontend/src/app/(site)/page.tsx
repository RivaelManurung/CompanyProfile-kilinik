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
import {
  getServices,
  getDoctors,
  getLocations,
  getPromotions,
  getArticles,
} from "@/lib/public/api";

export default async function Home() {
  // Live content managed from the admin dashboard, fetched in parallel.
  const [services, doctors, locations, promotions, articles] = await Promise.all([
    getServices(),
    getDoctors(),
    getLocations(),
    getPromotions(),
    getArticles(),
  ]);

  return (
    <>
      <Hero />
      <PartnersMarquee />
      <Services services={services} />
      <Stats />
      <WhyChoose />
      <Doctors doctors={doctors} />
      <Promotions promotions={promotions} />
      <Locations locations={locations} />
      <Testimonials />
      <Articles articles={articles} />
      <CTA />
    </>
  );
}

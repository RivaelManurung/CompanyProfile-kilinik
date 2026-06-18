import { Hero } from "@/components/sections/Hero";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";
import { Services } from "@/components/sections/Services";
import { Stats } from "@/components/sections/Stats";
import { WhyChoose } from "@/components/sections/WhyChoose";
import { Doctors } from "@/components/sections/Doctors";
import { Locations } from "@/components/sections/Locations";
import { Testimonials } from "@/components/sections/Testimonials";
import { Articles } from "@/components/sections/Articles";
import { CTA } from "@/components/sections/CTA";
import {
  getServices,
  getDoctors,
  getLocations,
  getArticles,
} from "@/lib/public/api";
import { site } from "@/lib/site";

/** MedicalClinic structured data (JSON-LD) for Google rich results.
 *  https://schema.org/MedicalClinic */
const clinicJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: site.name,
  url: site.url,
  telephone: site.phone,
  email: site.email,
  description: site.description,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line1,
    addressLocality: "Jakarta Pusat",
    postalCode: "10350",
    addressCountry: "ID",
  },
  openingHours: "Mo-Sa 08:00-20:00",
  sameAs: [site.instagram],
};

export default async function Home() {
  // Live content managed from the admin dashboard, fetched in parallel.
  const [services, doctors, locations, articles] = await Promise.all([
    getServices(),
    getDoctors(),
    getLocations(),
    getArticles(),
  ]);

  return (
    <>
      {/* Structured data for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }}
      />
      <Hero />
      <PartnersMarquee />
      <Services services={services} />
      <Stats />
      <WhyChoose />
      <Doctors doctors={doctors} />
      <Locations locations={locations} />
      <Testimonials />
      <Articles articles={articles} />
      <CTA />
    </>
  );
}

import dynamic from "next/dynamic";
import SiteShell from "@/components/layout/SiteShell";

const Hero = dynamic(() => import("@/components/home/Hero"), { loading: () => <div className="h-screen bg-cream" /> });
const FeaturedProducts = dynamic(() => import("@/components/home/FeaturedProducts"), { loading: () => <div className="h-96 bg-cream" /> });
const WhyMagna = dynamic(() => import("@/components/home/WhyMagna"), { loading: () => <div className="h-96 bg-cream" /> });
const About = dynamic(() => import("@/components/home/About"), { loading: () => <div className="h-96 bg-cream" /> });
const Contact = dynamic(() => import("@/components/home/Contact"), { loading: () => <div className="h-96 bg-cream" /> });

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <FeaturedProducts />
      <WhyMagna />
      <About />
      <Contact />
    </SiteShell>
  );
}

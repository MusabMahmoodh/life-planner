import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { PersonasSection } from "@/components/PersonasSection";
import { PricingSection } from "@/components/PricingSection";
import { TestimonialSection } from "@/components/TestimonialSection";
import { TrustStats } from "@/components/TrustStats";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <StatsSection />
        <ProblemSection />
        <SolutionSection />
        <PersonasSection />
        <PricingSection />
        <TestimonialSection />
        <TrustStats />
        <CtaSection />
      </main>
      <Footer />
      {/* Mobile sticky CTA - appears after scrolling */}
      <StickyMobileCTA />
    </div>
  );
};

export default Index;

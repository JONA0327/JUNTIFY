import { ParallaxHero } from "@/components/parallax-hero"
import { PresentationSection } from "@/components/presentation-section"
import { ReimagineSection } from "@/components/reimagine-section"
import { IntegratedExperienceSection } from "@/components/integrated-experience-section"
import { TransformWorkSection } from "@/components/transform-work-section"
import { AIContextSection } from "@/components/ai-context-section"
import { PricingSection } from "@/components/pricing-section"

export default function Home() {
  return (
    
    <main className="bg-black">
      <ParallaxHero />
      <PresentationSection />
      <ReimagineSection />
      <IntegratedExperienceSection />
      <TransformWorkSection />
      <AIContextSection />
      <PricingSection />
    </main>
    
  )
}

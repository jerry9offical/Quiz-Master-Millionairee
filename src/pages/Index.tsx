import { LandingNav } from '@/components/landing/LandingNav';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { ArenaStatsStrip } from '@/components/landing/ArenaStatsStrip';
import { PlayablePreview } from '@/components/landing/PlayablePreview';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { TopThisWeek } from '@/components/landing/TopThisWeek';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { KnowledgeLadder } from '@/components/landing/KnowledgeLadder';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { StickyMobileCTA } from '@/components/landing/StickyMobileCTA';

export default function Index() {
  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      {/* Spotlight effects */}
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-gold w-64 h-64 top-40 right-20 opacity-20" />
      <div className="glow-orb glow-orb-purple w-80 h-80 bottom-20 left-1/4 opacity-25" />

      <LandingNav />
      <main>
        <HeroCarousel />
        <ArenaStatsStrip />
        <PlayablePreview />
        <SocialProofStrip />
        <TopThisWeek />
        <HowItWorks />
        <KnowledgeLadder />
        <FinalCTA />
      </main>
      <LandingFooter />
      <StickyMobileCTA />
    </div>
  );
}

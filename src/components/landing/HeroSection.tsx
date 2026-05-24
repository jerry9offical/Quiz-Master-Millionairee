import { Link } from 'react-router-dom';
import { CTAButton } from '@/components/CTAButton';
import { Trophy, ShieldCheck, Smartphone, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRUST_BULLETS = [
{ icon: Zap, text: 'No downloads' },
{ icon: Target, text: 'Free to play' },
{ icon: Smartphone, text: 'Skill-based — No gambling' },
{ icon: ShieldCheck, text: 'Compete globally' }];


export function HeroSection() {
  return (
    <section className="relative z-10 container mx-auto px-6 pt-12 pb-8 md:pt-20 md:pb-12 text-center">
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        {/* Curiosity-driven headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1]">
          <span className="text-foreground">Only </span>
          <span className="gradient-text-gold text-glow-gold">5%</span>
          <span className="text-foreground"> Reach Question 15.</span>
          <br />
          <span className="text-foreground">Are You </span>
          <span className="gradient-text-gold text-glow-gold">One of Them?</span>
        </h1>

        {/* Clear subheadline */}
        




        {/* Competitive tagline */}
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent/70">
          Play Free. Compete Globally.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/categories">
            <CTAButton
              size="lg"
              label="Play Now"
              showArrow
              className="cta-glow-pulse text-base md:text-lg px-8 py-5" />

          </Link>
          <Link to="/leaderboards">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-6 py-5 border-accent/50 text-accent hover:bg-accent/10 hover:text-accent">

              <Trophy className="w-5 h-5 mr-2" />
              View Leaderboards
            </Button>
          </Link>
        </div>

        {/* Trust bullets */}
        







      </div>
    </section>);

}
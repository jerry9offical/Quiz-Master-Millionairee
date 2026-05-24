import { Link } from 'react-router-dom';
import { CTAButton } from '@/components/CTAButton';
import { Sparkles } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative z-10 container mx-auto px-6 py-16 md:py-20">
      <div className="glass-card rounded-2xl p-10 md:p-16 text-center max-w-2xl mx-auto border border-accent/15">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Ready to Prove Your Knowledge?
        </h2>
        <p className="text-muted-foreground mb-2">
          Play free. Compete globally. See your name on the leaderboard.
        </p>
        <p className="text-xs text-accent/70 mb-8 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          New questions added weekly. Can you stay on top?
        </p>
        <Link to="/categories">
          <CTAButton size="lg" label="Take Question 1" showArrow className="cta-glow-pulse" />
        </Link>
      </div>
    </section>
  );
}

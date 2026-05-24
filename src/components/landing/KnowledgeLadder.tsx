import { Star } from 'lucide-react';

const MONEY_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];

export function KnowledgeLadder() {
  return (
    <section className="relative z-10 container mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">The Ultimate Knowledge Ladder</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Each level represents a progression milestone in the game. Reach safe points at Q5 and Q10 to lock in your score.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-md mx-auto">
        <div className="space-y-1.5">
          {[...MONEY_LADDER].reverse().map((amount, index) => {
            const questionNum = 15 - index;
            const isMilestone = questionNum === 5 || questionNum === 10;
            const isTop = questionNum === 15;

            return (
              <div
                key={amount}
                className={`flex items-center justify-between px-4 py-2 rounded-lg transition-all ${
                  isTop
                    ? 'bg-gradient-to-r from-accent/20 to-accent/10 border border-accent shadow-gold-glow'
                    : isMilestone
                    ? 'ladder-step milestone'
                    : 'ladder-step'
                }`}
              >
                <span className={`font-medium text-sm ${isTop || isMilestone ? 'text-accent' : 'text-foreground/70'}`}>
                  Q{questionNum}
                </span>
                <span className={`font-bold ${isTop ? 'text-accent text-base' : isMilestone ? 'text-accent text-sm' : 'text-foreground text-sm'}`}>
                  ${amount.toLocaleString()}
                </span>
                {isMilestone && <Star className="w-3.5 h-3.5 text-accent ml-1.5" />}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-4 italic">
          Points represent in-game progression milestones, not real currency.
        </p>
      </div>
    </section>
  );
}

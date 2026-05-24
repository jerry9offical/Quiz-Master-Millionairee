import { Crown } from 'lucide-react';

const MONEY_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
const MILESTONES = [4, 9]; // 0-indexed: question 5 ($1,000) and question 10 ($32,000)

interface MoneyLadderProps {
  currentIndex: number;
}

export function MoneyLadder({ currentIndex }: MoneyLadderProps) {
  return (
    <div className="glass-card rounded-xl p-3 w-full h-full">
      <div className="flex flex-col-reverse gap-1 h-full justify-between">
        {MONEY_LADDER.map((amount, index) => {
          const isCurrent = index === currentIndex;
          const isMilestone = MILESTONES.includes(index);
          const isTop = index === 14;
          const isPassed = index < currentIndex;
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isCurrent
                  ? 'bg-accent text-accent-foreground shadow-gold-glow'
                  : isTop
                  ? 'bg-gradient-to-r from-accent/30 to-accent/10 text-accent border border-accent/50'
                  : isMilestone
                  ? 'bg-primary/40 text-accent border border-accent/30'
                  : isPassed
                  ? 'bg-correct/20 text-correct'
                  : 'bg-card/40 text-muted-foreground'
              }`}
            >
              <span className="w-6 text-center">{index + 1}</span>
              <span className="font-bold">
                {isTop ? (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    $1M
                  </span>
                ) : (
                  `$${amount >= 1000 ? `${amount / 1000}k` : amount}`
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

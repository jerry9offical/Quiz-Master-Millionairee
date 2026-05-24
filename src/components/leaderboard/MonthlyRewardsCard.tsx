import { useState, useEffect } from 'react';
import { Trophy, Crown, Clock, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface MonthlyRewardsCardProps {
  onUpgrade?: () => void;
  variant?: 'full' | 'compact';
}

export function MonthlyRewardsCard({ onUpgrade, variant = 'full' }: MonthlyRewardsCardProps) {
  const { profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const isFree = profile?.access_tier === 'free';
  const isPremium = profile?.access_tier === 'premium';
  const isStandard = profile?.access_tier === 'standard';

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = endOfMonth.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <div className={cn(
        "glass-card rounded-xl p-4 border transition-all duration-300",
        isFree ? "border-muted/20 opacity-75" : "border-accent/30 rewards-glow"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isFree ? "bg-muted/20" : "bg-accent/20"
            )}>
              <Trophy className={cn("w-5 h-5", isFree ? "text-muted-foreground" : "text-accent")} />
            </div>
            <div>
              <p className="font-semibold text-sm">Monthly Rewards</p>
              <p className="text-xs text-muted-foreground">
                {timeLeft.days}d {timeLeft.hours}h remaining
              </p>
            </div>
          </div>
          {isFree ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : isPremium ? (
            <Crown className="w-5 h-5 text-accent animate-pulse" />
          ) : (
            <Badge variant="outline" className="border-accent/50 text-accent text-xs">
              Qualifying
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden glass-card rounded-2xl p-6 border-2 transition-all duration-500",
      isFree ? "border-muted/20" : "border-accent/30 rewards-glow"
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl relative",
            isFree ? "bg-muted/20" : "bg-gradient-to-br from-accent/30 to-accent/10"
          )}>
            {!isFree && (
              <div className="absolute inset-0 bg-accent/20 blur-lg rounded-xl animate-pulse" />
            )}
            <Trophy className={cn(
              "w-8 h-8 relative z-10",
              isFree ? "text-muted-foreground" : "text-accent"
            )} />
          </div>
          <div>
            <h3 className={cn(
              "text-xl font-bold",
              !isFree && "gradient-text-gold"
            )}>
              Compete this month. Win real rewards.
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Top-ranked Standard & Premium players qualify for monthly prizes based on total money won.
            </p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1 text-xs shrink-0",
            isFree ? "border-muted/30" : "border-accent/50 text-accent"
          )}
        >
          <Sparkles className="w-3 h-3" />
          Ranked play only
        </Badge>
      </div>

      {/* Countdown Timer */}
      <div className={cn(
        "grid grid-cols-4 gap-3 mb-6 p-4 rounded-xl",
        isFree ? "bg-muted/10" : "bg-primary/20"
      )}>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold countdown-tick",
            isFree ? "text-muted-foreground" : "text-accent"
          )}>
            {timeLeft.days}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold countdown-tick",
            isFree ? "text-muted-foreground" : "text-accent"
          )}>
            {timeLeft.hours}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Hours</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold countdown-tick",
            isFree ? "text-muted-foreground" : "text-accent"
          )}>
            {timeLeft.minutes}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Mins</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold countdown-tick",
            isFree ? "text-muted-foreground" : "text-foreground"
          )}>
            {timeLeft.seconds}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Secs</div>
        </div>
      </div>

      {/* Prize Pool Teaser */}
      <div className={cn(
        "text-center p-4 rounded-xl mb-6",
        isFree ? "bg-muted/10 border border-muted/20" : "bg-accent/10 border border-accent/20"
      )}>
        <p className={cn(
          "text-sm font-medium",
          isFree ? "text-muted-foreground" : "text-accent"
        )}>
          🏆 This month's prize pool grows with every ranked game played
        </p>
      </div>

      {/* Status / CTA */}
      {isFree ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          <button
            onClick={onUpgrade}
            className={cn(
              "w-full relative overflow-hidden font-bold rounded-xl px-6 py-4",
              "bg-gradient-to-r from-[hsl(48,100%,55%)] via-[hsl(48,100%,65%)] to-[hsl(45,100%,55%)]",
              "text-[hsl(260,80%,10%)]",
              "shadow-[0_4px_20px_hsl(48_100%_60%/0.4)]",
              "hover:shadow-[0_8px_30px_hsl(48_100%_60%/0.5)]",
              "hover:-translate-y-0.5 active:translate-y-0",
              "transition-all duration-300"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Upgrade to Compete for Rewards
            </span>
          </button>
        </div>
      ) : (
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl",
          isPremium ? "bg-accent/20 border border-accent/30" : "bg-primary/20"
        )}>
          <div className="flex items-center gap-3">
            {isPremium ? (
              <>
                <Crown className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold gradient-text-gold">Premium Status</p>
                  <p className="text-sm text-muted-foreground">Eligible for top-tier rewards</p>
                </div>
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold text-accent">Standard Status</p>
                  <p className="text-sm text-muted-foreground">Qualifying for monthly rewards</p>
                </div>
              </>
            )}
          </div>
          <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
        </div>
      )}
    </div>
  );
}

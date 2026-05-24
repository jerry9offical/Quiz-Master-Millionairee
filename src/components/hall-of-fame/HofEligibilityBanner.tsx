import { Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isEligible: boolean;
  isLoggedIn: boolean;
  onUpgrade: () => void;
}

export function HofEligibilityBanner({ isEligible, isLoggedIn, onUpgrade }: Props) {
  if (isEligible) {
    return (
      <div className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-3">
        <Shield className="w-5 h-5 text-accent shrink-0" />
        <p className="text-sm font-medium text-accent">
          You are eligible for the Hall of Fame. Keep playing to climb the ranks!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <Crown className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Hall of Fame is reserved for Standard & Premium players.
        </p>
      </div>
      <Button 
        size="sm" 
        onClick={onUpgrade}
        className="bg-accent text-background hover:bg-accent/90"
      >
        Upgrade to compete
      </Button>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Crown, Trophy, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CTAButton } from '@/components/CTAButton';
import { Button } from '@/components/ui/button';

interface FreeTrialUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function FreeTrialUpgradeModal({ open, onClose }: FreeTrialUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative rounded-2xl overflow-hidden border border-accent/40"
          style={{
            background: 'linear-gradient(145deg, hsl(260 60% 8%) 0%, hsl(260 50% 12%) 50%, hsl(260 60% 8%) 100%)',
            boxShadow: '0 0 60px hsl(48 100% 60% / 0.2), 0 0 120px hsl(260 80% 40% / 0.15)',
          }}
        >
          {/* Top gold shimmer bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(48 100% 60%), transparent)' }} />

          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ background: 'hsl(48 100% 60%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-3xl"
            style={{ background: 'hsl(260 80% 60%)' }} />

          <div className="relative p-8 text-center">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5 mx-auto">
              <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: 'hsl(48 100% 60%)' }} />
              <div className="relative w-full h-full rounded-full border-2 border-accent/60 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(48 100% 30% / 0.4), hsl(48 100% 60% / 0.2))' }}
              >
                <Trophy className="w-9 h-9 text-accent" />
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-black mb-2 gradient-text-gold leading-tight">
              You're 3/3.
              <br />
              Only 5% reach Question 15.
            </h2>

            {/* Body */}
            <p className="text-muted-foreground mb-1 text-sm leading-relaxed">
              You're ahead of most players today.
            </p>
            <p className="text-foreground/90 mb-6 text-sm leading-relaxed">
              Create your free account to continue competing and unlock full leaderboard access.
            </p>

            {/* Competitive stats */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>Free to join</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Crown className="w-3.5 h-3.5 text-accent" />
                <span>Compete globally</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span>Real rewards</span>
              </div>
            </div>

            {/* CTA */}
            <Link to="/auth" onClick={onClose}>
              <CTAButton
                label="Continue & Compete"
                subtext="Join the global arena."
                fullWidth
                showArrow
                className="text-base py-4 cta-glow-pulse"
              />
            </Link>

            {/* Secondary */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mt-3 text-muted-foreground hover:text-foreground text-xs w-full"
            >
              Continue as guest (score won't be saved)
            </Button>
          </div>

          {/* Bottom gold shimmer bar */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(48 100% 60% / 0.4), transparent)' }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Crown } from 'lucide-react';
import { CTAButton } from '@/components/CTAButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTier: (tier: 'standard' | 'premium') => void;
  title?: string;
  description?: string;
}

export function PricingModal({ 
  open, 
  onOpenChange, 
  onSelectTier,
  title = "Choose Your Plan",
  description = "One-time purchase. Play forever."
}: PricingModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-accent/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text-gold flex items-center gap-2">
            <Crown className="w-6 h-6 text-accent" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Standard Plan */}
          <div className="p-5 rounded-xl bg-primary/20 border-2 border-accent/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-accent text-background text-xs font-bold rounded-bl-lg">
              POPULAR
            </div>
            <div className="mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-accent/70">Serious Competitor Tier</span>
            </div>
            <h3 className="text-xl font-bold gradient-text-gold mb-2">Standard Access</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Unlimited category plays, all categories, full leaderboard access, and advanced stats.
            </p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-accent">₦5,000</span>
              <span className="text-muted-foreground">one-time</span>
            </div>
            <CTAButton
              label="Unlock Standard Access"
              subtext="Unlimited plays • All categories • Analytics"
              onClick={() => onSelectTier('standard')}
              fullWidth
            />
          </div>

          {/* Premium Plan */}
          <div className="p-5 rounded-xl bg-primary/10 border-2 border-accent/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary/50 text-accent text-xs font-bold rounded-bl-lg border-l border-b border-accent/30">
              SUBSCRIPTION
            </div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent" />
              Premium Access
            </h3>
            <p className="text-mmuted-foreground text-xs font-semibold text-accent/70 mb-2 uppercase tracking-wider">Monthly Champion Tier</p>
            <p className="text-muted-foreground text-sm mb-4">
              Everything in Standard plus Millionaire Arena, FIFA Exam Practice, Monthly Hall of Fame eligibility, and a gold badge by your name.
            </p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-accent">₦10,000</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <CTAButton
              label="Start Premium"
              subtext="Millionaire Arena • Monthly Championship • Gold Badge"
              variant="secondary"
              onClick={() => onSelectTier('premium')}
              fullWidth
            />
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

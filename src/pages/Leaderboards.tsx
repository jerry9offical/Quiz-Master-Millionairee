import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Crown, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalizedPricing } from '@/hooks/useLocalizedPricing';
import { LockedLeaderboardCard } from '@/components/leaderboard/LockedLeaderboardCard';
import { UnlockedLeaderboard } from '@/components/leaderboard/UnlockedLeaderboard';
import { MonthlyRewardsCard } from '@/components/leaderboard/MonthlyRewardsCard';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';
import { PaystackCheckout } from '@/components/PaystackCheckout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CTAButton } from '@/components/CTAButton';


export default function Leaderboards() {
  const { profile, user } = useAuth();
  const pricing = useLocalizedPricing();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState<'standard' | 'premium' | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const isFree = !profile || profile.access_tier === 'free';
  const hasAccess = profile && (profile.access_tier === 'standard' || profile.access_tier === 'premium');

  // Auto-open pricing modal when returning from auth with intent=unlock
  useEffect(() => {
    if (user && searchParams.get('intent') === 'unlock') {
      setShowPricingModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [user, searchParams, setSearchParams]);

  const handleUnlock = () => {
    if (!user) {
      navigate('/auth?next=/leaderboards&intent=unlock');
      return;
    }
    setShowPricingModal(true);
  };

  const handlePurchase = (tier: 'standard' | 'premium') => {
    setShowPricingModal(false);
    setShowCheckout(tier);
  };

  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-purple w-64 h-64 bottom-20 right-10 opacity-20" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold gradient-text-gold">QuizMaster</span>
        </Link>
        <Link to="/hall-of-fame" className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
          Hall of Fame
          <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
            <Trophy className="w-14 h-14 text-accent relative z-10" />
          </div>
          <h1 className="text-4xl font-bold mb-3 gradient-text-gold">Leaderboards</h1>
          <p className="text-muted-foreground">
            {hasAccess ? "Compete with the best. Climb the money ladder." : "Top players ranked by money won"}
          </p>
        </div>

        {isFree ? (
          <LockedLeaderboardCard onUnlock={handleUnlock} />
        ) : (
          <UnlockedLeaderboard justUnlocked={justUnlocked} />
        )}

        <div className="mt-8">
          <MonthlyRewardsCard onUpgrade={handleUnlock} />
        </div>

        <div className="mt-8 text-center">
          <Link to="/hall-of-fame" className="inline-flex items-center gap-2 text-accent hover:underline transition-all">
            <Crown className="w-4 h-4" />
            View Hall of Fame
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Pricing Modal - uses localized pricing */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="glass-card border-accent/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text-gold flex items-center gap-2">
              <Crown className="w-6 h-6 text-accent" />
              Unlock Leaderboards
            </DialogTitle>
            <DialogDescription className="text-base">
              Join the arena. Compete for glory and monthly rewards.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-xl bg-primary/20 border-2 border-accent/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-accent text-background text-xs font-bold rounded-bl-lg">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold gradient-text-gold mb-2">Standard Access</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Unlimited category plays, full leaderboard access, and monthly reward eligibility.
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-accent">₦5,000</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <CTAButton
                label="Unlock Standard Access"
                subtext="Compete for monthly rewards"
                onClick={() => handlePurchase('standard')}
                fullWidth
              />
            </div>

            <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Premium Access
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Everything in Standard plus Millionaire Arena and top-tier reward eligibility.
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">₦10,000</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <CTAButton
                label="Unlock Premium Access"
                subtext="Includes Millionaire Arena"
                variant="secondary"
                onClick={() => handlePurchase('premium')}
                fullWidth
              />
            </div>

            {/* Currency switch link */}
            <div className="text-center">
              <button
                onClick={pricing.switchCurrency}
                className="text-xs text-muted-foreground hover:text-accent transition-colors underline underline-offset-2"
              >
                {pricing.isNigeria ? 'Switch to USD pricing' : 'Switch to NGN pricing'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout - route to correct gateway */}
      {showCheckout && (
        pricing.gateway === 'paystack' ? (
          <PaystackCheckout tier={showCheckout} onClose={() => setShowCheckout(null)} />
        ) : (
          <EmbeddedCheckout tier={showCheckout} onClose={() => setShowCheckout(null)} />
        )
      )}
    </div>
  );
}

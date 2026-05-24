import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Sunrise, Crown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CTAButton } from '@/components/CTAButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FreePlaysExhaustedModalProps {
  open: boolean;
}

export function FreePlaysExhaustedModal({ open }: FreePlaysExhaustedModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rank, setRank] = useState<number | null>(null);
  const [nextRankGap, setNextRankGap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;

    const fetchRank = async () => {
      setLoading(true);
      // Get user's best weekly entry
      const { data: userEntry } = await supabase
        .from('leaderboard_entries')
        .select('best_money_won')
        .eq('user_id', user.id)
        .eq('period', 'weekly')
        .is('category', null)
        .single();

      if (!userEntry) {
        setRank(null);
        setLoading(false);
        return;
      }

      // Count how many users are above this user
      const { count } = await supabase
        .from('leaderboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('period', 'weekly')
        .is('category', null)
        .gt('best_money_won', userEntry.best_money_won);

      const currentRank = (count ?? 0) + 1;
      setRank(currentRank);

      // Find the next person above to calculate gap
      if (currentRank > 1) {
        const { data: aboveEntry } = await supabase
          .from('leaderboard_entries')
          .select('best_money_won')
          .eq('period', 'weekly')
          .is('category', null)
          .gt('best_money_won', userEntry.best_money_won)
          .order('best_money_won', { ascending: true })
          .limit(1)
          .single();

        if (aboveEntry) {
          setNextRankGap(aboveEntry.best_money_won - userEntry.best_money_won);
        }
      }
      setLoading(false);
    };

    fetchRank();
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div
          className="relative rounded-2xl overflow-hidden border border-accent/40"
          style={{
            background: 'linear-gradient(145deg, hsl(260 60% 8%) 0%, hsl(260 50% 12%) 50%, hsl(260 60% 8%) 100%)',
            boxShadow: '0 0 60px hsl(48 100% 60% / 0.2), 0 0 120px hsl(260 80% 40% / 0.15)',
          }}
        >
          {/* Top gold shimmer */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(48 100% 60%), transparent)' }} />

          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ background: 'hsl(48 100% 60%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-3xl" style={{ background: 'hsl(260 80% 60%)' }} />

          <div className="relative p-8 text-center">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5 mx-auto">
              <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ background: 'hsl(48 100% 60%)' }} />
              <div
                className="relative w-full h-full rounded-full border-2 border-accent/60 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(48 100% 30% / 0.4), hsl(48 100% 60% / 0.2))' }}
              >
                <Trophy className="w-9 h-9 text-accent" />
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-black mb-2 gradient-text-gold leading-tight">
              Great run today! 🔥
            </h2>
            <p className="text-muted-foreground text-sm mb-5">
              You've used all 3 free plays for today.
            </p>

            {/* Rank info */}
            {!loading && rank !== null && (
              <div className="rounded-xl border border-accent/20 p-4 mb-5" style={{ background: 'hsl(260 50% 15% / 0.6)' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">
                    You're ranked <span className="text-accent font-black">#{rank}</span> this week
                  </span>
                </div>
                {nextRankGap !== null && (
                  <p className="text-xs text-muted-foreground">
                    Only <span className="text-accent font-bold">${nextRankGap.toLocaleString()}</span> away from the next rank up!
                  </p>
                )}
              </div>
            )}

            {!loading && rank === null && (
              <div className="rounded-xl border border-accent/20 p-4 mb-5" style={{ background: 'hsl(260 50% 15% / 0.6)' }}>
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    Upgrade to start climbing the leaderboard!
                  </span>
                </div>
              </div>
            )}

            {/* CTA */}
            <CTAButton
              label="Upgrade for Unlimited Ranked Play"
              subtext="Never hit a limit again."
              fullWidth
              showArrow
              className="text-base py-4 cta-glow-pulse"
              onClick={() => navigate('/leaderboards')}
            />

            {/* Secondary */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mt-3 text-muted-foreground hover:text-foreground text-xs w-full gap-2"
            >
              <Sunrise className="w-3.5 h-3.5" />
              Come Back Tomorrow
            </Button>
          </div>

          {/* Bottom shimmer */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(48 100% 60% / 0.4), transparent)' }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

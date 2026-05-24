import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ChevronRight, Globe, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

export function LeaderboardPreview() {
  const [topPlayer, setTopPlayer] = useState<{ name: string; score: number; country_code: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('leaderboard_entries')
          .select('user_id, best_money_won')
          .eq('period', 'weekly')
          .is('category', null)
          .order('best_money_won', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const { data: profiles } = await supabase
            .from('leaderboard_profiles')
            .select('name, country_code')
            .eq('user_id', data[0].user_id);

          const profile = profiles?.[0];
          setTopPlayer({
            name: profile?.name || 'Anonymous',
            score: data[0].best_money_won,
            country_code: profile?.country_code || null,
          });
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <section className="relative z-10 container mx-auto px-6 py-10 md:py-14">
      <div className="max-w-md mx-auto glass-card rounded-2xl p-6 border border-accent/20 rewards-glow">
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-lg text-foreground">Top Player This Week</h3>
        </div>

        {topPlayer ? (
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xl">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{topPlayer.name}</span>
                {topPlayer.country_code && topPlayer.country_code !== 'UN' ? (
                  <img
                    src={`https://flagcdn.com/w20/${topPlayer.country_code.toLowerCase()}.png`}
                    alt={topPlayer.country_code}
                    className="w-5 h-auto rounded-sm"
                  />
                ) : (
                  <Globe className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Best score: <span className="text-accent font-semibold">{formatMoney(topPlayer.score)}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-5 py-3 text-muted-foreground">
            <Trophy className="w-8 h-8 opacity-50" />
            <p className="text-sm">No weekly rankings yet. Be the first to play!</p>
          </div>
        )}

        <Link
          to="/leaderboards"
          className="flex items-center justify-center gap-1 text-accent font-semibold text-sm hover:underline"
        >
          See Full Leaderboard
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

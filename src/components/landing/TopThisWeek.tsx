import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Globe, ChevronRight, Trophy, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

interface Player {
  name: string;
  score: number;
  country_code: string | null;
}

const RANK_CONFIG = [
  {
    rank: 1,
    label: '1st',
    circleClass: 'bg-gradient-to-br from-[hsl(48,100%,55%)] to-[hsl(45,90%,40%)] text-[hsl(260,80%,10%)]',
    cardClass: 'border-[hsl(48,100%,55%)/50%] bg-gradient-to-br from-[hsl(48,100%,60%)/12%] to-[hsl(48,80%,40%)/5%]',
    shadow: 'shadow-[0_0_30px_hsl(48,100%,55%,0.2)]',
    textClass: 'text-[hsl(48,100%,65%)]',
    crownColor: 'text-[hsl(48,100%,60%)]',
    showCrown: true,
    scale: 'scale-105',
  },
  {
    rank: 2,
    label: '2nd',
    circleClass: 'bg-gradient-to-br from-[hsl(0,0%,85%)] to-[hsl(0,0%,60%)] text-[hsl(260,80%,10%)]',
    cardClass: 'border-[hsl(0,0%,70%)/40%] bg-gradient-to-br from-[hsl(0,0%,80%)/8%] to-[hsl(0,0%,60%)/4%]',
    shadow: 'shadow-[0_0_20px_hsl(0,0%,70%,0.15)]',
    textClass: 'text-[hsl(0,0%,80%)]',
    crownColor: 'text-[hsl(0,0%,75%)]',
    showCrown: false,
    scale: '',
  },
  {
    rank: 3,
    label: '3rd',
    circleClass: 'bg-gradient-to-br from-[hsl(25,90%,55%)] to-[hsl(20,80%,40%)] text-[hsl(260,80%,10%)]',
    cardClass: 'border-[hsl(25,90%,55%)/35%] bg-gradient-to-br from-[hsl(25,90%,55%)/8%] to-[hsl(20,80%,40%)/4%]',
    shadow: 'shadow-[0_0_20px_hsl(25,90%,55%,0.15)]',
    textClass: 'text-[hsl(25,90%,60%)]',
    crownColor: 'text-[hsl(25,90%,55%)]',
    showCrown: false,
    scale: '',
  },
];

function PlayerCard({ config, player }: { config: typeof RANK_CONFIG[0]; player: Player | null }) {
  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all duration-300 ${config.cardClass} ${config.shadow} ${config.scale}`}
    >
      {config.showCrown && (
        <Crown className={`absolute -top-4 w-8 h-8 ${config.crownColor} drop-shadow-lg`} />
      )}

      {/* Rank circle */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${config.circleClass}`}>
        {config.rank}
      </div>

      {/* Player info */}
      {player ? (
        <>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-foreground text-base">{player.name}</span>
              {player.country_code && player.country_code !== 'UN' ? (
                <img
                  src={`https://flagcdn.com/w20/${player.country_code.toLowerCase()}.png`}
                  alt={player.country_code}
                  className="w-5 h-auto rounded-sm"
                />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className={`text-lg font-black mt-1 ${config.textClass}`}>
              {formatMoney(player.score)}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">No player yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Be the first!</p>
        </div>
      )}
    </div>
  );
}

export function TopThisWeek() {
  const [players, setPlayers] = useState<(Player | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: entries } = await supabase
          .from('leaderboard_entries')
          .select('user_id, best_money_won')
          .eq('period', 'weekly')
          .is('category', null)
          .order('best_money_won', { ascending: false })
          .limit(3);

        if (entries && entries.length > 0) {
          const userIds = entries.map((e) => e.user_id);
          const { data: profiles } = await supabase
            .from('leaderboard_profiles')
            .select('user_id, name, country_code')
            .in('user_id', userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

          const mapped: (Player | null)[] = [null, null, null];
          entries.forEach((entry, i) => {
            const profile = profileMap.get(entry.user_id);
            mapped[i] = {
              name: profile?.name || 'Anonymous',
              score: entry.best_money_won,
              country_code: profile?.country_code || null,
            };
          });
          setPlayers(mapped);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <section className="relative z-10 container mx-auto px-6 py-10 md:py-14">
      {/* ── Top 3 This Week ── */}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-4">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Live Rankings</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            <span className="gradient-text-gold">Top 3</span>
            <span className="text-foreground"> This Week</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2">Real players. Real scores. Could you be next?</p>
        </div>

        {/* Podium — 2nd | 1st | 3rd on desktop, stacked mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
          {/* Reorder: 2nd, 1st, 3rd visually on desktop */}
          <div className="sm:order-1 mt-4 sm:mt-0">
            <PlayerCard config={RANK_CONFIG[1]} player={players[1]} />
          </div>
          <div className="sm:order-2">
            <PlayerCard config={RANK_CONFIG[0]} player={players[0]} />
          </div>
          <div className="sm:order-3 mt-4 sm:mt-0">
            <PlayerCard config={RANK_CONFIG[2]} player={players[2]} />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-10">
          <Link
            to="/leaderboards"
            className="inline-flex items-center gap-1.5 text-accent font-bold text-sm hover:underline"
          >
            View Full Leaderboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Monthly Hall of Fame teaser ── */}
        <div className="glass-card rounded-2xl border border-accent/20 p-6 md:p-8 bg-gradient-to-br from-primary/20 to-transparent relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Monthly Championship</span>
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">
                🔥 Monthly Hall of Fame
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The <span className="text-accent font-semibold">#1 player</span> at the end of each month earns a special{' '}
                <span className="text-accent font-semibold">Amazon Gift Card</span> and permanent Hall of Fame status.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">Premium members only. One win per quarter.</p>
            </div>
          </div>

          <div className="mt-5">
            <Link to="/categories">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/20 border border-accent/30 text-accent font-bold text-sm hover:bg-accent/30 transition-colors">
                Compete Now
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

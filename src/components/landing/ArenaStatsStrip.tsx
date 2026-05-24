import { useState, useEffect, useRef } from 'react';
import { Flame, Trophy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

function useMonthCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = end.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const steps = 40;
        const inc = target / steps;
        let cur = 0;
        const t = setInterval(() => {
          cur += inc;
          if (cur >= target) { cur = target; clearInterval(t); }
          setVal(Math.floor(cur));
        }, 25);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref} className="tabular-nums">{val.toLocaleString()}</span>;
}

export function ArenaStatsStrip() {
  const countdown = useMonthCountdown();
  const [activePlayers] = useState(1248);
  const [topScore, setTopScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: leaderData } = await supabase
        .from('leaderboard_entries')
        .select('best_money_won')
        .eq('period', 'monthly')
        .is('category', null)
        .order('best_money_won', { ascending: false })
        .limit(1);

      if (leaderData && leaderData.length > 0) {
        setTopScore(leaderData[0].best_money_won);
      }
    })();
  }, []);

  return (
    <section className="relative z-10 border-y border-accent/20 py-4 overflow-hidden bg-primary/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-center">
          {/* Active players */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-wrong/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-wrong" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-wrong">
                <AnimatedNumber target={activePlayers} />+
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-none">Competing today</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border hidden sm:block" />

          {/* Current leader */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-accent">
                {topScore != null ? formatMoney(topScore) : '—'}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-none">Current leader</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border hidden sm:block" />

          {/* Monthly championship countdown */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-foreground">
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-none">Championship ends</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </section>
  );
}

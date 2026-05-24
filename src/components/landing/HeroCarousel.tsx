import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CTAButton } from '@/components/CTAButton';
import { Button } from '@/components/ui/button';
import {
  Trophy, ChevronLeft, ChevronRight, CheckCircle2, Star,
  Clock, Flame, Crown, Globe, Users } from
'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SLIDE_DURATION = 5000;

/* ─── helpers ─── */
const formatMoney = (n: number) =>
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

function useMonthCountdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = end.getTime() - now.getTime();
      if (diff > 0)
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff % 86400000 / 3600000),
        m: Math.floor(diff % 3600000 / 60000),
        s: Math.floor(diff % 60000 / 1000)
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ─── Slide 1 – Main CTA ─── */
function Slide1() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-4 py-10 md:py-14 space-y-5 animate-fade-in">
      




      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] max-w-4xl">
        <span className="text-foreground">Only </span>
        <span className="gradient-text-gold text-glow-gold">5%</span>
        <span className="text-foreground"> Reach Question 15.</span>
        <br />
        <span className="text-foreground">Are You </span>
        <span className="gradient-text-gold text-glow-gold">One of Them?</span>
      </h1>

      



      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link to="/categories">
          <CTAButton size="lg" label="Play Now" showArrow className="cta-glow-pulse text-base md:text-lg px-8 py-5" />
        </Link>
        <Link to="/leaderboards">
          <Button size="lg" variant="outline" className="text-base px-6 py-5 border-accent/50 text-accent hover:bg-accent/10 hover:text-accent">
            <Trophy className="w-5 h-5 mr-2" />
            View Leaderboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-6 pt-1 text-xs text-muted-foreground/70 font-medium">
        <span>✓ Free to play</span>
        <span>✓ No downloads</span>
        <span>✓ Skill-based</span>
        <span className="hidden sm:inline">✓ Compete globally</span>
      </div>
    </div>);

}

/* ─── Slide 2 – Signup value prop ─── */
function Slide2() {
  const bullets = [
  { icon: Trophy, text: 'Appear on the Global Leaderboard' },
  { icon: Star, text: 'Track your personal best score' },
  { icon: Crown, text: 'Compete for Monthly Hall of Fame reward' },
  { icon: Flame, text: 'Unlock Premium Challenges' }];


  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 h-full px-4 py-10 md:py-12 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Left: text */}
      <div className="flex-1 text-center md:text-left space-y-5">
        




        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
          <span className="text-foreground">Why </span>
          <span className="gradient-text-gold">Create an Account?</span>
        </h2>

        <ul className="space-y-3 text-left">
          {bullets.map(({ icon: Icon, text }) =>
          <li key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-foreground font-medium text-sm md:text-base">{text}</span>
            </li>
          )}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/auth">
            <CTAButton size="lg" label="Create Free Account" showArrow className="cta-glow-pulse" />
          </Link>
          <Link to="/leaderboards">
            <Button size="lg" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent">
              See How It Works
            </Button>
          </Link>
        </div>
      </div>

      {/* Right: visual card */}
      <div className="flex-shrink-0 w-full md:w-64">
        <div className="glass-card rounded-2xl border border-accent/20 p-6 bg-gradient-to-br from-primary/30 to-transparent space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">It's completely</p>
            <p className="text-2xl font-black gradient-text-gold">FREE</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground border-t border-accent/20 pt-4">
            <div className="flex justify-between">
              <span>Setup time</span>
              <span className="text-foreground font-bold">30 seconds</span>
            </div>
            <div className="flex justify-between">
              <span>Credit card?</span>
              <span className="text-foreground font-bold">Never required</span>
            </div>
            <div className="flex justify-between">
              <span>Google sign-in</span>
              <span className="text-accent font-bold">✓ Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

/* ─── Slide 3 – Social proof ─── */
interface Player {name: string;score: number;country_code: string | null;}

const RANK_STYLES = [
{ label: '🥇', ring: 'ring-[hsl(48,100%,55%)] bg-[hsl(48,100%,55%)/10%]', text: 'text-[hsl(48,100%,65%)]' },
{ label: '🥈', ring: 'ring-[hsl(0,0%,75%)] bg-[hsl(0,0%,75%)/10%]', text: 'text-[hsl(0,0%,80%)]' },
{ label: '🥉', ring: 'ring-[hsl(25,90%,55%)] bg-[hsl(25,90%,55%)/10%]', text: 'text-[hsl(25,90%,60%)]' }];


function Slide3({ players, topScore }: {players: (Player | null)[];topScore: number | null;}) {
  const countdown = useMonthCountdown();

  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-4 py-10 md:py-12 space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
      <div className="space-y-2">
        



        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
          <span className="text-foreground">Real Players.</span>{' '}
          <span className="gradient-text-gold">Real Competition.</span>
        </h2>
        


      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-wrong/20 bg-wrong/10">
          <Flame className="w-4 h-4 text-wrong" />
          <div className="text-left">
            <p className="text-base font-black text-wrong">1,000+</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Competing today</p>
          </div>
        </div>
        {topScore != null &&
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/10">
            <Trophy className="w-4 h-4 text-accent" />
            <div className="text-left">
              <p className="text-base font-black text-accent">{formatMoney(topScore)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current leader</p>
            </div>
          </div>
        }
        






      </div>

      {/* Mini leaderboard */}
      <div className="w-full max-w-sm space-y-2">
        {RANK_STYLES.map((style, i) => {
          const p = players[i];
          return (
            <div key={i} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl ring-1', style.ring)}>
              <span className="text-lg">{style.label}</span>
              {p ?
              <>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-bold text-foreground text-sm truncate">{p.name}</span>
                    {p.country_code && p.country_code !== 'UN' ?
                  <img src={`https://flagcdn.com/w20/${p.country_code.toLowerCase()}.png`} alt={p.country_code} className="w-4 h-auto rounded-sm flex-shrink-0" /> :

                  <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  }
                  </div>
                  <span className={cn('font-black text-sm', style.text)}>{formatMoney(p.score)}</span>
                </> :

              <span className="text-muted-foreground text-sm">— Be the first!</span>
              }
            </div>);

        })}
      </div>

      <Link to="/categories">
        <CTAButton size="lg" label="Join the Competition" showArrow className="cta-glow-pulse" />
      </Link>
    </div>);

}

/* ─── Main carousel ─── */
const SLIDES = 3;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {currentRef.current = current;}, [current]);

  // Leaderboard data for Slide 3
  const [players, setPlayers] = useState<(Player | null)[]>([null, null, null]);
  const [topScore, setTopScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: entries }, { data: leaderData }] = await Promise.all([
        supabase.
        from('leaderboard_entries').
        select('user_id, best_money_won').
        eq('period', 'weekly').
        is('category', null).
        order('best_money_won', { ascending: false }).
        limit(3),
        supabase.
        from('leaderboard_entries').
        select('best_money_won').
        eq('period', 'monthly').
        is('category', null).
        order('best_money_won', { ascending: false }).
        limit(1)]
        );

        if (leaderData && leaderData.length > 0) setTopScore(leaderData[0].best_money_won);

        if (entries && entries.length > 0) {
          const { data: profiles } = await supabase.
          from('leaderboard_profiles').
          select('user_id, name, country_code').
          in('user_id', entries.map((e) => e.user_id));

          const map = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
          const mapped: (Player | null)[] = [null, null, null];
          entries.forEach((e, i) => {
            const p = map.get(e.user_id);
            mapped[i] = { name: p?.name || 'Anonymous', score: e.best_money_won, country_code: p?.country_code || null };
          });
          setPlayers(mapped);
        }
      } catch {/* ignore */}
    })();
  }, []);

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true); // fade out
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false); // fade in
    }, 350);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % SLIDES), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES) % SLIDES), [current, goTo]);

  // Auto-rotate — fade out, swap, fade in using ref to avoid stale closure
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      const nxt = (currentRef.current + 1) % SLIDES;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(nxt);
        setIsTransitioning(false);
      }, 350);
    }, SLIDE_DURATION);
    return () => {if (timerRef.current) clearInterval(timerRef.current);};
  }, [paused]);

  const slides = [
  <Slide1 key="s1" />,
  <Slide2 key="s2" />,
  <Slide3 key="s3" players={players} topScore={topScore} />];


  return (
    <section
      className="relative z-10 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
      aria-label="Hero carousel">

      {/* Slide area */}
      <div className="relative overflow-hidden min-h-[520px] md:min-h-[540px] flex items-center justify-center">
        <div
          className={cn(
            'w-full flex items-center justify-center transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : 'opacity-100'
          )}>

          {slides[current]}
        </div>

        {/* Arrow buttons */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/60 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 transition-all backdrop-blur-sm z-10">

          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/60 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 transition-all backdrop-blur-sm z-10">

          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Indicator dots + progress */}
      <div className="flex items-center justify-center gap-2.5 pb-4">
        {Array.from({ length: SLIDES }).map((_, i) =>
        <button
          key={i}
          onClick={() => goTo(i)}
          aria-label={`Go to slide ${i + 1}`}
          className="relative h-2 rounded-full overflow-hidden transition-all duration-300 focus:outline-none"
          style={{ width: i === current ? 32 : 8 }}>

            <span className={cn(
            'absolute inset-0 rounded-full transition-colors duration-300',
            i === current ? 'bg-accent' : 'bg-accent/30'
          )} />
            {/* progress fill on active dot */}
            {i === current && !paused &&
          <span
            className="absolute inset-0 rounded-full bg-accent/60 origin-left animate-[carousel-progress_5s_linear_forwards]" />

          }
          </button>
        )}
      </div>

      {/* Trust bar */}
      <div className="border-t border-accent/10 py-3 bg-primary/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>✓ Free to play</span>
            <span className="hidden sm:inline text-accent/30">|</span>
            <span>✓ No hidden fees</span>
            <span className="hidden sm:inline text-accent/30">|</span>
            <span>✓ Global leaderboard</span>
            <span className="hidden sm:inline text-accent/30">|</span>
            <span>✓ Skill-based — Not gambling</span>
          </div>
        </div>
      </div>
    </section>);

}
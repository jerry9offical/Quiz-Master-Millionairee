import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trophy, Medal, Star, Award, ChevronRight, Sparkles, Globe, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from '@/components/PricingModal';
import { usePaymentModal } from '@/hooks/usePaymentModal';
import { HofChampionCard } from '@/components/hall-of-fame/HofChampionCard';
import { HofEmptyState } from '@/components/hall-of-fame/HofEmptyState';
import { HofEligibilityBanner } from '@/components/hall-of-fame/HofEligibilityBanner';

interface HofEntry {
  user_id: string;
  display_name: string;
  country_code: string | null;
  country_name: string | null;
  money_won: number;
  rank: number;
  category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  microbiology: 'Microbiology',
  data_science: 'Data Science',
  medicine: 'Medicine',
  gmat: 'GMAT',
  gre: 'GRE',
  a_level: 'A-Level',
  gcse: 'GCSE',
  general_knowledge: 'General Knowledge',
  physics: 'Physics',
  mathematics: 'Mathematics',
  sports: 'Sports',
};

/** Client-side dedup safety net */
function dedupeByUser(entries: HofEntry[]): HofEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => {
    if (seen.has(e.user_id)) return false;
    seen.add(e.user_id);
    return true;
  });
}

function dedupeByUserCategory(entries: HofEntry[]): HofEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => {
    const key = `${e.user_id}_${e.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function HallOfFame() {
  const { user, profile } = useAuth();
  const { showPricingModal, openPricingModal, closePricingModal, openCheckout, showCheckout } = usePaymentModal();
  
  const [monthlyChampions, setMonthlyChampions] = useState<HofEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<HofEntry[]>([]);
  const [categoryMasters, setCategoryMasters] = useState<HofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const isEligible = profile?.access_tier === 'premium'; // Only Premium for Monthly Championship
  const isStandardOrAbove = profile?.access_tier === 'standard' || profile?.access_tier === 'premium';

  useEffect(() => {
    fetchHallOfFame();

    // Monthly countdown
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

  const fetchHallOfFame = async () => {
    setLoading(true);

    const [monthlyRes, allTimeRes, mastersRes] = await Promise.all([
      supabase.from('monthly_hof_view' as any).select('*'),
      supabase.from('all_time_hof_view' as any).select('*'),
      supabase.from('masters_hof_view' as any).select('*'),
    ]);

    if (monthlyRes.data) {
      setMonthlyChampions(dedupeByUser(monthlyRes.data as unknown as HofEntry[]));
    }
    if (allTimeRes.data) {
      setAllTimeLeaders(dedupeByUser(allTimeRes.data as unknown as HofEntry[]));
    }
    if (mastersRes.data) {
      setCategoryMasters(dedupeByUserCategory(mastersRes.data as unknown as HofEntry[]));
    }

    setLoading(false);
  };

  const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-20 bg-primary/20 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      {/* Background effects */}
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-20" />
      <div className="glow-orb glow-orb-purple w-64 h-64 bottom-20 right-20 opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="flex items-center gap-2">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold gradient-text-gold">QuizMaster</span>
        </Link>
        <Link 
          to="/leaderboards"
          className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
        >
          Leaderboards
          <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full" />
            <div className="relative p-5 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/50">
              <Trophy className="w-12 h-12 text-accent" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-gold">Hall of Fame</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            These players didn't guess. They earned it.
          </p>
        </div>

        {/* Monthly Championship Hero Card */}
        <div className="glass-card rounded-2xl p-6 border-2 border-accent/40 rewards-glow mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold gradient-text-gold">Monthly Championship</h2>
            <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold border border-accent/30">
              Premium Only
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Highest verified Millionaire Arena score wins. Monthly Hall of Fame Champion receives an exclusive Amazon Gift Card.
          </p>

          {/* Rules */}
          <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-accent/70" />
              Active Premium required at time of reward
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-accent/70" />
              1 win per user every 3 months
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent/70" />
              Minimum attempts required for eligibility
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-accent/70" />
              WWTBAM mode scores only
            </div>
          </div>

          {/* Countdown */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: timeLeft.days, label: 'Days' },
              { val: timeLeft.hours, label: 'Hours' },
              { val: timeLeft.minutes, label: 'Mins' },
              { val: timeLeft.seconds, label: 'Secs' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center p-2 rounded-lg bg-primary/20">
                <div className="text-2xl font-black text-accent countdown-tick">{val}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>

          {!isEligible && (
            <div className="mt-4">
              <HofEligibilityBanner
                isEligible={isEligible}
                isLoggedIn={!!user}
                onUpgrade={() => openPricingModal()}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-primary/20 p-1 rounded-xl">
            <TabsTrigger value="monthly" className="data-[state=active]:bg-accent data-[state=active]:text-background rounded-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Champions
            </TabsTrigger>
            <TabsTrigger value="all-time" className="data-[state=active]:bg-accent data-[state=active]:text-background rounded-lg">
              <Crown className="w-4 h-4 mr-2" />
              All-Time
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-accent data-[state=active]:text-background rounded-lg">
              <Award className="w-4 h-4 mr-2" />
              Masters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-0">
            <div className="glass-card rounded-2xl p-6 museum-card">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Monthly Championship — Top 3
              </h2>
              <p className="text-xs text-muted-foreground mb-6">Premium players only • Highest Millionaire Arena score wins</p>
              {loading ? <LoadingSkeleton /> : monthlyChampions.length === 0 ? (
                <HofEmptyState
                  icon={Trophy}
                  message="No Monthly Championship entries yet. Only Premium players competing in Millionaire Arena qualify."
                  onUpgrade={!isEligible ? () => openPricingModal() : undefined}
                />
              ) : (
                <div className="space-y-3">
                  {monthlyChampions.slice(0, 3).map((entry) => (
                    <HofChampionCard key={entry.user_id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all-time" className="mt-0">
            <div className="glass-card rounded-2xl p-6 museum-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Hall of Fame — All-Time Winners
              </h2>
              {loading ? <LoadingSkeleton count={5} /> : allTimeLeaders.length === 0 ? (
                <HofEmptyState
                  icon={Crown}
                  message="The throne awaits. Be the first to dominate."
                  onUpgrade={!isStandardOrAbove ? () => openPricingModal() : undefined}
                />
              ) : (
                <div className="space-y-3">
                  {allTimeLeaders.map((entry) => (
                    <HofChampionCard key={entry.user_id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="glass-card rounded-2xl p-6 museum-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Category Masters
              </h2>
              {loading ? <LoadingSkeleton count={4} /> : categoryMasters.length === 0 ? (
                <HofEmptyState
                  icon={Medal}
                  message="Master a category to etch your name here. Standard & Premium players only."
                  onUpgrade={!isStandardOrAbove ? () => openPricingModal() : undefined}
                />
              ) : (
                <div className="space-y-3">
                  {categoryMasters.map((entry) => (
                    <HofChampionCard
                      key={`${entry.user_id}_${entry.category}`}
                      entry={entry}
                      categoryLabels={CATEGORY_LABELS}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Monthly Championship: Premium only • All-Time &amp; Masters: Standard &amp; Premium
          </p>
        </div>
      </main>

      <PricingModal
        open={showPricingModal}
        onOpenChange={closePricingModal}
        onSelectTier={openCheckout}
        title="Compete for the Hall of Fame"
        description="Upgrade to be eligible for Monthly Championship rewards."
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Crown, Globe, Medal, Trophy, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  best_money_won: number;
  period: 'all_time' | 'monthly' | 'weekly';
  category: string | null;
  previous_rank: number | null;
  profile?: {
    name: string;
    avatar_url: string | null;
    country_code?: string | null;
  };
}

interface UnlockedLeaderboardProps {
  justUnlocked?: boolean;
}

const getFlagUrl = (countryCode: string) =>
  `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'microbiology', label: 'Microbiology' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'general_knowledge', label: 'General Knowledge' },
  { value: 'sports', label: 'Sports' },
  { value: 'gmat', label: 'GMAT' },
  { value: 'gre', label: 'GRE' },
  { value: 'a_level', label: 'A-Level' },
  { value: 'gcse', label: 'GCSE' },
];

const COUNTRY_OPTIONS = [
  { value: 'all', label: '🌍 All Countries' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australia' },
];

// No placeholders — show real data only

export function UnlockedLeaderboard({ justUnlocked = false }: UnlockedLeaderboardProps) {
  const { user, profile: authProfile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [showReveal, setShowReveal] = useState(justUnlocked);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, categoryFilter]);

  useEffect(() => {
    if (justUnlocked) {
      setShowReveal(true);
      const timer = setTimeout(() => setShowReveal(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [justUnlocked]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('period', period)
        .order('best_money_won', { ascending: false })
        .limit(100);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      } else {
        query = query.is('category', null);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setEntries([]);
        findUserRank([]);
      } else {
        const userIds = data.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('leaderboard_profiles')
          .select('user_id, name, avatar_url, country_code')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const formatted = data.map((entry: any) => ({
          ...entry,
          profile: profileMap.get(entry.user_id) || { name: 'Anonymous', avatar_url: null },
        }));
        setEntries(formatted);
        findUserRank(formatted);
      }
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  const findUserRank = (allEntries: LeaderboardEntry[]) => {
    if (!user) { setUserRank(null); setUserEntry(null); return; }
    const idx = allEntries.findIndex(e => e.user_id === user.id);
    if (idx >= 0) {
      setUserRank(idx + 1);
      setUserEntry(allEntries[idx]);
    } else {
      setUserRank(null);
      setUserEntry(null);
    }
  };

  const filteredEntries = countryFilter === 'all'
    ? entries
    : entries.filter(e => e.profile?.country_code === countryFilter);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getRankChange = (currentRank: number, previousRank: number | null) => {
    if (previousRank === null) return null;
    const diff = previousRank - currentRank;
    if (diff > 0) return { direction: 'up', amount: diff };
    if (diff < 0) return { direction: 'down', amount: Math.abs(diff) };
    return { direction: 'same', amount: 0 };
  };

  const RankChangeIndicator = ({ currentRank, previousRank }: { currentRank: number; previousRank: number | null }) => {
    const change = getRankChange(currentRank, previousRank);
    if (!change) return null;
    if (change.direction === 'up') return (
      <span className="inline-flex items-center gap-0.5 text-xs text-green-400 font-medium">
        <TrendingUp className="w-3 h-3" /> +{change.amount}
      </span>
    );
    if (change.direction === 'down') return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-400 font-medium">
        <TrendingDown className="w-3 h-3" /> -{change.amount}
      </span>
    );
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 md:p-6 transition-all duration-700",
      showReveal && "leaderboard-reveal"
    )}>
      {showReveal && <div className="absolute inset-0 gold-shimmer-pass rounded-2xl pointer-events-none" />}

      {/* User Rank Banner */}
      {userRank && userEntry && (
        <div className="mb-4 p-3 md:p-4 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center font-bold text-lg">
              {userRank}
            </div>
            <div>
              <p className="font-semibold text-sm">Your Rank: <span className="gradient-text-gold">#{userRank}</span></p>
              <RankChangeIndicator currentRank={userRank} previousRank={userEntry.previous_rank} />
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold gradient-text-gold">{formatMoney(userEntry.best_money_won)}</p>
            <p className="text-xs text-muted-foreground">Best score</p>
          </div>
        </div>
      )}

      {/* Qualifying Status */}
      {authProfile && authProfile.access_tier !== 'free' && (
        <div className="mb-4 p-3 rounded-xl bg-primary/20 flex items-center gap-2">
          {authProfile.access_tier === 'premium' ? (
            <>
              <Crown className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium gradient-text-gold">Premium Status: Top-tier reward eligibility</span>
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-accent">Standard Status: Qualifying for monthly rewards</span>
            </>
          )}
        </div>
      )}

      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-primary/20">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-accent data-[state=active]:text-background text-xs md:text-sm">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-accent data-[state=active]:text-background text-xs md:text-sm">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="all_time" className="data-[state=active]:bg-accent data-[state=active]:text-background text-xs md:text-sm">
            All-Time
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1 bg-primary/20 border-primary/30 text-sm h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30 z-50">
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="flex-1 bg-primary/20 border-primary/30 text-sm h-9">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30 z-50">
              {COUNTRY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={period} className="mt-0">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-primary/20 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rankings yet. Be the first to compete!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredEntries.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-2 md:gap-4 p-2.5 md:p-3.5 rounded-xl transition-all duration-300",
                      "hover:bg-primary/30",
                      entry.user_id === user?.id && "ring-1 ring-accent/50 bg-accent/10",
                      rank === 1 && "bg-gradient-to-r from-accent/20 to-transparent border border-accent/30",
                      rank === 2 && "bg-gradient-to-r from-[hsl(45,30%,70%)]/10 to-transparent",
                      rank === 3 && "bg-gradient-to-r from-[hsl(25,50%,55%)]/10 to-transparent",
                      rank > 3 && "bg-primary/10"
                    )}
                    style={{
                      animationDelay: justUnlocked ? `${index * 0.05}s` : '0s',
                      opacity: justUnlocked ? 0 : 1,
                      animation: justUnlocked ? `slideUpReveal 0.5s ease-out ${index * 0.05}s forwards` : 'none'
                    }}
                  >
                    {/* Rank */}
                    <div className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg shrink-0",
                      rank === 1 && "bg-accent text-background",
                      rank === 2 && "bg-[hsl(45,30%,70%)] text-background",
                      rank === 3 && "bg-[hsl(25,50%,55%)] text-background",
                      rank > 3 && "bg-primary/30 text-foreground"
                    )}>
                      {rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {entry.profile?.country_code && entry.profile.country_code !== 'UN' ? (
                          <img
                            src={getFlagUrl(entry.profile.country_code)}
                            alt={`${entry.profile.country_code} flag`}
                            className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                          />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-semibold truncate text-sm md:text-base">
                          {entry.profile?.name || 'Anonymous'}
                        </span>
                        {rank <= 3 && (
                          rank === 1 ? <Crown className="w-4 h-4 text-accent animate-pulse shrink-0" /> :
                          rank === 2 ? <Medal className="w-4 h-4 text-[hsl(45,30%,70%)] shrink-0" /> :
                          <Trophy className="w-4 h-4 text-[hsl(25,50%,55%)] shrink-0" />
                        )}
                      </div>
                      <RankChangeIndicator currentRank={rank} previousRank={entry.previous_rank} />
                    </div>

                    {/* Score */}
                    <div className={cn(
                      "font-bold text-sm md:text-lg shrink-0",
                      rank === 1 && "gradient-text-gold"
                    )}>
                      {formatMoney(entry.best_money_won)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results count */}
          {!loading && filteredEntries.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Showing top {filteredEntries.length} players
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

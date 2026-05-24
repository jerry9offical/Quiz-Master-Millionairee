import { useState, useEffect } from 'react';
import { Lock, Crown, Trophy, Medal, Globe, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedPricing } from '@/hooks/useLocalizedPricing';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PreviewEntry {
  rank: number;
  name: string;
  score: number;
  country_code: string | null;
  user_id: string;
}

interface LockedLeaderboardCardProps {
  onUnlock: () => void;
}

const getFlagUrl = (countryCode: string) =>
  `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const COUNTRY_OPTIONS = [
  { value: 'all', label: '🌍 All Countries' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'IN', label: '🇮🇳 India' },
];

const VISIBLE_COUNT = 10;
const BLURRED_PLACEHOLDERS = 8; // fake blurred rows after top 10

export function LockedLeaderboardCard({ onUnlock }: LockedLeaderboardCardProps) {
  const pricing = useLocalizedPricing();
  const { user } = useAuth();
  const [entries, setEntries] = useState<PreviewEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [countryFilter, setCountryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [period]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leaderboard_entries')
        .select('user_id, best_money_won')
        .eq('period', period)
        .is('category', null)
        .order('best_money_won', { ascending: false })
        .limit(VISIBLE_COUNT);

      if (data && data.length > 0) {
        const userIds = data.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('leaderboard_profiles')
          .select('user_id, name, country_code')
          .in('user_id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setEntries(data.map((e: any, i: number) => ({
          rank: i + 1,
          name: profileMap.get(e.user_id)?.name || 'Anonymous',
          score: e.best_money_won,
          country_code: profileMap.get(e.user_id)?.country_code || null,
          user_id: e.user_id,
        })));
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  const filteredEntries = countryFilter === 'all'
    ? entries
    : entries.filter(e => e.country_code === countryFilter);

  const userRank = user ? filteredEntries.findIndex(e => e.user_id === user.id) : -1;

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6">
      {/* User rank banner */}
      {user && userRank >= 0 && (
        <div className="mb-4 p-3 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center font-bold text-lg">
              {userRank + 1}
            </div>
            <p className="font-semibold text-sm">Your Rank: <span className="gradient-text-gold">#{userRank + 1}</span></p>
          </div>
          <p className="font-bold gradient-text-gold">{formatMoney(filteredEntries[userRank].score)}</p>
        </div>
      )}

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-primary/20">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-accent data-[state=active]:text-background text-xs md:text-sm">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-accent data-[state=active]:text-background text-xs md:text-sm">
            Monthly
          </TabsTrigger>
        </TabsList>

        {/* Country Filter */}
        <div className="mb-4">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="bg-primary/20 border-primary/30 text-sm h-9">
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
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No rankings yet. Be the first to play!</p>
            </div>
          ) : (
            <>
              {/* Visible Top 10 */}
              <div className="space-y-1.5">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.rank}
                    className={cn(
                      "flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl transition-all",
                      entry.user_id === user?.id && "ring-1 ring-accent/50 bg-accent/10",
                      entry.rank === 1 && "bg-gradient-to-r from-accent/20 to-transparent border border-accent/30",
                      entry.rank === 2 && "bg-gradient-to-r from-[hsl(45,30%,70%)]/10 to-transparent",
                      entry.rank === 3 && "bg-gradient-to-r from-[hsl(25,50%,55%)]/10 to-transparent",
                      entry.rank > 3 && "bg-primary/10",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      entry.rank === 1 && "bg-accent text-background",
                      entry.rank === 2 && "bg-[hsl(45,30%,70%)] text-background",
                      entry.rank === 3 && "bg-[hsl(25,50%,55%)] text-background",
                      entry.rank > 3 && "bg-primary/30 text-foreground",
                    )}>
                      {entry.rank}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {entry.country_code && entry.country_code !== 'UN' ? (
                        <img
                          src={getFlagUrl(entry.country_code)}
                          alt={`${entry.country_code} flag`}
                          className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                        />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-semibold truncate text-sm">{entry.name}</span>
                      {entry.rank === 1 && <Crown className="w-4 h-4 text-accent shrink-0" />}
                      {entry.rank === 2 && <Medal className="w-4 h-4 text-[hsl(45,30%,70%)] shrink-0" />}
                      {entry.rank === 3 && <Trophy className="w-4 h-4 text-[hsl(25,50%,55%)] shrink-0" />}
                    </div>
                    <span className={cn("font-bold text-sm shrink-0", entry.rank === 1 && "gradient-text-gold")}>
                      {formatMoney(entry.score)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Blurred rows 11–18 */}
              <div className="mt-2 space-y-1.5 relative">
                {[...Array(BLURRED_PLACEHOLDERS)].map((_, i) => (
                  <div
                    key={`blur-${i}`}
                    className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-primary/15 blur-[5px] select-none"
                  >
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {VISIBLE_COUNT + i + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-muted-foreground text-sm">Player Name</span>
                    </div>
                    <span className="font-bold text-sm text-muted-foreground">$0</span>
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/80 pointer-events-none rounded-xl" />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Unlock CTA */}
      <div className="flex flex-col items-center pt-6 pb-2">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full animate-pulse" />
          <div className="relative p-3 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/50 lock-icon-glow">
            <Lock className="w-7 h-7 text-accent" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-center mb-1 gradient-text-gold">
          Unlock Full Leaderboard
        </h3>
        <p className="text-muted-foreground text-center text-sm max-w-xs mb-4">
          See where you rank, track rank changes, all-time stats & category filters
        </p>

        <button
          className={cn(
            "relative overflow-hidden font-bold rounded-xl px-6 py-3",
            "bg-gradient-to-r from-[hsl(48,100%,55%)] via-[hsl(48,100%,65%)] to-[hsl(45,100%,55%)]",
            "text-[hsl(260,80%,10%)]",
            "shadow-[0_4px_20px_hsl(48_100%_60%/0.4)]",
            "hover:shadow-[0_8px_30px_hsl(48_100%_60%/0.5)]",
            "hover:-translate-y-0.5 active:translate-y-0",
            "transition-all duration-300",
            "unlock-btn-shimmer"
          )}
          onClick={onUnlock}
        >
          <span className="relative z-10 flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4" />
            Unlock Leaderboards
          </span>
        </button>
      </div>
    </div>
  );
}

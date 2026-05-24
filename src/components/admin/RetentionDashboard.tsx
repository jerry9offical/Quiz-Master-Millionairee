import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, RefreshCw, TrendingUp, CalendarDays, Repeat, Globe, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RetentionStats {
  total_users: number;
  total_players: number;
  active_today: number;
  active_7d: number;
  active_30d: number;
  returning_players: number;
  new_today: number;
  daily_activity: { day: string; players: number; games: number }[] | null;
  top_returners: {
    name: string;
    country_code: string | null;
    days_active: number;
    total_games: number;
    best_score: number;
    last_played: string;
  }[] | null;
}

const chartConfig: ChartConfig = {
  players: { label: 'Players', color: 'hsl(var(--accent))' },
  games: { label: 'Games', color: 'hsl(var(--chart-2))' },
};

const getFlagUrl = (cc: string) => `https://flagcdn.com/w40/${cc.toLowerCase()}.png`;

export function RetentionDashboard() {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('get_player_retention_stats');
    if (err) {
      setError(err.message);
    } else {
      setStats(data as unknown as RetentionStats);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load retention stats: {error}</p>
        <Button variant="outline" onClick={fetchStats} className="mt-4">Retry</Button>
      </div>
    );
  }

  const retentionRate = stats.total_players > 0
    ? Math.round((stats.returning_players / stats.total_players) * 100)
    : 0;

  const dailyData = (stats.daily_activity || []).map(d => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text-gold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Player Retention
        </h2>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats.total_users} badge="All" />
        <MetricCard icon={<CalendarDays className="w-5 h-5" />} label="Active Today" value={stats.active_today} badge="DAU" />
        <MetricCard icon={<Repeat className="w-5 h-5" />} label="Returning Players" value={stats.returning_players} badge={`${retentionRate}%`} />
        <MetricCard icon={<UserPlus className="w-5 h-5" />} label="New Today" value={stats.new_today} badge="New" />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.active_7d}</p>
          <p className="text-xs text-muted-foreground">WAU (7d)</p>
        </div>
        <div className="bg-primary/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.active_30d}</p>
          <p className="text-xs text-muted-foreground">MAU (30d)</p>
        </div>
        <div className="bg-primary/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.total_players}</p>
          <p className="text-xs text-muted-foreground">Total Players</p>
        </div>
      </div>

      {/* Daily Activity Chart */}
      {dailyData.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Daily Activity (14 days)
          </h3>
          <ChartContainer config={chartConfig} className="h-56">
            <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="players" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} name="Players" />
              <Bar dataKey="games" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} name="Games" />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Top Returning Players */}
      {stats.top_returners && stats.top_returners.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Top Returning Players
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs text-muted-foreground px-2 pb-1 border-b border-primary/20">
              <span>Player</span>
              <span className="text-center">Days</span>
              <span className="text-center">Games</span>
              <span className="text-center">Best</span>
            </div>
            {stats.top_returners.map((player, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-2 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  {player.country_code && player.country_code !== 'UN' ? (
                    <img src={getFlagUrl(player.country_code)} alt="" className="w-5 h-3.5 rounded-sm object-cover flex-shrink-0" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{player.name || 'Anonymous'}</span>
                </div>
                <span className="text-sm text-center font-semibold text-accent">{player.days_active}</span>
                <span className="text-sm text-center text-muted-foreground">{player.total_games}</span>
                <span className="text-sm text-center text-accent font-medium">
                  ${player.best_score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: number; badge: string }) {
  return (
    <div className="glass-card rounded-xl p-4 relative overflow-hidden">
      <Badge className="absolute top-2 right-2 bg-primary/50 text-accent border-0 text-[10px]">{badge}</Badge>
      <div className="text-accent mb-1.5 opacity-70">{icon}</div>
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

import { Crown, Award, Medal, Star, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HofEntry {
  user_id: string;
  display_name: string;
  country_code: string | null;
  money_won: number;
  rank: number;
  category?: string;
}

const getFlagUrl = (countryCode: string) =>
  `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

function getBadgeIcon(rank: number) {
  if (rank === 1) return <Crown className="w-6 h-6 text-accent" />;
  if (rank <= 3) return <Award className="w-6 h-6 text-[hsl(220,30%,80%)]" />;
  return <Medal className="w-6 h-6 text-[hsl(45,80%,60%)]" />;
}

interface Props {
  entry: HofEntry;
  categoryLabels?: Record<string, string>;
}

export function HofChampionCard({ entry, categoryLabels }: Props) {
  const isFirst = entry.rank === 1;
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        "hall-of-fame-card flex items-center gap-4 p-5 rounded-xl transition-all duration-500",
        "bg-gradient-to-r from-primary/20 to-transparent border",
        isFirst && "border-accent/40 from-accent/10",
        !isFirst && isTop3 && "border-[hsl(220,30%,60%)]/30",
        !isTop3 && "border-[hsl(45,60%,50%)]/30",
        "hover:scale-[1.02] hover:border-accent/50"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
        isFirst && "bg-accent text-background",
        !isFirst && isTop3 && "bg-[hsl(220,30%,70%)] text-background",
        !isTop3 && "bg-primary/30"
      )}>
        {entry.rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {entry.country_code && entry.country_code !== 'UN' ? (
            <img
              src={getFlagUrl(entry.country_code)}
              alt={`${entry.country_code} flag`}
              className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
            />
          ) : (
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className={cn("font-bold text-lg truncate", isFirst && "gradient-text-gold")}>
            {entry.display_name}
          </span>
          {getBadgeIcon(entry.rank)}
        </div>
        {entry.category && categoryLabels && (
          <Badge variant="outline" className="mt-1 text-xs capitalize border-accent/30 text-accent">
            {categoryLabels[entry.category] || entry.category}
          </Badge>
        )}
      </div>

      <div className={cn("text-xl font-bold shrink-0", isFirst && "gradient-text-gold")}>
        {formatMoney(entry.money_won)}
      </div>
    </div>
  );
}

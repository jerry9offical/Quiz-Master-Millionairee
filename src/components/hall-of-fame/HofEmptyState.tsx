import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon: LucideIcon;
  message: string;
  onUpgrade?: () => void;
}

export function HofEmptyState({ icon: Icon, message, onUpgrade }: Props) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="mb-4">{message}</p>
      {onUpgrade && (
        <Button onClick={onUpgrade} className="bg-accent text-background hover:bg-accent/90">
          Upgrade to compete
        </Button>
      )}
    </div>
  );
}

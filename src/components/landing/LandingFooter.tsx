import { Crown } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-border/30 py-8 px-6">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-accent" />
          <span className="font-bold gradient-text-gold">QuizMaster Millionaire</span>
        </div>
        <div className="text-sm text-muted-foreground">
          © 2025 QuizMaster. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

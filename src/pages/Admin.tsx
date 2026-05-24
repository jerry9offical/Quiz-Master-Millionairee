import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Shield, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RetentionDashboard } from '@/components/admin/RetentionDashboard';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [rebuilding, setRebuilding] = useState(false);

  const handleRebuildLeaderboards = async () => {
    setRebuilding(true);
    try {
      const { error } = await supabase.functions.invoke('rebuild-leaderboards');
      if (error) throw error;
      toast({ title: 'Leaderboards rebuilt', description: 'All leaderboard entries have been recalculated from quiz data.' });
    } catch (e: any) {
      toast({ title: 'Rebuild failed', description: e.message || 'Something went wrong.', variant: 'destructive' });
    }
    setRebuilding(false);
  };
  
  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/categories" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <Crown className="w-6 h-6 text-accent" />
          <span className="font-bold gradient-text-gold">QuizMaster</span>
        </Link>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
          <p className="text-muted-foreground">Manage questions and users</p>
        </div>
        
        <div className="glass-card rounded-2xl p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/20 border border-primary/30">
            <div>
              <h3 className="font-semibold">Rebuild Leaderboards</h3>
              <p className="text-sm text-muted-foreground">Recalculate all rankings from quiz run data</p>
            </div>
            <Button
              onClick={handleRebuildLeaderboards}
              disabled={rebuilding}
              className="btn-gold"
            >
              {rebuilding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {rebuilding ? 'Rebuilding...' : 'Rebuild'}
            </Button>
          </div>

          {/* Retention Analytics */}
          <RetentionDashboard />

          <p className="text-center text-muted-foreground text-sm">More admin features coming soon.</p>
        </div>
      </main>
    </div>
  );
}

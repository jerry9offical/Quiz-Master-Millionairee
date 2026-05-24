import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Crown, Settings as SettingsIcon, ArrowLeft, LogOut } from 'lucide-react';

export default function Settings() {
  const { profile, signOut } = useAuth();
  
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

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <SettingsIcon className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
        </div>
        
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Account</h3>
            <p className="text-muted-foreground">{profile?.email}</p>
            <p className="text-sm text-accent capitalize mt-1">{profile?.access_tier} Plan</p>
          </div>
          
          <div className="pt-6 border-t border-border">
            <Button onClick={signOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

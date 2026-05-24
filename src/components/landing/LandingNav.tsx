import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CTAButton } from '@/components/CTAButton';
import { MusicToggle } from '@/components/MusicToggle';
import { Button } from '@/components/ui/button';
import { Crown, LogOut } from 'lucide-react';

export function LandingNav() {
  const { user, signOut } = useAuth();

  return (
    <nav className="relative z-10 px-6 py-4 md:px-12">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold gradient-text-gold">QuizMaster</span>
        </div>
        <div className="flex items-center gap-4">
          <MusicToggle />
          


          <Link to="/categories">
            <CTAButton label="Play Now" subtext="No signup needed" />
          </Link>
          {user ?
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent">

              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button> :

          <Link to="/auth">
              <CTAButton variant="secondary" label="Sign In" />
            </Link>
          }
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold gradient-text-gold">QuizMaster</span>
        </div>
        <div className="flex items-center gap-3">
          <MusicToggle />
          <Link to="/categories">
            <CTAButton label="Play Now" subtext="No signup needed" size="sm" />
          </Link>
        </div>
      </div>
    </nav>);

}
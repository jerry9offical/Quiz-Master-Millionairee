import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CTAButton } from '@/components/CTAButton';
import { PricingModal } from '@/components/PricingModal';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';
import { usePaymentModal } from '@/hooks/usePaymentModal';
import { 
  Crown, ArrowLeft, Dna, FlaskConical, Bug, Database, Stethoscope,
  GraduationCap, BookOpen, Atom, Calculator, Brain, Lock, Trophy, Swords,
  ShieldCheck, AlertTriangle, Users, LogOut
} from 'lucide-react';

const CATEGORIES = [
  { id: 'biology', name: 'Biology', icon: Dna, color: 'from-green-500/20 to-green-600/10' },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'from-blue-500/20 to-blue-600/10' },
  { id: 'microbiology', name: 'Microbiology', icon: Bug, color: 'from-purple-500/20 to-purple-600/10' },
  { id: 'data_science', name: 'Data Science', icon: Database, color: 'from-cyan-500/20 to-cyan-600/10' },
  { id: 'medicine', name: 'Medicine', icon: Stethoscope, color: 'from-red-500/20 to-red-600/10' },
  { id: 'gmat', name: 'GMAT', icon: GraduationCap, color: 'from-orange-500/20 to-orange-600/10' },
  { id: 'gre', name: 'GRE', icon: GraduationCap, color: 'from-yellow-500/20 to-yellow-600/10' },
  { id: 'a_level', name: 'A-Level', icon: BookOpen, color: 'from-indigo-500/20 to-indigo-600/10' },
  { id: 'gcse', name: 'GCSE', icon: BookOpen, color: 'from-pink-500/20 to-pink-600/10' },
  { id: 'general_knowledge', name: 'General Knowledge', icon: Brain, color: 'from-violet-500/20 to-violet-600/10' },
  { id: 'physics', name: 'Physics', icon: Atom, color: 'from-amber-500/20 to-amber-600/10' },
  { id: 'mathematics', name: 'Mathematics', icon: Calculator, color: 'from-emerald-500/20 to-emerald-600/10' },
  { id: 'sports', name: 'Sports', icon: Trophy, color: 'from-rose-500/20 to-rose-600/10' },
];

export default function Categories() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    showPricingModal,
    showCheckout,
    openPricingModal,
    openCheckout,
    closePricingModal,
    closeCheckout,
  } = usePaymentModal();
  
  const canPlayWWTBAM = profile?.access_tier === 'premium';
  const isLoggedIn = !!user;

  const handleCategoryClick = (categoryId: string) => {
    // Anyone can play categories — no login required
    navigate(`/quiz/category/${categoryId}`);
  };

  const handleMillionaireArenaClick = () => {
    if (!canPlayWWTBAM) {
      openCheckout('premium');
      return;
    }
    navigate('/quiz/wwtbam');
  };

  const handleFifaExamClick = () => {
    if (!canPlayWWTBAM) {
      openCheckout('premium');
      return;
    }
    navigate('/fifa-exam');
  };

  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      {/* Spotlight effects */}
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-gold w-64 h-64 bottom-20 right-20 opacity-20" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <Crown className="w-6 h-6 text-accent" />
          <span className="font-bold gradient-text-gold">QuizMaster</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/leaderboards" className="text-foreground/70 hover:text-foreground transition-colors hidden md:block">
            Leaderboards
          </Link>
          {isLoggedIn && (
            <>
              <Link to="/analytics" className="text-foreground/70 hover:text-foreground transition-colors hidden md:block">
                Analytics
              </Link>
              <Link to="/settings" className="text-foreground/70 hover:text-foreground transition-colors hidden md:block">
                Settings
              </Link>
            </>
          )}
          {isLoggedIn ? (
            <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <CTAButton variant="secondary" label="Sign In" size="sm" />
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Category</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select a category to start your quiz. Answer 15 questions correctly to win $1,000,000!
          </p>
          
          {/* Social proof */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-accent">1,248</span> players played today
            </span>
          </div>

          {/* Not logged in notice */}
          {!isLoggedIn && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
              <span className="text-sm text-muted-foreground">
                🎮 Playing as <span className="font-semibold text-foreground">Guest</span> — 
                <Link to="/auth" className="text-accent hover:underline ml-1">Sign in to save scores</Link>
              </span>
            </div>
          )}
        </div>

        {/* Category Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="glass-card rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-purple-glow cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">15 questions • 30s each</p>
              </button>
            );
          })}
        </div>

        {/* Millionaire Arena Card */}
        <div className="mb-12">
          <button
            onClick={handleMillionaireArenaClick}
            className={`w-full glass-card rounded-2xl p-8 border-2 transition-all duration-300 text-left ${
              canPlayWWTBAM 
                ? 'border-accent hover:shadow-gold-glow hover:scale-[1.01] cursor-pointer' 
                : 'border-border hover:border-accent/30 cursor-pointer'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  canPlayWWTBAM 
                    ? 'bg-gradient-to-br from-accent/40 to-accent/20' 
                    : 'bg-gradient-to-br from-primary/30 to-primary/10'
                }`}>
                  {canPlayWWTBAM ? (
                    <Crown className="w-8 h-8 text-accent" />
                  ) : (
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold gradient-text-gold">Millionaire Arena</h2>
                    {canPlayWWTBAM ? (
                      <Crown className="w-5 h-5 text-accent" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">The ultimate challenge.</strong> Questions from ALL categories mixed together.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-accent">
                      <Swords className="w-4 h-4" />
                      <span>Compete globally</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent">
                      <Trophy className="w-4 h-4" />
                      <span>Climb the prize ladder</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent">
                      <Crown className="w-4 h-4" />
                      <span>Monthly rewards for top players</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:flex-shrink-0">
                {canPlayWWTBAM ? (
                  <div className="premium-badge flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Premium Access
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2 px-4 py-2 rounded-xl bg-wrong/10 border border-wrong/30">
                      <Lock className="w-4 h-4 text-wrong" />
                      <span className="text-sm font-bold text-wrong">Premium Required</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Compete for Monthly Hall of Fame</p>
                    <CTAButton 
                      label="Unlock Premium"
                      subtext="Subscription • Hall of Fame eligible"
                    />
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* FIFA Agent Exam Practice Card */}
        <div className="mb-12">
          <button
            onClick={handleFifaExamClick}
            className={`w-full glass-card rounded-2xl p-8 border-2 transition-all duration-300 text-left ${
              canPlayWWTBAM 
                ? 'border-accent hover:shadow-gold-glow hover:scale-[1.01] cursor-pointer' 
                : 'border-border hover:border-accent/30 cursor-pointer'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  canPlayWWTBAM 
                    ? 'bg-gradient-to-br from-accent/40 to-accent/20' 
                    : 'bg-gradient-to-br from-primary/30 to-primary/10'
                }`}>
                  {canPlayWWTBAM ? (
                    <ShieldCheck className="w-8 h-8 text-accent" />
                  ) : (
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold gradient-text-gold">FIFA Agent Exam Practice</h2>
                    {canPlayWWTBAM ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        Premium Exclusive
                      </span>
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Prepare for the FIFA Football Agent Examination.</strong> Comprehensive mock exams with timed practice.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-accent">
                      <ShieldCheck className="w-4 h-4" />
                      <span>20 questions per exam</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent">
                      <Trophy className="w-4 h-4" />
                      <span>60-minute timed mode</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent">
                      <BookOpen className="w-4 h-4" />
                      <span>Explanations included</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Not affiliated with or endorsed by FIFA.
                  </p>
                </div>
              </div>
              <div className="md:flex-shrink-0">
                {canPlayWWTBAM ? (
                  <div className="premium-badge flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Premium Access
                  </div>
                ) : (
                  <CTAButton 
                    label="Unlock Premium"
                    subtext="Premium • Full exam preparation"
                  />
                )}
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Pricing Modal */}
      <PricingModal
        open={showPricingModal}
        onOpenChange={closePricingModal}
        onSelectTier={openCheckout}
        title="Unlock Unlimited Access"
        description="Upgrade to continue playing without daily limits."
      />

      {/* Embedded Checkout Modal */}
      {showCheckout && (
        <EmbeddedCheckout
          tier={showCheckout}
          onClose={closeCheckout}
        />
      )}
    </div>
  );
}

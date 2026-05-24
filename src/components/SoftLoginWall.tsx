import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Crown, Mail, Lock, User, Loader2, Trophy, TrendingUp, Shield } from 'lucide-react';
import { z } from 'zod';

const HEADLINES = [
  "🔥 Save your score & see how you rank",
  "💪 You're doing well! Don't lose your progress",
  "🏆 One step left to prove you're elite",
];

interface SoftLoginWallProps {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSuccess: () => void;
  currentScore: number;
  questionsAnswered: number;
  canSkip: boolean;
}

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function SoftLoginWall({ open, onClose, onSkip, onSuccess, currentScore, questionsAnswered, canSkip }: SoftLoginWallProps) {
  const { signUp, signIn } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const headline = HEADLINES[Math.floor(Math.random() * HEADLINES.length)];

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.redirected) return;
      if (result.error) {
        setError(result.error.message || 'Failed to sign in with Google');
      } else {
        onSuccess();
      }
    } catch {
      setError('An unexpected error occurred.');
    }
    setOauthLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const validation = signUpSchema.safeParse({ name, email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(error.message.includes('already registered')
            ? 'This email is already registered. Try signing in.'
            : error.message);
        } else {
          onSuccess();
        }
      } else {
        const validation = signInSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message.includes('Invalid login')
            ? 'Invalid email or password.'
            : error.message);
        } else {
          onSuccess();
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass-card border-accent/30 max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full animate-pulse" />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/50">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl gradient-text-gold">
            {headline}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Create a free account to save your score, continue playing, and unlock competitive features.
          </DialogDescription>
        </DialogHeader>

        {/* Current progress teaser */}
        <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-primary/20 border border-accent/20 my-2">
          <div className="text-center">
            <div className="text-xl font-bold gradient-text-gold">${currentScore.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Current Score</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl font-bold text-accent">{questionsAnswered}/15</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
        </div>

        {!showEmailForm ? (
          <div className="space-y-3 mt-2">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={oauthLoading}
              className="w-full py-6 bg-foreground/95 hover:bg-foreground text-background font-semibold text-base"
            >
              {oauthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Email option */}
            <Button
              variant="outline"
              onClick={() => setShowEmailForm(true)}
              className="w-full py-6 bg-secondary/50 border-border hover:bg-secondary text-base"
            >
              <Mail className="w-5 h-5 mr-2" />
              Continue with Email
            </Button>

            {/* Skip */}
            {canSkip && (
              <button
                onClick={onSkip}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground/70 transition-colors py-2"
              >
                Maybe later
                <span className="block text-xs text-muted-foreground/60 mt-0.5">
                  ⚠️ Your score won't be saved
                </span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="wall-name" className="text-sm">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="wall-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="wall-email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="wall-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wall-password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="wall-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-wrong/10 border border-wrong/30 text-wrong text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full btn-gold py-5" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowEmailForm(false)} className="text-sm text-muted-foreground hover:text-foreground">
                ← Back
              </button>
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm text-accent hover:underline">
                {isSignUp ? 'Already have an account?' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        {/* Value props */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
          <div className="text-center">
            <Trophy className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] text-muted-foreground">Save Scores</span>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] text-muted-foreground">Track Progress</span>
          </div>
          <div className="text-center">
            <Shield className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] text-muted-foreground">Compete Globally</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

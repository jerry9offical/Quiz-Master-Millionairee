import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Mail, Lock, User, Loader2, ArrowLeft, Trophy, TrendingUp, Target, Unlock } from 'lucide-react';
import { z } from 'zod';
import { lovable } from '@/integrations/lovable/index';
import { fireSignupConversion, fireLoginEvent, fireGoogleLoginEvent } from '@/lib/gtag';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const BENEFITS = [
  { icon: Trophy, label: 'Appear on the Global Leaderboard' },
  { icon: TrendingUp, label: 'Track Your Personal Best' },
  { icon: Target, label: 'Compete for Monthly Hall of Fame Rewards' },
  { icon: Unlock, label: 'Unlock Premium Challenges' },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setError('');
    setOauthLoading(provider);

    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const intent = params.get('intent');
      const oauthRedirect = next
        ? `${window.location.origin}/auth?next=${encodeURIComponent(next)}${intent ? `&intent=${encodeURIComponent(intent)}` : ''}`
        : window.location.origin;

      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: oauthRedirect,
      });

      if (result.redirected) {
        if (provider === 'google') fireGoogleLoginEvent();
        return;
      }

      if (result.error) {
        setError(result.error.message || `Failed to sign in with ${provider}`);
      }
    } catch {
      setError(`An unexpected error occurred with ${provider} sign-in.`);
    }

    setOauthLoading(null);
  };

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const intent = params.get('intent');
      if (next) {
        const redirectUrl = intent ? `${next}?intent=${intent}` : next;
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/categories', { replace: true });
      }
    }
  }, [user, navigate]);

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
            ? 'This email is already registered. Please sign in instead.'
            : error.message);
        } else {
          fireSignupConversion();
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
            ? 'Invalid email or password. Please try again.'
            : error.message);
        } else {
          fireLoginEvent();
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  const anyLoading = loading || !!oauthLoading;

  return (
    <div className="min-h-screen stage-background relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Spotlight effects */}
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-gold w-64 h-64 bottom-20 right-20 opacity-20" />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Free plays expired banner */}
        {new URLSearchParams(window.location.search).get('expired') === 'true' && (
          <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-center mb-4">
            <p className="text-sm font-medium text-accent">🔥 You've used all 3 free plays today!</p>
            <p className="text-xs text-muted-foreground mt-1">Sign up or upgrade to keep playing.</p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 sm:p-8 animate-scale-in space-y-6">

          {/* ── Conversion Header ── */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 mb-1">
              <Crown className="w-9 h-9 text-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text-gold leading-tight">
              {isSignUp ? 'Create Your Free Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isSignUp
                ? "You're one step away from competing globally."
                : 'Ready to win $1,000,000?'}
            </p>
            {isSignUp && (
              <p className="text-xs text-muted-foreground/70">
                No spam. No unnecessary emails. Just competition.
              </p>
            )}
          </div>

          {/* ── Benefits (signup only) ── */}
          {isSignUp && (
            <div className="grid grid-cols-1 gap-2.5">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/[0.06] border border-accent/15"
                >
                  <div className="shrink-0 p-1.5 rounded-lg bg-accent/15">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm text-foreground/90">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Auth Options ── */}
          {!showEmailForm ? (
            <div className="space-y-3">
              {/* Google – primary */}
              <Button
                type="button"
                className="w-full py-6 text-base font-semibold bg-foreground/95 hover:bg-foreground text-background"
                onClick={() => handleOAuthSignIn('google')}
                disabled={anyLoading}
              >
                {oauthLoading === 'google' ? (
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

              {/* Apple – secondary strong */}
              <Button
                type="button"
                className="w-full py-6 text-base font-semibold bg-foreground/80 hover:bg-foreground/90 text-background"
                onClick={() => handleOAuthSignIn('apple')}
                disabled={anyLoading}
              >
                {oauthLoading === 'apple' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email – tertiary */}
              <Button
                type="button"
                variant="outline"
                className="w-full py-5 bg-secondary/50 border-border hover:bg-secondary text-sm"
                onClick={() => setShowEmailForm(true)}
                disabled={anyLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Continue with Email
              </Button>
            </div>
          ) : (
            /* ── Email Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 bg-secondary/50 border-border" disabled={loading} />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-wrong/10 border border-wrong/30 text-wrong text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full btn-gold py-5" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setShowEmailForm(false); setError(''); }} className="text-muted-foreground hover:text-foreground">
                  ← Back
                </button>
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-accent hover:underline font-medium">
                  {isSignUp ? 'Already have an account?' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* ── Toggle (when not in email form) ── */}
          {!showEmailForm && (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-accent hover:underline font-medium"
                disabled={anyLoading}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          )}

          {/* ── Social Proof ── */}
          <p className="text-center text-xs text-muted-foreground/60 pt-1">
            🔥 Over 1,200 players competing today.
          </p>
        </div>
      </div>
    </div>
  );
}

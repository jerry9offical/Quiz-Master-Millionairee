import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Crown, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const tierParam = searchParams.get('tier');
    const gateway = searchParams.get('gateway');
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (gateway === 'paystack' && reference) {
      verifyPaystackPayment(reference, tierParam);
    } else if (sessionId) {
      verifyStripePayment(sessionId, tierParam);
    } else if (reference) {
      // Paystack redirect without explicit gateway param
      verifyPaystackPayment(reference, tierParam);
    } else {
      setStatus('error');
      setMessage('No payment session found.');
    }
  }, [searchParams]);

  const verifyStripePayment = async (sessionId: string, tierParam: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      if (data.success) {
        setStatus('success');
        setTier(data.tier || tierParam);
        setMessage(`Welcome to ${data.tier === 'premium' ? 'Premium' : 'Standard'}!`);
        await refreshProfile();
      } else {
        setStatus('error');
        setMessage(data.message || 'Payment verification failed.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage('Failed to verify payment. Please contact support.');
    }
  };

  const verifyPaystackPayment = async (reference: string, tierParam: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference },
      });
      if (error) throw error;
      if (data.success) {
        setStatus('success');
        setTier(data.tier || tierParam);
        setMessage(`Welcome to ${data.tier === 'premium' ? 'Premium' : 'Standard'}!`);
        await refreshProfile();
      } else {
        setStatus('error');
        setMessage(data.message || 'Payment verification failed.');
      }
    } catch (error) {
      console.error('Paystack verification error:', error);
      setStatus('error');
      setMessage('Failed to verify payment. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen stage-background relative overflow-hidden flex items-center justify-center">
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-gold w-64 h-64 bottom-20 right-20 opacity-20" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold gradient-text-gold">QuizMaster</span>
        </Link>

        <div className="glass-card rounded-2xl p-8">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-accent mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold mb-4">{message}</h1>
              <p className="text-muted-foreground">Please wait while we confirm your purchase...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full" />
                <CheckCircle className="w-20 h-20 text-accent mx-auto relative z-10" />
              </div>
              <h1 className="text-3xl font-bold gradient-text-gold mb-4">{message}</h1>
              <p className="text-muted-foreground mb-6">
                {tier === 'premium' 
                  ? "You now have full access to Millionaire Arena, leaderboards, and top-tier rewards!" 
                  : "You now have full access to leaderboards and monthly reward eligibility!"}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/leaderboards')}
                  className="w-full bg-gradient-to-r from-[hsl(48,100%,55%)] to-[hsl(45,100%,55%)] text-[hsl(260,80%,10%)] font-bold"
                >
                  View Leaderboards
                </Button>
                <Button variant="outline" onClick={() => navigate('/categories')} className="w-full">
                  Start Playing
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/leaderboards')} variant="outline" className="w-full">
                  Back to Leaderboards
                </Button>
                <Button variant="ghost" onClick={() => navigate('/settings')} className="w-full">
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const stripePromise = loadStripe('pk_live_51StVlpRsiGz4HkfoEZ5bms8XJZZhwPBAGLp58gQwbeTMXleenv4ucT5wrQQtGy2vl8svw3WzAqhN4IIIZv4wlPZs00pgkRQyjv');

interface EmbeddedCheckoutProps {
  tier: 'standard' | 'premium';
  onClose: () => void;
}

export function EmbeddedCheckout({ tier, onClose }: EmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned');
      }

      return data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize checkout';
      setError(message);
      toast({
        title: "Checkout Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  }, [tier]);

  const options = { fetchClientSecret };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="relative w-full max-w-lg p-6 glass-card border-destructive/30 rounded-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto glass-card border-accent/30 rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground bg-background/50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold gradient-text-gold mb-4 text-center">
            {tier === 'standard' ? 'Standard Access - $10' : 'Premium Access - $20'}
          </h2>
          <div className="min-h-[400px]">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <StripeEmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

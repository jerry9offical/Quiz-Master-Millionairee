import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaystackCheckoutProps {
  tier: 'standard' | 'premium';
  onClose: () => void;
}

export function PaystackCheckout({ tier, onClose }: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaystackCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
        body: { tier },
      });

      if (error) throw new Error(error.message || 'Failed to create checkout');

      if (!data?.authorization_url) {
        throw new Error('No payment URL returned');
      }

      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(message);
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const amount = tier === 'standard' ? '₦5,000' : '₦10,000';
  const planName = tier === 'standard' ? 'Standard Access' : 'Premium Access';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md glass-card border-accent/30 rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground bg-background/50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold gradient-text-gold mb-2">
            {planName}
          </h2>
          <div className="text-3xl font-bold text-accent mb-1">{amount}</div>
          <p className="text-muted-foreground text-sm mb-6">One-time payment</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePaystackCheckout}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-[hsl(145,60%,45%)] to-[hsl(145,60%,35%)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Pay with Paystack
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure payment powered by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}

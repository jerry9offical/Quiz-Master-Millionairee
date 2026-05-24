import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveCountryCode, setCountryOverride } from '@/hooks/useCountryDetection';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export type PaymentGateway = 'stripe' | 'paystack';
export type Currency = 'USD' | 'NGN';

interface PricingConfig {
  currency: Currency;
  currencySymbol: string;
  gateway: PaymentGateway;
  standard: { amount: number; display: string };
  premium: { amount: number; display: string };
  isNigeria: boolean;
  switchCurrency: () => void;
}

// Simple external store to force re-renders across all consumers
let overrideVersion = 0;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const handler = () => { overrideVersion++; listeners.forEach(l => l()); };
  window.addEventListener('country-override-changed', handler);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('country-override-changed', handler);
  };
}

function getSnapshot() {
  return overrideVersion;
}

export function useLocalizedPricing(): PricingConfig {
  const { profile, user, refreshProfile } = useAuth();

  // Re-render when override changes
  useSyncExternalStore(subscribe, getSnapshot);

  const effectiveCode = getEffectiveCountryCode(profile?.country_code);
  const isNigeria = effectiveCode === 'NG';

  const switchCurrency = useCallback(async () => {
    if (isNigeria) {
      // Switch to USD — set override to US
      setCountryOverride('US', 'United States');
      if (user) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('profiles').update({
          country_code: 'US',
          country_name: 'United States',
          country_source: 'manual',
        } as any).eq('user_id', user.id);
        refreshProfile();
      }
    } else {
      // Switch to NGN — set override to NG
      setCountryOverride('NG', 'Nigeria');
      if (user) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('profiles').update({
          country_code: 'NG',
          country_name: 'Nigeria',
          country_source: 'manual',
        } as any).eq('user_id', user.id);
        refreshProfile();
      }
    }
  }, [isNigeria, user, refreshProfile]);

  console.log('[PRICING] Resolved:', {
    detected_country: profile?.country_code || 'none',
    selected_country: effectiveCode,
    pricing_currency: isNigeria ? 'NGN' : 'USD',
    checkout_provider: isNigeria ? 'paystack' : 'stripe',
  });

  if (isNigeria) {
    return {
      currency: 'NGN',
      currencySymbol: '₦',
      gateway: 'paystack',
      standard: { amount: 5000, display: '₦5,000' },
      premium: { amount: 10000, display: '₦10,000' },
      isNigeria: true,
      switchCurrency,
    };
  }

  return {
    currency: 'USD',
    currencySymbol: '$',
    gateway: 'stripe',
    standard: { amount: 10, display: '$10' },
    premium: { amount: 20, display: '$20' },
    isNigeria: false,
    switchCurrency,
  };
}

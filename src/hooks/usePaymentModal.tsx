import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalizedPricing, type PaymentGateway } from '@/hooks/useLocalizedPricing';
import { useNavigate } from 'react-router-dom';

export type PaymentTier = 'standard' | 'premium';

export function usePaymentModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pricing = useLocalizedPricing();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState<PaymentTier | null>(null);

  const openPricingModal = (returnPath?: string) => {
    if (!user) {
      const next = returnPath || window.location.pathname;
      navigate(`/auth?next=${encodeURIComponent(next)}&intent=unlock`);
      return;
    }
    setShowPricingModal(true);
  };

  const openCheckout = (tier: PaymentTier) => {
    if (!user) {
      navigate('/auth?next=/leaderboards&intent=unlock');
      return;
    }
    setShowPricingModal(false);
    setShowCheckout(tier);
  };

  const closePricingModal = () => setShowPricingModal(false);
  const closeCheckout = () => setShowCheckout(null);

  return {
    showPricingModal,
    showCheckout,
    openPricingModal,
    openCheckout,
    closePricingModal,
    closeCheckout,
    gateway: pricing.gateway,
    pricing,
  };
}

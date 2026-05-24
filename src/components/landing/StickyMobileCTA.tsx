import { Link } from 'react-router-dom';
import { CTAButton } from '@/components/CTAButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

export function StickyMobileCTA() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  if (!isMobile || !show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/90 backdrop-blur-md border-t border-border/50">
      <Link to="/categories" className="block">
        <CTAButton label="Take Question 1" showArrow fullWidth className="cta-glow-pulse" />
      </Link>
    </div>
  );
}

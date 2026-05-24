import { useCountryDetection } from '@/hooks/useCountryDetection';

export function CountryDetector() {
  useCountryDetection();
  return null;
}

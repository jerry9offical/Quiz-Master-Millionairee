import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CACHE_KEY = 'quizmaster_country';
const OVERRIDE_KEY = 'quizmaster_country_override';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedCountry {
  country_code: string;
  country_name: string;
  detected_at: number;
}

function getCachedCountry(): CachedCountry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedCountry = JSON.parse(raw);
    if (Date.now() - cached.detected_at > CACHE_DURATION) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedCountry(code: string, name: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    country_code: code,
    country_name: name,
    detected_at: Date.now(),
  }));
}

/** Set a manual country override (persists to localStorage) */
export function setCountryOverride(code: string, name: string) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ country_code: code, country_name: name }));
  // Also update the geo cache so everything stays consistent
  setCachedCountry(code, name);
  // Dispatch storage event so other tabs/hooks pick it up
  window.dispatchEvent(new Event('country-override-changed'));
  console.log('[PRICING] Country override set:', { country_code: code, country_name: name });
}

/** Clear the manual override (revert to geo detection) */
export function clearCountryOverride() {
  localStorage.removeItem(OVERRIDE_KEY);
  window.dispatchEvent(new Event('country-override-changed'));
}

/** Get the manual override if set */
export function getCountryOverride(): { country_code: string; country_name: string } | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get the effective country code, respecting override > profile > geo cache.
 * Used by pricing hooks and anywhere that needs the user's country.
 */
export function getEffectiveCountryCode(profileCountryCode?: string | null): string {
  // 1. Manual override always wins
  const override = getCountryOverride();
  if (override) {
    console.log('[PRICING] Using manual override country:', override.country_code);
    return override.country_code;
  }
  // 2. Profile country for logged-in users
  if (profileCountryCode) {
    console.log('[PRICING] Using profile country:', profileCountryCode);
    return profileCountryCode;
  }
  // 3. Geo cache
  const cached = getCachedCountry();
  const code = cached?.country_code || 'UN';
  console.log('[PRICING] Using geo-cached country:', code);
  return code;
}

export function useCountryDetection() {
  const { user, profile } = useAuth();
  const detecting = useRef(false);

  useEffect(() => {
    // If logged-in user already has country set, cache it and skip
    if (profile?.country_code) {
      setCachedCountry(profile.country_code, profile.country_name || '');
      return;
    }

    // Check local cache
    const cached = getCachedCountry();
    if (cached) {
      // If logged in but no country in profile, save cached to DB
      if (user && !profile?.country_code && profile) {
        saveCountryToProfile(user.id, cached.country_code, cached.country_name, 'ip');
      }
      return;
    }

    // Need to detect
    if (detecting.current) return;
    detecting.current = true;

    detectCountry().then((result) => {
      setCachedCountry(result.country_code, result.country_name);
      if (user) {
        saveCountryToProfile(user.id, result.country_code, result.country_name, result.source);
      }
    }).finally(() => {
      detecting.current = false;
    });
  }, [user, profile]);
}

async function detectCountry(): Promise<{ country_code: string; country_name: string; source: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('geo-detect');
    if (error || !data) throw new Error('Edge function failed');
    return {
      country_code: data.country_code || 'UN',
      country_name: data.country_name || 'Unknown',
      source: data.source || 'unknown',
    };
  } catch {
    return { country_code: 'UN', country_name: 'Unknown', source: 'unknown' };
  }
}

async function saveCountryToProfile(userId: string, code: string, name: string, source: string) {
  await supabase
    .from('profiles')
    .update({
      country_code: code,
      country_name: name,
      country_detected_at: new Date().toISOString(),
      country_source: source,
    } as any)
    .eq('user_id', userId);
}

// Utility: get cached country for guest quiz runs
export function getGuestCountryCode(): string {
  const cached = getCachedCountry();
  return cached?.country_code || 'UN';
}

// Google Ads conversion tracking utilities

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Replace 'CONVERSION_LABEL' with your actual Google Ads conversion label
// It looks like: AW-17947891742/AbCdEfGhIjKlMnOp
const ADS_CONVERSION_ID = 'AW-17947891742';
const SIGNUP_CONVERSION_LABEL = 'CONVERSION_LABEL'; // <-- paste your conversion label here

let signupConversionFired = false;

export function fireSignupConversion() {
  if (signupConversionFired) return; // guard against duplicate fires
  if (typeof window.gtag !== 'function') return;

  signupConversionFired = true;
  window.gtag('event', 'conversion', {
    send_to: `${ADS_CONVERSION_ID}/${SIGNUP_CONVERSION_LABEL}`,
  });
}

export function fireLoginEvent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'login', { method: 'email' });
}

export function fireGoogleLoginEvent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'login', { method: 'google' });
}

// Reset the guard (call on sign-out so a new user can trigger it again)
export function resetSignupConversionGuard() {
  signupConversionFired = false;
}

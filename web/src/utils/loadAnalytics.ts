/**
 * Dynamically load Rybbit analytics script
 * Uses environment variables for configuration
 */

const RYBBIT_SCRIPT_URL = import.meta.env.VITE_RYBBIT_SCRIPT_URL as string | undefined;
const RYBBIT_SITE_ID = import.meta.env.VITE_RYBBIT_SITE_ID as string | undefined;
const RYBBIT_API_KEY = import.meta.env.VITE_RYBBIT_API_KEY as string | undefined; // dev-only for localhost

/**
 * Load the Rybbit analytics script if configured
 */
export function loadAnalytics(): void {
  // Skip if analytics is not configured
  if (!RYBBIT_SCRIPT_URL || !RYBBIT_SITE_ID) {
    console.info('Analytics not configured - skipping tracking');
    return;
  }

  // Check if script is already loaded (Rybbit uses data-site-id)
  if (document.querySelector(`script[data-site-id="${RYBBIT_SITE_ID}"]`)) {
    console.info('Analytics script already loaded');
    return;
  }

  // Create and append the analytics script
  const script = document.createElement('script');
  script.defer = true;
  script.src = RYBBIT_SCRIPT_URL;
  script.setAttribute('data-site-id', RYBBIT_SITE_ID);

  // Only include API key for localhost/dev if provided
  if (import.meta.env.DEV && RYBBIT_API_KEY) {
    script.setAttribute('data-api-key', RYBBIT_API_KEY);
  }

  script.onerror = () => {
    console.warn('Failed to load analytics script');
  };

  document.head.appendChild(script);
}

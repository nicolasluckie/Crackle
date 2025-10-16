/**
 * Dynamically load Umami analytics script
 * Uses environment variables for configuration
 */

const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL;
const ANALYTICS_WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

/**
 * Load the Umami analytics script if configured
 */
export function loadAnalytics(): void {
  // Skip if analytics is not configured
  if (!ANALYTICS_URL || !ANALYTICS_WEBSITE_ID) {
    console.info('Analytics not configured - skipping tracking');
    return;
  }

  // Check if script is already loaded
  if (document.querySelector(`script[data-website-id="${ANALYTICS_WEBSITE_ID}"]`)) {
    console.info('Analytics script already loaded');
    return;
  }

  // Create and append the analytics script
  const script = document.createElement('script');
  script.defer = true;
  script.src = ANALYTICS_URL;
  script.setAttribute('data-website-id', ANALYTICS_WEBSITE_ID);

  script.onerror = () => {
    console.warn('Failed to load analytics script');
  };

  document.head.appendChild(script);
}

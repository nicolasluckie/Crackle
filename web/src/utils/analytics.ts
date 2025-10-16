// Umami Analytics Tracking Utilities
// Documentation: https://umami.is/docs/track-events

// Extend the Window interface to include the umami tracking function
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

/**
 * Track a custom event with optional data
 * @param eventName - Name of the event (max 50 characters)
 * @param eventData - Optional data to associate with the event
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean>
): void {
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(eventName, eventData);
    } catch (error) {
      console.warn('Umami tracking error:', error);
    }
  }
}

// Specific event tracking functions for better type safety and consistency

/**
 * Track page/screen views
 */
export function trackPageView(pageName: string): void {
  trackEvent('page-view', { page: pageName });
}

/**
 * Track mode selection from main menu
 */
export function trackModeSelection(mode: 'practice' | 'crack'): void {
  trackEvent('mode-selected', { mode });
}

/**
 * Track guess submission in Practice Mode
 */
export function trackPracticeGuess(guess: string, guessNumber: number, isCorrect: boolean, method: 'click' | 'enter'): void {
  trackEvent('practice-guess', {
    guess: guess.toLowerCase(),
    guess_number: guessNumber,
    correct: isCorrect,
    method,
  });
}

/**
 * Track game win in Practice Mode
 */
export function trackPracticeWin(guessCount: number, targetWord: string): void {
  trackEvent('practice-win', {
    total_guesses: guessCount,
    target_word: targetWord.toLowerCase(),
  });
}

/**
 * Track new game started in Practice Mode
 */
export function trackPracticeNewGame(): void {
  trackEvent('practice-new-game');
}

/**
 * Track guess submission in Crack Mode
 */
export function trackCrackGuess(guess: string, guessNumber: number, wordsRemaining: number, method: 'click' | 'enter'): void {
  trackEvent('crack-guess', {
    guess: guess.toLowerCase(),
    guess_number: guessNumber,
    words_remaining: wordsRemaining,
    method,
  });
}

/**
 * Track word cracked in Crack Mode
 */
export function trackCrackWin(guessCount: number, crackedWord: string): void {
  trackEvent('crack-win', {
    total_guesses: guessCount,
    cracked_word: crackedWord.toLowerCase(),
  });
}

/**
 * Track when user has no words remaining in Crack Mode
 */
export function trackCrackMessedUp(guessCount: number): void {
  trackEvent('crack-messed-up', {
    total_guesses: guessCount,
  });
}

/**
 * Track back button click
 */
export function trackBackButton(fromMode: 'practice' | 'crack'): void {
  trackEvent('back-button', { from: fromMode });
}

/**
 * Track reset button click
 */
export function trackReset(mode: 'practice' | 'crack'): void {
  trackEvent('reset-game', { mode });
}

/**
 * Track new game button click
 */
export function trackNewGame(mode: 'practice' | 'crack'): void {
  trackEvent('new-game', { mode });
}

/**
 * Track errors
 */
export function trackError(errorType: string, errorMessage: string, context: string): void {
  trackEvent('error', {
    type: errorType,
    message: errorMessage,
    context,
  });
}

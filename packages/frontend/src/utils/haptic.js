/**
 * Haptic feedback utility using the Web Vibration API.
 * Gracefully no-ops on unsupported platforms (desktop, iOS Safari < 16).
 */

const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

const vibrate = (pattern) => {
  if (!supported) return;
  try { navigator.vibrate(pattern); } catch (_) {}
};

export const haptic = {
  /** Lightest tap — selection, chip press */
  light:   () => vibrate(4),
  /** Standard button press */
  medium:  () => vibrate(10),
  /** Heavy action — submit, confirm */
  heavy:   () => vibrate(20),
  /** Two-pulse success feel */
  success: () => vibrate([10, 80, 20]),
  /** Error / destructive action */
  error:   () => vibrate([25, 80, 25, 80, 40]),
  /** Quick double-tick — toggle on/off */
  toggle:  () => vibrate([8, 50, 12]),
  /** Navigation tab switch */
  nav:     () => vibrate(5),
};

export default haptic;

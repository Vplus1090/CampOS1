import { motion, AnimatePresence } from 'framer-motion';
import { WifiX, ArrowClockwise, CloudSlash } from '@phosphor-icons/react';

/**
 * Offline / stale data banner.
 *
 * Shows a slim pill at the top of a screen when:
 * - User is offline (WifiX icon)
 * - Data is stale and refreshing (spinner)
 * - Fetch failed but cache exists (CloudSlash icon)
 *
 * Props:
 *   isOffline    — navigator is offline
 *   isRefreshing — background fetch in progress
 *   isStale      — cached data is past TTL
 *   error        — last fetch error (non-null when refresh failed)
 *   onRetry      — callback to retry manually
 *   cachedAt     — optional Date of last successful fetch
 */
export default function OfflineBanner({ isOffline, isRefreshing, isStale, error, onRetry, cachedAt }) {
  const show = isOffline || (error && isStale);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between gap-2 px-3 py-1.5 mx-4 mt-2 rounded-xl text-[11px] font-semibold"
          style={{
            background: isOffline
              ? 'rgba(239,68,68,0.12)'
              : error
                ? 'rgba(251,146,60,0.12)'
                : 'rgba(59,130,246,0.10)',
            border: isOffline
              ? '1px solid rgba(239,68,68,0.25)'
              : error
                ? '1px solid rgba(251,146,60,0.25)'
                : '1px solid rgba(59,130,246,0.20)',
            color: isOffline ? '#f87171' : error ? '#fb923c' : '#60a5fa',
          }}
        >
          <div className="flex items-center gap-1.5">
            {isOffline ? (
              <WifiX size={13} weight="bold" />
            ) : error ? (
              <CloudSlash size={13} weight="bold" />
            ) : (
              <ArrowClockwise size={13} weight="bold" className="animate-spin" />
            )}
            <span>
              {isOffline
                ? 'You\'re offline — showing cached data'
                : error
                  ? 'Couldn\'t refresh — showing saved data'
                  : 'Updating in background…'}
            </span>
          </div>

          {(isOffline || error) && onRetry && (
            <button
              onClick={onRetry}
              data-haptic="light"
              className="text-[10px] font-black uppercase tracking-wider opacity-80 hover:opacity-100 bg-transparent border-none cursor-pointer"
              style={{ color: 'inherit' }}
            >
              Retry
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

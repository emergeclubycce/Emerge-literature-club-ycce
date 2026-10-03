/**
 * Production-safe logger utility.
 * - In development: logs to console as normal.
 * - In production: suppresses console output to avoid leaking
 *   internal error messages, DB schema hints, and bucket paths
 *   to users via browser DevTools.
 *
 * Usage: import { logger } from '@/utils/logger'
 *        logger.error('Something failed:', err)
 *        logger.warn('Notice:', msg)
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(message, ...args);
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(message, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(message, ...args);
  },
};
/**
 * Production-safe logger utility.
 * - Development: logs to the console as normal.
 * - Production: console output is suppressed so internal error messages,
 *   DB schema hints and bucket paths don't leak via browser DevTools.
 *   Errors are still sent to `reportError` so you can see them.
 *
 * Error objects (Supabase PostgrestError, Error, etc.) have non-enumerable
 * fields, so they print as `{}`. `serialize` turns them into plain objects
 * so message / code / details / hint are always visible.
 *
 * Usage: import { logger } from '@/utils/logger'
 *        logger.error('Something failed:', err)
 *        logger.warn('Notice:', msg)
 */

const isDev = process.env.NODE_ENV !== "production";

function serialize(arg: unknown): unknown {
  if (arg && typeof arg === "object") {
    const e = arg as Record<string, unknown>;
    if (arg instanceof Error || "message" in e || "code" in e) {
      return {
        name: e.name,
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
        status: e.status,
        ...(arg instanceof Error && isDev ? { stack: arg.stack } : {}),
      };
    }
  }
  return arg;
}

/**
 * Plug your monitoring in here (Sentry, LogRocket, your own endpoint...).
 * Example with Sentry:
 *   import * as Sentry from "@sentry/nextjs";
 *   Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(message), { extra: { args } });
 */
function reportError(message: string, ...args: unknown[]): void {
  // TODO: send to your monitoring service. Never print to the console here.
  void message;
  void args;
}

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.error(message, ...args.map(serialize));
    } else {
      reportError(message, ...args.map(serialize));
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(message, ...args.map(serialize));
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(message, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(message, ...args);
  },
};
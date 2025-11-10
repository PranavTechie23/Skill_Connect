/**
 * Logger utility that only logs in development mode
 * Prevents console pollution in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but format them better
    if (isDevelopment) {
      console.error('[DEV]', ...args);
    } else {
      // In production, you might want to send to error tracking service
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[DEV]', ...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEV]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[DEV]', ...args);
    }
  }
};


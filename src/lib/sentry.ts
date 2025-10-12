import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      environment: import.meta.env.MODE,
      
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        const error = hint.originalException as Error;
        if (error?.message?.includes('ResizeObserver loop')) {
          return null;
        }
        return event;
      },
    });
  }
};

export const logError = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error, context);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  console.info(message, context);
  
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: context,
    });
  }
};

export { Sentry };

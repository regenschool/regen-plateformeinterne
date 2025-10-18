// Monitoring centralisé pour production
// Permet de tracer les performances et erreurs critiques

import * as Sentry from '@sentry/react';

export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  console.log(`[Performance] ${operation}: ${duration}ms`, metadata);
  
  // Si Sentry est configuré, envoyer une métrique
  if (Sentry.isEnabled()) {
    Sentry.metrics.distribution(`operation.${operation}.duration`, duration, {
      unit: 'millisecond',
    });
  }
};

export const logError = (context: string, error: Error, extra?: Record<string, any>) => {
  console.error(`[Error] ${context}:`, error, extra);
  
  // Envoyer à Sentry si configuré
  if (Sentry.isEnabled()) {
    Sentry.captureException(error, {
      tags: { context },
      extra,
    });
  }
};

export const logCritical = (message: string, details?: Record<string, any>) => {
  console.error(`[CRITICAL] ${message}`, details);
  
  if (Sentry.isEnabled()) {
    Sentry.captureMessage(message, {
      level: 'fatal',
      extra: details,
    });
  }
};

// Hook de mesure de performance
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logPerformance(operation, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(operation, error as Error, { ...metadata, duration });
    throw error;
  }
};

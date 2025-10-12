import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry); // INP remplace FID dans web-vitals v3+
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

// Fonction pour envoyer les métriques à un service d'analytics
export const sendToAnalytics = (metric: Metric) => {
  const body = JSON.stringify(metric);
  const url = '/api/analytics'; // Adapter selon votre backend

  // Utiliser `navigator.sendBeacon()` si disponible, sinon `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
};

// Log les Core Web Vitals en développement
export const logWebVitals = (metric: Metric) => {
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
};

export default reportWebVitals;

// Fonction pour initialiser le monitoring des Web Vitals
export const initWebVitals = () => {
  if (import.meta.env.PROD) {
    // En production, envoyer vers analytics
    reportWebVitals(sendToAnalytics);
  } else {
    // En développement, logger dans la console
    reportWebVitals(logWebVitals);
  }
};

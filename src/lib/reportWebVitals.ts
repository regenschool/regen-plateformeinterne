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

// Log et stocke les Core Web Vitals
export const logWebVitals = (metric: Metric) => {
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });

  // Stocker dans localStorage pour la page Quality
  try {
    const stored = localStorage.getItem('web-vitals');
    const vitals = stored ? JSON.parse(stored) : {};
    
    // Mettre à jour la métrique
    if (metric.name === 'LCP') {
      vitals.lcp = metric.value / 1000; // Convertir en secondes
    } else if (metric.name === 'CLS') {
      vitals.cls = metric.value;
    } else if (metric.name === 'INP') {
      vitals.inp = metric.value;
    } else if (metric.name === 'FCP') {
      vitals.fcp = metric.value / 1000; // Convertir en secondes
    } else if (metric.name === 'TTFB') {
      vitals.ttfb = metric.value / 1000; // Convertir en secondes
    }

    vitals.lastUpdated = new Date().toISOString();
    localStorage.setItem('web-vitals', JSON.stringify(vitals));
  } catch (e) {
    console.error('Erreur lors du stockage des Web Vitals:', e);
  }
};

export default reportWebVitals;

// Fonction pour initialiser le monitoring des Web Vitals
export const initWebVitals = () => {
  // Toujours logger les Web Vitals (dev + prod)
  // En dev pour debug, en prod pour monitoring
  reportWebVitals(logWebVitals);
  
  // En production, également envoyer vers analytics si configuré
  if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    reportWebVitals(sendToAnalytics);
  }
};

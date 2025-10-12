/**
 * Configuration des en-têtes de sécurité
 * Ces headers sont appliqués via supabase/config.toml
 */

export const SECURITY_HEADERS = {
  // Content Security Policy - Prévient XSS
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),

  // Strict Transport Security - Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prévient le clickjacking
  'X-Frame-Options': 'DENY',

  // Prévient le sniffing MIME
  'X-Content-Type-Options': 'nosniff',

  // Active la protection XSS du navigateur
  'X-XSS-Protection': '1; mode=block',

  // Contrôle les informations du referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (anciennement Feature Policy)
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

/**
 * Validation côté client pour s'assurer que les headers de sécurité sont présents
 */
export const validateSecurityHeaders = async (): Promise<{
  valid: boolean;
  missing: string[];
}> => {
  try {
    const response = await fetch(window.location.origin, { method: 'HEAD' });
    const headers = response.headers;

    const missing: string[] = [];
    const criticalHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
    ];

    criticalHeaders.forEach((header) => {
      if (!headers.has(header)) {
        missing.push(header);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
    };
  } catch (error) {
    console.error('Erreur lors de la validation des headers de sécurité:', error);
    return { valid: false, missing: [] };
  }
};

import { supabase } from '@/integrations/supabase/client';

type RateLimitConfig = {
  endpoint: string;
  maxRequests: number;
  windowMinutes: number;
};

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const checkRateLimit = async (config: RateLimitConfig): Promise<boolean> => {
  const { endpoint, maxRequests, windowMinutes } = config;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  // Vérifier les requêtes dans la fenêtre
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    // Incrémenter le compteur
    if (existing.request_count >= maxRequests) {
      const retryAfter = Math.ceil(
        (new Date(existing.window_start).getTime() + windowMinutes * 60 * 1000 - Date.now()) / 1000
      );
      throw new RateLimitError(
        `Limite de ${maxRequests} requêtes par ${windowMinutes} minutes atteinte`,
        retryAfter
      );
    }

    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (updateError) throw updateError;
  } else {
    // Créer une nouvelle entrée
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: user.id,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  }

  return true;
};

// Configuration par défaut pour différents endpoints
export const RATE_LIMITS = {
  IMPORT_STUDENTS: { endpoint: 'import-students', maxRequests: 10, windowMinutes: 60 },
  IMPORT_SUBJECTS: { endpoint: 'import-subjects', maxRequests: 10, windowMinutes: 60 },
  BULK_GRADES: { endpoint: 'bulk-grades', maxRequests: 20, windowMinutes: 60 },
  EXPORT_DATA: { endpoint: 'export-data', maxRequests: 30, windowMinutes: 60 },
  CREATE_STUDENT: { endpoint: 'create-student', maxRequests: 100, windowMinutes: 60 },
  CREATE_GRADE: { endpoint: 'create-grade', maxRequests: 200, windowMinutes: 60 },
} as const;

import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type UseAuditLogsOptions = {
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  limit?: number;
};

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { userId, tableName, action, limit = 100 } = options;

  return useQuery({
    queryKey: ['audit-logs', userId, tableName, action, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

// Fonction utilitaire pour logger manuellement des actions (LOGIN, LOGOUT, EXPORT, IMPORT)
export const logAuditAction = async (
  action: 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT',
  tableName: string,
  details?: Record<string, any>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    table_name: tableName,
    new_values: details || {},
  });
};

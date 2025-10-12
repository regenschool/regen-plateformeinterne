import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminContextType = {
  isAdmin: boolean;
  hasAdminRole: boolean;
  toggleAdmin: (checked: boolean) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        checkAdminStatus(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const { data: override } = await (supabase as any)
      .from("dev_role_overrides")
      .select("is_admin")
      .eq("user_id", userId)
      .maybeSingle();

    const hasRole = !!roleData;
    setHasAdminRole(hasRole);
    setIsAdmin(hasRole || !!override?.is_admin);
  };

  const toggleAdmin = async (checked: boolean) => {
    if (!userId) return;
    
    const { error } = await (supabase as any)
      .from("dev_role_overrides")
      .upsert(
        { user_id: userId, is_admin: checked, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Failed to toggle admin override", error);
      toast.error("Impossible de changer de rôle");
      return;
    }

    setIsAdmin(checked);
    toast.success(checked ? "Mode administrateur activé" : "Mode enseignant activé");
  };

  const refreshAdminStatus = async () => {
    if (userId) {
      await checkAdminStatus(userId);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, hasAdminRole, toggleAdmin, refreshAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

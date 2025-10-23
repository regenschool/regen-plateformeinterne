import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Non authentifié");

    // Vérifier rôle admin
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Accès refusé - Admin uniquement");

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) throw new Error("userId et newPassword requis");
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (updateError) throw updateError;

    console.log("Mot de passe défini manuellement pour:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "Mot de passe mis à jour" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur set password:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur inconnue" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("Non authentifié");
    }

    // Vérifier que l'utilisateur est admin
    const { data: adminCheck } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!adminCheck) {
      throw new Error("Accès refusé - Admin uniquement");
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId requis");
    }

    console.log("Suppression de l'utilisateur:", userId);

    // Supprimer les données liées dans l'ordre inverse des dépendances
    // 1. Supprimer les user_roles
    const { error: rolesError } = await supabaseClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Erreur suppression roles:", rolesError);
      throw rolesError;
    }

    // 2. Supprimer le profil teacher_profiles
    const { error: profileError } = await supabaseClient
      .from("teacher_profiles")
      .delete()
      .eq("user_id", userId);

    if (profileError) {
      console.error("Erreur suppression profile:", profileError);
      throw profileError;
    }

    // 3. Supprimer l'entrée teachers (si elle existe)
    const { error: teacherError } = await supabaseClient
      .from("teachers")
      .delete()
      .eq("user_id", userId);

    // Ignorer l'erreur si l'entrée n'existe pas (PGRST116)
    if (teacherError && teacherError.code !== 'PGRST116') {
      console.error("Erreur suppression teacher:", teacherError);
      throw teacherError;
    }

    // 4. Supprimer l'utilisateur de auth.users (cela supprimera les dépendances restantes en cascade)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Erreur suppression auth user:", deleteError);
      throw deleteError;
    }

    console.log("Utilisateur supprimé avec succès:", userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Utilisateur supprimé avec succès"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur suppression utilisateur:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

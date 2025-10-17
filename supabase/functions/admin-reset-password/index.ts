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

    // Générer un lien de réinitialisation de mot de passe
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: "recovery",
      email: "", // Will be fetched from userId
      options: {
        redirectTo: `${req.headers.get("origin")}/auth`,
      },
    });

    // Get user email first
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    
    if (userError) throw userError;

    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: "recovery",
      email: userData.user.email!,
      options: {
        redirectTo: `${req.headers.get("origin")}/auth`,
      },
    });

    if (resetError) throw resetError;

    console.log("Lien de réinitialisation généré pour:", userData.user.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        resetLink: resetData.properties.action_link,
        message: "Lien de réinitialisation généré avec succès"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur reset password:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { email, resetLink } = await req.json();

    if (!email || !resetLink) {
      throw new Error("Email et lien requis");
    }

    // Récupérer le nom de l'utilisateur
    const { data: profileData } = await supabaseClient
      .from("teacher_profiles")
      .select("full_name")
      .eq("email", email)
      .single();

    const fullName = profileData?.full_name || email.split("@")[0];

    // Envoyer l'email de rappel
    const emailResponse = await resend.emails.send({
      from: "Regen School <onboarding@regen-school.com>",
      to: [email],
      subject: "Rappel - Finalisez votre profil Regen School",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Rappel : Votre compte Regen School</h1>
          <p>Bonjour ${fullName},</p>
          <p>Vous avez été invité(e) à rejoindre Regen School mais n'avez pas encore finalisé votre profil.</p>
          <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Finaliser mon profil
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien est valable 24 heures.</p>
          <p style="margin-top: 30px;">À bientôt,<br>L'équipe Regen School</p>
        </div>
      `,
    });

    console.log("Email de rappel envoyé:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email de rappel envoyé avec succès"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur renvoi invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

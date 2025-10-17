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

    const { email, fullName, role } = await req.json();

    if (!email || !fullName || !role) {
      throw new Error("Email, nom complet et rôle requis");
    }

    // Créer l'utilisateur
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) throw createError;

    // Assigner le rôle
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: role,
      });

    if (roleError) throw roleError;

    // Créer TOUJOURS le profil dans teacher_profiles (pour tous les rôles)
    const { error: profileError } = await supabaseClient
      .from("teacher_profiles")
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName,
      });

    if (profileError) throw profileError;

    // Si c'est un enseignant, créer aussi dans teachers
    if (role === "teacher") {
      const { error: teacherError } = await supabaseClient
        .from("teachers")
        .insert({
          user_id: newUser.user.id,
          full_name: fullName,
          email: email,
        });

      if (teacherError) throw teacherError;
    }

    // Générer un lien de connexion magic link
    const { data: magicLink, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin")}/complete-profile`,
      },
    });

    if (linkError) throw linkError;

    // Envoyer l'email d'invitation
    const emailResponse = await resend.emails.send({
      from: "Regen School <onboarding@regen-school.com>",
      to: [email],
      subject: "Bienvenue sur Regen School - Finalisez votre profil",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bienvenue sur Regen School !</h1>
          <p>Bonjour ${fullName},</p>
          <p>Votre compte a été créé avec succès en tant que <strong>${role === 'teacher' ? 'Enseignant' : 'Administrateur'}</strong>.</p>
          <p>Pour finaliser la création de votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
          <div style="margin: 30px 0;">
            <a href="${magicLink.properties.action_link}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Finaliser mon profil
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien est valable 24 heures.</p>
          <p style="margin-top: 30px;">À bientôt,<br>L'équipe Regen School</p>
        </div>
      `,
    });

    console.log("Email envoyé:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: newUser.user.id,
        message: "Utilisateur créé et email d'invitation envoyé"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur invitation utilisateur:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

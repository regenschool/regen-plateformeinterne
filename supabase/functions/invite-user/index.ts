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

    const { email, firstName, lastName, role } = await req.json();

    if (!email || !firstName || !lastName || !role) {
      throw new Error("Email, prénom, nom et rôle requis");
    }

    const fullName = `${firstName} ${lastName}`;

    // Créer l'utilisateur SANS confirmer l'email (permet de cliquer plusieurs fois sur le lien)
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: false, // Important : l'email n'est confirmé qu'après complétion du profil
      user_metadata: {
        full_name: fullName,
        profile_completed: false,
        invited_at: new Date().toISOString(),
      },
    });

    if (createError) throw createError;

    console.log("Utilisateur créé:", newUser.user.id);

    // Assigner le rôle principal
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: role,
      });

    if (roleError) throw roleError;

    // Si admin, ajouter automatiquement le rôle teacher
    if (role === "admin") {
      const { error: teacherRoleError } = await supabaseClient
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: "teacher",
        });

      if (teacherRoleError) throw teacherRoleError;
      console.log("Double rôle admin+teacher assigné");
    }

    // Créer TOUJOURS le profil dans teacher_profiles (pour tous les rôles)
    const { error: profileError } = await supabaseClient
      .from("teacher_profiles")
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      });

    if (profileError) {
      console.error("Erreur création profil:", profileError);
      throw profileError;
    }

    console.log("Profil créé dans teacher_profiles");

    // Créer AUSSI dans teachers (pour performance et triggers)
    const { error: teacherError } = await supabaseClient
      .from("teachers")
      .insert({
        user_id: newUser.user.id,
        full_name: fullName,
      });

    if (teacherError) {
      console.error("Erreur création teachers:", teacherError);
      throw teacherError;
    }

    console.log("Entrée créée dans teachers - trigger sync_teacher_role activé");

    // Générer un lien d'invitation (reste valide tant que l'email n'est pas confirmé)
    const { data: magicLink, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin")}/complete-profile`,
      },
    });

    if (linkError) throw linkError;

    // Déterminer le rôle affiché
    const roleDisplay = role === "admin" ? "Administrateur (avec accès enseignant)" : "Enseignant";

    // Envoyer l'email d'invitation avec instructions claires
    const emailResponse = await resend.emails.send({
      from: "Regen School <onboarding@regen-school.com>",
      to: [email],
      subject: "🎓 Créez votre compte Regen School",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 24px;">Bienvenue sur Regen School !</h1>
          
          <p style="font-size: 16px; margin-bottom: 16px;">Bonjour ${fullName},</p>
          
          <p style="font-size: 16px; margin-bottom: 16px;">
            Un administrateur vous a invité à rejoindre Regen School en tant que <strong>${roleDisplay}</strong>.
          </p>

          <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">📝 Prochaines étapes :</h3>
            <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin-bottom: 8px;">Cliquez sur le bouton ci-dessous</li>
              <li style="margin-bottom: 8px;">Créez votre mot de passe</li>
              <li style="margin-bottom: 8px;">Complétez vos informations (optionnel)</li>
              <li>Accédez à votre espace !</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink.properties.action_link}" 
               style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Créer mon compte
            </a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏱️ Important : Lien valide 24 heures</strong><br>
              Ce lien expire automatiquement après 24 heures. Si le lien a expiré, demandez simplement un nouveau lien d'invitation à votre administrateur.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            Votre email de connexion : <strong>${email}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.
          </p>

          <p style="margin-top: 24px; color: #4b5563;">
            À bientôt,<br>
            <strong>L'équipe Regen School</strong>
          </p>
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

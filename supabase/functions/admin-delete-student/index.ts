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

    const { studentId } = await req.json();

    if (!studentId) {
      throw new Error("studentId requis");
    }

    console.log("Suppression de l'étudiant:", studentId);

    // Supprimer les données liées dans l'ordre inverse des dépendances
    
    // 1. Supprimer les grades
    const { error: gradesError } = await supabaseClient
      .from("grades")
      .delete()
      .eq("student_id", studentId);

    if (gradesError) {
      console.error("Erreur suppression grades:", gradesError);
      throw gradesError;
    }
    console.log("✅ Grades supprimés");

    // 2. Supprimer les bulletins (report cards)
    const { error: reportCardsError } = await supabaseClient
      .from("student_report_cards")
      .delete()
      .eq("student_id", studentId);

    if (reportCardsError) {
      console.error("Erreur suppression bulletins:", reportCardsError);
      throw reportCardsError;
    }
    console.log("✅ Bulletins supprimés");

    // 3. Supprimer les documents
    const { error: documentsError } = await supabaseClient
      .from("student_documents")
      .delete()
      .eq("student_id", studentId);

    if (documentsError) {
      console.error("Erreur suppression documents:", documentsError);
      throw documentsError;
    }
    console.log("✅ Documents supprimés");

    // 4. Supprimer la checklist d'onboarding
    const { error: checklistError } = await supabaseClient
      .from("student_onboarding_checklist")
      .delete()
      .eq("student_id", studentId);

    if (checklistError) {
      console.error("Erreur suppression checklist:", checklistError);
      throw checklistError;
    }
    console.log("✅ Checklist supprimée");

    // 5. Supprimer le profil étudiant
    const { error: profileError } = await supabaseClient
      .from("student_profiles")
      .delete()
      .eq("student_id", studentId);

    if (profileError) {
      console.error("Erreur suppression profil:", profileError);
      throw profileError;
    }
    console.log("✅ Profil supprimé");

    // 6. Supprimer les enrollments
    const { error: enrollmentsError } = await supabaseClient
      .from("student_enrollments")
      .delete()
      .eq("student_id", studentId);

    if (enrollmentsError) {
      console.error("Erreur suppression enrollments:", enrollmentsError);
      throw enrollmentsError;
    }
    console.log("✅ Enrollments supprimés");

    // 7. Récupérer le user_id de l'étudiant (si lié à un compte)
    const { data: studentData } = await supabaseClient
      .from("students")
      .select("user_id")
      .eq("id", studentId)
      .single();

    const userId = studentData?.user_id;

    // 8. Supprimer l'étudiant lui-même
    const { error: studentError } = await supabaseClient
      .from("students")
      .delete()
      .eq("id", studentId);

    if (studentError) {
      console.error("Erreur suppression étudiant:", studentError);
      throw studentError;
    }
    console.log("✅ Étudiant supprimé");

    // 9. Si l'étudiant avait un compte utilisateur, le supprimer aussi
    if (userId) {
      // Supprimer d'abord les user_roles
      const { error: rolesError } = await supabaseClient
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesError) {
        console.error("Erreur suppression roles:", rolesError);
      }

      // Supprimer le compte auth
      const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(userId);

      if (deleteUserError) {
        console.error("Erreur suppression compte utilisateur:", deleteUserError);
        // Ne pas faire échouer toute l'opération si la suppression du compte échoue
      } else {
        console.log("✅ Compte utilisateur supprimé");
      }
    }

    console.log("🎉 Étudiant supprimé avec succès:", studentId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Étudiant supprimé avec succès"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur suppression étudiant:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

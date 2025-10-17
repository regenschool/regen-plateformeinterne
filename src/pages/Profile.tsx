import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, BookOpen, FileText, Receipt, Save, Download, Plus, Trash2, Upload, Clipboard, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportSubjectsDialog } from "@/components/ImportSubjectsDialog";
import { AddSubjectDialog } from "@/components/AddSubjectDialog";
import { useAdmin } from "@/contexts/AdminContext";
import { TeacherDocumentsSection } from "@/components/TeacherDocumentsSection";

type TeacherProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  secondary_email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
};

type EnrichedProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  secondary_email: string | null;
  phone: string | null;
  address: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  siret: string | null;
  subjects: string[];
  documents_approved: number;
  documents_pending: number;
  documents_rejected: number;
  onboarding_status: 'not_started' | 'in_progress' | 'completed';
  checklist_completed: number;
  checklist_total: number;
};

type TeacherDocument = {
  id: string;
  teacher_id: string;
  category_id: string | null;
  title: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  upload_source: 'admin' | 'teacher';
  expiry_date: string | null;
  created_at: string;
};

type OnboardingItem = {
  id: string;
  teacher_id: string;
  category_id: string | null;
  item_name: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
};

type Subject = {
  id: string;
  subject_name: string;
  class_name: string;
  school_year: string;
  semester: string;
};

type SchoolDocument = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  description: string;
  hours: number | null;
  rate_per_hour: number | null;
  other_amount: number | null;
  total_amount: number;
  status: string;
  pdf_path: string | null;
};

const Profile = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [enrichedProfile, setEnrichedProfile] = useState<EnrichedProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherDocuments, setTeacherDocuments] = useState<TeacherDocument[]>([]);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>([]);
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  
  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: "",
    invoice_date: new Date(),
    description: "",
    hours: "",
    rate_per_hour: "",
    other_amount: "",
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    const currentUserId = data.user?.id || null;
    setUserId(currentUserId);
    setLoading(false);
  };

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch enriched profile for full data
      const { data: enriched, error: enrichedError } = await supabase
        .from("v_teacher_profiles_enriched")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (enrichedError && enrichedError.code !== "PGRST116") throw enrichedError;

      if (enriched) {
        setEnrichedProfile(enriched as EnrichedProfile);
      }

      // Fetch base profile for editing
      const { data, error } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
      } else {
        // Create default profile
        const { data: userData } = await supabase.auth.getUser();
        const { data: newProfile, error: createError } = await supabase
          .from("teacher_profiles")
          .insert({
            user_id: userId,
            full_name: userData.user?.user_metadata?.full_name || "",
            email: userData.user?.email || "",
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    }
  }, [userId]);

  const fetchTeacherDocuments = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("teacher_documents")
        .select("*")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeacherDocuments((data || []) as TeacherDocument[]);
    } catch (error: any) {
      console.error("Error fetching teacher documents:", error);
    }
  }, [userId]);

  const fetchOnboardingItems = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("onboarding_checklist")
        .select("*")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOnboardingItems(data || []);
    } catch (error: any) {
      console.error("Error fetching onboarding items:", error);
    }
  }, [userId]);

  const fetchSubjects = useCallback(async () => {
    if (!userId) return;

    try {
      const showAsAdmin = isAdmin;
      
      if (showAsAdmin) {
        // Mode admin : voir toutes les matières
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("school_year", { ascending: false })
          .order("class_name");

        if (error) throw error;
        setSubjects(data || []);
      } else {
        // Mode enseignant : voir seulement ses matières (assignées via email ou créées par lui)
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData.user?.email;

        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .or(`teacher_email.eq.${userEmail},and(teacher_id.eq.${userId},teacher_email.is.null)`)
          .order("school_year", { ascending: false })
          .order("class_name");

        if (error) throw error;
        setSubjects(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
    }
  }, [userId, isAdmin]);

  const fetchDocuments = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("school_documents")
        .select("*")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  }, [userId]);

  const fetchInvoices = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("teacher_invoices")
        .select("*")
        .eq("teacher_id", userId)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
    }
  }, [userId]);

  // Fetch data when userId or isAdmin changes
  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchSubjects();
      fetchTeacherDocuments();
      fetchOnboardingItems();
      fetchDocuments();
      fetchInvoices();
    }
  }, [userId, isAdmin, fetchProfile, fetchSubjects, fetchTeacherDocuments, fetchOnboardingItems, fetchDocuments, fetchInvoices]);

  // Real-time subscription for subjects
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects',
          filter: `teacher_id=eq.${userId}`,
        },
        () => {
          fetchSubjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchSubjects]);

  const saveProfile = async () => {
    if (!profile || !userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("teacher_profiles")
        .upsert({
          user_id: userId,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name,
          secondary_email: profile.secondary_email,
          phone: profile.phone,
          address: profile.address,
          siret: profile.siret,
          bank_iban: profile.bank_iban,
          bank_bic: profile.bank_bic,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error saving profile:", error);
        throw error;
      }

      toast.success("Profil mis à jour avec succès");
      fetchProfile(); // Refresh enriched profile
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(`Erreur lors de la sauvegarde du profil: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const createInvoice = async () => {
    if (!userId) return;

    try {
      const hours = parseFloat(invoiceForm.hours) || 0;
      const ratePerHour = parseFloat(invoiceForm.rate_per_hour) || 0;
      const otherAmount = parseFloat(invoiceForm.other_amount) || 0;
      const total = (hours * ratePerHour) + otherAmount;

      const { error } = await supabase.from("teacher_invoices").insert({
        teacher_id: userId,
        invoice_number: invoiceForm.invoice_number,
        invoice_date: format(invoiceForm.invoice_date, "yyyy-MM-dd"),
        description: invoiceForm.description,
        hours: hours > 0 ? hours : null,
        rate_per_hour: ratePerHour > 0 ? ratePerHour : null,
        other_amount: otherAmount > 0 ? otherAmount : null,
        total_amount: total,
        status: "draft",
      });

      if (error) throw error;

      toast.success("Facture créée avec succès");
      setShowInvoiceForm(false);
      setInvoiceForm({
        invoice_number: "",
        invoice_date: new Date(),
        description: "",
        hours: "",
        rate_per_hour: "",
        other_amount: "",
      });
      fetchInvoices();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const navigateToGrades = (subject: Subject) => {
    navigate("/grades", {
      state: {
        prefilledClass: subject.class_name,
        prefilledSubject: subject.subject_name, // Use subject_name instead of id
        prefilledSchoolYear: subject.school_year,
        prefilledSemester: subject.semester,
      },
    });
  };

  const generateInvoicePDF = async (invoiceId: string) => {
    try {
      toast.info("Génération du PDF en cours...");
      
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        // Download the PDF
        window.open(data.pdfUrl, "_blank");
        toast.success("PDF généré avec succès");
        fetchInvoices();
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const downloadDocument = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("school-documents")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("URL de téléchargement indisponible");

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from("teacher_invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;

      toast.success("Facture supprimée");
      fetchInvoices();
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const exportSubjectsToCSV = () => {
    if (subjects.length === 0) {
      toast.error("Aucune matière à exporter");
      return;
    }

    const headers = ["Année Scolaire", "Semestre", "Classe", "Matière", "Email Enseignant", "Nom Enseignant"];
    const csvContent = [
      headers.join(","),
      ...subjects.map(s => [
        s.school_year,
        s.semester,
        s.class_name,
        s.subject_name,
        (s as any).teacher_email || "",
        (s as any).teacher_name || ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `matieres_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export CSV réussi");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          {isAdmin ? "Profil Administrateur" : "Mon Profil Enseignant"}
        </h2>
        <p className="text-muted-foreground">
          {isAdmin ? "Gérez les profils, matières et documents de l'école" : "Gérez vos informations, matières et factures"}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        {!isAdmin ? (
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="w-4 h-4 mr-2" />
              Matières
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Mes Documents
            </TabsTrigger>
            <TabsTrigger value="onboarding">
              <Clipboard className="w-4 h-4 mr-2" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Factures
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isAdmin ? "Informations du Compte" : "Informations Personnelles"}
              </CardTitle>
              {!isAdmin && (
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <>
                  {isAdmin ? (
                    // Profil simplifié pour admin
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">Prénom *</Label>
                          <Input
                            id="first_name"
                            value={profile.full_name.split(' ')[0] || ''}
                            onChange={(e) => {
                              const lastName = profile.full_name.split(' ').slice(1).join(' ');
                              setProfile({ ...profile, full_name: `${e.target.value} ${lastName}`.trim() });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Nom *</Label>
                          <Input
                            id="last_name"
                            value={profile.full_name.split(' ').slice(1).join(' ') || ''}
                            onChange={(e) => {
                              const firstName = profile.full_name.split(' ')[0];
                              setProfile({ ...profile, full_name: `${firstName} ${e.target.value}`.trim() });
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={profile.phone || ""}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Rôle dans l'organisation</Label>
                          <Input
                            id="role"
                            value={(profile as any).organization_role || "Administrateur"}
                            onChange={(e) => setProfile({ ...profile, organization_role: e.target.value } as any)}
                            placeholder="Directeur, Coordinateur..."
                          />
                        </div>
                      </div>

                      <Button onClick={saveProfile} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </>
                  ) : (
                    // Profil complet pour enseignant
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">Prénom *</Label>
                          <Input
                            id="first_name"
                            value={profile.first_name || ''}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Nom *</Label>
                          <Input
                            id="last_name"
                            value={profile.last_name || ''}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email principal *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Email de connexion (non modifiable)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary_email">Email secondaire</Label>
                          <Input
                            id="secondary_email"
                            type="email"
                            value={profile.secondary_email || ''}
                            onChange={(e) => setProfile({ ...profile, secondary_email: e.target.value })}
                            placeholder="email.secondaire@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={profile.phone || ""}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="siret">SIRET</Label>
                          <Input
                            id="siret"
                            value={profile.siret || ""}
                            onChange={(e) => setProfile({ ...profile, siret: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Textarea
                          id="address"
                          value={profile.address || ""}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            value={profile.bank_iban || ""}
                            onChange={(e) => setProfile({ ...profile, bank_iban: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bic">BIC</Label>
                          <Input
                            id="bic"
                            value={profile.bank_bic || ""}
                            onChange={(e) => setProfile({ ...profile, bank_bic: e.target.value })}
                          />
                        </div>
                      </div>

                      <Button onClick={saveProfile} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mes Matières</CardTitle>
                    <CardDescription>
                      Liste des matières que vous enseignez
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {subjects.length > 0 && (
                      <Button variant="outline" onClick={exportSubjectsToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune matière enregistrée. Créez vos matières depuis l'onglet Notes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        onClick={() => navigateToGrades(subject)}
                        className="p-4 border border-border rounded-lg hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {subject.subject_name}
                            </h3>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>📚 {subject.class_name}</span>
                              <span>📅 {subject.school_year}</span>
                              <span>📆 {subject.semester}</span>
                            </div>
                          </div>
                          <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="documents" className="space-y-4">
          {userId && <TeacherDocumentsSection userId={userId} />}
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Checklist d'Onboarding</CardTitle>
                    <CardDescription>
                      Suivez votre progression dans le processus d'intégration
                    </CardDescription>
                  </div>
                  {enrichedProfile && (
                    <div className="text-sm font-medium">
                      Progression : {enrichedProfile.checklist_completed} / {enrichedProfile.checklist_total}
                      <div className="w-48 h-2 bg-muted rounded-full mt-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${enrichedProfile.checklist_total > 0 ? (enrichedProfile.checklist_completed / enrichedProfile.checklist_total * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {onboardingItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune tâche d'onboarding pour le moment
                  </p>
                ) : (
                  <div className="space-y-3">
                    {onboardingItems.map((item) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border",
                          item.is_completed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"
                        )}
                      >
                        <div className="mt-0.5">
                          {item.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-medium",
                            item.is_completed && "line-through text-muted-foreground"
                          )}>
                            {item.item_name}
                          </h4>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                          {item.completed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Complété le {format(new Date(item.completed_at), "dd/MM/yyyy 'à' HH:mm")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}


        {!isAdmin && (
          <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mes Factures</CardTitle>
                  <CardDescription>
                    Créez et gérez vos factures pour les heures de cours
                  </CardDescription>
                </div>
                <Button onClick={() => setShowInvoiceForm(!showInvoiceForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Facture
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showInvoiceForm && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Créer une nouvelle facture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Numéro de facture *</Label>
                        <Input
                          id="invoice_number"
                          value={invoiceForm.invoice_number}
                          onChange={(e) =>
                            setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })
                          }
                          placeholder="ex: FACT-2025-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de la facture *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !invoiceForm.invoice_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(invoiceForm.invoice_date, "dd/MM/yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={invoiceForm.invoice_date}
                              onSelect={(date) =>
                                date && setInvoiceForm({ ...invoiceForm, invoice_date: date })
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={invoiceForm.description}
                        onChange={(e) =>
                          setInvoiceForm({ ...invoiceForm, description: e.target.value })
                        }
                        placeholder="Décrivez les prestations facturées"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hours">Heures</Label>
                        <Input
                          id="hours"
                          type="number"
                          step="0.5"
                          value={invoiceForm.hours}
                          onChange={(e) =>
                            setInvoiceForm({ ...invoiceForm, hours: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate">Taux horaire (€)</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={invoiceForm.rate_per_hour}
                          onChange={(e) =>
                            setInvoiceForm({ ...invoiceForm, rate_per_hour: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="other">Autres (€)</Label>
                        <Input
                          id="other"
                          type="number"
                          step="0.01"
                          value={invoiceForm.other_amount}
                          onChange={(e) =>
                            setInvoiceForm({ ...invoiceForm, other_amount: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={createInvoice} className="flex-1">
                        Créer la facture
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowInvoiceForm(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune facture créée pour le moment
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="max-w-xs truncate">{invoice.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.total_amount.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              invoice.status === "draft" && "bg-yellow-100 text-yellow-800",
                              invoice.status === "sent" && "bg-blue-100 text-blue-800",
                              invoice.status === "paid" && "bg-green-100 text-green-800"
                            )}
                          >
                            {invoice.status === "draft" && "Brouillon"}
                            {invoice.status === "sent" && "Envoyée"}
                            {invoice.status === "paid" && "Payée"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateInvoicePDF(invoice.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                            {invoice.status === "draft" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteInvoice(invoice.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </TabsContent>
        )}
      </Tabs>

      <ImportSubjectsDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={fetchSubjects}
      />

      <AddSubjectDialog
        open={showAddSubjectDialog}
        onClose={() => setShowAddSubjectDialog(false)}
        onSubjectAdded={fetchSubjects}
      />
    </div>
  );
};

export default Profile;

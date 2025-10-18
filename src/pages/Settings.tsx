import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, GraduationCap, Calendar, BookOpen, Award, Users, Archive, FileText, CheckSquare, ClipboardList, FolderTree } from "lucide-react";
import { SchoolYearsManager } from "@/components/settings/SchoolYearsManager";
import { ClassesManager } from "@/components/settings/ClassesManager";
import { AcademicPeriodsManager } from "@/components/settings/AcademicPeriodsManager";
import { LevelsManager } from "@/components/settings/LevelsManager";
import { UsersManager } from "@/components/settings/UsersManager";
import { SubjectsManager } from "@/components/settings/SubjectsManager";
import { SyncReferentialsButton } from "@/components/settings/SyncReferentialsButton";
import ArchiveManager from "@/components/settings/ArchiveManager";
import { DocumentCategoriesManager } from "@/components/settings/DocumentCategoriesManager";
import { TeacherDocumentsManager } from "@/components/settings/TeacherDocumentsManager";
import { DocumentationSection } from "@/components/settings/DocumentationSection";
import { OnboardingManager } from "@/components/settings/OnboardingManager";
import { ReportCardTemplatesManager } from "@/components/settings/ReportCardTemplatesManager";
import { SubjectCategoriesManager } from "@/components/settings/SubjectCategoriesManager";
import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("school-years");

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  // Organisation des onglets par catégories
  const tabGroups = [
    {
      title: "Référentiels académiques",
      tabs: [
        { value: "school-years", label: t("settings.schoolYears"), icon: Calendar, component: SchoolYearsManager, desc: t("settings.schoolYearsDesc") },
        { value: "classes", label: t("settings.classes"), icon: GraduationCap, component: ClassesManager, desc: t("settings.classesDesc") },
        { value: "levels", label: t("settings.levels"), icon: Award, component: LevelsManager, desc: t("settings.levelsDesc") },
        { value: "periods", label: "Semestres", icon: BookOpen, component: AcademicPeriodsManager, desc: t("settings.periodsDesc") },
        { value: "subjects", label: t("settings.subjects"), icon: BookOpen, component: SubjectsManager, desc: null },
        { value: "subject-categories", label: "Catégories de matières", icon: FolderTree, component: SubjectCategoriesManager, desc: "Référentiels pour organiser les matières" },
      ]
    },
    {
      title: "Gestion des enseignants",
      tabs: [
        { value: "users", label: "Utilisateurs", icon: Users, component: UsersManager, desc: null },
        { value: "onboarding", label: "Onboarding", icon: ClipboardList, component: OnboardingManager, desc: "Tâches d'intégration enseignants" },
      ]
    },
    {
      title: "Documents & Administration",
      tabs: [
        { value: "doc-categories", label: "Catégories documents", icon: FolderTree, component: DocumentCategoriesManager, desc: "Sections de documents enseignants" },
        { value: "doc-management", label: "Documents enseignants", icon: CheckSquare, component: TeacherDocumentsManager, desc: "Tous les documents centralisés" },
        { value: "report-templates", label: "Modèles de bulletins", icon: FileText, component: ReportCardTemplatesManager, desc: "Configurer l'apparence des bulletins PDF" },
        { value: "documentation", label: "Documentation", icon: FileText, component: DocumentationSection, desc: "Télécharger les guides" },
        { value: "archive", label: t("settings.archive"), icon: Archive, component: ArchiveManager, desc: null },
      ]
    }
  ];

  const allTabs = tabGroups.flatMap(g => g.tabs);
  const activeTabData = allTabs.find(tab => tab.value === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <SettingsIcon className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Administration
                </h1>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                Configurez et gérez votre établissement en toute simplicité
              </p>
            </div>
            <SyncReferentialsButton />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Navigation latérale premium */}
          <Card className="hidden lg:block w-80 h-fit sticky top-20 border-border/40 shadow-lg bg-card/95 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-6">
              <nav className="space-y-6">
                {tabGroups.map((group, idx) => (
                  <div key={group.title} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    {idx > 0 && <Separator className="my-4" />}
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest mb-3 px-1">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.value;
                        
                        return (
                          <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                                : 'hover:bg-muted/60 hover:scale-[1.01]'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-colors ${
                              isActive ? 'bg-primary-foreground/10' : 'bg-muted group-hover:bg-muted-foreground/10'
                            }`}>
                              <Icon className="h-4 w-4 shrink-0" />
                            </div>
                            <span className="text-sm font-medium truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Navigation mobile - tabs horizontales scrollables */}
          <div className="lg:hidden overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-card hover:bg-muted border border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 max-w-full lg:max-w-5xl animate-fade-in">
            {activeTabData && (
              <Card className="border-border/40 shadow-lg bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <activeTabData.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold tracking-tight">
                        {activeTabData.label}
                      </CardTitle>
                      {activeTabData.desc && (
                        <CardDescription className="text-base mt-1.5">
                          {activeTabData.desc}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 overflow-x-auto">
                  <activeTabData.component />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, GraduationCap, Calendar, BookOpen, Award, Users, Archive } from "lucide-react";
import { SchoolYearsManager } from "@/components/settings/SchoolYearsManager";
import { ClassesManager } from "@/components/settings/ClassesManager";
import { AcademicPeriodsManager } from "@/components/settings/AcademicPeriodsManager";
import { LevelsManager } from "@/components/settings/LevelsManager";
import { UsersManager } from "@/components/settings/UsersManager";
import { SubjectsManager } from "@/components/settings/SubjectsManager";
import { SyncReferentialsButton } from "@/components/settings/SyncReferentialsButton";
import ArchiveManager from "@/components/settings/ArchiveManager";
import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("school-years");

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const tabs = [
    { value: "school-years", label: t("settings.schoolYears"), icon: Calendar, component: SchoolYearsManager, desc: t("settings.schoolYearsDesc") },
    { value: "classes", label: t("settings.classes"), icon: GraduationCap, component: ClassesManager, desc: t("settings.classesDesc") },
    { value: "levels", label: t("settings.levels"), icon: Award, component: LevelsManager, desc: t("settings.levelsDesc") },
    { value: "periods", label: "Semestre", icon: BookOpen, component: AcademicPeriodsManager, desc: t("settings.periodsDesc") },
    { value: "subjects", label: t("settings.subjects"), icon: BookOpen, component: SubjectsManager, desc: null },
    { value: "users", label: t("settings.users"), icon: Users, component: UsersManager, desc: null },
    { value: "archive", label: t("settings.archive"), icon: Archive, component: ArchiveManager, desc: null },
  ];

  const activeTabData = tabs.find(tab => tab.value === activeTab);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold">{t("settings.title")}</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("settings.subtitle")}
            </p>
          </div>
          <SyncReferentialsButton />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation latérale - cachée sur mobile */}
          <Card className="hidden lg:block w-64 h-fit sticky top-20">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;
                  
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Navigation mobile - tabs horizontales scrollables */}
          <div className="lg:hidden overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
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

          {/* Contenu */}
          <div className="flex-1 max-w-full lg:max-w-4xl">
            {activeTabData && (
              <Card>
                {activeTabData.desc && (
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <activeTabData.icon className="h-5 w-5" />
                      {activeTabData.label}
                    </CardTitle>
                    <CardDescription className="text-sm">{activeTabData.desc}</CardDescription>
                  </CardHeader>
                )}
                <CardContent className={activeTabData.desc ? "overflow-x-auto" : "pt-6 overflow-x-auto"}>
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
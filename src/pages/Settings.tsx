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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{t("settings.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>
        <SyncReferentialsButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-[1400px]">
          <TabsTrigger value="school-years" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.schoolYears")}</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.classes")}</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.levels")}</span>
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.periods")}</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.subjects")}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.users")}</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.archive")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school-years">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.schoolYears")}</CardTitle>
              <CardDescription>
                {t("settings.schoolYearsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolYearsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.classes")}</CardTitle>
              <CardDescription>
                {t("settings.classesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.levels")}</CardTitle>
              <CardDescription>
                {t("settings.levelsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LevelsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.periods")}</CardTitle>
              <CardDescription>
                {t("settings.periodsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcademicPeriodsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectsManager />
        </TabsContent>

        <TabsContent value="users">
          <UsersManager />
        </TabsContent>

        <TabsContent value="archive">
          <ArchiveManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
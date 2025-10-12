import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, GraduationCap, Calendar, BookOpen, Award, Users } from "lucide-react";
import { SchoolYearsManager } from "@/components/settings/SchoolYearsManager";
import { ClassesManager } from "@/components/settings/ClassesManager";
import { AcademicPeriodsManager } from "@/components/settings/AcademicPeriodsManager";
import { LevelsManager } from "@/components/settings/LevelsManager";
import { UsersManager } from "@/components/settings/UsersManager";
import { SubjectsManager } from "@/components/settings/SubjectsManager";
import { SyncReferentialsButton } from "@/components/settings/SyncReferentialsButton";
import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";

export default function Settings() {
  const { isAdmin } = useAdmin();
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
            <h1 className="text-4xl font-bold">Paramètres</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez les référentiels de l'école et les utilisateurs
          </p>
        </div>
        <SyncReferentialsButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-[1200px]">
          <TabsTrigger value="school-years" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Années scolaires</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Classes</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Niveaux</span>
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Semestres</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Matières</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school-years">
          <Card>
            <CardHeader>
              <CardTitle>Années Scolaires</CardTitle>
              <CardDescription>
                Définissez les années scolaires avec leurs dates de début et de fin. 
                Une seule année peut être active à la fois.
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
              <CardTitle>Classes</CardTitle>
              <CardDescription>
                Gérez les classes de l'école : nom, niveau (Bachelor/Master), capacité.
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
              <CardTitle>Niveaux</CardTitle>
              <CardDescription>
                Gérez les niveaux académiques de l'école : Bachelor, Master, MBA, etc.
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
              <CardTitle>Périodes Académiques (Semestres)</CardTitle>
              <CardDescription>
                Définissez les semestres pour chaque année scolaire avec leurs dates.
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
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs & Enseignants</CardTitle>
              <CardDescription>
                Gérez tous les utilisateurs de la plateforme : accès, rôles (Admin, Enseignant, Modérateur) et informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "en" | "fr";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

const translations = {
  en: {
    nav: {
      teachersSpace: "Teachers' Area",
      ecosystem: "Ecosystem",
      quiz: "Quiz",
      grades: "Grades",
      logout: "Logout",
    },
    footer: {
      quote: "A wild garden growing through the bonds we create",
    },
    grades: {
      title: "Grade Management",
      class: "Class",
      selectClass: "Select a class",
      subject: "Subject",
      selectSubject: "Select a subject",
      newSubject: "+ New subject",
      bulkImport: "Bulk import",
      addGrade: "Add a grade",
      noGradeEntered: "No grade entered",
      generalAverage: "General average",
      subjectInfo: "Subject information",
      teacher: "Teacher",
      schoolYear: "School year",
      semester: "Semester",
      createSubject: "Create a new subject",
      teacherFullName: "Teacher's first and last name",
      teacherPlaceholder: "e.g. Marie Dupont",
      schoolYearLabel: "School year",
      selectSchoolYear: "Select school year",
      semesterLabel: "Semester",
      selectSemester: "Select semester",
      semester1: "Semester 1",
      semester2: "Semester 2",
      fullYear: "Full year",
      subjectName: "Subject name",
      subjectPlaceholder: "e.g. Applied Mathematics",
      subjectHelp: "This name will be used for grade management. The administration will compose the final name for reports.",
      createButton: "Create subject",
      cancel: "Cancel",
      assessmentType: "Assessment type",
      selectAssessmentType: "Select assessment type",
      individualParticipation: "Individual participation",
      oralGroup: "Oral - group work",
      oralIndividual: "Oral - individual work",
      writtenGroup: "Written - group work",
      writtenIndividual: "Written - individual work",
      thesis: "Thesis",
      other: "Other",
      specifyType: "Specify assessment type",
      specifyPlaceholder: "e.g. End of year project",
      grade: "Grade",
      outOf: "Out of",
      weighting: "Weighting in final grade",
      defaultWeighting: "Default weighting",
      weightingHelp: "e.g. 1 for normal coefficient, 2 for double, 0.5 for half",
      selectWeighting: "Choose weighting",
      appreciation: "Comments",
      appreciationPlaceholder: "Comment on student performance...",
      save: "Save",
      gradeSuccess: "Grade saved successfully",
      gradeError: "Error saving grade",
      visualEntry: "Visual entry",
      csvImport: "CSV import",
      enterGrades: "Enter grades",
      pasteCSV: "Paste your CSV data",
      csvFormats: "Accepted formats:",
      csvFormat1: "• Grade [Weighting] (one per line, in order displayed)",
      csvFormat2: "• Last name First name Grade [Weighting] (separated by comma, semicolon or tab)",
      csvFormat3: "• First name Last name Grade [Weighting]",
      csvOptional: "Weighting is optional",
      csvPlaceholder: "Example with weighting:\nJean Dupont, 15.5, 2\nMarie Martin, 18, 1\n\nOr simply:\n15.5, 2\n18, 1\n16, 1.5",
      parseCSV: "Parse CSV",
      gradesDetected: "grades detected:",
      importGrades: "Import",
      maxGrade: "Maximum grade",
    },
    directory: {
      title: "Student Ecosystem",
      studentsCount: "students",
      student: "student",
      subtitle: "Informed decision-makers of tomorrow",
      exportCSV: "Export CSV",
      searchPlaceholder: "Search by name, company or background...",
      filterByClass: "Filter by class",
      allClasses: "All classes",
      sortBy: "Sort by",
      sortLastName: "Name (A → Z)",
      sortClass: "Class (A → Z)",
      sortClassReverse: "Class (Z → A)",
      sortAge: "Age (youngest → oldest)",
      sortCreatedAt: "Date added (newest → oldest)",
      showActiveSearch: "Show only students actively searching",
      noStudents: "No students found",
      adjustFilters: "Adjust your filters",
      addFirstStudent: "Add your first student",
      loading: "Loading ecosystem...",
      exportSuccess: "CSV export successful",
      loadError: "Failed to load students",
    },
    quiz: {
      title: "Ecosystem Quiz",
      subtitle: "Test your knowledge of the informed decision-makers building with you a world compatible with planetary limits",
      selectClass: "Select a class",
      chooseClass: "Choose a class...",
      startQuiz: "Start quiz",
      exitQuiz: "Exit Quiz",
      questionOf: "Question",
      of: "of",
      score: "Score",
      whoIsThis: "Who is this?",
      results: {
        perfect: {
          title: "Remarkable!",
          message: "You know perfectly the students you support to become informed decision-makers, capable of building a world compatible with planetary limits.",
        },
        good: {
          title: "Very good!",
          message: "You know well the students you support to become the informed decision-makers of tomorrow.",
        },
        decent: {
          title: "Good start!",
          message: "Keep building connections with your students. The better you know them, the better you guide them to become informed decision-makers.",
        },
        low: {
          title: "A starting point",
          message: "Take time to know your students better to effectively support them in their role as informed decision-makers.",
        },
        scoreLabel: "Score:",
        anotherClass: "Another class",
        backToEcosystem: "Back to ecosystem",
      },
    },
    index: {
      title: "Regen School",
      subtitle: "Your comprehensive student directory and learning platform for economic adaptation to planetary limits",
      directoryTitle: "Student Directory",
      directoryDesc: "Easily browse and manage student profiles with photos, academic backgrounds, and company affiliations. Add private notes for each student.",
      quizTitle: "Quiz Mode",
      quizDesc: "Learn student names faster with our gamified quiz system. Match faces to names and track your progress with scores.",
      getStarted: "Get Started",
      signupLogin: "Sign up or log in to access the platform",
    },
    auth: {
      welcome: "Welcome",
      subtitle: "Access your student ecosystem",
      email: "Email",
      password: "Password",
      login: "Log In",
      signup: "Sign Up",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      loginError: "Login failed",
      signupError: "Signup failed",
    },
    studentCard: {
      yearsOld: "years old",
      notSpecified: "Not specified",
      privateNotes: "Private notes",
      addPrivateNotes: "Add your private notes...",
      save: "Save",
      noNotes: "No notes. Click to add.",
      loginToSaveNotes: "Please log in to save notes",
      noteSaved: "Note saved",
      failedToSaveNote: "Failed to save note",
      studentDeleted: "Student deleted",
      deleteFailed: "Delete failed",
      confirmDelete: "Confirm deletion",
      deleteConfirmMessage: "Are you sure you want to delete",
      cancel: "Cancel",
      delete: "Delete",
      birthDate: "Date of Birth",
      pickDate: "Pick a date",
    },
  },
  fr: {
    nav: {
      teachersSpace: "Espace enseignants",
      ecosystem: "Écosystème",
      quiz: "Quiz",
      grades: "Notes",
      logout: "Déconnexion",
    },
    footer: {
      quote: "Un jardin sauvage qui pousse au gré des liens qui se tissent",
    },
    grades: {
      title: "Gestion des notes",
      class: "Classe",
      selectClass: "Sélectionner une classe",
      subject: "Matière",
      selectSubject: "Sélectionner une matière",
      newSubject: "+ Nouvelle matière",
      bulkImport: "Import en masse",
      addGrade: "Ajouter une note",
      noGradeEntered: "Aucune note saisie",
      generalAverage: "Moyenne générale",
      subjectInfo: "Informations de la matière",
      teacher: "Enseignant",
      schoolYear: "Année scolaire",
      semester: "Semestre",
      createSubject: "Créer une nouvelle matière",
      teacherFullName: "Nom et prénom de l'enseignant",
      teacherPlaceholder: "Ex: Marie Dupont",
      schoolYearLabel: "Année scolaire",
      selectSchoolYear: "Sélectionner l'année scolaire",
      semesterLabel: "Semestre concerné",
      selectSemester: "Sélectionner le semestre",
      semester1: "Semestre 1",
      semester2: "Semestre 2",
      fullYear: "Année complète",
      subjectName: "Nom de la matière",
      subjectPlaceholder: "Ex: Mathématiques appliquées",
      subjectHelp: "Ce nom sera utilisé pour la gestion des notes. La direction composera le nom final pour le bulletin.",
      createButton: "Créer la matière",
      cancel: "Annuler",
      assessmentType: "Type d'épreuve",
      selectAssessmentType: "Sélectionner le type d'épreuve",
      individualParticipation: "Participation individuelle",
      oralGroup: "Oral - travail de groupe",
      oralIndividual: "Oral - travail individuel",
      writtenGroup: "Écrit - travail de groupe",
      writtenIndividual: "Écrit - travail individuel",
      thesis: "Mémoire",
      other: "Autre",
      specifyType: "Précisez le type d'épreuve",
      specifyPlaceholder: "Ex: Projet de fin d'année",
      grade: "Note",
      outOf: "Sur",
      weighting: "Pondération dans la note finale",
      defaultWeighting: "Pondération par défaut",
      weightingHelp: "Ex: 1 pour coefficient normal, 2 pour double, 0.5 pour demi",
      selectWeighting: "Choisir la pondération",
      appreciation: "Appréciation",
      appreciationPlaceholder: "Commentaire sur la performance de l'étudiant...",
      save: "Enregistrer",
      gradeSuccess: "Note enregistrée avec succès",
      gradeError: "Erreur lors de l'enregistrement de la note",
      visualEntry: "Saisie visuelle",
      csvImport: "Import CSV",
      enterGrades: "Saisie des notes",
      pasteCSV: "Coller vos données CSV",
      csvFormats: "Formats acceptés:",
      csvFormat1: "• Note [Pondération] (une par ligne, dans l'ordre affiché)",
      csvFormat2: "• Nom Prénom Note [Pondération] (séparés par virgule, point-virgule ou tabulation)",
      csvFormat3: "• Prénom Nom Note [Pondération]",
      csvOptional: "La pondération est optionnelle",
      csvPlaceholder: "Exemple avec pondération:\nJean Dupont, 15.5, 2\nMarie Martin, 18, 1\n\nOu simplement:\n15.5, 2\n18, 1\n16, 1.5",
      parseCSV: "Parser le CSV",
      gradesDetected: "notes détectées:",
      importGrades: "Importer",
      maxGrade: "Note maximale",
    },
    directory: {
      title: "Écosystème étudiant",
      studentsCount: "étudiants",
      student: "étudiant",
      subtitle: "Décideurs éclairés de demain",
      exportCSV: "Export CSV",
      searchPlaceholder: "Rechercher par nom, entreprise ou parcours...",
      filterByClass: "Filtrer par classe",
      allClasses: "Toutes les classes",
      sortBy: "Trier par",
      sortLastName: "Nom (A → Z)",
      sortClass: "Classe (A → Z)",
      sortClassReverse: "Classe (Z → A)",
      sortAge: "Âge (+ jeune → + vieux)",
      sortCreatedAt: "Date d'ajout (+ récent → + ancien)",
      showActiveSearch: "Afficher uniquement les étudiants en recherche active",
      noStudents: "Aucun étudiant trouvé",
      adjustFilters: "Ajustez vos filtres",
      addFirstStudent: "Ajoutez votre premier étudiant",
      loading: "Chargement de l'écosystème...",
      exportSuccess: "Export CSV réussi",
      loadError: "Échec du chargement des étudiants",
    },
    quiz: {
      title: "Quiz de l'écosystème",
      subtitle: "Testez votre connaissance des décideurs éclairés qui construisent avec vous un monde compatible avec les limites planétaires",
      selectClass: "Sélectionnez une classe",
      chooseClass: "Choisir une classe...",
      startQuiz: "Commencer le quiz",
      exitQuiz: "Quitter le quiz",
      questionOf: "Question",
      of: "sur",
      score: "Score",
      whoIsThis: "Qui est-ce ?",
      results: {
        perfect: {
          title: "Remarquable !",
          message: "Vous connaissez parfaitement les étudiants que vous accompagnez à devenir des décideurs éclairés, capables de construire un monde compatible avec les limites planétaires.",
        },
        good: {
          title: "Très bien !",
          message: "Vous connaissez bien les étudiants que vous accompagnez à devenir des décideurs éclairés de demain.",
        },
        decent: {
          title: "Bon début !",
          message: "Continuez à tisser des liens avec vos étudiants. Mieux vous les connaissez, mieux vous les accompagnez à devenir des décideurs éclairés.",
        },
        low: {
          title: "Un point de départ",
          message: "Prenez le temps de mieux connaître vos étudiants pour les accompagner efficacement vers leur rôle de décideurs éclairés.",
        },
        scoreLabel: "Score :",
        anotherClass: "Autre classe",
        backToEcosystem: "Retour à l'écosystème",
      },
    },
    index: {
      title: "Regen School",
      subtitle: "Votre annuaire étudiant complet et plateforme d'apprentissage pour l'adaptation économique aux limites planétaires",
      directoryTitle: "Annuaire étudiant",
      directoryDesc: "Parcourez et gérez facilement les profils étudiants avec photos, parcours académiques et affiliations d'entreprise. Ajoutez des notes privées pour chaque étudiant.",
      quizTitle: "Mode Quiz",
      quizDesc: "Apprenez les noms des étudiants plus rapidement avec notre système de quiz gamifié. Associez les visages aux noms et suivez vos progrès avec des scores.",
      getStarted: "Commencer",
      signupLogin: "Inscrivez-vous ou connectez-vous pour accéder à la plateforme",
    },
    auth: {
      welcome: "Bienvenue",
      subtitle: "Accédez à votre écosystème étudiant",
      email: "Email",
      password: "Mot de passe",
      login: "Se connecter",
      signup: "S'inscrire",
      noAccount: "Pas encore de compte ?",
      hasAccount: "Déjà un compte ?",
      loginError: "Échec de la connexion",
      signupError: "Échec de l'inscription",
    },
    studentCard: {
      yearsOld: "ans",
      notSpecified: "Non renseigné",
      privateNotes: "Notes privées",
      addPrivateNotes: "Ajoutez vos notes privées...",
      save: "Sauver",
      noNotes: "Pas de notes. Cliquez pour ajouter.",
      loginToSaveNotes: "Veuillez vous connecter pour sauvegarder les notes",
      noteSaved: "Note sauvegardée",
      failedToSaveNote: "Échec de la sauvegarde de la note",
      studentDeleted: "Étudiant supprimé",
      deleteFailed: "Échec de la suppression",
      confirmDelete: "Confirmer la suppression",
      deleteConfirmMessage: "Êtes-vous sûr de vouloir supprimer",
      cancel: "Annuler",
      delete: "Supprimer",
      birthDate: "Date de naissance",
      pickDate: "Choisir une date",
    },
  },
};

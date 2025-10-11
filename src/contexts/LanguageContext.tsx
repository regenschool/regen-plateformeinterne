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
      logout: "Logout",
    },
    footer: {
      quote: "A wild garden growing through the bonds we create",
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
    },
  },
  fr: {
    nav: {
      teachersSpace: "Espace enseignants",
      ecosystem: "Écosystème",
      quiz: "Quiz",
      logout: "Déconnexion",
    },
    footer: {
      quote: "Un jardin sauvage qui pousse au gré des liens qui se tissent",
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
    },
  },
};

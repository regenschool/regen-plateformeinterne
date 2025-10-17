import { useAdmin } from "@/contexts/AdminContext";
import { Navigate } from "react-router-dom";
import { ReportCardGeneration } from "@/components/ReportCardGeneration";
import { FileText } from "lucide-react";

export default function Bulletins() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Génération de Bulletins</h1>
        </div>
        <p className="text-muted-foreground">
          Configurez et générez les bulletins scolaires pour vos classes
        </p>
      </div>

      <ReportCardGeneration />
    </div>
  );
}

import { Navigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { AuditLogsViewer } from "@/components/settings/AuditLogsViewer";
import { useAdmin } from "@/contexts/AdminContext";

export default function Audit() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Journal d'Audit</h1>
        </div>
        <p className="text-muted-foreground">
          Consultez l'historique complet de toutes les actions effectuées sur les données sensibles
        </p>
      </div>

      <AuditLogsViewer />
    </div>
  );
}

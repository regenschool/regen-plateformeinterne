import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { ReportCardEditor } from '@/components/ReportCardEditor';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BulletinEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: reportCard, isLoading } = useQuery({
    queryKey: ['report-card', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_report_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!reportCard) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bulletin non trouvé</p>
          <Button onClick={() => navigate('/bulletins')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux bulletins
          </Button>
        </div>
      </Layout>
    );
  }

  // Utiliser edited_data s'il existe, sinon generated_data
  const initialData = (reportCard.edited_data || reportCard.generated_data) as any;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/bulletins')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        <ReportCardEditor
          reportCardId={reportCard.id}
          initialData={initialData}
          onClose={() => navigate('/bulletins')}
        />
      </div>
    </Layout>
  );
}

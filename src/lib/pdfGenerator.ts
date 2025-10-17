// Architecture flexible pour la génération de PDF
// Permet de basculer facilement entre jsPDF et Puppeteer

export interface ReportCardData {
  student: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    className: string;
    photoUrl?: string;
  };
  academic: {
    schoolYear: string;
    semester: string;
  };
  grades: Array<{
    subject: string;
    grade: number;
    maxGrade: number;
    weighting: number;
    assessmentType: string;
    appreciation?: string;
  }>;
  template?: {
    name: string;
    headerColor: string;
    logoUrl?: string;
    footerText?: string;
    sections: string[];
  };
  averages?: {
    student: number;
    class: number;
  };
}

export interface PDFGenerator {
  generateReportCard(data: ReportCardData): Promise<Blob>;
}

// Implémentation Puppeteer (via edge function)
export class PuppeteerGenerator implements PDFGenerator {
  async generateReportCard(data: ReportCardData): Promise<Blob> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: pdfData, error } = await supabase.functions.invoke(
      'generate-report-card-pdf',
      {
        body: { reportCardData: data },
      }
    );

    if (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      throw new Error('Échec de la génération du PDF');
    }

    return new Blob([pdfData], { type: 'application/pdf' });
  }
}

// Implémentation jsPDF (fallback, à implémenter si besoin)
export class JsPDFGenerator implements PDFGenerator {
  async generateReportCard(data: ReportCardData): Promise<Blob> {
    // Implémentation basique avec jsPDF si besoin
    // Pour l'instant, on utilise Puppeteer
    throw new Error('jsPDF generator not implemented yet');
  }
}

// Factory pour choisir le générateur
export const createPDFGenerator = (useAdvancedTemplates = true): PDFGenerator => {
  if (useAdvancedTemplates) {
    return new PuppeteerGenerator();
  }
  return new JsPDFGenerator();
};

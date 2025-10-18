// Architecture flexible pour la génération de PDF
// Utilise HTML to PDF côté client pour éviter les limitations des Edge Functions

import { supabase } from '@/integrations/supabase/client';

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
    classAverage?: number;
    minAverage?: number;
    maxAverage?: number;
  }>;
  template?: {
    id?: string;
    name: string;
    headerColor: string;
    logoUrl?: string;
    footerText?: string;
    sections: string[];
    htmlTemplate?: string;
    cssTemplate?: string;
    useCustomHtml?: boolean;
    // Flags pour contrôler l'affichage
    show_header?: boolean;
    show_footer?: boolean;
    show_student_info?: boolean;
    show_academic_info?: boolean;
    show_grades_table?: boolean;
    show_average?: boolean;
    show_class_average?: boolean;
    show_appreciation?: boolean;
    show_student_photo?: boolean;
    show_logo?: boolean;
  };
  averages?: {
    student: number;
    class: number;
  };
  generalAppreciation?: string;
  title?: string;
  headerText?: string;
}

export interface PDFGenerator {
  generateReportCard(data: ReportCardData): Promise<Blob>;
}

// Implémentation basée sur Edge Function qui retourne HTML + génération PDF côté client
export class PuppeteerGenerator implements PDFGenerator {
  async generateReportCard(data: ReportCardData): Promise<Blob> {
    const { data: response, error } = await supabase.functions.invoke(
      'generate-report-card-pdf',
      {
        body: { reportCardData: data },
      }
    );

    if (error) {
      console.error('Error generating HTML:', error);
      throw new Error('Échec de la génération du bulletin');
    }

    // L'edge function retourne du HTML
    const { html } = response;
    
    // Lazy load des dépendances
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    
    // Créer un élément temporaire pour le rendu
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      // Capturer le HTML comme image
      const canvas = await html2canvas.default(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      return pdf.output('blob');
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}

// Implémentation jsPDF (fallback, à implémenter si besoin)
export class JsPDFGenerator implements PDFGenerator {
  async generateReportCard(data: ReportCardData): Promise<Blob> {
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

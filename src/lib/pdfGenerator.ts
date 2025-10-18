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
    age?: number;
  };
  academic: {
    schoolYear: string;
    semester: string;
    programName?: string;
  };
  grades: Array<{
    subject: string;
    subject_category?: string;
    grade: number;
    maxGrade: number;
    weighting: number;
    assessmentType: string;
    appreciation?: string;
    classAverage?: number;
    minAverage?: number;
    maxAverage?: number;
    teacher_name?: string;
  }>;
  template?: {
    name: string;
    logo_url?: string;
    signature_url?: string;
    header_color?: string;
    footer_text?: string;
    config: Array<{
      section_key: string;
      element_key: string;
      is_visible: boolean;
      is_editable: boolean;
      default_value?: string;
      style_options?: Record<string, any>;
    }>;
  };
  averages?: {
    student: number;
    class: number;
  };
  generalAppreciation?: string;
  companyAppreciation?: string;
}

export interface PDFGenerator {
  generateReportCard(data: ReportCardData): Promise<Blob>;
}

// Implémentation basée sur Edge Function V2 avec nouvelle architecture
export class PuppeteerGenerator implements PDFGenerator {
  async generateReportCard(data: ReportCardData): Promise<Blob> {
    const { data: response, error } = await supabase.functions.invoke(
      'generate-report-card-pdf-v2',
      {
        body: { reportCardData: data },
      }
    );

    if (error) {
      console.error('Error generating HTML:', error);
      throw new Error('Échec de la génération du bulletin');
    }

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
      // Capturer le HTML comme image (échelle réduite pour limiter la taille)
      const canvas = await html2canvas.default(tempDiv, {
        scale: 1.5,
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

      // Utiliser JPEG compressé pour réduire le poids
      const imgData = canvas.toDataURL('image/jpeg', 0.82);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
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

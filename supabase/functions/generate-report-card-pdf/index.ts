const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportCardData {
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
    name: string;
    headerColor: string;
    logoUrl?: string;
    footerText?: string;
    sections: string[];
    htmlTemplate?: string;
    cssTemplate?: string;
    useCustomHtml?: boolean;
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

const generateHTMLTemplate = (data: ReportCardData): string => {
  const { student, academic, grades, template, averages } = data;
  
  // Si un template HTML personnalisé est fourni, l'utiliser
  if (template?.useCustomHtml && template?.htmlTemplate) {
    let html = template.htmlTemplate;
    
    // Remplacer les variables
    html = html.replace(/FIRST_NAME/g, student.firstName);
    html = html.replace(/LAST_NAME/g, student.lastName);
    html = html.replace(/CLASS_NAME/g, student.className);
    html = html.replace(/BIRTH_DATE/g, student.birthDate || '');
    html = html.replace(/SCHOOL_YEAR/g, academic.schoolYear);
    html = html.replace(/SEMESTER/g, academic.semester);
    
    // Générer les lignes de notes (moyennes par matière)
    const showClassAverage = template?.show_class_average !== false;
    const gradesRows = grades.map(grade => `
      <tr>
        <td><strong>${grade.subject}</strong></td>
        <td class="grade-cell">${grade.grade.toFixed(2)}/${grade.maxGrade}</td>
        ${showClassAverage ? `
          <td class="text-center text-muted">${grade.classAverage?.toFixed(2) || '-'}</td>
          <td class="text-center text-xs text-danger">${grade.minAverage?.toFixed(2) || '-'}</td>
          <td class="text-center text-xs text-success">${grade.maxAverage?.toFixed(2) || '-'}</td>
        ` : ''}
        <td class="text-center">${grade.weighting}</td>
        <td class="appreciation">${grade.appreciation || '-'}</td>
      </tr>
    `).join('');
    
    html = html.replace(/<!-- GRADES_ROWS -->/g, gradesRows);
    html = html.replace(/STUDENT_AVERAGE/g, averages?.student.toFixed(2) || '0');
    html = html.replace(/CLASS_AVERAGE/g, averages?.class.toFixed(2) || '0');
    
    // Ajouter le CSS personnalisé dans le head si fourni
    if (template.cssTemplate) {
      html = html.replace('</head>', `<style>${template.cssTemplate}</style></head>`);
    }
    
    return html;
  }
  
  // Sinon, utiliser le template par défaut
  const headerColor = template?.headerColor || '#1e40af';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulletin - ${student.firstName} ${student.lastName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          padding: 40px;
          color: #333;
        }
        
        .header {
          background: ${headerColor};
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .header .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .logo {
          max-height: 60px;
          max-width: 150px;
        }
        
        .student-info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
        }
        
        .student-photo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid ${headerColor};
        }
        
        .student-details h2 {
          color: ${headerColor};
          margin-bottom: 10px;
        }
        
        .student-details p {
          margin: 5px 0;
          color: #64748b;
        }
        
        .grades-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .grades-table thead {
          background: ${headerColor};
          color: white;
        }
        
        .grades-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        
        .grades-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .grades-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .grade-cell {
          font-weight: bold;
          color: ${headerColor};
        }
        
        .appreciation {
          font-style: italic;
          color: #64748b;
          font-size: 14px;
        }
        
        .averages {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        
        .average-card {
          background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          text-align: center;
        }
        
        .average-card h3 {
          font-size: 16px;
          margin-bottom: 10px;
          opacity: 0.9;
        }
        
        .average-card .value {
          font-size: 36px;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      ${template?.show_header !== false ? `
        <div class="header">
          <div>
            <h1>${data.title || 'Bulletin Scolaire'}</h1>
            <div class="subtitle">${academic.schoolYear} - ${academic.semester}</div>
            ${data.headerText ? `<div class="subtitle" style="font-size: 12px; margin-top: 5px;">${data.headerText}</div>` : ''}
          </div>
          ${template?.show_logo !== false && template?.logoUrl ? `<img src="${template.logoUrl}" class="logo" alt="Logo" />` : ''}
        </div>
      ` : ''}
      
      ${template?.show_student_info !== false ? `
        <div class="student-info">
          ${template?.show_student_photo !== false && student.photoUrl ? `<img src="${student.photoUrl}" class="student-photo" alt="${student.firstName}" />` : ''}
          <div class="student-details">
            <h2>${student.firstName} ${student.lastName}</h2>
            <p><strong>Classe:</strong> ${student.className}</p>
            ${student.birthDate ? `<p><strong>Date de naissance:</strong> ${student.birthDate}</p>` : ''}
          </div>
        </div>
      ` : ''}
      
      ${template?.show_grades_table !== false ? `
        <table class="grades-table">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Moyenne Élève</th>
              ${template?.show_class_average ? `
                <th>Moy. Classe</th>
                <th>Min</th>
                <th>Max</th>
              ` : ''}
              <th>Coefficient</th>
              <th>Appréciation</th>
            </tr>
          </thead>
          <tbody>
            ${grades.map(grade => `
              <tr>
                <td><strong>${grade.subject}</strong></td>
                <td class="grade-cell">${grade.grade.toFixed(2)}/${grade.maxGrade}</td>
                ${template?.show_class_average ? `
                  <td class="text-center" style="color: #64748b;">${grade.classAverage?.toFixed(2) || '-'}</td>
                  <td class="text-center text-xs" style="color: #dc2626;">${grade.minAverage?.toFixed(2) || '-'}</td>
                  <td class="text-center text-xs" style="color: #16a34a;">${grade.maxAverage?.toFixed(2) || '-'}</td>
                ` : ''}
                <td class="text-center">${grade.weighting}</td>
                <td class="appreciation">${grade.appreciation || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: rgba(30, 64, 175, 0.05); font-weight: bold;">
              <td colspan="${template?.show_class_average ? 5 : 1}" style="padding: 15px;">Moyenne générale</td>
              <td colspan="2" style="text-align: center; color: ${headerColor}; font-size: 18px; padding: 15px;">
                ${averages?.student.toFixed(2)}/20
              </td>
            </tr>
          </tfoot>
        </table>
      ` : ''}
      
      ${template?.show_average && averages ? `
        <div class="averages">
          <div class="average-card">
            <h3>Moyenne de l'élève</h3>
            <div class="value">${averages.student.toFixed(2)}/20</div>
          </div>
          ${template?.show_class_average ? `
            <div class="average-card">
              <h3>Moyenne de la classe</h3>
              <div class="value">${averages.class.toFixed(2)}/20</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${template?.show_appreciation !== false && data.generalAppreciation ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="margin-bottom: 10px; color: ${headerColor};">Appréciation générale</h3>
          <p style="font-style: italic; color: #64748b;">${data.generalAppreciation}</p>
        </div>
      ` : ''}
      
      ${template?.show_footer !== false && template?.footerText ? `
        <div class="footer">
          ${template.footerText}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportCardData } = await req.json();
    
    console.log('Generating report card HTML for:', reportCardData.student);

    // Générer le HTML final
    const html = generateHTMLTemplate(reportCardData);

    console.log('HTML generated successfully');

    // Retourner le HTML au lieu du PDF
    // Le client utilisera jsPDF pour générer le PDF côté navigateur
    return new Response(JSON.stringify({ html }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error generating HTML:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

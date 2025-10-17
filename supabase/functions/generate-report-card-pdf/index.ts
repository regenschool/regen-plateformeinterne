import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

const generateHTMLTemplate = (data: ReportCardData): string => {
  const { student, academic, grades, template, averages } = data;
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
      <div class="header">
        <div>
          <h1>Bulletin Scolaire</h1>
          <div class="subtitle">${academic.schoolYear} - ${academic.semester}</div>
        </div>
        ${template?.logoUrl ? `<img src="${template.logoUrl}" class="logo" alt="Logo" />` : ''}
      </div>
      
      <div class="student-info">
        ${student.photoUrl ? `<img src="${student.photoUrl}" class="student-photo" alt="${student.firstName}" />` : ''}
        <div class="student-details">
          <h2>${student.firstName} ${student.lastName}</h2>
          <p><strong>Classe:</strong> ${student.className}</p>
          ${student.birthDate ? `<p><strong>Date de naissance:</strong> ${student.birthDate}</p>` : ''}
        </div>
      </div>
      
      <table class="grades-table">
        <thead>
          <tr>
            <th>Matière</th>
            <th>Type</th>
            <th>Note</th>
            <th>Coefficient</th>
            <th>Appréciation</th>
          </tr>
        </thead>
        <tbody>
          ${grades.map(grade => `
            <tr>
              <td><strong>${grade.subject}</strong></td>
              <td>${grade.assessmentType}</td>
              <td class="grade-cell">${grade.grade}/${grade.maxGrade}</td>
              <td>${grade.weighting}</td>
              <td class="appreciation">${grade.appreciation || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${averages ? `
        <div class="averages">
          <div class="average-card">
            <h3>Moyenne de l'élève</h3>
            <div class="value">${averages.student.toFixed(2)}/20</div>
          </div>
          <div class="average-card">
            <h3>Moyenne de la classe</h3>
            <div class="value">${averages.class.toFixed(2)}/20</div>
          </div>
        </div>
      ` : ''}
      
      ${template?.footerText ? `
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
    
    console.log('Generating report card PDF for:', reportCardData.student);

    // Generate HTML from template
    const html = generateHTMLTemplate(reportCardData);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    console.log('PDF generated successfully');

    return new Response(pdfBuffer.buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bulletin_${reportCardData.student.lastName}_${reportCardData.student.firstName}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

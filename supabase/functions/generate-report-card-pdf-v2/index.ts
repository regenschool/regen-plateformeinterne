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
    assessment_name?: string;
    teacher_name?: string;
  }>;
  template?: {
    name: string;
    config: TemplateConfig[];
  };
  averages?: {
    student: number;
    class: number;
  };
  generalAppreciation?: string;
  companyAppreciation?: string;
}

interface TemplateConfig {
  section_key: string;
  element_key: string;
  is_visible: boolean;
  is_editable: boolean;
  default_value?: string;
  style_options?: {
    format?: 'fraction' | 'percentage' | 'points';
    [key: string]: any;
  };
}

const getConfigValue = (
  config: TemplateConfig[],
  sectionKey: string,
  elementKey: string,
  property: 'is_visible' | 'default_value' | 'style_options' = 'is_visible'
): any => {
  const item = config.find(c => c.section_key === sectionKey && c.element_key === elementKey);
  if (!item) return property === 'is_visible' ? true : undefined;
  return item[property];
};

const formatGrade = (grade: number, maxGrade: number, format?: string): string => {
  const normalized = (grade / maxGrade) * 20;
  
  switch (format) {
    case 'percentage':
      return `${((grade / maxGrade) * 100).toFixed(1)}%`;
    case 'points':
      return normalized.toFixed(2);
    case 'fraction':
    default:
      return `${normalized.toFixed(2)}/20`;
  }
};

const generateHTMLTemplate = (data: ReportCardData): string => {
  const config = data.template?.config || [];
  
  // Grouper les notes par matière
  const gradesBySubject = new Map<string, typeof data.grades>();
  data.grades.forEach(grade => {
    const existing = gradesBySubject.get(grade.subject) || [];
    gradesBySubject.set(grade.subject, [...existing, grade]);
  });

  const subjectStats = Array.from(gradesBySubject.entries()).map(([subject, grades]) => {
    const avg = grades.reduce((sum, g) => sum + (g.grade / g.maxGrade) * 20, 0) / grades.length;
    const classAvgs = grades.map(g => g.classAverage || 0).filter(a => a > 0);
    const minGrade = classAvgs.length > 0 ? Math.min(...classAvgs) : 0;
    const maxGrade = classAvgs.length > 0 ? Math.max(...classAvgs) : 0;
    const category = grades[0]?.subject_category;
    const teacherName = grades[0]?.teacher_name;
    return { subject, category, grades, avg, minGrade, maxGrade, teacherName };
  });

  // Valeurs par défaut des éléments de config
  const headerColor = getConfigValue(config, 'style', 'header_color', 'default_value') || '#1e40af';
  const title = getConfigValue(config, 'header', 'title', 'default_value') || 'Bulletin de Notes';
  const schoolName = getConfigValue(config, 'header', 'school_name', 'default_value') || '';
  const logo = getConfigValue(config, 'header', 'logo', 'default_value');
  const signature = getConfigValue(config, 'footer', 'signature', 'default_value');
  const signatoryTitle = getConfigValue(config, 'footer', 'signatory_title', 'default_value') || 'Le Directeur des Études';
  const footerText = getConfigValue(config, 'footer', 'school_name_footer', 'default_value') || '';

  // Format des notes
  const gradeFormat = getConfigValue(config, 'grades_table', 'student_subject_average', 'style_options')?.format || 'fraction';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #1f2937;
      background: white;
      padding: 30px 40px;
    }
    .report-container {
      max-width: 750px;
      margin: 0 auto;
    }
    
    /* Header élégant avec logo centré */
    .header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      max-width: 60px;
      max-height: 60px;
      object-fit: contain;
      margin: 0 auto 15px;
      display: block;
    }
    .title {
      font-size: 20pt;
      font-weight: 700;
      color: ${headerColor};
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .school-name {
      font-size: 10pt;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .academic-info {
      font-size: 8.5pt;
      color: #9ca3af;
      font-weight: 500;
    }
    
    /* Section étudiant avec design épuré */
    .student-section {
      background: linear-gradient(135deg, ${headerColor}08, ${headerColor}03);
      border: 1px solid ${headerColor}20;
      border-radius: 8px;
      padding: 18px 24px;
      margin-bottom: 30px;
    }
    .student-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 24px;
      font-size: 9pt;
    }
    .student-label {
      font-weight: 600;
      color: #6b7280;
      display: inline-block;
      min-width: 90px;
    }
    .student-value {
      color: #1f2937;
      font-weight: 500;
    }
    
    /* Séparateur premium */
    .section-separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${headerColor}30, transparent);
      margin: 28px 0;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: ${headerColor};
      margin: 20px 0 16px;
      padding-left: 12px;
      border-left: 3px solid ${headerColor};
      letter-spacing: -0.3px;
    }
    
    /* Table des notes élégante */
    .grades-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 25px;
      font-size: 8.5pt;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .grades-table th {
      background: linear-gradient(180deg, ${headerColor}12, ${headerColor}08);
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid ${headerColor}30;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .grades-table td {
      padding: 11px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .grades-table tbody tr:last-child td {
      border-bottom: none;
    }
    .subject-row {
      background: white;
      transition: background 0.2s;
    }
    .subject-row:nth-child(even) {
      background: #fafbfc;
    }
    .subject-name {
      font-weight: 600;
      color: #1f2937;
    }
    .category-badge {
      display: inline-block;
      padding: 2px 8px;
      background: linear-gradient(135deg, ${headerColor}15, ${headerColor}08);
      color: ${headerColor};
      border-radius: 4px;
      font-size: 7pt;
      margin-left: 8px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .grade-value {
      font-weight: 700;
      color: ${headerColor};
      text-align: center;
      font-size: 9pt;
    }
    .appreciation-cell {
      font-style: italic;
      color: #6b7280;
      font-size: 8pt;
      line-height: 1.3;
    }
    
    /* Moyenne générale premium */
    .overall-average {
      background: linear-gradient(135deg, ${headerColor}12, ${headerColor}05);
      border: 2px solid ${headerColor}40;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 2px 8px ${headerColor}10;
    }
    .overall-label {
      font-size: 9.5pt;
      color: #6b7280;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 700;
    }
    .overall-value {
      font-size: 32pt;
      font-weight: 800;
      color: ${headerColor};
      letter-spacing: -1px;
    }
    .class-average-detail {
      margin-top: 12px;
      font-size: 8.5pt;
      color: #6b7280;
      font-weight: 500;
    }
    
    /* Appréciations élégantes */
    .general-appreciation {
      background: linear-gradient(135deg, #f9fafb, #ffffff);
      border-left: 3px solid ${headerColor};
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 9pt;
      line-height: 1.6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .appreciation-title {
      font-weight: 700;
      margin-bottom: 8px;
      color: #374151;
      font-size: 9.5pt;
    }
    
    /* Signature raffinée */
    .signature-section {
      margin-top: 45px;
      display: flex;
      justify-content: flex-end;
    }
    .signature-block {
      text-align: center;
      max-width: 200px;
    }
    .signature-label {
      font-size: 8.5pt;
      color: #6b7280;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .signature-img {
      max-width: 140px;
      max-height: 50px;
      object-fit: contain;
      margin-bottom: 8px;
    }
    .signature-line {
      width: 180px;
      border-top: 1px solid #d1d5db;
      margin-top: 8px;
    }
    
    /* Footer minimaliste */
    .footer {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 7.5pt;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${getConfigValue(config, 'header', 'title', 'is_visible') !== false ? `
    <div class="header">
      ${getConfigValue(config, 'header', 'logo', 'is_visible') !== false && logo ? `
      <img src="${logo}" alt="Logo" class="logo">` : ''}
      <div class="title">${title}</div>
      ${getConfigValue(config, 'header', 'school_name', 'is_visible') !== false && schoolName ? `
      <div class="school-name">${schoolName}</div>` : ''}
      <div class="academic-info">
        ${getConfigValue(config, 'header', 'school_year', 'is_visible') !== false ? data.academic.schoolYear : ''}
        ${getConfigValue(config, 'header', 'semester', 'is_visible') !== false ? ` • ${data.academic.semester}` : ''}
      </div>
    </div>` : ''}

    <div class="section-separator"></div>

    ${getConfigValue(config, 'student_info', 'first_name', 'is_visible') !== false ? `
    <div class="student-section">
      <div class="student-grid">
        ${getConfigValue(config, 'student_info', 'first_name', 'is_visible') !== false ? `
        <div><span class="student-label">Prénom :</span> <span class="student-value">${data.student.firstName}</span></div>` : ''}
        ${getConfigValue(config, 'student_info', 'last_name', 'is_visible') !== false ? `
        <div><span class="student-label">Nom :</span> <span class="student-value">${data.student.lastName}</span></div>` : ''}
        ${getConfigValue(config, 'student_info', 'age', 'is_visible') !== false && data.student.age ? `
        <div><span class="student-label">Âge :</span> <span class="student-value">${data.student.age} ans</span></div>` : ''}
        ${getConfigValue(config, 'student_info', 'class_name', 'is_visible') !== false ? `
        <div><span class="student-label">Classe :</span> <span class="student-value">${data.student.className}</span></div>` : ''}
        ${getConfigValue(config, 'student_info', 'program_name', 'is_visible') !== false && data.academic.programName ? `
        <div><span class="student-label">Programme :</span> <span class="student-value">${data.academic.programName}</span></div>` : ''}
      </div>
    </div>` : ''}

    <div class="section-separator"></div>

    ${getConfigValue(config, 'grades_table', 'subject_name', 'is_visible') !== false ? `
    <div class="section-title">Résultats par Matière</div>
    <table class="grades-table">
      <thead>
        <tr>
          ${getConfigValue(config, 'grades_table', 'subject_name', 'is_visible') !== false ? '<th>Matière</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'student_subject_average', 'is_visible') !== false ? '<th style="text-align:center">Moyenne</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false ? '<th style="text-align:center">Moy. Classe</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'class_min_average', 'is_visible') !== false ? '<th style="text-align:center">Min</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'class_max_average', 'is_visible') !== false ? '<th style="text-align:center">Max</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'subject_weighting', 'is_visible') !== false ? '<th style="text-align:center">Coef.</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'teacher_name', 'is_visible') !== false ? '<th>Enseignant</th>' : ''}
          ${getConfigValue(config, 'grades_table', 'subject_appreciation', 'is_visible') !== false ? '<th>Appréciation</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${subjectStats.map(stat => `
        <tr class="subject-row">
          <td class="subject-name">
            ${stat.subject}
            ${getConfigValue(config, 'grades_table', 'subject_category', 'is_visible') !== false && stat.category ? `<span class="category-badge">${stat.category}</span>` : ''}
          </td>
          ${getConfigValue(config, 'grades_table', 'student_subject_average', 'is_visible') !== false ? `<td class="grade-value">${formatGrade(stat.avg, 20, gradeFormat)}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false ? `<td style="text-align:center;font-size:8pt">${stat.minGrade > 0 ? formatGrade((stat.minGrade + stat.maxGrade) / 2, 20, gradeFormat) : '-'}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'class_min_average', 'is_visible') !== false ? `<td style="text-align:center;font-size:8pt;color:#dc2626">${stat.minGrade > 0 ? formatGrade(stat.minGrade, 20, gradeFormat) : '-'}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'class_max_average', 'is_visible') !== false ? `<td style="text-align:center;font-size:8pt;color:#16a34a">${stat.maxGrade > 0 ? formatGrade(stat.maxGrade, 20, gradeFormat) : '-'}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'subject_weighting', 'is_visible') !== false ? `<td style="text-align:center">${stat.grades[0]?.weighting || 1}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'teacher_name', 'is_visible') !== false ? `<td style="font-size:8pt">${stat.teacherName || '-'}</td>` : ''}
          ${getConfigValue(config, 'grades_table', 'subject_appreciation', 'is_visible') !== false ? `<td class="appreciation-cell">${stat.grades[0]?.appreciation || '-'}</td>` : ''}
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    <div class="section-separator"></div>

    ${getConfigValue(config, 'grades_table', 'student_general_average', 'is_visible') !== false && data.averages ? `
    <div class="overall-average">
      <div class="overall-label">Moyenne Générale</div>
      <div class="overall-value">${formatGrade(data.averages.student, 20, gradeFormat)}</div>
      ${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false && data.averages.class ? `
      <div class="class-average-detail">Moyenne de classe : ${formatGrade(data.averages.class, 20, gradeFormat)}</div>` : ''}
    </div>` : ''}

    ${getConfigValue(config, 'grades_table', 'school_appreciation', 'is_visible') !== false && data.generalAppreciation ? `
    <div class="section-separator"></div>
    <div class="general-appreciation">
      <div class="appreciation-title">Appréciation de l'établissement</div>
      <div>${data.generalAppreciation}</div>
    </div>` : ''}

    ${getConfigValue(config, 'grades_table', 'company_appreciation', 'is_visible') !== false && data.companyAppreciation ? `
    <div class="general-appreciation">
      <div class="appreciation-title">Appréciation du tuteur en entreprise</div>
      <div>${data.companyAppreciation}</div>
    </div>` : ''}

    ${getConfigValue(config, 'footer', 'signature', 'is_visible') !== false && signature ? `
    <div class="signature-section">
      <div class="signature-block">
        <div class="signature-label">${signatoryTitle}</div>
        <img src="${signature}" alt="Signature" class="signature-img">
        <div class="signature-line"></div>
      </div>
    </div>` : ''}

    ${getConfigValue(config, 'footer', 'school_name_footer', 'is_visible') !== false && footerText ? `
    <div class="footer">${footerText}</div>` : ''}
  </div>
</body>
</html>`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportCardData } = await req.json();
    
    console.log('Generating report card HTML V2 for:', reportCardData.student);

    const html = generateHTMLTemplate(reportCardData);

    console.log('HTML V2 generated successfully');

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

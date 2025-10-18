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

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;font-size:10pt;line-height:1.5;color:#1a1a1a;background:white;padding:40px 50px}.report-container{max-width:700px;margin:0 auto}.header{border-bottom:2px solid ${headerColor};padding-bottom:20px;margin-bottom:30px;display:flex;align-items:center;justify-content:space-between}.logo{max-width:80px;max-height:80px;object-fit:contain}.header-center{flex:1;text-align:center}.title{font-size:22pt;font-weight:700;color:${headerColor};margin-bottom:4px}.school-name{font-size:11pt;color:#666;margin-bottom:8px}.academic-info{font-size:9pt;color:#999}.student-section{background:#f9fafb;border-left:3px solid ${headerColor};padding:20px;margin-bottom:25px}.student-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:9pt}.student-label{font-weight:600;color:#555}.student-value{color:#1a1a1a}.section-title{font-size:13pt;font-weight:600;color:${headerColor};margin:25px 0 15px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}.grades-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:9pt}.grades-table th{background:${headerColor}15;padding:10px 8px;text-align:left;font-weight:600;border:1px solid #e5e7eb}.grades-table td{padding:10px 8px;border:1px solid #e5e7eb}.subject-row{background:white}.subject-name{font-weight:600;color:#1a1a1a}.category-badge{display:inline-block;padding:2px 8px;background:#e0e7ff;color:#3730a3;border-radius:4px;font-size:7pt;margin-left:8px}.grade-value{font-weight:700;color:${headerColor};text-align:center}.appreciation-cell{font-style:italic;color:#666;font-size:8pt}.overall-average{background:linear-gradient(135deg,${headerColor}15,${headerColor}05);border:2px solid ${headerColor};border-radius:8px;padding:20px;text-align:center;margin:25px 0}.overall-label{font-size:10pt;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:600}.overall-value{font-size:36pt;font-weight:700;color:${headerColor}}.general-appreciation{background:#f9fafb;border-left:3px solid ${headerColor};padding:15px 20px;margin:20px 0;font-size:9pt;line-height:1.6}.appreciation-title{font-weight:600;margin-bottom:8px;color:#1a1a1a}.signature-section{margin-top:50px;display:flex;justify-content:flex-end}.signature-block{text-align:center}.signature-label{font-size:9pt;color:#666;margin-bottom:15px}.signature-img{max-width:150px;max-height:60px;object-fit:contain;margin-bottom:5px}.signature-line{width:200px;border-top:1px solid #ccc;margin-top:10px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:8pt;color:#999}</style></head><body><div class="report-container">
${getConfigValue(config, 'header', 'title', 'is_visible') !== false ? `<div class="header">${getConfigValue(config, 'header', 'logo', 'is_visible') !== false && logo ? `<img src="${logo}" alt="Logo" class="logo">` : ''}<div class="header-center"><div class="title">${title}</div>${getConfigValue(config, 'header', 'school_name', 'is_visible') !== false && schoolName ? `<div class="school-name">${schoolName}</div>` : ''}<div class="academic-info">${getConfigValue(config, 'header', 'school_year', 'is_visible') !== false ? `${data.academic.schoolYear}` : ''}${getConfigValue(config, 'header', 'semester', 'is_visible') !== false ? ` - ${data.academic.semester}` : ''}</div></div>${getConfigValue(config, 'header', 'logo', 'is_visible') !== false && logo ? '<div style="width:80px"></div>' : ''}</div>` : ''}
${getConfigValue(config, 'student_info', 'first_name', 'is_visible') !== false ? `<div class="student-section"><div class="student-grid">${getConfigValue(config, 'student_info', 'first_name', 'is_visible') !== false ? `<div><span class="student-label">Prénom :</span> <span class="student-value">${data.student.firstName}</span></div>` : ''}${getConfigValue(config, 'student_info', 'last_name', 'is_visible') !== false ? `<div><span class="student-label">Nom :</span> <span class="student-value">${data.student.lastName}</span></div>` : ''}${getConfigValue(config, 'student_info', 'age', 'is_visible') !== false && data.student.age ? `<div><span class="student-label">Âge :</span> <span class="student-value">${data.student.age} ans</span></div>` : ''}${getConfigValue(config, 'student_info', 'class_name', 'is_visible') !== false ? `<div><span class="student-label">Classe :</span> <span class="student-value">${data.student.className}</span></div>` : ''}${getConfigValue(config, 'student_info', 'program_name', 'is_visible') !== false && data.academic.programName ? `<div><span class="student-label">Programme :</span> <span class="student-value">${data.academic.programName}</span></div>` : ''}</div></div>` : ''}
${getConfigValue(config, 'grades_table', 'subject_name', 'is_visible') !== false ? `<div class="section-title">Résultats</div><table class="grades-table"><thead><tr>${getConfigValue(config, 'grades_table', 'subject_name', 'is_visible') !== false ? '<th>Matière</th>' : ''}${getConfigValue(config, 'grades_table', 'student_subject_average', 'is_visible') !== false ? '<th style="text-align:center">Moyenne</th>' : ''}${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false ? '<th style="text-align:center">Moy. Classe</th>' : ''}${getConfigValue(config, 'grades_table', 'class_min_average', 'is_visible') !== false ? '<th style="text-align:center">Min</th>' : ''}${getConfigValue(config, 'grades_table', 'class_max_average', 'is_visible') !== false ? '<th style="text-align:center">Max</th>' : ''}${getConfigValue(config, 'grades_table', 'subject_weighting', 'is_visible') !== false ? '<th style="text-align:center">Coef.</th>' : ''}${getConfigValue(config, 'grades_table', 'teacher_name', 'is_visible') !== false ? '<th>Enseignant</th>' : ''}${getConfigValue(config, 'grades_table', 'subject_appreciation', 'is_visible') !== false ? '<th>Appréciation</th>' : ''}</tr></thead><tbody>${subjectStats.map(stat => `<tr class="subject-row"><td class="subject-name">${stat.subject}${getConfigValue(config, 'grades_table', 'subject_category', 'is_visible') !== false && stat.category ? `<span class="category-badge">${stat.category}</span>` : ''}</td>${getConfigValue(config, 'grades_table', 'student_subject_average', 'is_visible') !== false ? `<td class="grade-value">${formatGrade(stat.avg, 20, gradeFormat)}</td>` : ''}${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false ? `<td style="text-align:center">${stat.minGrade > 0 ? formatGrade((stat.minGrade + stat.maxGrade) / 2, 20, gradeFormat) : '-'}</td>` : ''}${getConfigValue(config, 'grades_table', 'class_min_average', 'is_visible') !== false ? `<td style="text-align:center;font-size:8pt;color:#dc2626">${stat.minGrade > 0 ? formatGrade(stat.minGrade, 20, gradeFormat) : '-'}</td>` : ''}${getConfigValue(config, 'grades_table', 'class_max_average', 'is_visible') !== false ? `<td style="text-align:center;font-size:8pt;color:#16a34a">${stat.maxGrade > 0 ? formatGrade(stat.maxGrade, 20, gradeFormat) : '-'}</td>` : ''}${getConfigValue(config, 'grades_table', 'subject_weighting', 'is_visible') !== false ? `<td style="text-align:center">${stat.grades[0]?.weighting || 1}</td>` : ''}${getConfigValue(config, 'grades_table', 'teacher_name', 'is_visible') !== false ? `<td style="font-size:8pt">${stat.teacherName || '-'}</td>` : ''}${getConfigValue(config, 'grades_table', 'subject_appreciation', 'is_visible') !== false ? `<td class="appreciation-cell">${stat.grades[0]?.appreciation || '-'}</td>` : ''}</tr>`).join('')}</tbody></table>` : ''}
${getConfigValue(config, 'grades_table', 'student_general_average', 'is_visible') !== false && data.averages ? `<div class="overall-average"><div class="overall-label">Moyenne générale</div><div class="overall-value">${formatGrade(data.averages.student, 20, gradeFormat)}</div>${getConfigValue(config, 'grades_table', 'class_subject_average', 'is_visible') !== false && data.averages.class ? `<div style="margin-top:10px;font-size:9pt;color:#666">Moyenne de classe : ${formatGrade(data.averages.class, 20, gradeFormat)}</div>` : ''}</div>` : ''}
${getConfigValue(config, 'grades_table', 'school_appreciation', 'is_visible') !== false && data.generalAppreciation ? `<div class="general-appreciation"><div class="appreciation-title">Appréciation de l'établissement</div><div>${data.generalAppreciation}</div></div>` : ''}
${getConfigValue(config, 'grades_table', 'company_appreciation', 'is_visible') !== false && data.companyAppreciation ? `<div class="general-appreciation"><div class="appreciation-title">Appréciation du tuteur en entreprise</div><div>${data.companyAppreciation}</div></div>` : ''}
${getConfigValue(config, 'footer', 'signature', 'is_visible') !== false && signature ? `<div class="signature-section"><div class="signature-block"><div class="signature-label">${signatoryTitle}</div><img src="${signature}" alt="Signature" class="signature-img"><div class="signature-line"></div></div></div>` : ''}
${getConfigValue(config, 'footer', 'school_name_footer', 'is_visible') !== false && footerText ? `<div class="footer">${footerText}</div>` : ''}
</div></body></html>`;
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

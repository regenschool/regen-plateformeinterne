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
    programName?: string;
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
    assessment_name?: string;
  }>;
  template?: {
    name: string;
    headerColor: string;
    header_color?: string;
    logoUrl?: string;
    logo_url?: string;
    footerText?: string;
    footer_text?: string;
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
    show_student_birth_date?: boolean;
    show_logo?: boolean;
    show_signature?: boolean;
    show_individual_grades?: boolean;
    show_min_max_grades?: boolean;
    show_program_name?: boolean;
    show_general_appreciation?: boolean;
    program_name?: string;
    signature_url?: string;
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
  if (data.template?.useCustomHtml && data.template?.htmlTemplate) {
    let html = data.template.htmlTemplate;
    html = html.replace(/{{student\.firstName}}/g, data.student.firstName || '');
    html = html.replace(/{{student\.lastName}}/g, data.student.lastName || '');
    html = html.replace(/{{student\.birthDate}}/g, data.student.birthDate || '');
    html = html.replace(/{{student\.className}}/g, data.student.className || '');
    html = html.replace(/{{academic\.schoolYear}}/g, data.academic.schoolYear || '');
    html = html.replace(/{{academic\.semester}}/g, data.academic.semester || '');
    html = html.replace(/{{averages\.student}}/g, data.averages?.student?.toFixed(2) || '0');
    html = html.replace(/{{averages\.class}}/g, data.averages?.class?.toFixed(2) || '0');
    
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${data.template.cssTemplate || ''}</style></head><body>${html}</body></html>`;
  }

  const template = (data.template || {}) as Partial<NonNullable<typeof data.template>>;
  const headerColor = template.header_color || template.headerColor || '#1e40af';
  // Prioriser le programme de l'étudiant (dynamique), puis celui du template (fallback)
  const programName = data.academic.programName || template.program_name || 'Programme de Formation';
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
    return { subject, grades, avg, minGrade, maxGrade };
  });

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;font-size:10pt;line-height:1.6;color:#1a1a1a;background:white;padding:40px 50px}.report-container{max-width:700px;margin:0 auto}.header{border-bottom:1px solid ${headerColor};padding-bottom:20px;margin-bottom:30px;display:flex;align-items:flex-start;justify-content:space-between}.logo{max-width:80px;max-height:80px;object-fit:contain;margin-bottom:10px}.title{font-family:'Playfair Display',serif;font-size:20pt;font-weight:700;color:${headerColor};margin-bottom:4px;letter-spacing:0.5px}.subtitle{font-size:9pt;color:#666;font-weight:400;margin-bottom:2px}.academic-info{background:#f9fafb;border-left:2px solid ${headerColor};padding:15px 20px;margin-bottom:25px;font-size:9pt}.academic-info .row{display:flex;margin-bottom:6px}.academic-info .label{font-weight:500;color:#555;width:140px}.academic-info .value{color:#1a1a1a;font-weight:400}.student-info{display:flex;align-items:center;gap:20px;margin-bottom:25px;padding:15px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}.student-photo{width:60px;height:60px;border-radius:4px;object-fit:cover;border:1px solid #e5e7eb}.student-name{font-family:'Playfair Display',serif;font-size:14pt;font-weight:600;color:#1a1a1a;margin-bottom:4px}.student-meta{font-size:9pt;color:#666}.section-title{font-family:'Playfair Display',serif;font-size:12pt;font-weight:600;color:${headerColor};margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}.subject-block{margin-bottom:20px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden}.subject-header{background:linear-gradient(to right,${headerColor}15,transparent);padding:10px 15px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb}.subject-name{font-weight:600;font-size:10pt;color:#1a1a1a}.subject-average{font-family:'Playfair Display',serif;font-size:16pt;font-weight:600;color:${headerColor}}.subject-stats{font-size:8pt;color:#666;display:flex;gap:15px}.grades-detail{padding:10px 15px;background:white}.grade-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:9pt}.grade-row:last-child{border-bottom:none}.grade-label{color:#555;flex:1}.grade-value{font-weight:500;color:#1a1a1a;min-width:60px;text-align:right}.overall-average{background:linear-gradient(135deg,${headerColor}10,${headerColor}05);border:1px solid ${headerColor}30;border-radius:4px;padding:20px;text-align:center;margin-bottom:25px}.overall-label{font-size:10pt;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:500}.overall-value{font-family:'Playfair Display',serif;font-size:32pt;font-weight:700;color:${headerColor};line-height:1}.overall-max{font-size:14pt;color:#999}.appreciation{background:#f9fafb;border-left:2px solid ${headerColor};padding:15px 20px;margin-bottom:25px;font-size:9pt;line-height:1.6;color:#333}.appreciation-title{font-weight:600;margin-bottom:8px;color:#1a1a1a}.signature-section{margin-top:40px;display:flex;justify-content:flex-end}.signature-block{text-align:center}.signature-label{font-size:9pt;color:#666;margin-bottom:15px}.signature-img{max-width:150px;max-height:60px;object-fit:contain;margin-bottom:5px}.signature-line{width:200px;border-top:1px solid #ccc;margin-top:10px}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #e5e7eb;text-align:center;font-size:8pt;color:#999}</style></head><body><div class="report-container">${template.show_header!==false?`<div class="header"><div class="header-left">${template.show_logo!==false&&(template.logo_url||template.logoUrl)?`<img src="${template.logo_url||template.logoUrl}" alt="Logo" class="logo">`:''}
<div class="title">${data.title||'Bulletin de Notes'}</div>${template.show_program_name!==false?`<div class="subtitle">${programName}</div>`:''}</div></div>`:''}${template.show_academic_info!==false?`<div class="academic-info"><div class="row"><span class="label">Année scolaire :</span><span class="value">${data.academic.schoolYear}</span></div><div class="row"><span class="label">Période :</span><span class="value">${data.academic.semester}</span></div><div class="row"><span class="label">Niveau :</span><span class="value">${data.student.className}</span></div></div>`:''}${template.show_student_info!==false?`<div class="student-info">${template.show_student_photo!==false&&data.student.photoUrl?`<img src="${data.student.photoUrl}" alt="Photo" class="student-photo">`:''}<div class="student-details"><div class="student-name">${data.student.firstName} ${data.student.lastName}</div><div class="student-meta">${template.show_student_birth_date!==false&&data.student.birthDate?`Né(e) le ${new Date(data.student.birthDate).toLocaleDateString('fr-FR')}`:''}</div></div></div>`:''}${template.show_grades_table!==false?`<div class="grades-section"><div class="section-title">Résultats par matière</div>${subjectStats.map(stat=>`<div class="subject-block"><div class="subject-header"><div><div class="subject-name">${stat.subject}</div>${template.show_min_max_grades!==false?`<div class="subject-stats"><span>Min. classe: ${stat.minGrade.toFixed(2)}/20</span><span>Max. classe: ${stat.maxGrade.toFixed(2)}/20</span></div>`:''}</div><div class="subject-average">${stat.avg.toFixed(2)}<span style="font-size:10pt;color:#999;">/20</span></div></div>${template.show_individual_grades?`<div class="grades-detail">${stat.grades.map(grade=>`<div class="grade-row"><span class="grade-label">${grade.assessmentType}${grade.assessment_name?` - ${grade.assessment_name}`:''}</span><span class="grade-value">${grade.grade.toFixed(2)} / ${grade.maxGrade}</span></div>`).join('')}</div>`:''}</div>`).join('')}</div>`:''}${template.show_average!==false&&data.averages?`<div class="overall-average"><div class="overall-label">Moyenne générale</div><div class="overall-value">${data.averages.student.toFixed(2)}<span class="overall-max">/20</span></div>${template.show_class_average!==false&&data.averages.class?`<div style="margin-top:10px;font-size:9pt;color:#666;">Moyenne de classe : ${data.averages.class.toFixed(2)}/20</div>`:''}</div>`:''}${template.show_general_appreciation!==false&&data.generalAppreciation?`<div class="appreciation"><div class="appreciation-title">Appréciation générale</div><div>${data.generalAppreciation}</div></div>`:''}${template.show_signature!==false&&(template.signature_url)?`<div class="signature-section"><div class="signature-block"><div class="signature-label">Le Directeur des Études</div><img src="${template.signature_url}" alt="Signature" class="signature-img"><div class="signature-line"></div></div></div>`:''}${template.show_footer!==false?`<div class="footer">${template.footer_text||template.footerText||`Document généré le ${new Date().toLocaleDateString('fr-FR')}`}</div>`:''}</div></body></html>`;
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

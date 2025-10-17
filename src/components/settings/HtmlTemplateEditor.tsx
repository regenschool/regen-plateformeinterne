import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface HtmlTemplateEditorProps {
  htmlTemplate?: string;
  cssTemplate?: string;
  useCustomHtml?: boolean;
  onHtmlChange: (html: string) => void;
  onCssChange: (css: string) => void;
  onUseCustomHtmlChange: (use: boolean) => void;
}

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin</title>
</head>
<body>
  <div class="header">
    <h1>Bulletin Scolaire</h1>
    <div class="subtitle">SCHOOL_YEAR - SEMESTER</div>
  </div>
  
  <div class="student-info">
    <h2>FIRST_NAME LAST_NAME</h2>
    <p><strong>Classe:</strong> CLASS_NAME</p>
    <p><strong>Date de naissance:</strong> BIRTH_DATE</p>
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
      <!-- GRADES_ROWS -->
    </tbody>
  </table>
  
  <div class="averages">
    <div class="average-card">
      <h3>Moyenne de l élève</h3>
      <div class="value">STUDENT_AVERAGE/20</div>
    </div>
    <div class="average-card">
      <h3>Moyenne de la classe</h3>
      <div class="value">CLASS_AVERAGE/20</div>
    </div>
  </div>
</body>
</html>`;

const DEFAULT_CSS_TEMPLATE = `* {
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
  background: #1e40af;
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 5px;
}

.header .subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.student-info {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.student-info h2 {
  color: #1e40af;
  margin-bottom: 10px;
}

.student-info p {
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
  background: #1e40af;
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
  color: #1e40af;
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
  background: linear-gradient(135deg, #1e40af 0%, #1e40afdd 100%);
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
}`;

export const HtmlTemplateEditor = ({
  htmlTemplate = DEFAULT_HTML_TEMPLATE,
  cssTemplate = DEFAULT_CSS_TEMPLATE,
  useCustomHtml = false,
  onHtmlChange,
  onCssChange,
  onUseCustomHtmlChange,
}: HtmlTemplateEditorProps) => {
  const [localHtml, setLocalHtml] = useState(htmlTemplate);
  const [localCss, setLocalCss] = useState(cssTemplate);

  const handleSave = () => {
    onHtmlChange(localHtml);
    onCssChange(localCss);
  };

  const generatePreviewHtml = () => {
    let html = localHtml;
    
    // Données d'exemple pour la prévisualisation
    const sampleData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      className: 'M2 DDD',
      birthDate: '15/03/2000',
      schoolYear: '2025-2026',
      semester: 'Semestre 1',
      grades: [
        { subject: 'Limites planétaires', assessmentType: 'Contrôle continu', grade: 15, maxGrade: 20, weighting: 2, appreciation: 'Très bon travail' },
        { subject: 'DDD', assessmentType: 'Examen', grade: 17, maxGrade: 20, weighting: 3, appreciation: 'Excellent' },
        { subject: 'Management', assessmentType: 'Contrôle continu', grade: 14, maxGrade: 20, weighting: 2, appreciation: 'Bien' },
      ],
      studentAverage: '15.33',
      classAverage: '14.80'
    };

    // Remplacer les variables
    html = html.replace(/FIRST_NAME/g, sampleData.firstName);
    html = html.replace(/LAST_NAME/g, sampleData.lastName);
    html = html.replace(/CLASS_NAME/g, sampleData.className);
    html = html.replace(/BIRTH_DATE/g, sampleData.birthDate);
    html = html.replace(/SCHOOL_YEAR/g, sampleData.schoolYear);
    html = html.replace(/SEMESTER/g, sampleData.semester);
    
    // Générer les lignes de notes
    const gradesRows = sampleData.grades.map(grade => `
      <tr>
        <td><strong>${grade.subject}</strong></td>
        <td>${grade.assessmentType}</td>
        <td class="grade-cell">${grade.grade}/${grade.maxGrade}</td>
        <td>${grade.weighting}</td>
        <td class="appreciation">${grade.appreciation}</td>
      </tr>
    `).join('');
    
    html = html.replace(/<!-- GRADES_ROWS -->/g, gradesRows);
    html = html.replace(/STUDENT_AVERAGE/g, sampleData.studentAverage);
    html = html.replace(/CLASS_AVERAGE/g, sampleData.classAverage);
    
    return html;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Éditeur de Template HTML
          </span>
          <div className="flex items-center gap-2">
            <Label htmlFor="use-custom-html">Utiliser template personnalisé</Label>
            <Switch
              id="use-custom-html"
              checked={useCustomHtml}
              onCheckedChange={onUseCustomHtmlChange}
            />
          </div>
        </CardTitle>
        <CardDescription>
          Personnalisez complètement le rendu du bulletin avec HTML et CSS.
          Utilisez des variables comme FIRST_NAME, LAST_NAME, GRADES_ROWS, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="html">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="space-y-2">
            <Label>Template HTML</Label>
            <Textarea
              value={localHtml}
              onChange={(e) => setLocalHtml(e.target.value)}
              className="font-mono text-sm min-h-[400px]"
              placeholder="Entrez votre HTML personnalisé..."
            />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Variables disponibles :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>FIRST_NAME, LAST_NAME, CLASS_NAME, BIRTH_DATE</li>
                <li>SCHOOL_YEAR, SEMESTER</li>
                <li>GRADES_ROWS (sera remplacé par les lignes de notes)</li>
                <li>STUDENT_AVERAGE, CLASS_AVERAGE</li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="css" className="space-y-2">
            <Label>CSS Personnalisé</Label>
            <Textarea
              value={localCss}
              onChange={(e) => setLocalCss(e.target.value)}
              className="font-mono text-sm min-h-[400px]"
              placeholder="Entrez votre CSS personnalisé..."
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={handleSave}>
            Enregistrer le template
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Aperçu du template avec données d'exemple</DialogTitle>
              </DialogHeader>
              <div className="border rounded-lg p-4 bg-white">
                <style>{localCss}</style>
                <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

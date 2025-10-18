import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Save, Upload } from 'lucide-react';
import { 
  useSections, 
  useSectionElements, 
  useTemplateConfig,
  useUpsertTemplateConfig,
  type TemplateConfig 
} from '@/hooks/useReportCardTemplateConfig';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportCardTemplateConfigPanelProps {
  templateId: string;
  templateName: string;
}

export const ReportCardTemplateConfigPanel = ({ 
  templateId, 
  templateName 
}: ReportCardTemplateConfigPanelProps) => {
  const { data: sections } = useSections();
  const { data: allElements } = useSectionElements();
  const { data: existingConfig } = useTemplateConfig(templateId);
  const upsertConfig = useUpsertTemplateConfig();

  const [config, setConfig] = useState<Record<string, TemplateConfig>>({});

  useEffect(() => {
    if (existingConfig && allElements) {
      const configMap: Record<string, TemplateConfig> = {};
      
      // Initialiser avec la config existante
      existingConfig.forEach(c => {
        const key = `${c.section_key}_${c.element_key}`;
        configMap[key] = c;
      });

      // Ajouter les éléments manquants avec valeurs par défaut
      allElements.forEach(element => {
        const key = `${element.section_key}_${element.element_key}`;
        if (!configMap[key]) {
          configMap[key] = {
            template_id: templateId,
            section_key: element.section_key,
            element_key: element.element_key,
            is_visible: true,
            is_editable: element.is_editable_in_draft,
            style_options: {},
          };
        }
      });

      setConfig(configMap);
    }
  }, [existingConfig, allElements, templateId]);

  const handleToggleVisibility = (sectionKey: string, elementKey: string) => {
    const key = `${sectionKey}_${elementKey}`;
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_visible: !prev[key]?.is_visible,
      },
    }));
  };

  const handleToggleEditable = (sectionKey: string, elementKey: string) => {
    const key = `${sectionKey}_${elementKey}`;
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_editable: !prev[key]?.is_editable,
      },
    }));
  };

  const handleDefaultValueChange = (sectionKey: string, elementKey: string, value: string) => {
    const key = `${sectionKey}_${elementKey}`;
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        default_value: value,
      },
    }));
  };

  const handleStyleOptionChange = (sectionKey: string, elementKey: string, optionKey: string, value: any) => {
    const key = `${sectionKey}_${elementKey}`;
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        style_options: {
          ...(prev[key]?.style_options || {}),
          [optionKey]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    const configArray = Object.values(config);
    upsertConfig.mutate(configArray);
  };

  if (!sections || !allElements) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertConfig.isPending}>
          {upsertConfig.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <Accordion type="multiple" defaultValue={sections.map(s => s.section_key)} className="space-y-4">
          {sections.map(section => {
            const sectionElements = allElements.filter(e => e.section_key === section.section_key);

            return (
              <AccordionItem key={section.section_key} value={section.section_key}>
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h4 className="font-semibold">{section.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {sectionElements.length} élément(s) configurable(s)
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-4">
                      {sectionElements.map(element => {
                        const key = `${section.section_key}_${element.element_key}`;
                        const elementConfig = config[key];

                        return (
                          <div key={element.element_key} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <Label className="font-medium">{element.label}</Label>
                                <p className="text-xs text-muted-foreground">
                                  Type: {element.element_type}
                                  {element.is_editable_in_draft && ' • Éditable dans les brouillons'}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {/* Visible */}
                              <div className="flex items-center justify-between p-2 rounded border">
                                <Label htmlFor={`${key}_visible`} className="text-sm">
                                  Afficher
                                </Label>
                                <Switch
                                  id={`${key}_visible`}
                                  checked={elementConfig?.is_visible ?? true}
                                  onCheckedChange={() => 
                                    handleToggleVisibility(section.section_key, element.element_key)
                                  }
                                />
                              </div>

                              {/* Éditable (seulement si l'élément le permet) */}
                              {element.is_editable_in_draft && (
                                <div className="flex items-center justify-between p-2 rounded border">
                                  <Label htmlFor={`${key}_editable`} className="text-sm">
                                    Éditable
                                  </Label>
                                  <Switch
                                    id={`${key}_editable`}
                                    checked={elementConfig?.is_editable ?? true}
                                    onCheckedChange={() => 
                                      handleToggleEditable(section.section_key, element.element_key)
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            {/* Valeur par défaut (pour types text et image) */}
                            {(element.element_type === 'text' || element.element_type === 'image') && (
                              <div className="space-y-2">
                                <Label htmlFor={`${key}_default`} className="text-sm">
                                  {element.element_type === 'image' ? 'URL de l\'image' : 'Valeur par défaut'}
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`${key}_default`}
                                    value={elementConfig?.default_value || ''}
                                    onChange={(e) => 
                                      handleDefaultValueChange(
                                        section.section_key, 
                                        element.element_key, 
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      element.element_type === 'image' 
                                        ? 'https://...' 
                                        : 'Texte par défaut'
                                    }
                                  />
                                  {element.element_type === 'image' && (
                                    <Button variant="outline" size="icon">
                                      <Upload className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Options de style pour les notes */}
                            {element.element_key.includes('average') || element.element_key.includes('grade') && (
                              <div className="space-y-2">
                                <Label className="text-sm">Format d'affichage</Label>
                                <Select
                                  value={elementConfig?.style_options?.format || 'fraction'}
                                  onValueChange={(value) => 
                                    handleStyleOptionChange(
                                      section.section_key,
                                      element.element_key,
                                      'format',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fraction">Fraction (15/20)</SelectItem>
                                    <SelectItem value="percentage">Pourcentage (75%)</SelectItem>
                                    <SelectItem value="points">Points (15)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
};

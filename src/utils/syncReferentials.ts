import { supabase } from '@/integrations/supabase/client';

// Helper function to sync a level to the database
const syncLevelToReferential = async (levelName: string) => {
  if (!levelName) return;

  const { data: existing } = await supabase
    .from('levels')
    .select('id')
    .eq('name', levelName)
    .maybeSingle();

  if (!existing) {
    await supabase.from('levels').insert([{ name: levelName, is_active: true }]);
  }
};
import { toast } from 'sonner';

/**
 * Synchronise toutes les données existantes avec les référentiels
 * À exécuter une fois pour mettre en cohérence l'historique
 */
export const syncExistingDataToReferentials = async () => {
  try {
    console.log('🔄 Début de la synchronisation des référentiels...');
    
    const stats = { classesAdded: 0, yearsAdded: 0, periodsAdded: 0, levelsAdded: 0 };
    
    // 1. Synchroniser les classes depuis la table students
    // Phase 4B: class_name removed from students - get via enrollments
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('name')
      .eq('is_active', true);
    
    if (classesError) throw classesError;
    
    const uniqueClassesFromStudents = classes?.map(c => c.name) || [];
    console.log(`📚 Classes trouvées dans classes: ${uniqueClassesFromStudents.length}`);
    
    // 2. Phase 4A: Récupérer les classes via JOIN
    const { data: subjects } = await supabase
      .from('subjects')
      .select('classes!fk_subjects_class(name)');
    
    const uniqueClassesFromSubjects = [...new Set(subjects?.map((s: any) => s.classes?.[0]?.name).filter(Boolean) || [])];
    
    // Combiner toutes les classes uniques
    const allUniqueClasses = [...new Set([
      ...uniqueClassesFromStudents,
      ...uniqueClassesFromSubjects
    ])].filter(Boolean);
    
    console.log(`📚 Total de classes uniques: ${allUniqueClasses.length}`);
    
    // 3. Récupérer les classes déjà dans le référentiel
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('name');
    
    const existingClassNames = new Set(existingClasses?.map(c => c.name) || []);
    
    // 4. Insérer les classes manquantes
    const classesToInsert = allUniqueClasses
      .filter(className => !existingClassNames.has(className))
      .map(className => ({
        name: className,
        is_active: true,
        // Déterminer le niveau selon le nom
        level: className.toLowerCase().startsWith('m') ? 'Master' : 
               className.toLowerCase().startsWith('b') ? 'Bachelor' : null
      }));
    
    if (classesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('classes')
        .insert(classesToInsert);
      
      if (insertError) throw insertError;
      console.log(`✅ ${classesToInsert.length} classes ajoutées au référentiel`);
    }
    
    // 4b. Harmoniser l'état d'activation des classes : activer utilisées, désactiver le reste
    if (allUniqueClasses.length > 0) {
      await supabase
        .from('classes')
        .update({ is_active: false })
        .not('name', 'in', `(${allUniqueClasses.join(',')})`);

      await supabase
        .from('classes')
        .update({ is_active: true })
        .in('name', allUniqueClasses);
    }
    
    // 4c. Synchroniser les niveaux depuis les classes
    const { data: classesWithLevel } = await supabase.from('classes').select('level');
    const uniqueLevels = Array.from(
      new Set(
        (classesWithLevel || [])
          .map(c => c.level)
          .filter(Boolean)
      )
    );

    for (const levelName of uniqueLevels) {
      if (levelName) {
        await syncLevelToReferential(levelName);
        stats.levelsAdded++;
      }
    }
    
    // 5. Phase 4A: Récupérer les années scolaires via JOIN
    const { data: subjectsWithYear } = await supabase
      .from('subjects')
      .select('school_years!fk_subjects_school_year(label)');
    
    const uniqueYearsFromSubjects = [...new Set(subjectsWithYear?.map((s: any) => s.school_years?.[0]?.label).filter(Boolean) || [])];
    
    const allUniqueYears = [...new Set([...uniqueYearsFromSubjects])];
    
    console.log(`📅 Années scolaires trouvées: ${allUniqueYears.length}`);
    
    // 6. Récupérer les années déjà dans le référentiel
    const { data: existingYears } = await supabase
      .from('school_years')
      .select('label');
    
    const existingYearLabels = new Set(existingYears?.map(y => y.label) || []);
    
    // 7. Insérer les années manquantes
    const yearsToInsert = allUniqueYears
      .filter(year => !existingYearLabels.has(year))
      .map(year => {
        // Parser l'année (format attendu: "2024-2025")
        const [startYear, endYear] = year.split('-').map(y => parseInt(y));
        return {
          label: year,
          start_date: `${startYear}-09-01`,
          end_date: `${endYear}-06-30`,
          is_active: false // On va activer 2025-2026 séparément
        };
      });
    
    if (yearsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('school_years')
        .insert(yearsToInsert);
      
      if (insertError) throw insertError;
      console.log(`✅ ${yearsToInsert.length} années scolaires ajoutées`);
    }
    
    // 7b. Activer spécifiquement l'année 2025-2026
    const { error: activateError } = await supabase
      .from('school_years')
      .update({ is_active: true })
      .eq('label', '2025-2026');
    
    if (activateError) {
      console.error('Erreur lors de l\'activation de 2025-2026:', activateError);
    } else {
      console.log('✅ Année 2025-2026 activée');
    }
    
    // 8. Phase 4A: Récupérer les semestres via JOIN
    const { data: subjectsWithSemester } = await supabase
      .from('subjects')
      .select('academic_periods!fk_subjects_academic_period(label)');
    
    const uniqueSemesters = [...new Set([
      ...(subjectsWithSemester?.map((s: any) => s.academic_periods?.[0]?.label).filter(Boolean) || [])
    ])];
    
    console.log(`📆 Semestres trouvés: ${uniqueSemesters.length}`);
    
    // 9. Pour chaque semestre, créer une période académique si elle n'existe pas
    const { data: existingPeriods } = await supabase
      .from('academic_periods')
      .select('label, school_year_id');
    
    const { data: schoolYears } = await supabase
      .from('school_years')
      .select('id, label');
    
    const periodsToInsert: Array<{
      school_year_id: string;
      label: string;
      start_date: string;
      end_date: string;
      is_active: boolean;
    }> = [];
    
    for (const semester of uniqueSemesters) {
      for (const schoolYear of schoolYears || []) {
        const exists = existingPeriods?.some(
          p => p.label === semester && p.school_year_id === schoolYear.id
        );
        
        if (!exists) {
          const [startYear, endYear] = schoolYear.label.split('-').map(y => parseInt(y));
          const isSemester1 = semester.toLowerCase().includes('1') || semester.toLowerCase().includes('s1');
          
          periodsToInsert.push({
            school_year_id: schoolYear.id,
            label: semester,
            start_date: isSemester1 ? `${startYear}-09-01` : `${endYear}-01-01`,
            end_date: isSemester1 ? `${endYear}-01-31` : `${endYear}-06-30`,
            is_active: schoolYear.label === '2025-2026'
          });
        }
      }
    }

    // 9b. S'assurer que 2025-2026 a bien Semestre 1 et Semestre 2
    const activeYear = (schoolYears || []).find(y => y.label === '2025-2026');
    if (activeYear) {
      const [startYear, endYear] = activeYear.label.split('-').map(y => parseInt(y));
      const need = ['Semestre 1', 'Semestre 2'];
      for (const label of need) {
        const alreadyExists = (existingPeriods || []).some(p => p.label === label && p.school_year_id === activeYear.id)
          || periodsToInsert.some(p => p.label === label && p.school_year_id === activeYear.id);
        if (!alreadyExists) {
          const isS1 = label === 'Semestre 1';
          periodsToInsert.push({
            school_year_id: activeYear.id,
            label,
            start_date: isS1 ? `${startYear}-09-01` : `${endYear}-01-01`,
            end_date: isS1 ? `${endYear}-01-31` : `${endYear}-06-30`,
            is_active: true,
          });
        }
      }
    }
    
    if (periodsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('academic_periods')
        .insert(periodsToInsert);
      
      if (insertError && !insertError.message.includes('duplicate')) {
        throw insertError;
      }
      console.log(`✅ ${periodsToInsert.length} périodes académiques ajoutées`);
    }
    
    console.log('✅ Synchronisation terminée avec succès !');
    
    return {
      success: true,
      stats: {
        classesAdded: classesToInsert.length,
        yearsAdded: yearsToInsert.length,
        periodsAdded: periodsToInsert.length,
        levelsAdded: stats.levelsAdded
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

/**
 * Associe tous les étudiants existants à l'année scolaire 2025-2026
 * Note: La table students n'a pas de colonne school_year, 
 * donc cette fonction est pour référence future
 */
export const assignStudentsToSchoolYear = async (schoolYear: string = '2025-2026') => {
  console.log(`ℹ️ Note: La table students n'a pas de colonne school_year.`);
  console.log(`Les étudiants sont associés aux années via leurs notes et matières.`);
  
  toast.info('Les étudiants sont gérés via leurs notes et matières');
};

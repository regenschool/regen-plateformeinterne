import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { ImportStudentsDialog } from "@/components/ImportStudentsDialog";
import { Plus, Upload, Users } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  age: number | null;
  academic_background: string | null;
  company: string | null;
  class_name: string;
};

const Directory = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedClass, searchTerm]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("class_name", { ascending: true })
        .order("last_name", { ascending: true });

      if (error) throw error;

      setStudents(data || []);
      const uniqueClasses = Array.from(new Set(data?.map((s) => s.class_name) || []));
      setClasses(uniqueClasses);
    } catch (error: any) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.class_name === selectedClass);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(term) ||
          s.last_name.toLowerCase().includes(term) ||
          s.company?.toLowerCase().includes(term) ||
          s.academic_background?.toLowerCase().includes(term)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleStudentAdded = () => {
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Users className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Student Directory</h2>
          <p className="text-muted-foreground">
            {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
          </p>
        </div>
        <div className="flex gap-2">
          <ImportStudentsDialog onImportComplete={handleStudentAdded} />
          <AddStudentDialog onStudentAdded={handleStudentAdded} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name, company, or background..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:flex-1"
        />
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((className) => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Users className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium text-foreground">No students found</p>
            <p className="text-muted-foreground">
              {searchTerm || selectedClass !== "all"
                ? "Try adjusting your filters"
                : "Add your first student to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;

// ==========================================
// WIDOK: Profil Ucznia
// ==========================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePenLine, Clock4, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentLoader } from "@/components/layout/ContentLoader";

import { useStudentDetails } from "../hook";
import {
  getStudentColor,
  getInitials,
  formatEducationLabelFull,
} from "../utils";
import { StudentFormModal } from "../components/StudentFormModal";
import { StudentInfoTab } from "../components/StudentProfileInfoTab";
import { StudentCalendarTab } from "../components/StudentProfileCalendarTab";
import { cn } from "@/lib/utils";

interface StudentProfileProps {
  id: string;
}

export function StudentProfile({ id }: StudentProfileProps) {
  const router = useRouter();
  const { student, isLoading, error, refetch } = useStudentDetails(id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  // * Odświeżanie szczegółów po zapisie w modalu edycji
  const handleStudentUpdated = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl pb-4 pt-4">
        {/* Przycisk powrotu. */}
        <Button
          variant="ghost"
          disabled
          className="-ml-4 mb-6 w-fit text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do uczniów
        </Button>

        <ContentLoader minHeight="h-[400px]" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">
          {error || "Nie znaleziono ucznia"}
        </p>
        <Button variant="outline" onClick={() => router.push("/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
        </Button>
      </div>
    );
  }

  const colorInfo = getStudentColor(student.id);

  return (
    <div className="mx-auto max-w-6xl pb-4 pt-4">
      {/* Nawigacja. */}
      <Button
        variant="ghost"
        className="-ml-4 mb-4 w-fit text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/students")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do uczniów
      </Button>

      {/* Nagłówek z imieniem i nazwiskiem ucznia. */}
      <div className="flex flex-col mb-6 md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md",
              colorInfo.solid,
            )}
          >
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {student.firstName} {student.lastName}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {formatEducationLabelFull(
                student.educationType,
                student.classYear,
                student.mathLevel,
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edytuj
          </Button>
        </div>
      </div>

      {/* Zakładki. */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList cols={4} className="mb-6">
          <TabsTrigger value="info">Informacje</TabsTrigger>
          <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
          <TabsTrigger value="homework">Prace domowe</TabsTrigger>
          <TabsTrigger value="history">Historia zajęć</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="focus-visible:outline-none">
          <StudentInfoTab student={student} colorInfo={colorInfo} />
        </TabsContent>

        <TabsContent value="calendar" className="focus-visible:outline-none">
          <StudentCalendarTab studentId={student.id} />
        </TabsContent>

        <TabsContent
          value="homework"
          className="pt-12 focus-visible:outline-none"
        >
          <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border bg-secondary/10 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FilePenLine className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Brak zadanych prac domowych
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Gdy nadasz uczniowi zestaw zadań, jego wyniki i status rozwiązania
              pojawią się w tym miejscu.
            </p>
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="pt-12 focus-visible:outline-none"
        >
          <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border bg-secondary/10 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Clock4 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Historia lekcji pusta
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Lista zrealizowanych zajęć wraz z notatkami i linkami do
              archiwalnych tablic będzie widoczna tutaj.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <StudentFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        studentId={student.id}
        onStudentCreated={handleStudentUpdated}
        defaultValues={{
          firstName: student.firstName,
          lastName: student.lastName,
          educationType: student.educationType,
          classYear: student.classYear,
          mathLevel: student.mathLevel,
          email: student.email || "",
          phone: student.phone || "",
          parentPhone: student.parentPhone || "",
          hourlyRate: student.hourlyRate,
          notes: student.notes || "",
          scheduleSlots: student.scheduleSlots || [],
        }}
      />
    </div>
  );
}

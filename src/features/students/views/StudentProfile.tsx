// ==========================================
// WIDOK: Profil Ucznia
// ==========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  FilePenLine,
  Clock4,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentLoader } from "@/components/layout/ContentLoader";

import { useStudentDetails } from "../hook";
import { getStudentColor } from "../utils";
import { StudentFormModal } from "../components/StudentFormModal";
import { StudentInfoTab } from "../components/StudentProfileInfoTab";
import type { StudentFormData } from "../schema";

interface StudentProfileProps {
  id: string;
}

export function StudentProfile({ id }: StudentProfileProps) {
  const router = useRouter();
  const { student, isLoading, error, updateStudent } = useStudentDetails(id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl pb-16 pt-4">
        {/* Przycisk powrotu */}
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

  const handleEditSubmit = async (data: StudentFormData) => {
    return await updateStudent(data);
  };

  return (
    <div className="mx-auto max-w-6xl pb-16 pt-4">
      {/* Nawigacja */}
      <Button
        variant="ghost"
        className="-ml-4 mb-6 w-fit text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/students")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do uczniów
      </Button>

      {/* ZAKŁADKI */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList cols={4} className="mb-6">
          <TabsTrigger value="info">Informacje</TabsTrigger>
          <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
          <TabsTrigger value="homework">Prace domowe</TabsTrigger>
          <TabsTrigger value="history">Historia zajęć</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="focus-visible:outline-none">
          <StudentInfoTab
            student={student}
            colorInfo={colorInfo}
            onEditClick={() => setIsEditOpen(true)}
          />
        </TabsContent>

        <TabsContent
          value="calendar"
          className="pt-12 focus-visible:outline-none"
        >
          {/* PLACEHOLDER DLA KALENDARZA */}
          <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-border bg-secondary/10 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Kalendarz zajęć w przygotowaniu
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Tutaj wkrótce pojawi się interaktywny kalendarz, w którym
              zaplanujesz i zobaczysz wszystkie lekcje z tym uczniem.
            </p>
          </div>
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
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}

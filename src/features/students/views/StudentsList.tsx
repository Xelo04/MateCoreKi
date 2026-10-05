// ==========================================
// WIDOK: Lista aktywnych i zarchiwizowanych uczniów z wyszukiwaniem
// ==========================================
// Główny panel zarządzania uczniami. Umożliwia wyszukiwanie, archiwizację,
// edycję danych oraz bezpośrednie planowanie zajęć dla konkretnego ucznia.

"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContentLoader } from "@/components/layout/ContentLoader";

import { useStudentsList } from "../hook";
import { ActiveStudentCard } from "../components/ActiveStudentCard";
import { ArchivedStudentCard } from "../components/ArchivedStudentCard";
import { StudentFormModal } from "../components/StudentFormModal";
import { LessonFormModal } from "@/features/calendar/components/LessonFormModal";
import { StudentService } from "../service";
import type { StudentFormData } from "../schema";

export function StudentsList() {
  const {
    activeStudents,
    archivedStudents,
    isLoading,
    archiveStudent,
    restoreStudent,
    refetch,
  } = useStudentsList();

  const [searchQuery, setSearchQuery] = useState("");

  // * Stan dla modalu zarządzania profilem studenta (dodawanie/edycja)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    studentId?: string;
    defaultValues?: Partial<StudentFormData>;
  }>({
    isOpen: false,
    mode: "add",
  });

  // * Stan dla modalu szybkiego planowania zajęć bezpośrednio z karty
  const [planModalState, setPlanModalState] = useState<{
    isOpen: boolean;
    studentId?: string;
  }>({
    isOpen: false,
  });

  // * Filtrowanie uczniów po imieniu lub nazwisku
  const filteredActive = useMemo(() => {
    if (!searchQuery.trim()) return activeStudents;
    const lowerQuery = searchQuery.toLowerCase();
    return activeStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(lowerQuery) ||
        s.lastName.toLowerCase().includes(lowerQuery),
    );
  }, [activeStudents, searchQuery]);

  // * Otwarcie formularza dodawania ucznia
  const handleOpenAdd = useCallback(
    () => setModalState({ isOpen: true, mode: "add", studentId: undefined }),
    [],
  );

  // * Otwarcie formularza edycji po pobraniu świeżych szczegółów z API
  const handleOpenEdit = useCallback(async (id: string) => {
    try {
      const toastId = toast.loading("Pobieranie danych...");
      const details = await StudentService.getStudentDetails(id);
      toast.dismiss(toastId);

      setModalState({
        isOpen: true,
        mode: "edit",
        studentId: id,
        defaultValues: {
          firstName: details.firstName,
          lastName: details.lastName,
          educationType: details.educationType,
          classYear: details.classYear,
          mathLevel: details.mathLevel,
          email: details.email || "",
          phone: details.phone || "",
          parentPhone: details.parentPhone || "",
          hourlyRate: details.hourlyRate,
          notes: details.notes || "",
          scheduleSlots: details.scheduleSlots || [],
        },
      });
    } catch {
      toast.error("Nie udało się pobrać danych ucznia.");
    }
  }, []);

  // * Otwarcie szybkiego planowania lekcji dla wybranego ucznia
  const handleOpenPlan = useCallback((id: string) => {
    setPlanModalState({
      isOpen: true,
      studentId: id,
    });
  }, []);

  // * Odświeżenie widoku po udanym zaplanowaniu lekcji (aktualizuje harmonogram na karcie)
  const handlePlanSubmit = useCallback(async () => {
    void refetch();
    return true;
  }, [refetch]);

  // * Odświeżenie widoku po zmianach w profilu ucznia
  const handleStudentCreatedOrUpdated = useCallback(() => {
    void refetch();
  }, [refetch]);

  // * Stabilna referencja dla wartości domyślnych planowania (zapobiega pętli renderu)
  const planDefaults = useMemo(
    () => ({
      studentId: planModalState.studentId,
    }),
    [planModalState.studentId],
  );

  if (isLoading) {
    return (
      <div className="space-y-10 pb-16">
        {/* Tytuł, wyszukiwarka i przycisk dodawania */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Moi Uczniowie
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Zarządzaj swoimi uczniami i sprawdzaj ich postępy.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full flex-1 sm:w-72">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj ucznia..."
                className="border-border/50 bg-card pl-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              className="w-full sm:w-auto shrink-0 shadow-md"
              onClick={handleOpenAdd}
            >
              <Plus className="mr-2 h-4 w-4" /> Dodaj Ucznia
            </Button>
          </div>
        </div>
        <ContentLoader minHeight="h-[350px]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Branding i tytuł */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Moi Uczniowie
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Zarządzaj swoimi uczniami i sprawdzaj ich postępy.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Wyszukiwarka */}
          <div className="relative w-full flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj ucznia..."
              className="border-border/50 bg-card pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Przycisk dodawania */}
          <Button
            className="w-full sm:w-auto shrink-0 shadow-md"
            onClick={handleOpenAdd}
          >
            <Plus className="mr-2 h-4 w-4" /> Dodaj Ucznia
          </Button>
        </div>
      </div>

      {/* Aktywni uczniowie. */}
      {filteredActive.length > 0 ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredActive.map((student) => (
            <ActiveStudentCard
              key={student.id}
              student={student}
              onArchive={archiveStudent}
              onEdit={handleOpenEdit}
              onPlan={handleOpenPlan} // * Podpięcie akcji szybkiego planowania lekcji
            />
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/50 py-12 text-center">
          <p className="font-medium text-muted-foreground">
            Brak aktywnych uczniów spełniających kryteria.
          </p>
        </div>
      )}

      {/* Archiwum rozwijane na dole strony. */}
      {archivedStudents.length > 0 && (
        <div className="w-full pt-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="archive"
              className="border-none px-0 bg-transparent shadow-none"
            >
              <AccordionTrigger className="rounded-2xl border border-border/50 bg-card px-6 py-4 transition-colors hover:bg-card hover:no-underline">
                <span className="text-sm font-semibold text-foreground">
                  Archiwum uczniów ({archivedStudents.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-2 pt-6">
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedStudents.map((student) => (
                    <ArchivedStudentCard
                      key={student.id}
                      student={student}
                      onRestore={restoreStudent}
                    />
                  ))}
                </section>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* * Modal dodawania / edycji profilu studenta */}
      <StudentFormModal
        open={modalState.isOpen}
        onOpenChange={(isOpen) =>
          setModalState((prev) => ({ ...prev, isOpen }))
        }
        mode={modalState.mode}
        studentId={modalState.studentId}
        defaultValues={modalState.defaultValues}
        onStudentCreated={handleStudentCreatedOrUpdated}
      />

      {/* * Modal szybkiego planowania zajęć bezpośrednio z karty ucznia */}
      <LessonFormModal
        open={planModalState.isOpen}
        onOpenChange={(isOpen) =>
          setPlanModalState((prev) => ({ ...prev, isOpen }))
        }
        defaultValues={planDefaults}
        onSubmit={handlePlanSubmit}
        hideStudentSelect={true}
      />
    </div>
  );
}

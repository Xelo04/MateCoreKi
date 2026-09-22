// ==========================================
// KOMPONENT: Modal dodawania / edycji ucznia
// ==========================================

"use client";

import { useEffect, useMemo, useCallback } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  User,
  UserRoundPlus,
  UserRoundPen,
  GraduationCap,
  Phone,
  StickyNote,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ModalShell } from "@/components/ui/modal-shell";

import { studentFormSchema, type StudentFormData } from "../schema";
import type { EducationType } from "../types";
import { ScheduleSlotRow } from "./ScheduleSlotRow";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit";
  defaultValues?: Partial<StudentFormData>;
  onSubmit: (data: StudentFormData) => Promise<boolean>;
}

// * Domyślne wartości formularza
const DEFAULT_VALUES: StudentFormData = {
  firstName: "",
  lastName: "",
  educationType: "high_school",
  classYear: 1,
  mathLevel: "basic",
  email: "",
  phone: "",
  hourlyRate: null,
  notes: "",
  scheduleSlots: [],
};

// * Zwraca dostępne klasy w zależności od typu szkoły
const getClassYearsForEducation = (type: EducationType): number[] => {
  if (type === "primary_school") return [1, 2, 3, 4, 5, 6, 7, 8];
  if (type === "high_school") return [1, 2, 3, 4];
  return [1, 2, 3, 4, 5];
};

// * Formatuje numer telefonu do postaci "123 456 789"
const formatPhoneDisplay = (digits: string): string => {
  const clean = digits.replace(/\D/g, "").slice(0, 9);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
};

// * Usuwa wszystkie znaki niebędące cyframi i ogranicza do 9 cyfr
const stripPhoneToDigits = (formatted: string): string =>
  formatted.replace(/\D/g, "").slice(0, 9);

export function StudentFormModal({
  open,
  onOpenChange,
  mode = "add",
  defaultValues,
  onSubmit,
}: StudentFormModalProps) {
  const methods = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "scheduleSlots",
  });

  const educationType = useWatch({ control, name: "educationType" });
  const classYear = useWatch({ control, name: "classYear" });
  const phoneValue = useWatch({ control, name: "phone" });

  const availableYears = useMemo(
    () => getClassYearsForEducation(educationType),
    [educationType],
  );

  // * Resetuj formularz przy otwieraniu modala (np. po zamknięciu i ponownym otwarciu)
  useEffect(() => {
    if (open) {
      reset({ ...DEFAULT_VALUES, ...defaultValues });
    }
  }, [open, defaultValues, reset]);

  // * Jeśli zmieni się typ szkoły, zresetuj klasę i poziom matematyki
  useEffect(() => {
    if (!availableYears.includes(classYear)) {
      setValue("classYear", 1, { shouldValidate: true });
    }
    if (educationType === "primary_school") {
      setValue("mathLevel", null, { shouldValidate: true });
    } else {
      setValue("mathLevel", "basic", { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educationType]);

  // * Dodaje nowy termin zajęć z domyślnymi wartościami
  const handleAddSlot = () => {
    append({
      id: crypto.randomUUID(),
      dayOfWeek: 1,
      startTime: "",
      durationMins: 60,
      recurrence: "weekly",
      date: "",
    });
  };

  // * Funkcja wywoływana przy submitowaniu formularza
  const submit = async (data: StudentFormData) => {
    const cleanedData: StudentFormData = {
      ...data,
      phone: data.phone ? stripPhoneToDigits(data.phone) : "",
    };
    const success = await onSubmit(cleanedData);
    if (success) {
      onOpenChange(false);
      reset(DEFAULT_VALUES);
    }
  };

  // * Obsługa zmiany pola telefonu (formatowanie i walidacja)
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue("phone", stripPhoneToDigits(e.target.value), {
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const phoneDisplay = useMemo(
    () => formatPhoneDisplay(phoneValue || ""),
    [phoneValue],
  );

  // * Czy modal jest w trybie edycji czy dodawania
  const isEdit = mode === "edit";

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={
        isEdit ? (
          <UserRoundPen className="h-6 w-6 text-white" strokeWidth={2} />
        ) : (
          <UserRoundPlus className="h-6 w-6 text-white" strokeWidth={2} />
        )
      }
      title={isEdit ? "Edytuj dane ucznia" : "Dodaj nowego ucznia"}
      formId="student-form"
      submitLabel={isEdit ? "Zapisz zmiany" : "Dodaj ucznia"}
      isSubmitting={isSubmitting}
      onClose={() => onOpenChange(false)}
    >
      <FormProvider {...methods}>
        <form
          id="student-form"
          onSubmit={handleSubmit(submit)}
          className="space-y-6"
        >
          {/* SEKCJA: Dane podstawowe */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              Dane podstawowe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Imię *</Label>
                <Input placeholder="Jan" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Nazwisko *</Label>
                <Input placeholder="Kowalski" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <Separator className="bg-primary/10" />

          {/* SEKCJA: Edukacja */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              Edukacja
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Typ szkoły *</Label>
                <Controller
                  control={control}
                  name="educationType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as EducationType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary_school">
                          Szkoła podstawowa
                        </SelectItem>
                        <SelectItem value="high_school">Liceum</SelectItem>
                        <SelectItem value="technical_school">
                          Technikum
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Klasa *</Label>
                <Controller
                  control={control}
                  name="classYear"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            Klasa {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.classYear && (
                  <p className="text-xs text-destructive">
                    {errors.classYear.message}
                  </p>
                )}
              </div>

              {educationType !== "primary_school" && (
                <div className="space-y-1.5">
                  <Label>Poziom *</Label>
                  <Controller
                    control={control}
                    name="mathLevel"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "basic"}
                        onValueChange={(v) =>
                          field.onChange(v as "basic" | "extended")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Podstawowy</SelectItem>
                          <SelectItem value="extended">Rozszerzony</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.mathLevel && (
                    <p className="text-xs text-destructive">
                      {errors.mathLevel.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <Separator className="bg-primary/10" />

          {/* SEKCJA: Pozostałe informacje */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="h-4 w-4 text-primary" />
              Pozostałe informacje
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="jan@kowalski.pl"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="123 456 789"
                  maxLength={11}
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Stawka godzinowa (zł)</Label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  placeholder="np. 120"
                  {...register("hourlyRate", {
                    setValueAs: (v) =>
                      v === "" || v === null ? null : Number(v),
                  })}
                />
                {errors.hourlyRate && (
                  <p className="text-xs text-destructive">
                    {errors.hourlyRate.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <Separator className="bg-primary/10" />

          {/* SEKCJA: Notatki */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <StickyNote className="h-4 w-4 text-primary" />
              Prywatne notatki (widoczne tylko dla Ciebie)
            </h3>
            <Textarea
              rows={3}
              placeholder="Np. Przygotowanie do matury, ma problem z trygonometrią..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </section>

          <Separator className="bg-primary/10" />

          {/* SEKCJA: Terminy zajęć */}
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Terminy zajęć
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Możesz dodać teraz lub później z kalendarza.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSlot}
                className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary shrink-0"
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Dodaj termin
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-2xl border-2 border-primary py-8 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-sm">Brak dodanych terminów.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <ScheduleSlotRow
                    key={field.id}
                    index={index}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>
            )}
          </section>
        </form>
      </FormProvider>
    </ModalShell>
  );
}

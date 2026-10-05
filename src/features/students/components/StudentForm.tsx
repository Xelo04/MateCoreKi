// ==========================================
// KOMPONENT: Formularz ucznia (embeddable)
// ==========================================
// Czysty formularz ucznia z własnym useForm i walidacją Zod.
// Czeka na sygnał submit() od rodzica (przez ref), sam fetchuje
// StudentService, sam pokazuje toast, zwraca wynik rodzicowi.

"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, GraduationCap, Phone, StickyNote } from "lucide-react";
import { toast } from "sonner";

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

import { studentFormSchema, type StudentFormData } from "../schema";
import type { EducationType } from "../types";
import { StudentService } from "../service";

export interface StudentFormHandle {
  // * Pozwala rodzicowi walidować dane przed transakcją
  validate: () => Promise<boolean>;
  submit: () => Promise<StudentFormResult>;
}

export interface StudentFormResult {
  success: boolean;
  // * ID ucznia (nowego lub edytowanego) - potrzebne rodzicowi do kaskadowych transakcji
  studentId?: string;
  // * Komunikat błędu dla rodzica (toast już się pokazał)
  error?: string;
}

interface StudentFormProps {
  readonly mode: "add" | "edit";
  readonly defaultValues?: Partial<StudentFormData>;
  // * Wymagane w trybie "edit" - ID ucznia do aktualizacji
  readonly studentId?: string;
}

// * Puste wartości startowe formularza
const EMPTY_FORM: StudentFormData = {
  firstName: "",
  lastName: "",
  educationType: "high_school",
  classYear: 1,
  mathLevel: "basic",
  email: "",
  phone: "",
  parentPhone: "",
  hourlyRate: null,
  notes: "",
  scheduleSlots: [],
};

// * Dostępne klasy w zależności od typu szkoły
const getClassYearsForEducation = (type: EducationType): number[] => {
  if (type === "primary_school") return [1, 2, 3, 4, 5, 6, 7, 8];
  if (type === "high_school") return [1, 2, 3, 4];
  return [1, 2, 3, 4, 5];
};

// * Formatowanie telefonu "123 456 789"
const formatPhoneDisplay = (digits: string): string => {
  const clean = digits.replace(/\D/g, "").slice(0, 9);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
};

const stripPhoneToDigits = (formatted: string): string =>
  formatted.replace(/\D/g, "").slice(0, 9);

export const StudentForm = forwardRef<StudentFormHandle, StudentFormProps>(
  function StudentForm({ mode, defaultValues, studentId }, ref) {
    const methods = useForm<StudentFormData>({
      resolver: zodResolver(studentFormSchema) as Resolver<StudentFormData>,
      defaultValues: { ...EMPTY_FORM, ...defaultValues },
      mode: "onBlur",
    });

    const {
      register,
      control,
      setValue,
      handleSubmit,
      trigger,
      formState: { errors },
    } = methods;

    const educationType = useWatch({ control, name: "educationType" });
    const classYear = useWatch({ control, name: "classYear" });
    const phoneValue = useWatch({ control, name: "phone" });
    const parentPhoneValue = useWatch({ control, name: "parentPhone" });

    const availableYears = useMemo(
      () => getClassYearsForEducation(educationType),
      [educationType],
    );

    // * Reset klasy i poziomu matmy przy zmianie typu szkoły
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

    // * Obsługa pól telefonów
    const handlePhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue("phone", stripPhoneToDigits(e.target.value), {
          shouldValidate: true,
        });
      },
      [setValue],
    );

    const handleParentPhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue("parentPhone", stripPhoneToDigits(e.target.value), {
          shouldValidate: true,
        });
      },
      [setValue],
    );

    const phoneDisplay = useMemo(
      () => formatPhoneDisplay(phoneValue || ""),
      [phoneValue],
    );
    const parentPhoneDisplay = useMemo(
      () => formatPhoneDisplay(parentPhoneValue || ""),
      [parentPhoneValue],
    );

    // ==========================================
    // SYGNAŁY OD RODZICA: validate() oraz submit()
    // ==========================================
    useImperativeHandle(
      ref,
      () => ({
        // * Walidacja Zod całego profilu ucznia
        validate: async () => {
          return trigger();
        },
        submit: async (): Promise<StudentFormResult> => {
          // * Zwracamy Promise ręcznie - handleSubmit nie wspiera tego natywnie
          return new Promise((resolve) => {
            void handleSubmit(
              async (data) => {
                try {
                  const cleaned: StudentFormData = {
                    ...data,
                    phone: data.phone ? stripPhoneToDigits(data.phone) : "",
                    parentPhone: data.parentPhone
                      ? stripPhoneToDigits(data.parentPhone)
                      : "",
                  };

                  let resultStudentId: string;

                  if (mode === "add") {
                    const created = await StudentService.createStudent(cleaned);
                    resultStudentId = created.id;
                    toast.success("Uczeń został dodany");
                  } else {
                    if (!studentId) {
                      throw new Error("Brak studentId dla trybu edycji");
                    }
                    await StudentService.updateStudent(studentId, cleaned);
                    resultStudentId = studentId;
                    toast.success("Dane ucznia zostały zaktualizowane");
                  }

                  resolve({ success: true, studentId: resultStudentId });
                } catch (err) {
                  const msg =
                    err instanceof Error
                      ? err.message
                      : "Nie udało się zapisarć ucznia";
                  console.error("StudentForm submit error:", err);
                  toast.error("Błąd zapisu ucznia", { description: msg });
                  resolve({ success: false, error: msg });
                }
              },
              // * Walidacja Zod nie przeszła - błędy już są pod polami
              () => {
                resolve({
                  success: false,
                  error: "Formularz zawiera błędy walidacji",
                });
              },
            )();
          });
        },
      }),
      [handleSubmit, mode, studentId, trigger],
    );

    return (
      <FormProvider {...methods}>
        {/* * Formularz BEZ tagu <form> - rodzic kontroluje submit przez ref */}
        <div className="space-y-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-3">
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
                <Label>Telefon ucznia</Label>
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
              <div className="space-y-1.5">
                <Label>Telefon rodzica</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="123 456 789"
                  maxLength={11}
                  value={parentPhoneDisplay}
                  onChange={handleParentPhoneChange}
                />
                {errors.parentPhone && (
                  <p className="text-xs text-destructive">
                    {errors.parentPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Stawka (zł/h)</Label>
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
        </div>
      </FormProvider>
    );
  },
);

// ==========================================
// KOMPONENT: Formularz Zadania (embeddable)
// ==========================================
// Czysty formularz tworzenia/edycji zadania z własnym useForm i walidacją Zod.
// Czeka na sygnał submit() od rodzica, sam zarządza uploadem plików Drag&Drop.

"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, FileText, Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { exerciseFormSchema, type ExerciseFormData } from "../schema";
import { uploadExerciseFile } from "../actions";
import { useTags } from "../hook";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_TYPE_LABELS,
} from "../types";

export interface ExerciseFormHandle {
  validate: () => Promise<boolean>;
  submit: () => Promise<ExerciseFormResult>;
}

export interface ExerciseFormResult {
  success: boolean;
  data?: ExerciseFormData;
  error?: string;
}

interface ExerciseFormProps {
  readonly defaultValues?: Partial<ExerciseFormData>;
}

const EMPTY_FORM: Partial<ExerciseFormData> = {
  title: "",
  contentText: "",
  contentImages: [],
  contentFiles: [],
  solutionText: "",
  solutionImagesUrls: [],
  solutionFilesUrls: [],
  tagIds: [],
  description: "",
  difficulty: null,
  mathLevel: null,
  exerciseType: undefined,
  points: null,
};

export const ExerciseForm = forwardRef<ExerciseFormHandle, ExerciseFormProps>(
  function ExerciseForm({ defaultValues }, ref) {
    const { tags } = useTags();

    const hasExistingSolution = !!(
      defaultValues?.solutionText ||
      defaultValues?.solutionImagesUrls?.length ||
      defaultValues?.solutionFilesUrls?.length
    );
    const [showSolution, setShowSolution] = useState(hasExistingSolution);

    const {
      register,
      control,
      setValue,
      handleSubmit,
      trigger,
      formState: { errors, isSubmitted, submitCount },
    } = useForm<ExerciseFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(exerciseFormSchema) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultValues: { ...EMPTY_FORM, ...defaultValues } as any,
      mode: "onBlur",
    });

    const watchedTags = useWatch({ control, name: "tagIds" });
    const watchedContentText = useWatch({ control, name: "contentText" });
    const watchedContentImages =
      useWatch({ control, name: "contentImages" }) || [];
    const watchedContentFiles =
      useWatch({ control, name: "contentFiles" }) || [];

    const hasNoContent =
      !watchedContentText?.trim() &&
      watchedContentImages.length === 0 &&
      watchedContentFiles.length === 0;

    const showContentError =
      Boolean(errors.contentText) ||
      ((isSubmitted || submitCount > 0) && hasNoContent);

    useImperativeHandle(
      ref,
      () => ({
        validate: async () => trigger(),
        submit: async () => {
          return new Promise((resolve) => {
            void handleSubmit(
              (data: ExerciseFormData) => resolve({ success: true, data }),
              () =>
                resolve({ success: false, error: "Formularz zawiera błędy" }),
            )();
          });
        },
      }),
      [handleSubmit, trigger],
    );

    const sortedTags = useMemo(() => {
      return [...tags].sort((a, b) => {
        if (a.id === "t-inne") return 1;
        if (b.id === "t-inne") return -1;
        return a.name.localeCompare(b.name, "pl");
      });
    }, [tags]);

    const handleTagToggle = useCallback(
      (tagId: string) => {
        const current = watchedTags || [];
        if (current.includes(tagId)) {
          setValue(
            "tagIds",
            current.filter((id) => id !== tagId),
            { shouldDirty: true, shouldValidate: true },
          );
        } else {
          setValue("tagIds", [...current, tagId], {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      },
      [watchedTags, setValue],
    );

    const CombinedUploader = ({
      imageField,
      fileField,
      label,
    }: {
      imageField: "contentImages" | "solutionImagesUrls";
      fileField: "contentFiles" | "solutionFilesUrls";
      label: string;
    }) => {
      const [isDragging, setIsDragging] = useState(false);
      const [isUploading, setIsUploading] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const currentImages = useWatch({ control, name: imageField }) || [];
      const currentFiles = useWatch({ control, name: fileField }) || [];
      const totalFilesCount = currentImages.length + currentFiles.length;

      const handleFiles = async (files: File[]) => {
        if (totalFilesCount + files.length > 5) {
          toast.error("Limit plików", {
            description:
              "Możesz dodać maksymalnie 5 plików łącznie (zdjęcia + PDF) do tej sekcji.",
          });
          return;
        }

        setIsUploading(true);
        const newImages: string[] = [];
        const newPdfs: string[] = [];

        try {
          for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
              toast.error("Plik zbyt duży", {
                description: `Plik ${file.name} przekracza 10MB.`,
              });
              continue;
            }

            const formData = new FormData();
            formData.append("file", file);
            const res = await uploadExerciseFile(formData);

            if (res.error) {
              toast.error("Błąd uploadu", { description: res.error });
            } else if (res.url) {
              if (file.type === "application/pdf" || res.url.endsWith(".pdf")) {
                newPdfs.push(res.url);
              } else {
                newImages.push(res.url);
              }
            }
          }

          if (newImages.length > 0) {
            setValue(imageField, [...currentImages, ...newImages], {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
          if (newPdfs.length > 0) {
            setValue(fileField, [...currentFiles, ...newPdfs], {
              shouldValidate: true,
              shouldDirty: true,
            });
          }

          const uploadedCount = newImages.length + newPdfs.length;
          if (uploadedCount > 0) {
            toast.success(`Wgrano ${uploadedCount} plik(ów)`);
          }
        } catch (err) {
          console.error("Upload handler error:", err);
          toast.error("Wystąpił nieoczekiwany błąd uploadu");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      const handleRemoveImage = (idx: number) => {
        setValue(
          imageField,
          currentImages.filter((_, i) => i !== idx),
          { shouldValidate: true },
        );
      };

      const handleRemoveFile = (idx: number) => {
        setValue(
          fileField,
          currentFiles.filter((_, i) => i !== idx),
          { shouldValidate: true },
        );
      };

      return (
        <div className="space-y-3">
          <Label className="text-muted-foreground">{label}</Label>

          {totalFilesCount > 0 && (
            <div className="flex flex-wrap gap-4 mb-2 pt-2">
              {currentImages.map((url, idx) => (
                <div key={`img-${idx}`} className="relative group h-20 w-20">
                  <div className="w-full h-full rounded-xl border border-border/50 bg-card overflow-hidden flex items-center justify-center shadow-sm">
                    <Image
                      src={url}
                      alt={`Podgląd ${idx}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {currentFiles.map((url, idx) => (
                <div key={`pdf-${idx}`} className="relative group h-20 w-20">
                  <div className="w-full h-full rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col items-center justify-center shadow-sm text-muted-foreground">
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-[9px] font-medium truncate w-16 text-center px-1">
                      {url.split("-").pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalFilesCount < 5 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length)
                  void handleFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:bg-muted/30 hover:border-primary/40",
                isUploading && "pointer-events-none opacity-50",
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length)
                    void handleFiles(Array.from(e.target.files));
                }}
              />
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex gap-2 mb-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Kliknij lub przeciągnij pliki (max 5)
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      );
    };

    const handleRemoveSolution = () => {
      setValue("solutionText", "");
      setValue("solutionImagesUrls", []);
      setValue("solutionFilesUrls", []);
      setShowSolution(false);
    };

    return (
      <div className="space-y-8">
        {/* ========================================== */}
        {/* SEKCJA 1: Informacje podstawowe            */}
        {/* ========================================== */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-title">
              Tytuł zadania <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ex-title"
              placeholder="np. Równanie kwadratowe z parametrem"
              className="h-11"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Typ zadania <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="exerciseType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 bg-card">
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXERCISE_TYPE_LABELS).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.exerciseType && (
                <p className="text-xs text-destructive">
                  {errors.exerciseType.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Poziom edukacji</Label>
              <Controller
                control={control}
                name="mathLevel"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : v)
                    }
                  >
                    <SelectTrigger className="h-11 bg-card">
                      <SelectValue placeholder="Brak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nieokreślony</SelectItem>
                      {Object.entries(EXERCISE_MATH_LEVEL_LABELS).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Trudność</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : v)
                    }
                  >
                    <SelectTrigger className="h-11 bg-card">
                      <SelectValue placeholder="Brak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nieokreślona</SelectItem>
                      {Object.entries(EXERCISE_DIFFICULTY_LABELS).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-points">Punktacja</Label>
              <Input
                id="ex-points"
                type="number"
                min={0}
                max={999}
                placeholder="np. 4"
                className="h-11"
                {...register("points", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
              />
              {errors.points && (
                <p className="text-xs text-destructive">
                  {errors.points.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>
              Działy i tematyka
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {sortedTags.map((tag) => {
                const isSelected = watchedTags?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors outline-none cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/60 hover:bg-muted/50",
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {errors.tagIds && (
              <p className="text-xs text-destructive">
                {errors.tagIds.message}
              </p>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* SEKCJA 2: Treść zadania                    */}
        {/* ========================================== */}
        <div
          className={cn(
            "space-y-4 rounded-2xl border bg-muted/10 p-4 sm:p-5 transition-colors",
            showContentError ? "border-destructive/60" : "border-border/60",
          )}
        >
          <h3 className="font-bold text-foreground">
            Treść zadania <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground -mt-3">
            Wymagany jest przynajmniej jeden format (tekst, zdjęcie lub PDF).
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="ex-content-text">Treść tekstowa</Label>
            <Textarea
              id="ex-content-text"
              placeholder="np. Wyznacz wszystkie wartości parametru m, dla których..."
              className="min-h-25 resize-y rounded-xl"
              {...register("contentText")}
            />
          </div>

          <div className="pt-2">
            <CombinedUploader
              imageField="contentImages"
              fileField="contentFiles"
              label="Zdjęcia i pliki PDF z treścią zadania"
            />
          </div>
        </div>

        {showContentError && (
          <p className="text-xs text-destructive -mt-6">
            Dodaj treść zadania (tekst, zdjęcie lub plik)
          </p>
        )}

        {/* ========================================== */}
        {/* SEKCJA 3: Rozwiązanie i Detale             */}
        {/* ========================================== */}
        {!showSolution ? (
          <Button
            type="button"
            onClick={() => setShowSolution(true)}
            className="w-full h-11 rounded-xl font-semibold shadow-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Dodaj rozwiązanie do zadania
          </Button>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5 relative group">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleRemoveSolution}
              title="Usuń rozwiązanie"
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="font-bold text-foreground pr-8">Rozwiązanie</h3>

            <div className="space-y-1.5">
              <Label htmlFor="ex-solution-text">
                Rozwiązanie tekstowe / klucz odpowiedzi
              </Label>
              <Textarea
                id="ex-solution-text"
                placeholder="np. x1 = -2, x2 = 5"
                className="min-h-20 resize-y rounded-xl"
                {...register("solutionText")}
              />
            </div>

            <div className="pt-2">
              <CombinedUploader
                imageField="solutionImagesUrls"
                fileField="solutionFilesUrls"
                label="Zdjęcia i pliki PDF z rozwiązaniem"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ex-description">
            Prywatne notatki (widoczne tylko dla Ciebie)
          </Label>
          <Textarea
            id="ex-description"
            placeholder="np. Zadanie z matury 2023, często sprawia problemy na znakach."
            className="min-h-20 resize-y rounded-xl"
            {...register("description")}
          />
        </div>
      </div>
    );
  },
);

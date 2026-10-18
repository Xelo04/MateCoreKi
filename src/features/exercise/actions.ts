// ==========================================
// AKCJE SERWEROWE: Moduł Bazy Zadań
// ==========================================
// * Obsługa zapisu plików bezpośrednio na dysk do folderu /public/files
// * To rozwiązanie działa świetnie lokalnie. Przy przejściu na produkcję
// * należy je zastąpić integracją z AWS S3, Cloudinary itp.

"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadExerciseFile(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { error: "Brak pliku w żądaniu" };

    // * Walidacja rozmiaru pliku (10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { error: "Plik jest zbyt duży (maksymalnie 10MB)" };
    }

    // * Generowanie unikalnej nazwy pliku (aby uniknąć nadpisywania)
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;

    // * Zapewnienie, że ścieżka istnieje
    const uploadDir = join(process.cwd(), "public", "files", "exercises");
    await mkdir(uploadDir, { recursive: true });

    // * Zapis pliku na dysk
    const filePath = join(uploadDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // * Zwracamy publiczny URL do pliku (zaczynający się od /files...)
    return { url: `/files/exercises/${fileName}` };
  } catch (err) {
    console.error("Błąd przesyłania pliku:", err);
    return { error: "Wystąpił błąd podczas zapisywania pliku na serwerze" };
  }
}

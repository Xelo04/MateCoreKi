// ==========================================
// AKCJE SERWEROWE: Moduł Bazy Zadań
// ==========================================
// * Upload plików zadań (obrazy / PDF) bezpośrednio na dysk do /public/files/exercise-database.
// * Rozwiązanie lokalne — przy przejściu na produkcję zastąpić integracją z S3/Cloudinary.
// ! Plik "use server": wolno eksportować wyłącznie funkcje async (typy są dozwolone).

"use server";

import { randomInt, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { EXERCISE_FILE_LIMITS } from "./schema";

// ==========================================
// TYPY
// ==========================================

// * Wynik uploadu: url + assetId (mock) albo error.
// * assetId jest wymagany przez schemat formularza dla bloków "image" i "pdf".
export interface UploadExerciseFileResult {
  url?: string;
  assetId?: number;
  error?: string;
}

// ==========================================
// STAŁE I WALIDACJA TYPU PLIKU
// ==========================================

// * Whitelist MIME → rozszerzenie zapisanego pliku (rozszerzenie NIE pochodzi z nazwy klienta).
// ! SVG celowo pominięte: plik serwowany z /public mógłby zawierać skrypt (XSS).
// ? Klient akceptuje "image/*", więc SVG dostanie czytelny komunikat błędu.
const ALLOWED_FILE_TYPES: Readonly<Record<string, string>> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const startsWithBytes = (
  buffer: Buffer,
  bytes: readonly number[],
  offset = 0,
): boolean => bytes.every((byte, index) => buffer[offset + index] === byte);

// * Sprawdza sygnaturę (magic bytes) — `file.type` pochodzi od klienta i można je podrobić.
const hasValidSignature = (mimeType: string, buffer: Buffer): boolean => {
  switch (mimeType) {
    case "image/png":
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47]);
    case "image/jpeg":
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38]);
    case "image/webp":
      // * "RIFF" na początku i "WEBP" od bajtu 8
      return (
        startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
        startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
      );
    case "application/pdf":
      return startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46]);
    default:
      return false;
  }
};

// * Bezpieczna baza nazwy pliku: bez rozszerzenia, tylko [a-zA-Z0-9-_], max 60 znaków.
const toSafeBaseName = (originalName: string): string => {
  const base = originalName
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .slice(0, 60);
  return base || "plik";
};

// ==========================================
// AKCJA: Upload pliku zadania
// ==========================================

// * Zapisuje plik na dysk i zwraca publiczny URL + mockowany assetId.
// * Błędy walidacji i zapisu wracają jako `error` (UI pokazuje toast), nigdy jako „sukces”.
// TODO: [BACKEND] POST /api/v1/assets — backend zwraca url i assetId po zapisie do S3/Cloudinary.
// TODO: [BACKEND] Sprawdzić sesję użytkownika przed zapisem (obecnie brak autoryzacji).
export async function uploadExerciseFile(
  formData: FormData,
): Promise<UploadExerciseFileResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Brak pliku w żądaniu" };

    // * Walidacja rozmiaru
    if (file.size > EXERCISE_FILE_LIMITS.maxFileSizeBytes) {
      const maxMb = EXERCISE_FILE_LIMITS.maxFileSizeBytes / (1024 * 1024);
      return { error: `Plik jest zbyt duży (maksymalnie ${maxMb}MB)` };
    }

    // * Walidacja typu: whitelist MIME + zgodność sygnatury z deklarowanym typem
    const extension = ALLOWED_FILE_TYPES[file.type];
    if (!extension) {
      return { error: "Dozwolone formaty: PNG, JPG, WEBP, GIF lub PDF" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(file.type, buffer)) {
      return { error: "Zawartość pliku nie odpowiada jego typowi" };
    }

    // * Unikalna nazwa (timestamp + losowy sufiks) — brak nadpisywania i kolizji
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${toSafeBaseName(file.name)}${extension}`;

    const uploadDir = join(
      process.cwd(),
      "public",
      "files",
      "exercise-database",
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileName), buffer);

    // * Mockowany assetId: timestamp × 1000 + losowa końcówka (unikalność w paczce plików)
    const mockAssetId = Date.now() * 1000 + randomInt(1000);

    return {
      url: `/files/exercise-database/${fileName}`,
      assetId: mockAssetId,
    };
  } catch (err) {
    console.error("Błąd przesyłania pliku:", err);
    return { error: "Wystąpił błąd podczas zapisywania pliku na serwerze" };
  }
}

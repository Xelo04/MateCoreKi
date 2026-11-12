export interface UploadExerciseFileResult {
  url?: string;
  assetId?: number;
  error?: string;
}

export async function uploadExerciseFile(
  formData: FormData,
): Promise<UploadExerciseFileResult> {
  void formData;
  return { error: "Przesyłanie plików jest tymczasowo niedostępne." };
}

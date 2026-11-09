import { ExerciseDetailView } from "@/features/exercise-database/views/ExerciseDetailView";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return <ExerciseDetailView exerciseId={resolvedParams.id} />;
}

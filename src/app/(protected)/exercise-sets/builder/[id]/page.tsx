// ==========================================
// ROUTING: Edycja zestawu zadań
// ==========================================

import { ExerciseSetBuilderView } from "@/features/exercise-sets/views/ExerciseSetBuilderView";

export default async function EditExerciseSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ExerciseSetBuilderView setId={resolvedParams.id} />;
}

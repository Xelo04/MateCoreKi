// ==========================================
// TRASA: Widok tablicy dla konkretnego ID
// ==========================================

import { Board } from "@/features/board/views/Board";

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { id } = await params;
  return { title: `Tablica zajęć #${id}` };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  return <Board boardId={id} />;
}

// TODO: Rozszerzyć stronę o obsługę zawartości tablicy.
// 9. Tryb widoku (View Mode) dla uczniów
// Gdy korepetytor chce tylko pokazać coś uczniowi bez ryzyka, że uczeń coś zmieni:

// React

// <Excalidraw
//   viewModeEnabled={userRole === "student"}
//   zenModeEnabled={false}
// />
// Dlaczego: Kontrola ról — korepetytor edytuje, uczeń ogląda (lub odwrotnie w zależności od scenariusza).

// 11. Własne statystyki (renderCustomStats)
// W oknie "Nerd Stats" możesz pokazać np. czas trwania zajęć, liczbę elementów:

// React

// <Excalidraw
//   renderCustomStats={(elements, appState) => (
//     <div>
//       <p>Elementów na tablicy: {elements.length}</p>
//       <p>Czas zajęć: {sessionDuration}</p>
//     </div>
//   )}
// />

// 12. Walidacja osadzanych linków
// Jeśli w przyszłości włączysz embeddowanie (np. wykresy Desmos, GeoGebra):

// React

// <Excalidraw
//   validateEmbeddable={["desmos.com", "geogebra.org"]}
// />

// czyszczenie tablicy tylko dla nauczyciela w menu w lewym górnym rogu

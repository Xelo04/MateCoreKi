// ==========================================
// KOMPONENT: Leniwy podgląd PDF (bez SSR)
// ==========================================
// * Jedyny punkt dynamicznego importu react-pdf. Zastępuje trzy kopie
// * `dynamic(() => import("./PdfPreview"))` z renderera, kolumny podglądu i builderów.

"use client";

import dynamic from "next/dynamic";
import { PdfSkeleton } from "./PdfSkeleton";

// ! react-pdf wymaga przeglądarki (canvas, worker) — ssr: false jest obowiązkowe.
// * `loading` rezerwuje miejsce na czas pobierania chunka, co zapobiega skakaniu layoutu.
export const LazyPdfPreview = dynamic(() => import("./PdfPreview"), {
  ssr: false,
  loading: () => <PdfSkeleton />,
});

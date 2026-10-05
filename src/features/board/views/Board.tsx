// ==========================================
// WIDOK: Interaktywna tablica korepetytora
// ==========================================
// Lekki komponent - dynamicznie importuje wrapper Excalidraw
// i renderuje overlay z identyfikatorem pokoju.

"use client";

import dynamic from "next/dynamic";
import { Loader } from "@/components/layout/Loader";
import type { BoardProps } from "../types";
import { useAuth } from "@/features/auth/hook";

// Dynamiczny import wrappera z wyłączeniem SSR.
const ExcalidrawBoard = dynamic(
  () =>
    import("../components/ExcalidrawBoard").then((mod) => ({
      default: mod.ExcalidrawBoard,
    })),
  {
    ssr: false,
    loading: () => <Loader />,
  },
);

export function Board({ boardId }: BoardProps) {
  const { session } = useAuth();

  const username = session?.user.firstName || "Ładowanie...";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Obszar tablicy Excalidraw. */}
      <div className="absolute inset-0 h-full w-full">
        {username !== "Ładowanie..." ? (
          <ExcalidrawBoard boardId={boardId} username={username} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}

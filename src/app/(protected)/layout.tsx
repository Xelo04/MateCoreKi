// ==========================================
// LAYOUT: Layout dla aplikacji (chronione strony wymagające logowania)
// ==========================================

"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Sprawdza czy aktualna ścieżka to tablica
  const isBoardPage = pathname?.includes("/board");

  if (isBoardPage) {
    // Zerowy layout dla tablicy
    return <>{children}</>;
  }

  // Pełny layout z Sidebarem dla pozostałych stron chronionych
  return (
    <div className="flex h-screen w-full overflow-hidden bg-secondary/20">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl w-full p-8">{children}</div>
      </main>
    </div>
  );
}

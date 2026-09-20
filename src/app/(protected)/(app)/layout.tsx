// ==========================================
// LAYOUT: Layout dla aplikacji (chronione strony wymagające logowania - bez tablicy)
// ==========================================

import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-secondary/20">
      {/* Lewy Sidebar dla stron aplikacji */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Treść podstrony */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl w-full p-8">{children}</div>
      </main>
    </div>
  );
}

// ==========================================
// KOMPONENT: Powłoka chronionego panelu
// ==========================================
// Przekazuje sesję z serwera do hooka i udostępnia nawigację oraz wylogowanie.

"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { MobileNavigation, Sidebar } from "@/components/layout/Sidebar";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/hook";
import { ChangePassword } from "@/features/auth/views/ChangePassword";
import type { AuthSession } from "@/features/auth/types";
import { InitialSessionContext } from "@/store/use-session-store";

export function ProtectedShell({ children, initialSession }: { children: React.ReactNode; initialSession: AuthSession }) {
  return (
    <InitialSessionContext.Provider value={initialSession}>
      <ProtectedContent>{children}</ProtectedContent>
    </InitialSessionContext.Provider>
  );
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  // * Tablica ma własny układ i nie korzysta z paska bocznego panelu.
  if (pathname?.includes("/board")) return <>{children}</>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-secondary/20">
      {/* * Na większych ekranach nawigację zapewnia pasek boczny. */}
      <div className="hidden md:block">
        <Sidebar onChangePassword={() => setChangePasswordOpen(true)} />
      </div>
      <main className="relative h-full min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* * Na telefonie menu zapewnia dostęp do tych samych sekcji co sidebar. */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 text-xs sm:text-sm md:hidden">
          <MobileNavigation />
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setChangePasswordOpen(true)}>Zmień hasło</button>
            <button type="button" onClick={() => void logout()}>Wyloguj się</button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl w-full p-4 sm:p-8">{children}</div>
      </main>
      {/* * Formularz zmiany hasła nie opuszcza bieżącego widoku panelu. */}
      <ModalShell
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        icon={<KeyRound className="h-6 w-6 text-white" />}
        title="Zmień hasło"
        hideFooter
        hasDescription
      >
        <DialogDescription className="sr-only">Podaj obecne hasło oraz nowe hasło i jego potwierdzenie.</DialogDescription>
        {changePasswordOpen && <ChangePassword onSuccess={() => setChangePasswordOpen(false)} />}
      </ModalShell>
    </div>
  );
}

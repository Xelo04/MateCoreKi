// ==========================================
// STRONA: Zmiana hasła
// ==========================================
// Osobny ekran jest potrzebny, gdy dostęp do panelu blokuje wymagana zmiana hasła.

import { ChangePassword } from "@/features/auth/views/ChangePassword";

// * Grupa (public) nie nadaje uprawnień: /change-password jest chronione w proxy.
export const metadata = { title: "Zmiana hasła" };

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/20 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">Zmień hasło</h1>
        <ChangePassword />
      </section>
    </main>
  );
}

// ==========================================
// WIDOK: Główny panel sterowania (Dashboard)
// ==========================================
// Ekran widoczny po pomyślnym zalogowaniu.

"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";

export function Dashboard() {
  const { session, logout } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-border p-8 bg-card shadow-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LayoutDashboard className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Panel Korepetytora
          </h1>
          <p className="text-sm text-muted-foreground">
            Witaj w systemie,{" "}
            <span className="font-semibold text-foreground">
              {session?.user.firstName}
            </span>
            !
          </p>
        </div>

        <div className="pt-4 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Zalogowany jako: {session?.user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Wyloguj się
          </Button>
        </div>
      </div>
    </main>
  );
}

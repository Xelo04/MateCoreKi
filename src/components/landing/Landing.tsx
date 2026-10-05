// Publiczny ekran powitalny z nawigacją do logowania i rejestracji.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
          Platforma dla Korepetytorów
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          MatCoreKi
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Nowoczesne narzędzie do prowadzenia interaktywnych zajęć z matematyki,
          zarządzania uczniami i pracy na żywo.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Zarejestruj się</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

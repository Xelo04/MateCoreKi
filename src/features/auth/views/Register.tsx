// ==========================================
// WIDOK: Rejestracja użytkownika
// ==========================================
// Formularz rejestracji z walidacją Zod; Google OAuth nie jest jeszcze dostępny.

"use client";

import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hook";
import { registerSchema, RegisterFormData } from "../schema";
import { ShowcaseCards } from "../components/ShowcaseCards";
import packageJson from "../../../../package.json";
import { ApiError } from "@/lib/api/api-errors";

export function Register() {
  const { register: registerUser, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormData) {
    try {
      await registerUser(values);
    } catch (err) {
      // * Hook wyświetla błąd; logujemy tylko status, bez danych rejestracji.
      console.error("Nie udało się utworzyć konta:", err instanceof ApiError ? err.status : "błąd żądania");
    }
  }

  // * Tymczasowa funkcja rejestracji przez Google (do podpięcia w kolejnych krokach)
  function handleGoogleRegister() {
    // TODO: Integracja z backendem / OAuth Google
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      {/* * Formularz i nawigacja do pozostałych stron autoryzacji. */}
      <main className="flex items-center justify-center bg-background px-6 py-12 order-1 lg:order-0">
        <div className="w-full max-w-sm space-y-8">
          <header className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Zarejestruj się
            </h2>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* * Dane profilu korepetytora. */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  placeholder="Jan"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "first-name-error" : undefined}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p id="first-name-error" className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  placeholder="Kowalski"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "last-name-error" : undefined}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p id="last-name-error" className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* * Adres będzie służyć do logowania. */}
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@kowalski.pl"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* * Nowe hasło podlega walidacji schematu rejestracji. */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* * Ponowne wysłanie jest blokowane podczas rejestracji. */}
            <Button
              type="submit"
              className="w-full shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
            </Button>
          </form>

          {/* * Rozdzielenie rejestracji hasłem od planowanego OAuth. */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs uppercase text-muted-foreground">
              lub
            </span>
          </div>

          {/* * Google OAuth pozostaje wyłączony do czasu integracji. */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleRegister}
            disabled
          >
            <Image
              src="/google-icon.svg"
              alt=""
              width={16}
              height={16}
              className="h-4 w-4"
            />
            Kontynuuj z Google
          </Button>

          {/* * Nawigacja do logowania i strony głównej. */}
          <div className="space-y-2 pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              Masz już konto?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Zaloguj się
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Wróć do strony głównej
            </Link>
          </div>
        </div>
      </main>

      {/* * Grafika brandowa i przykładowe karty są widoczne na dużych ekranach. */}
      {/* * TODO: [UX] Dostosować przykładowe karty do faktycznych funkcjonalności. */}
      <aside className="relative hidden overflow-hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white bg-slate-950 order-2 lg:order-0">
        <div
          className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(46,91,255,0.35),transparent_60%)]"
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between">
          <Image
            src="/logo_white.png"
            alt="Logo"
            width={200}
            height={87}
            priority
            className="w-50 h-auto object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center my-8">
          <ShowcaseCards />
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} JukuSpace</span>
          <span>Wersja {packageJson.version}</span>
        </div>
      </aside>
    </div>
  );
}

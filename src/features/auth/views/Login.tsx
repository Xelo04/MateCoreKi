// ==========================================
// WIDOK: Logowanie użytkownika
// ==========================================
// Formularz logowania z walidacją Zod; Google OAuth nie jest jeszcze dostępny.

"use client";

import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hook";
import { loginSchema, LoginFormData } from "../schema";
import { ApiError } from "@/lib/api/api-errors";

export function Login() {
  const { login, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormData) {
    try {
      await login(values);
    } catch (err) {
      // * Hook wyświetla błąd; logujemy tylko status, bez danych logowania.
      console.error("Nie udało się zalogować:", err instanceof ApiError ? err.status : "błąd żądania");
    }
  }

  // * Tymczasowa funkcja obsługi logowania Google (do podpięcia w kolejnych krokach)
  function handleGoogleLogin() {
    // TODO: Integracja z backendem / OAuth Google
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Witaj ponownie</h2>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* * Adres używany przez backend jako nazwa użytkownika. */}
        <div className="space-y-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="jan@kowalski.pl"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* * Hasło może być uzupełnione przez menedżer haseł. */}
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pl-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* * Widok resetowania informuje, że funkcja nie jest jeszcze dostępna. */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Nie pamiętasz hasła?
          </Link>
        </div>

        {/* * Ponowne wysłanie jest blokowane podczas logowania. */}
        <Button
          type="submit"
          className="w-full shadow-lg shadow-primary/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Logowanie..."
          ) : (
            <>
              Zaloguj się
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* * Rozdzielenie logowania hasłem od planowanego OAuth. */}
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
        onClick={handleGoogleLogin}
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

      {/* * Nawigacja do rejestracji i strony głównej. */}
      <div className="space-y-2 pt-2 text-center">
        <p className="text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Zarejestruj się
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
  );
}

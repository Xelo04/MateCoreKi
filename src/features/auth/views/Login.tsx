// ==========================================
// WIDOK: Logowanie użytkownika
// ==========================================
// Formularz logowania z obsługą walidacji Zod, autouzupełnianiem i OAuth Google.

"use client";

import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hook";
import { loginSchema, LoginFormData } from "../schema";

export function Login() {
  const { login, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  async function onSubmit(values: LoginFormData) {
    try {
      await login(values);
    } catch {}
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
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="jan@kowalski.pl"
              autoComplete="email"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Hasło */}
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Checkbox i link do resetu */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field }) => (
                <Checkbox
                  id="rememberMe"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <Label
              htmlFor="rememberMe"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Zapamiętaj mnie
            </Label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Nie pamiętasz hasła?
          </Link>
        </div>

        {/* Przycisk logowania tradycyjnego */}
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

      {/* Separator */}
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs uppercase text-muted-foreground">
          lub
        </span>
      </div>

      {/* Przycisk rejestracji przez Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
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

      {/* Linki dolne */}
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

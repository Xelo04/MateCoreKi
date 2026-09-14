// ==========================================
// WIDOK: Resetowanie zapomnianego hasła
// ==========================================

"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "../service";
import { forgotSchema, ForgotFormData } from "../schema";
import { toast } from "sonner";

export function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotFormData) {
    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(values.email);
      setIsSent(true);
      toast.success("Link wysłany", {
        description: `Sprawdź skrzynkę: ${values.email}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nie udało się wysłać linku.";
      toast.error("Błąd", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Sprawdź skrzynkę e-mail
        </h2>
        <p className="text-sm text-muted-foreground">
          Wysłaliśmy instrukcje resetowania hasła.
        </p>
        <Button asChild className="w-full h-11">
          <Link href="/login">Wróć do logowania</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Zresetuj hasło</h2>
        <p className="text-sm text-muted-foreground">
          Podaj adres e-mail powiązany z kontem
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="jan@kowalski.pl"
              className="h-11 pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Wróć do logowania
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// WIDOK: Zmiana hasła
// ==========================================
// Formularz służy również do wymaganej zmiany hasła po zalogowaniu.

"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "../service";
import { useSessionStore } from "@/store/use-session-store";
import { useAuth } from "../hook";
import { changePasswordSchema, type ChangePasswordFormData } from "../schema";
import { ApiError } from "@/lib/api/api-errors";

export function ChangePassword({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", newPasswordConfirm: "" },
  });

  async function submit(values: ChangePasswordFormData) {
    let passwordChanged = false;
    try {
      await authService.changePassword(values.currentPassword, values.newPassword, values.newPasswordConfirm);
      passwordChanged = true;
      let session;
      try {
        session = await authService.getSession();
      } catch (err) {
        // ! Nie logujemy danych odpowiedzi, które mogą zawierać dane użytkownika.
        console.error("Nie udało się odświeżyć sesji po zmianie hasła:", err instanceof ApiError ? err.status : "błąd połączenia");
        if (err instanceof ApiError && err.status === 401) {
          useSessionStore.getState().clearSession();
          toast.error("Hasło zostało zmienione. Zaloguj się ponownie.");
          router.replace("/login");
          router.refresh();
        } else {
          toast.error("Hasło zostało zmienione, ale nie udało się odświeżyć sesji. Odśwież stronę i spróbuj ponownie.");
        }
        return;
      }
      useSessionStore.getState().setSession(session);
      if (session.user.mustChangePassword) {
        toast.error("Hasło zostało zmienione, ale serwer nadal wymaga jego zmiany.");
        return;
      }
      toast.success("Hasło zostało zmienione.");
      if (onSuccess) onSuccess();
      else router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Nie udało się zmienić hasła:", err instanceof ApiError ? err.status : "błąd żądania");
      toast.error(err instanceof Error ? err.message : "Nie udało się zmienić hasła.");
    } finally {
      if (passwordChanged) reset();
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <p className="text-sm text-muted-foreground">Podaj obecne hasło oraz nowe hasło, które ma co najmniej 8 znaków.</p>
      {/* * Błędy walidacji są powiązane z odpowiednimi polami formularza. */}
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {/* * Obecne hasło potwierdza, że operację wykonuje właściciel konta. */}
        <div className="space-y-2">
          <Label htmlFor="current-password">Obecne hasło</Label>
          <Input id="current-password" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} aria-describedby={errors.currentPassword ? "current-password-error" : undefined} {...register("currentPassword")} />
          {errors.currentPassword && <p id="current-password-error" className="text-xs text-destructive">{errors.currentPassword.message}</p>}
        </div>
        {/* * Nowe hasło musi spełniać wymagania schematu. */}
        <div className="space-y-2">
          <Label htmlFor="new-password">Nowe hasło</Label>
          <Input id="new-password" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} aria-describedby={errors.newPassword ? "new-password-error" : undefined} {...register("newPassword")} />
          {errors.newPassword && <p id="new-password-error" className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        {/* * Potwierdzenie chroni przed przypadkową literówką. */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" aria-invalid={!!errors.newPasswordConfirm} aria-describedby={errors.newPasswordConfirm ? "confirm-password-error" : undefined} {...register("newPasswordConfirm")} />
          {errors.newPasswordConfirm && <p id="confirm-password-error" className="text-xs text-destructive">{errors.newPasswordConfirm.message}</p>}
        </div>
        {/* * Przy wymaganej zmianie hasła obok zapisu pozostaje dostępne wylogowanie. */}
        <div className={onSuccess ? undefined : "flex flex-wrap gap-3 pt-4"}>
          {!onSuccess && (
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => void logout()}>
              Wyloguj się
            </Button>
          )}
          <Button type="submit" className={onSuccess ? undefined : "h-11 flex-1"} disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
          </Button>
        </div>
      </form>
    </div>
  );
}

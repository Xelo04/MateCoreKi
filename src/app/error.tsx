// ==========================================
// STRONA: Globalny błąd aplikacji (Error Boundary)
// ==========================================

"use client";

import Image from "next/image";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl text-center space-y-8">
        <div className="relative mx-auto h-48 w-48">
          <Image
            src="/error.svg"
            alt="Błąd serwera"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Wystąpił błąd aplikacji
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Przepraszamy za utrudnienia. Coś poszło nie tak po naszej stronie.
            Spróbuj odświeżyć stronę lub wrócić na stronę główną.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto pt-2">
          <Button onClick={reset} className="h-11 flex-1 font-medium gap-2">
            <RefreshCw className="h-4 w-4" /> Spróbuj ponownie
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 flex-1 font-medium gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" /> Strona główna
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

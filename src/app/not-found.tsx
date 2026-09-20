// ==========================================
// STRONA: 404 - Nie znaleziono strony
// ==========================================

import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl text-center space-y-8">
        <div className="relative mx-auto h-48 w-48">
          <Image
            src="/not-found.svg"
            alt="Strona nie znaleziona"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Strona nie została znaleziona
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Przepraszamy, ale strona, której szukasz, nie istnieje, została
            przeniesiona lub jest tymczasowo niedostępna.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" /> Wróć na stronę główną
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// LAYOUT: Uniwersalny układ dla autoryzacji
// ==========================================

import Image from "next/image";
import type { ReactNode } from "react";
import packageJson from "../../../package.json";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Lewa strona - brand */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/auth/login-hero.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 0vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-br from-slate-950/85 via-slate-900/70 to-slate-900/40"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(46,91,255,0.35),transparent_55%)]"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <span className="text-lg font-semibold tracking-tight">
            MatCoreKi
          </span>

          <div className="max-w-lg space-y-6">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              Nowoczesne{" "}
              <span className="bg-linear-to-r from-white to-primary bg-clip-text text-transparent">
                korepetycje matematyki
              </span>{" "}
              w jednym miejscu
            </h1>
            <p className="text-base leading-relaxed text-slate-300 xl:text-lg">
              Zarządzaj uczniami, materiałami i zadaniami w profesjonalnym
              systemie dla korepetytorów.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>© {new Date().getFullYear()} MatCoreKi</span>
            <span>Wersja {packageJson.version}</span>
          </div>
        </div>
      </aside>

      {/* Prawa strona - formularz */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

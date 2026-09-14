// ==========================================
// KOMPONENT: Ekran ładowania
// ==========================================

import { Pi, Sigma, Infinity as InfinityIcon, Radical } from "lucide-react";

export function Loader() {
  return (
    <div
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background text-foreground select-none"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie"
    >
      {/* Subtelne tło siatki geometrycznej w jasnym odcieniu */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e740_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e740_1px,transparent_1px)] bg-size-[3rem_3rem]" />

      {/* Delikatny świetlny akcent w tle */}
      <div className="absolute h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Centralny element: Stabilny układ z pulsującym pierścieniem */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* Zewnętrzny, rotujący pierścień */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin animation-duration-[15s]" />

          {/* Centralna ikona główna (Sigma) */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <Sigma className="h-7 w-7" />
          </div>

          {/* Stabilnie osadzone symbole matematyczne wokół */}
          <div className="absolute -top-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-primary shadow-sm">
              <Pi className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="absolute -bottom-1 right-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-primary shadow-sm">
              <Radical className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="absolute -left-1 bottom-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-primary shadow-sm">
              <InfinityIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Sekcja tekstowa i pasek postępu */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              MatCoreKi
            </h2>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Ładowanie...
            </p>
          </div>

          {/* Pasek postępu z płynnym efektem shimmer */}
          <div className="relative h-1 w-40 overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

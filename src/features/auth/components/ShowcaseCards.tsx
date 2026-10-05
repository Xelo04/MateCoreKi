// ==========================================
// KOMPONENT: Showcase kart dla rejestracji
// ==========================================
// Prezentuje interaktywne elementy platformy (lekcje, postępy, zadania) w widoku rejestracji.

import { Calendar, Clock, TrendingUp } from "lucide-react";

export function ShowcaseCards() {
  return (
    <div className="relative h-105 w-full max-w-lg">
      {/* Karta najbliższych zajęć. */}
      <div className="absolute left-0 top-0 w-64 -rotate-2">
        <ShowcaseCard>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-900">
              Najbliższe zajęcia
            </span>
          </div>
          <div className="space-y-2.5">
            <StudentRow
              name="Marek N."
              subject="Funkcje kwadratowe"
              time="14:00"
            />
            <StudentRow
              name="Zuzanna W."
              subject="Geometria analityczna"
              time="15:30"
            />
          </div>
        </ShowcaseCard>
      </div>

      {/* Karta postępu ucznia. */}
      <div className="absolute right-0 top-14 w-56 rotate-3">
        <ShowcaseCard>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-900">
              Postęp: Katarzyna B.
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600">Cel: Trygonometria</span>
              <span className="font-semibold text-emerald-600">75%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-3/4 rounded-full bg-emerald-500" />
            </div>
          </div>
        </ShowcaseCard>
      </div>
    </div>
  );
}

function ShowcaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
      {children}
    </div>
  );
}

function StudentRow({
  name,
  subject,
  time,
}: {
  name: string;
  subject: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-900">{name}</p>
        <p className="truncate text-[11px] text-slate-500">{subject}</p>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
        <Clock className="h-3 w-3 text-slate-400" />
        {time}
      </div>
    </div>
  );
}

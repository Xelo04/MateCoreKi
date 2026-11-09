// ==========================================
// KOMPONENT: Pasek boczny nawigacji
// ==========================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  LibraryBig,
  Folder,
  PenTool,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

// Definicja struktury menu
const NAV_ITEMS = [
  {
    title: "Panel główny",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Moi Uczniowie",
    href: "/students",
    icon: Users,
  },
  {
    title: "Baza zadań",
    href: "/exercise-database",
    icon: LibraryBig,
  },
  {
    title: "Zestawy zadań",
    href: "/exercise-sets",
    icon: Folder,
  },
  {
    title: "Kalendarz zajęć",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Szybka Tablica",
    href: "/board/demo-123",
    icon: PenTool,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo marki */}
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-border px-2 py-1">
        <Image
          src="/logo.png"
          alt="Logo"
          width={240}
          height={80}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      {/* Menu główne. */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Profil i ustawienia. */}
      <div className="border-t border-border p-4 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-secondary hover:text-foreground",
          )}
        >
          <Settings className="h-5 w-5 shrink-0 text-muted-foreground" />
          Ustawienia
        </Link>

        {/* Tymczasowe dane profilu nauczyciela. */}
        <div className="mt-4 flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Anna Kowalska
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Korepetytor
            </p>
          </div>
          <button
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Wyloguj się"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

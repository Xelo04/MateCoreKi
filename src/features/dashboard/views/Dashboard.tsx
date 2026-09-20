// ==========================================
// WIDOK: Główny panel sterowania (Dashboard)
// ==========================================
// Ekran widoczny po pomyślnym zalogowaniu.

"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  GraduationCap,
  Palette,
  Type,
  Component,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pomocniczy komponent do wyświetlania kafelków z kolorami
function ColorSwatch({
  bgClass,
  textClass,
  label,
  border = false,
}: {
  bgClass: string;
  textClass: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "h-20 w-full rounded-xl shadow-sm flex items-center justify-center font-medium text-sm",
          bgClass,
          textClass,
          border && "border border-border",
        )}
      >
        Abc
      </div>
      <span className="text-xs font-medium text-muted-foreground text-center">
        {label}
      </span>
    </div>
  );
}

export function Dashboard() {
  const { session, logout } = useAuth();

  return (
    // <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    //   <div className="w-full max-w-xl space-y-8 rounded-2xl border border-border p-8 bg-card shadow-sm text-center">
    //     <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
    //       <LayoutDashboard className="h-6 w-6" />
    //     </div>

    //     <div className="space-y-2">
    //       <h1 className="text-3xl font-bold tracking-tight">
    //         Panel Korepetytora
    //       </h1>
    //       <p className="text-sm text-muted-foreground">
    //         Witaj w systemie,{" "}
    //         <span className="font-semibold text-foreground">
    //           {session?.user.firstName}
    //         </span>
    //         !
    //       </p>
    //     </div>

    //     <div className="pt-4 border-t border-border flex justify-between items-center">
    //       <span className="text-xs text-muted-foreground">
    //         Zalogowany jako: {session?.user.email}
    //       </span>
    //       <Button
    //         variant="outline"
    //         size="sm"
    //         onClick={logout}
    //         className="gap-2"
    //       >
    //         <LogOut className="h-4 w-4" /> Wyloguj się
    //       </Button>
    //     </div>
    //   </div>
    // </main>
    <div className="flex flex-col space-y-12 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Identyfikacja Wizualna & UI
        </h1>
      </div>

      {/* ==========================================
          SEKCJA 1: KOLORY (BRAND PALETTE)
          ========================================== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Kolory (Brand Palette)</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          <ColorSwatch
            bgClass="bg-primary"
            textClass="text-primary-foreground"
            label="Primary (Główny)"
          />
          <ColorSwatch
            bgClass="bg-secondary"
            textClass="text-secondary-foreground"
            label="Secondary (Tła UI)"
            border
          />
          <ColorSwatch
            bgClass="bg-accent"
            textClass="text-accent-foreground"
            label="Accent (Hover)"
            border
          />
          <ColorSwatch
            bgClass="bg-background"
            textClass="text-foreground"
            label="Background (Tło)"
            border
          />
          <ColorSwatch
            bgClass="bg-card"
            textClass="text-card-foreground"
            label="Card (Karty)"
            border
          />
          <ColorSwatch
            bgClass="bg-destructive"
            textClass="text-destructive-foreground"
            label="Destructive (Błędy)"
          />
        </div>
      </section>

      {/* ==========================================
          SEKCJA 2: TYPOGRAFIA
          ========================================== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Type className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Typografia (Geist)</h2>
        </div>
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
              Heading 1
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Witaj w MatCoreKi
            </h1>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
              Heading 2
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Kalkulator funkcji
            </h2>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
              Heading 3
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Szczegóły ucznia
            </h3>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row gap-4 md:items-start">
            <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground pt-1">
              Paragraph
            </div>
            <p className="text-base leading-relaxed text-foreground max-w-2xl">
              To jest standardowy tekst akapitu. Aplikacja wspomagająca pracę
              korepetytorów matematyki (System Supporting the Work of
              Mathematics Tutors). Oferuje moduł zadań z generatorem LLM oraz
              interaktywną tablicę.
            </p>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row gap-4 md:items-start">
            <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
              Muted / Small
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Tekst pomocniczy, używany w opisach formularzy, datach i
              podpisach.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          SEKCJA 3: KOMPONENTY (BUTTONS & BADGES)
          ========================================== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Component className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            Przyciski i Statusy (Buttons & Badges)
          </h2>
        </div>
        {/* ZMIANA: grid-cols-1 na start (mobile), od sm:grid-cols-2, md:grid-cols-4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 bg-card p-8 border border-border rounded-2xl shadow-sm">
          <div className="flex flex-col space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Primary
            </Label>
            <Button className="w-full sm:w-auto">Zapisz zmiany</Button>
          </div>
          <div className="flex flex-col space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Outline
            </Label>
            <Button variant="outline" className="w-full sm:w-auto">
              Więcej opcji
            </Button>
          </div>
          <div className="flex flex-col space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Destructive
            </Label>
            <Button variant="destructive" className="w-full sm:w-auto">
              Usuń ucznia
            </Button>
          </div>
          <div className="flex flex-col space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              With Icon
            </Label>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nowe zajęcia
            </Button>
          </div>
          <div className="flex flex-col space-y-4 pt-4 col-span-full">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Statusy (Badges)
            </Label>
            {/* ZMIANA: Dodano flex-wrap, żeby spływały do nowej linii */}
            <div className="flex flex-wrap gap-3">
              <Badge>Aktywny</Badge>
              <Badge variant="secondary">Zawieszony</Badge>
              <Badge variant="outline">Wersja Robocza</Badge>
              <Badge variant="destructive">Zalega z płatnością</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SEKCJA 4: FORMULARZE
          ========================================== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          Formularze (Input, Select, Textarea)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-card p-8 border border-border rounded-2xl shadow-sm">
          <div className="space-y-3">
            <Label htmlFor="email">E-mail ucznia</Label>
            <Input id="email" type="email" placeholder="jan@kowalski.pl" />
          </div>

          <div className="space-y-3">
            <Label>Dział tematyczny (Select)</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz dział..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planimetria">Planimetria</SelectItem>
                <SelectItem value="funkcje">Funkcje kwadratowe</SelectItem>
                <SelectItem value="prawdopodobienstwo">
                  Prawdopodobieństwo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 col-span-full">
            <Label>Treść zadania (Textarea)</Label>
            <Textarea
              placeholder="Wpisz treść zadania matematycznego. Możesz używać symboli..."
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* ==========================================
          SEKCJA 5: UKŁADY (KARTY, MODALE)
          ========================================== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          Układy Złożone (Karty, Zakładki, Modale)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* KARTA UCZNIA Z DROPDOWNEM */}
          <Card className="rounded-2xl shadow-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl">Jan Kowalski</CardTitle>
                <CardDescription>
                  Klasa maturalna, poziom rozszerzony
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" /> Edytuj
                  </DropdownMenuItem>
                  {/* WARIANT DESTRUCTIVE W DROPDOWN (Zgodnie z wczorajszym fixem CSS) */}
                  <DropdownMenuItem variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Usuń
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="mb-6 w-full max-w-[calc(100vw-4rem)] md:max-w-none">
                  <TabsTrigger value="info">Informacje</TabsTrigger>
                  <TabsTrigger value="stats">Statystyki</TabsTrigger>
                  <TabsTrigger value="tests">Testy & Prace</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="info"
                  className="text-sm text-muted-foreground space-y-3"
                >
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Najbliższe zajęcia:</span>
                    <span className="font-medium text-foreground">
                      Piątek, 16:30
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span>Główny cel:</span>
                    <span className="font-medium text-foreground">
                      Matura Rozszerzona (80%+)
                    </span>
                  </div>
                </TabsContent>
                <TabsContent
                  value="stats"
                  className="text-sm text-muted-foreground flex h-16 items-center justify-center border border-dashed rounded-lg"
                >
                  Wykresy pojawią się tutaj.
                </TabsContent>
                <TabsContent
                  value="tests"
                  className="text-sm text-muted-foreground flex h-16 items-center justify-center border border-dashed rounded-lg"
                >
                  Wyniki testów pojawią się tutaj.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* KARTA Z MODALEM I CHECKBOXEM */}
          <Card className="rounded-2xl shadow-md border-border/50 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" /> Modale i
                Checkboxy
              </CardTitle>
              <CardDescription>
                Wyskakujące okienka do ważnych interakcji i akceptacji.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <Checkbox id="req" />
                <Label
                  htmlFor="req"
                  className="font-medium cursor-pointer text-sm"
                >
                  Wyślij automatyczne powiadomienie SMS uczniowi przed lekcją
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    Otwórz przykład Modalu (Dialog)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dodaj nowego ucznia</DialogTitle>
                    <DialogDescription>
                      Wprowadź podstawowe dane. Otrzyma on automatyczny e-mail z
                      linkiem do swojego panelu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Imię i nazwisko</Label>
                      <Input placeholder="np. Anna Nowak" />
                    </div>
                  </div>
                  <DialogFooter>
                    {/* W modalu używamy przycisków w układzie obok siebie (wspierane przez DialogFooter) */}
                    <Button variant="outline">Anuluj</Button>
                    <Button>Dodaj ucznia</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}

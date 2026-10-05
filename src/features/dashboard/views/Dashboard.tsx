// ==========================================
// WIDOK: Główny panel sterowania (Dashboard) / Design System
// ==========================================

"use client";

import { useAuth } from "@/features/auth/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Plus,
  GraduationCap,
  Palette,
  Type,
  Component,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { session } = useAuth();

  return (
    <div className="flex flex-col space-y-12 pb-16">
      {/* Nagłówek. */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Identyfikacja Wizualna & UI
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Witaj,{" "}
            <span className="font-semibold text-foreground">
              {session?.user.firstName || "Korepetytorze"}
            </span>
            . Oto zbiór ustandaryzowanych komponentów (Design System) platformy
            MatCoreKi.
          </p>
        </div>
      </div>

      {/* 1: KOLORY (BRAND PALETTE) */}
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

      {/* 2: TYPOGRAFIA */}
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
              korepetytorów matematyki. Oferuje moduł zadań z generatorem LLM
              oraz interaktywną tablicę.
            </p>
          </div>
        </div>
      </section>

      {/* 3: PRZYCISKI I STATUSY */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Component className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            Przyciski i Statusy (Buttons & Badges)
          </h2>
        </div>
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
            <div className="flex flex-wrap gap-3">
              <Badge>Aktywny</Badge>
              <Badge variant="secondary">Zawieszony</Badge>
              <Badge variant="outline">Wersja Robocza</Badge>
              <Badge variant="destructive">Zalega z płatnością</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 4: FORMULARZE */}
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

      {/* 5: UKŁADY (AKORDEON, MODAL, TABS) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Układy Złożone</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* PRZYKŁAD MODALA I TABSÓW W KARCIE */}
          <Card className="rounded-2xl shadow-sm border-border/50 flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">
                  Modale (Dialogi) i Zakładki
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Wyskakujące okienka do ważnych interakcji i akceptacji.
              </p>

              <Tabs defaultValue="info" className="w-full mb-6">
                <TabsList className="mb-6 w-full max-w-[calc(100vw-4rem)] md:max-w-none">
                  <TabsTrigger value="info">Informacje</TabsTrigger>
                  <TabsTrigger value="stats">Statystyki</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="info"
                  className="text-sm text-muted-foreground space-y-3"
                >
                  Wnętrze zakładki informacji.
                </TabsContent>
                <TabsContent
                  value="stats"
                  className="text-sm text-muted-foreground"
                >
                  Wnętrze zakładki statystyk.
                </TabsContent>
              </Tabs>

              <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <Checkbox id="req" />
                <Label
                  htmlFor="req"
                  className="font-medium cursor-pointer text-sm"
                >
                  Wyślij automatyczne powiadomienie SMS
                </Label>
              </div>
            </div>

            <div className="p-6 pt-0">
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
                      Wprowadź podstawowe dane ucznia.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Imię i nazwisko</Label>
                      <Input placeholder="np. Anna Nowak" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Anuluj</Button>
                    <Button>Dodaj ucznia</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Akordeon z przykładem użycia archiwum. */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Akordeon (np. dla sekcji archiwum)
            </h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="archive" className="border-none">
                <AccordionTrigger className="hover:no-underline py-4 px-6 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50">
                  <span className="font-semibold text-muted-foreground">
                    Rozwiń ukryte elementy (3)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-6 pb-2 px-2 text-muted-foreground text-sm">
                  Tutaj pojawią się rzadziej używane informacje, np.
                  zarchiwizowane karty, długa historia zmian czy polityka
                  prywatności.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}

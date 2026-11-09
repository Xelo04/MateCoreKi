// ==========================================
// KOMPONENT: Zwijany węzeł drzewa kategorii (checkbox)
// ==========================================
// * Używany w formularzu zadania do wielokrotnego wyboru działów.
// * Wybór pojedynczy (filtr) realizuje wspólny TreeSelect z components/ui.

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CategoryTreeLike } from "../utils";

// ----- TYPY -----

interface CollapsibleCategoryNodeProps {
  readonly node: CategoryTreeLike;
  readonly depth?: number;
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string, checked: boolean) => void;
}

// ----- KOMPONENT -----

export function CollapsibleCategoryNode({
  node,
  depth = 0,
  selectedIds,
  onToggle,
}: CollapsibleCategoryNodeProps) {
  // * Lokalny stan otwarcia gałęzi (każdy węzeł pamięta własny)
  const [isOpen, setIsOpen] = useState(false);

  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const checkboxId = `cat-${node.id}`;

  return (
    <div className="flex w-full flex-col">
      {/* * Główny wiersz węzła (wcięcie proporcjonalne do głębokości) */}
      <div
        className="flex items-center gap-1.5 rounded-lg py-1.5 transition-colors hover:bg-muted/40"
        style={{ paddingLeft: `${depth}rem` }}
      >
        {/* * Przycisk rozwijania lub pusty odstęp wyrównujący liście */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            className="shrink-0 p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={isOpen ? "Zwiń" : "Rozwiń"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" aria-hidden="true" />
        )}

        {/* * Checkbox wyboru kategorii z powiązaną etykietą */}
        <Checkbox
          id={checkboxId}
          checked={selectedIds.includes(node.id)}
          onCheckedChange={(checked) => onToggle(node.id, checked === true)}
        />
        <Label
          htmlFor={checkboxId}
          className={cn(
            "cursor-pointer select-none text-sm leading-tight text-foreground",
            depth === 0 ? "font-semibold" : "font-medium",
          )}
        >
          {node.name}
        </Label>
      </div>

      {/* * Dzieci renderowane rekurencyjnie tylko przy otwartej gałęzi */}
      {hasChildren && isOpen && (
        <div className="flex w-full flex-col">
          {children.map((child) => (
            <CollapsibleCategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

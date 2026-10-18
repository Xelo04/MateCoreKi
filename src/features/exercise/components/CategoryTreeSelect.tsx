// ==========================================
// KOMPONENT: Drzewo Kategorii (Tree Select)
// ==========================================

"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CategoryTreeItem {
  id: string;
  name: string;
  children?: CategoryTreeItem[];
}

interface CategoryTreeSelectProps {
  tree: CategoryTreeItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allOptionLabel?: string;
  className?: string;
}

// Pomocnicza funkcja do znajdowania nazwy aktualnie wybranej gałęzi
function findNodeName(nodes: CategoryTreeItem[], id: string): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.name;
    if (node.children?.length) {
      const found = findNodeName(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function CategoryTreeSelect({
  tree,
  value,
  onChange,
  placeholder = "Wybierz kategorię",
  allOptionLabel = "Wszystkie działy",
  className,
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const selectedName =
    value === "all" ? allOptionLabel : findNodeName(tree, value);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: CategoryTreeItem, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = value === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="w-full">
        <div
          className={cn(
            "flex items-center w-full rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
            isSelected && "bg-accent/50 font-medium",
          )}
          style={{ paddingLeft: `${depth * 1.2 + 0.5}rem` }}
          onClick={() => handleSelect(node.id)}
        >
          <div
            className="w-4 h-4 mr-1.5 flex items-center justify-center shrink-0"
            onClick={(e) =>
              hasChildren ? toggleExpand(e, node.id) : undefined
            }
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </div>
          <span className="truncate flex-1">{node.name}</span>
          {isSelected && (
            <Check className="ml-2 h-4 w-4 text-primary shrink-0" />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col w-full">
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Usunięto komponent <Button> i zastosowano czysty <button> z natywnymi 
            klasami <SelectTrigger> z Shadcn, aby perfekcyjnie ujednolicić wygląd */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 font-normal",
            !selectedName && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedName ?? placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-1.5 bg-popover rounded-xl shadow-md border-border"
        align="start"
      >
        <div className="max-h-87.5 overflow-y-auto overflow-x-hidden w-full flex flex-col">
          <div
            className={cn(
              "flex items-center w-full rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground mb-1",
              value === "all" && "bg-accent/50 font-medium",
            )}
            onClick={() => handleSelect("all")}
          >
            <div className="w-4 h-4 mr-1.5" />
            <span className="truncate flex-1">{allOptionLabel}</span>
            {value === "all" && (
              <Check className="ml-2 h-4 w-4 text-primary shrink-0" />
            )}
          </div>

          {tree.map((node) => renderNode(node, 0))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

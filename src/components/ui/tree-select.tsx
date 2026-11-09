"use client";

import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TreeSelectItem {
  readonly id: string;
  readonly name: string;
  readonly parentId?: string | null;
  readonly children?: readonly TreeSelectItem[];
}

interface TreeSelectProps {
  readonly items: readonly TreeSelectItem[];
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly id?: string;
  readonly placeholder?: string;
  readonly rootLabel?: string;
  readonly className?: string;
  readonly icon?: ReactNode;
  readonly showFullPath?: boolean;
}

interface OptionRowProps {
  readonly label: string;
  readonly depth: number;
  readonly isSelected: boolean;
  readonly isExpandable: boolean;
  readonly isExpanded: boolean;
  readonly onSelect: () => void;
  readonly onToggle: () => void;
}

function OptionRow({
  label,
  depth,
  isSelected,
  isExpandable,
  isExpanded,
  onSelect,
  onToggle,
}: OptionRowProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent/50 font-medium",
      )}
      style={{ paddingLeft: `${depth * 1.2 + 0.5}rem` }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {isExpandable ? (
        <button
          type="button"
          aria-label={isExpanded ? "Zwiń element" : "Rozwiń element"}
          aria-expanded={isExpanded}
          className="mr-1.5 flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {isSelected && (
        <Check className="ml-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      )}
    </div>
  );
}

export function TreeSelect({
  items,
  value,
  onChange,
  id,
  placeholder = "Wybierz element",
  rootLabel = "Wszystkie",
  className,
  icon,
  showFullPath = false,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const popoverContentId = useId();

  const flatItems = useMemo(() => {
    const result: TreeSelectItem[] = [];

    const visit = (item: TreeSelectItem, parentId: string | null) => {
      result.push({
        ...item,
        parentId: item.parentId ?? parentId,
        children: undefined,
      });
      item.children?.forEach((child) => visit(child, item.id));
    };

    items.forEach((item) => visit(item, null));
    return result;
  }, [items]);

  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, TreeSelectItem[]>();
    for (const item of flatItems) {
      const parentId = item.parentId ?? null;
      const children = result.get(parentId) ?? [];
      children.push(item);
      result.set(parentId, children);
    }
    return result;
  }, [flatItems]);

  const selectedPath = useMemo(() => {
    const path: TreeSelectItem[] = [];
    let item = flatItems.find((candidate) => candidate.id === value);
    const visited = new Set<string>();
    while (item && !visited.has(item.id)) {
      visited.add(item.id);
      path.unshift(item);
      item = flatItems.find((candidate) => candidate.id === item?.parentId);
    }
    return path;
  }, [flatItems, value]);

  const selectedName =
    selectedPath.length === 0
      ? rootLabel
      : showFullPath
        ? selectedPath.map((item) => item.name).join("/")
        : selectedPath[selectedPath.length - 1].name;

  const handleToggle = (id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderOptions = (parentId: string | null, depth = 0): ReactNode =>
    (childrenByParent.get(parentId) ?? []).map((item) => {
      const children = childrenByParent.get(item.id) ?? [];
      const isExpanded = expandedIds.has(item.id);
      return (
        <div key={item.id}>
          <OptionRow
            label={item.name}
            depth={depth}
            isSelected={value === item.id}
            isExpandable={children.length > 0}
            isExpanded={isExpanded}
            onSelect={() => {
              if (children.length > 0 && !isExpanded) {
                handleToggle(item.id);
                return;
              }
              onChange(item.id);
              setOpen(false);
            }}
            onToggle={() => handleToggle(item.id)}
          />
          {isExpanded && renderOptions(item.id, depth + 1)}
        </div>
      );
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-controls={popoverContentId}
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-xl border border-input bg-card px-3 py-2 text-sm font-normal shadow-sm ring-offset-background transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            "text-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center truncate">
            {icon}
            <span className="truncate">{selectedName ?? placeholder}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={popoverContentId}
        align="start"
        className="w-(--radix-popover-trigger-width) rounded-xl border-border bg-popover p-1.5 shadow-md"
      >
        <div
          role="listbox"
          aria-label={placeholder}
          className="flex max-h-80 w-full flex-col overflow-y-auto overflow-x-hidden"
        >
          <OptionRow
            label={rootLabel}
            depth={0}
            isSelected={value === null}
            isExpandable={false}
            isExpanded={false}
            onSelect={() => {
              onChange(null);
              setOpen(false);
            }}
            onToggle={() => undefined}
          />
          {renderOptions(null)}
        </div>
      </PopoverContent>
    </Popover>
  );
}

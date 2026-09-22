// ==========================================
// KOMPONENT: Lokalny spinner ładowania
// ==========================================

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentLoaderProps {
  className?: string;
  minHeight?: string;
}

export function ContentLoader({
  className,
  minHeight = "h-[300px]",
}: ContentLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        minHeight,
        className,
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-80" />
    </div>
  );
}

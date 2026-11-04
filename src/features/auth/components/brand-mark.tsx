import { ClapperboardIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type BrandMarkProps = {
  className?: string;
  /** `on-paper` for light surfaces; `on-bay` for the dark pitch panel. */
  tone?: "on-paper" | "on-bay";
};

export function BrandMark({ className, tone = "on-paper" }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-md",
          tone === "on-bay" ? "bg-sand text-bay" : "bg-bay text-sand",
        )}
      >
        <ClapperboardIcon className="size-4" aria-hidden />
      </span>
      <span
        className={cn(
          "font-heading text-base font-semibold tracking-tight",
          tone === "on-bay" ? "text-sand" : "text-foreground",
        )}
      >
        Demo Narrator
      </span>
    </span>
  );
}

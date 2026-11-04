import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

type ProgressProps = Omit<ComponentProps<"progress">, "className"> & {
  className?: string;
};

function Progress({ className, value, max = 100, ...props }: ProgressProps) {
  const indeterminate = value === undefined || value === null;
  return (
    <progress
      data-slot="progress"
      className={cn(
        "border-border bg-muted [&::-webkit-progress-value]:bg-copper [&::-moz-progress-bar]:bg-copper h-2 w-full overflow-hidden rounded-full border [&::-webkit-progress-bar]:bg-transparent",
        indeterminate && "animate-pulse",
        className,
      )}
      value={indeterminate ? undefined : value}
      max={max}
      {...props}
    />
  );
}

export { Progress };

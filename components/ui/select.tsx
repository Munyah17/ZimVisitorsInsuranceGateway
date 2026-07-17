import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-stone-300 bg-white px-4 pr-10 py-2 text-sm text-stone-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safari-500 focus-visible:border-safari-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };

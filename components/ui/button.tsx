import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-teal-400 text-slate-950 hover:bg-teal-300",
        variant === "ghost" && "text-slate-200 hover:bg-slate-800",
        variant === "outline" && "border border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-900",
        className,
      )}
      {...props}
    />
  );
}

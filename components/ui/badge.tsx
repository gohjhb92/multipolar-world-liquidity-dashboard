import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "slate",
  children,
}: {
  className?: string;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
  children: React.ReactNode;
}) {
  const tones = {
    green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    red: "border-red-400/30 bg-red-400/10 text-red-300",
    blue: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    slate: "border-slate-500/30 bg-slate-800/70 text-slate-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

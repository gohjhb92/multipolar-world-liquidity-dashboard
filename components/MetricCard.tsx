import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export default function MetricCard({
  label,
  value,
  detail,
  trend = "flat",
  accent = "teal",
}: {
  label: string;
  value: number;
  detail: string;
  trend?: "up" | "down" | "flat";
  accent?: "teal" | "amber" | "red" | "blue";
}) {
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const accents = {
    teal: "text-teal-300",
    amber: "text-amber-300",
    red: "text-red-300",
    blue: "text-sky-300",
  };

  return (
    <section className="terminal-panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className={cn("font-mono text-3xl font-semibold tabular-nums", accents[accent])}>{value}</span>
            <span className="pb-1 font-mono text-[10px] text-slate-500">/100</span>
          </div>
        </div>
        <div className={cn("rounded-md border border-current/20 bg-current/10 p-1.5", accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", accent === "red" ? "bg-red-400" : accent === "amber" ? "bg-amber-400" : accent === "blue" ? "bg-sky-400" : "bg-teal-400")} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        <span className="font-mono text-slate-300">{formatScore(value)}</span> · {detail}
      </p>
    </section>
  );
}

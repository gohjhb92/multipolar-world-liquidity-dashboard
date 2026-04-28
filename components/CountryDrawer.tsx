"use client";

import { X } from "lucide-react";
import { blocLabels, confidenceLabels, type CountryProfile } from "@/data/world-dashboard";
import { calculateBlocPressure, formatScore } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const rows: Array<{ key: keyof CountryProfile; label: string }> = [
  { key: "dollarFundingDependence", label: "Dollar funding dependence" },
  { key: "cnySettlementExposure", label: "CNY settlement exposure" },
  { key: "sanctionsExposure", label: "Sanctions exposure" },
  { key: "usSecurityDependence", label: "U.S. security dependence" },
  { key: "chinaTradeDependence", label: "China trade dependence" },
  { key: "energySettlementDollarShare", label: "Oil/LNG dollar share" },
  { key: "treasuryRecyclingScore", label: "Treasury recycling" },
  { key: "moralHazardRisk", label: "Moral hazard risk" },
  { key: "petroyuanMomentum", label: "Petroyuan momentum" },
];

export default function CountryDrawer({
  country,
  onClose,
}: {
  country: CountryProfile | null;
  onClose: () => void;
}) {
  if (!country) return null;

  const pressure = calculateBlocPressure(country);
  const tone = country.bloc === "US_DOLLAR" ? "green" : country.bloc === "CHINA_YUAN" ? "red" : country.bloc === "HEDGING" ? "amber" : "blue";

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-700 bg-slate-950/96 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={tone}>{blocLabels[country.bloc]}</Badge>
            <Badge>{confidenceLabels[country.confidence]}</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-50">{country.name}</h2>
          <p className="mt-1 font-mono text-xs uppercase text-slate-500">{country.iso3} · Swap line: {country.swapLineStatus}</p>
        </div>
        <Button variant="ghost" className="h-8 px-2" onClick={onClose} title="Close country drawer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-400">Bloc pressure score</span>
          <span className="font-mono text-lg text-teal-300">{pressure}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-teal-400" style={{ width: `${pressure}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{formatScore(pressure)} pressure from funding, security, trade, sanctions, and settlement variables.</p>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row) => {
          const value = country[row.key] as number;
          return (
            <div key={row.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-mono text-slate-200">{value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Notes</h3>
        <ul className="mt-2 space-y-2">
          {country.notes.map((note) => (
            <li key={note} className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-xs leading-relaxed text-slate-300">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

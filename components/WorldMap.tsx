"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { blocLabels, type Bloc, type CountryProfile } from "@/data/world-dashboard";
import { calculateBlocPressure, calculateCountryPulls } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const blocColors: Record<Bloc, string> = {
  US_DOLLAR: "#22c55e",
  CHINA_YUAN: "#ef4444",
  HEDGING: "#f59e0b",
  SANCTIONED_ALT_RAILS: "#38bdf8",
  UNKNOWN: "#334155",
};

export type MapMode = "bloc" | "dollarFunding" | "cnySettlement" | "energySettlement" | "sanctions";

const mapModes: Array<{ key: MapMode; label: string }> = [
  { key: "bloc", label: "Bloc" },
  { key: "dollarFunding", label: "Dollar" },
  { key: "cnySettlement", label: "CNY" },
  { key: "energySettlement", label: "Energy" },
  { key: "sanctions", label: "Sanctions" },
];

function scaleColor(value: number, low: string, mid: string, high: string) {
  if (value >= 67) return high;
  if (value >= 34) return mid;
  return low;
}

function colorForCountry(country: CountryProfile, mode: MapMode) {
  if (mode === "bloc") return blocColors[country.bloc];
  if (mode === "dollarFunding") return scaleColor(country.dollarFundingDependence, "#164e63", "#0d9488", "#22c55e");
  if (mode === "cnySettlement") return scaleColor(country.cnySettlementExposure, "#312e81", "#dc2626", "#f97316");
  if (mode === "energySettlement") return scaleColor(country.energySettlementDollarShare, "#1e3a8a", "#0284c7", "#38bdf8");
  return scaleColor(country.sanctionsExposure, "#422006", "#f59e0b", "#ef4444");
}

export default function WorldMap({
  countries,
  selected,
  onSelect,
  mode,
  onModeChange,
  className,
}: {
  countries: CountryProfile[];
  selected: CountryProfile | null;
  onSelect: (country: CountryProfile) => void;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  className?: string;
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [hovered, setHovered] = useState<{ country: CountryProfile; x: number; y: number } | null>(null);
  const byIso = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  const modeledIso = useMemo(() => countries.map((country) => country.iso3), [countries]);
  const isoProperty = "ISO3166-1-Alpha-3";
  const colorExpression = useMemo(() => {
    const pairs = countries.flatMap((country) => [country.iso3, colorForCountry(country, mode)]);
    return ["match", ["get", isoProperty], ...pairs, blocColors.UNKNOWN];
  }, [countries, mode]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNode.current,
      attributionControl: false,
      interactive: true,
      center: [20, 18],
      zoom: 1.08,
      minZoom: 0.9,
      maxZoom: 4,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#020617" },
          },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.on("load", () => {
      map.addSource("countries", {
        type: "geojson",
        data: "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
      });
      map.addLayer({
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": colorExpression as maplibregl.ExpressionSpecification,
          "fill-opacity": ["case", ["in", ["get", isoProperty], ["literal", modeledIso]], 0.86, 0.16],
        },
      });
      map.addLayer({
        id: "countries-line",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#020617",
          "line-width": 0.7,
        },
      });
    });

    map.on("click", "countries-fill", (event) => {
      const iso = event.features?.[0]?.properties?.[isoProperty];
      const country = typeof iso === "string" ? byIso.get(iso) : undefined;
      if (country) onSelect(country);
    });

    map.on("mousemove", "countries-fill", (event) => {
      const iso = event.features?.[0]?.properties?.[isoProperty];
      const country = typeof iso === "string" ? byIso.get(iso) : undefined;
      setHovered(country ? { country, x: event.point.x, y: event.point.y } : null);
      map.getCanvas().style.cursor = country ? "pointer" : "";
    });
    map.on("mouseleave", "countries-fill", () => {
      setHovered(null);
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [byIso, colorExpression, modeledIso, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer("countries-fill")) return;
    map.setPaintProperty("countries-fill", "fill-color", colorExpression);
    map.setPaintProperty("countries-fill", "fill-opacity", ["case", ["in", ["get", isoProperty], ["literal", modeledIso]], 0.86, 0.16]);
  }, [colorExpression, modeledIso]);

  const hoverPulls = hovered ? calculateCountryPulls(hovered.country) : null;

  return (
    <section className={cn("terminal-panel overflow-hidden rounded-lg", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Global Bloc Map</h2>
          <p className="mt-1 text-xs text-slate-500">Switch modes, hover for the pressure logic, click for the country file.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950/70">
            {mapModes.map((item) => (
              <button
                key={item.key}
                onClick={() => onModeChange(item.key)}
                className={cn(
                  "px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-slate-400 transition hover:text-slate-100",
                  mode === item.key && "bg-teal-400 text-slate-950 hover:text-slate-950",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {Object.entries(blocLabels).map(([bloc, label]) => (
            <span key={bloc} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: blocColors[bloc as Bloc] }} />
              {label.replace("Middle / ", "")}
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-[390px] bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(45,212,191,0.12),transparent_45%)]" />
        <div ref={mapNode} className="h-full w-full" />
        {selected ? (
          <div className="absolute right-4 top-4 rounded border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-300">
            Selected: <span className="font-mono text-teal-300">{selected.iso3}</span>
          </div>
        ) : null}
        {hovered && hoverPulls ? (
          <div
            className="pointer-events-none absolute z-10 w-64 rounded-md border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-2xl"
            style={{ left: Math.min(hovered.x + 14, 1740), top: Math.max(hovered.y - 18, 12) }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-100">{hovered.country.name}</p>
                <p className="font-mono text-[10px] uppercase text-slate-500">
                  {hovered.country.iso3} - {blocLabels[hovered.country.bloc]}
                </p>
              </div>
              <span className="font-mono text-teal-300">{calculateBlocPressure(hovered.country)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="text-slate-500">Dollar pull</span>
              <span className="text-right font-mono text-emerald-300">{hoverPulls.dollarPull}</span>
              <span className="text-slate-500">Yuan pull</span>
              <span className="text-right font-mono text-red-300">{hoverPulls.yuanPull}</span>
              <span className="text-slate-500">Top driver</span>
              <span className="text-right text-slate-200">{hoverPulls.topDriver}</span>
            </div>
          </div>
        ) : null}
        <div className="absolute bottom-3 left-4 rounded border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-[10px] text-slate-400">
          Modeled countries: {countries.length} - Unknown countries dimmed
        </div>
      </div>
    </section>
  );
}

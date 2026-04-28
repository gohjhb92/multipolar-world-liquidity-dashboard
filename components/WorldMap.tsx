"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { blocLabels, type Bloc, type CountryProfile } from "@/data/world-dashboard";
import { cn } from "@/lib/utils";

const blocColors: Record<Bloc, string> = {
  US_DOLLAR: "#22c55e",
  CHINA_YUAN: "#ef4444",
  HEDGING: "#f59e0b",
  SANCTIONED_ALT_RAILS: "#38bdf8",
  UNKNOWN: "#334155",
};

export default function WorldMap({
  countries,
  selected,
  onSelect,
  className,
}: {
  countries: CountryProfile[];
  selected: CountryProfile | null;
  onSelect: (country: CountryProfile) => void;
  className?: string;
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const byIso = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  const isoProperty = "ISO3166-1-Alpha-3";
  const colorExpression = useMemo(() => {
    const pairs = countries.flatMap((country) => [country.iso3, blocColors[country.bloc]]);
    return ["match", ["get", isoProperty], ...pairs, blocColors.UNKNOWN];
  }, [countries]);

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
          "fill-opacity": ["case", ["in", ["get", isoProperty], ["literal", countries.map((country) => country.iso3)]], 0.82, 0.16],
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
      const feature = event.features?.[0];
      const iso = feature?.properties?.[isoProperty];
      const country = typeof iso === "string" ? byIso.get(iso) : undefined;
      if (country) onSelect(country);
    });

    map.on("mousemove", "countries-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "countries-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [byIso, colorExpression, countries, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer("countries-fill")) return;
    map.setPaintProperty("countries-fill", "fill-color", colorExpression);
    map.setPaintProperty("countries-fill", "fill-opacity", ["case", ["in", ["get", isoProperty], ["literal", countries.map((country) => country.iso3)]], 0.82, 0.16]);
  }, [colorExpression, countries]);

  return (
    <section className={cn("terminal-panel overflow-hidden rounded-lg", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Global Bloc Map</h2>
          <p className="mt-1 text-xs text-slate-500">Click a modeled country for funding, settlement, security, and sanctions detail.</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        <div className="absolute bottom-3 left-4 rounded border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-[10px] text-slate-400">
          Modeled countries: {countries.length} · Unknown countries dimmed
        </div>
      </div>
    </section>
  );
}

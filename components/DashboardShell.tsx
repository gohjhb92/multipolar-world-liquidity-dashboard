"use client";

import { useMemo, useState } from "react";
import { Activity, Banknote, Cable, Filter, Fuel, Globe2, Info, Search, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CountryDrawer from "@/components/CountryDrawer";
import MetricCard from "@/components/MetricCard";
import ScenarioControls, { defaultControls } from "@/components/ScenarioControls";
import WorldMap, { type MapMode } from "@/components/WorldMap";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  architectureNodes,
  blocLabels,
  confidenceLabels,
  countryProfiles,
  scenarios,
  sourceNotes,
  type Bloc,
  type CountryProfile,
  type ScenarioKey,
} from "@/data/world-dashboard";
import { adjustedCountryProfile, calculateBlocPressure, calculateCompositeScores, calculateCountryPulls, explainCompositeScores } from "@/lib/scoring";

const blocColorClass: Record<Bloc, string> = {
  US_DOLLAR: "text-emerald-300",
  CHINA_YUAN: "text-red-300",
  HEDGING: "text-amber-300",
  SANCTIONED_ALT_RAILS: "text-sky-300",
  UNKNOWN: "text-slate-400",
};

const blocFill: Record<Bloc, string> = {
  US_DOLLAR: "#22c55e",
  CHINA_YUAN: "#ef4444",
  HEDGING: "#f59e0b",
  SANCTIONED_ALT_RAILS: "#38bdf8",
  UNKNOWN: "#64748b",
};

function PanelList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}) {
  return (
    <section className="terminal-panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-teal-300" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between gap-3 border-b border-slate-800/80 py-2 last:border-0">
            <span className="text-sm text-slate-300">{item}</span>
            <Badge tone="slate">modeled</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountryTable({
  countries,
  onSelect,
}: {
  countries: CountryProfile[];
  onSelect: (country: CountryProfile) => void;
}) {
  return (
    <div className="terminal-panel overflow-hidden rounded-lg">
      <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] gap-3 border-b border-slate-800 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-slate-500">
        <span>Country</span>
        <span>Bloc</span>
        <span>Dollar</span>
        <span>CNY</span>
        <span>Pressure</span>
      </div>
      <div className="max-h-[520px] overflow-auto">
        {countries.map((country) => (
          <button
            key={country.iso3}
            onClick={() => onSelect(country)}
            className="grid w-full grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] gap-3 border-b border-slate-900 px-4 py-3 text-left text-sm transition hover:bg-slate-900/70"
          >
            <span>
              <span className="block font-medium text-slate-100">{country.name}</span>
              <span className="font-mono text-[10px] text-slate-500">{country.iso3} - {confidenceLabels[country.confidence]}</span>
            </span>
            <span className={blocColorClass[country.bloc]}>{blocLabels[country.bloc]}</span>
            <span className="font-mono text-slate-300">{country.dollarFundingDependence}</span>
            <span className="font-mono text-slate-300">{country.cnySettlementExposure}</span>
            <span className="font-mono text-teal-300">{calculateBlocPressure(country)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreExplainer({
  explanations,
}: {
  explanations: ReturnType<typeof explainCompositeScores>;
}) {
  return (
    <section className="terminal-panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-teal-300" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Why The Scores Move</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {explanations.map((item) => (
          <div key={item.key} className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.formula}</p>
              </div>
              <span className="font-mono text-xl text-teal-300">{item.value}</span>
            </div>
            <div className="mt-3 space-y-2">
              {item.drivers.map((driver) => (
                <div key={driver.label}>
                  <div className="mb-1 flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">{driver.label}</span>
                    <span className="font-mono text-slate-200">{driver.value}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-teal-400" style={{ width: `${driver.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountryComparison({
  countries,
  onSelect,
}: {
  countries: CountryProfile[];
  onSelect: (country: CountryProfile) => void;
}) {
  const focusIso = ["SAU", "ARE", "QAT", "SGP", "IND", "BRA", "TUR", "IDN"];
  const rows = focusIso
    .map((iso) => countries.find((country) => country.iso3 === iso))
    .filter((country): country is CountryProfile => Boolean(country));

  return (
    <section className="terminal-panel overflow-hidden rounded-lg">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Strategic Country Comparison</h2>
        <p className="mt-1 text-xs text-slate-500">Hedging pressure is clearest where U.S. security, dollar pegs, China trade, and energy settlement overlap.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Dollar Pull</th>
              <th className="px-4 py-2">Yuan Pull</th>
              <th className="px-4 py-2">Energy $ Share</th>
              <th className="px-4 py-2">Security</th>
              <th className="px-4 py-2">China Trade</th>
              <th className="px-4 py-2">Petroyuan</th>
              <th className="px-4 py-2">Read</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((country) => {
              const pulls = calculateCountryPulls(country);
              const tension = Math.abs(pulls.dollarPull - pulls.yuanPull);
              return (
                <tr key={country.iso3} className="border-b border-slate-900 last:border-0">
                  <td className="px-4 py-3">
                    <button onClick={() => onSelect(country)} className="text-left font-medium text-slate-100 hover:text-teal-300">
                      {country.name}
                    </button>
                    <div className="font-mono text-[10px] text-slate-500">{country.iso3}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-300">{pulls.dollarPull}</td>
                  <td className="px-4 py-3 font-mono text-red-300">{pulls.yuanPull}</td>
                  <td className="px-4 py-3 font-mono text-sky-300">{country.energySettlementDollarShare}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{country.usSecurityDependence}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{country.chinaTradeDependence}</td>
                  <td className="px-4 py-3 font-mono text-amber-300">{country.petroyuanMomentum}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {tension < 15 ? "True hedge node" : pulls.dollarPull > pulls.yuanPull ? "Dollar anchor" : "Yuan-rails pressure"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function DashboardShell() {
  const [scenario, setScenario] = useState<ScenarioKey>("BASELINE");
  const [controls, setControls] = useState(defaultControls);
  const [search, setSearch] = useState("");
  const [blocFilter, setBlocFilter] = useState<Bloc | "ALL">("ALL");
  const [selectedCountry, setSelectedCountry] = useState<CountryProfile | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("bloc");

  const modeledCountries = useMemo(
    () => countryProfiles.map((country) => adjustedCountryProfile(country, controls, scenario)),
    [controls, scenario],
  );

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return modeledCountries.filter((country) => {
      const matchesSearch = !query || country.name.toLowerCase().includes(query) || country.iso3.toLowerCase().includes(query);
      const matchesBloc = blocFilter === "ALL" || country.bloc === blocFilter;
      return matchesSearch && matchesBloc;
    });
  }, [modeledCountries, search, blocFilter]);

  const scores = useMemo(() => calculateCompositeScores(modeledCountries, controls, scenario), [modeledCountries, controls, scenario]);
  const scoreExplanations = useMemo(() => explainCompositeScores(modeledCountries, controls, scenario), [modeledCountries, controls, scenario]);
  const activeScenario = scenarios.find((item) => item.key === scenario) ?? scenarios[0];

  const blocCounts = Object.entries(blocLabels).map(([bloc, label]) => ({
    bloc: label.replace(" / ", "\n"),
    count: modeledCountries.filter((country) => country.bloc === bloc).length,
    fill: blocFill[bloc as Bloc],
  }));

  const railComparison = modeledCountries
    .slice()
    .sort((a, b) => b.petroyuanMomentum - a.petroyuanMomentum)
    .slice(0, 8)
    .map((country) => ({
      name: country.iso3,
      dollar: country.dollarFundingDependence,
      yuan: country.cnySettlementExposure,
      petro: country.petroyuanMomentum,
    }));

  const stressPath = [
    { step: "T0", dollar: scores.dollarPullIndex - 12, yuan: scores.yuanRailsIndex - 5, backstop: scores.usLiquidityBackstopRisk - 10 },
    { step: "T1", dollar: scores.dollarPullIndex - 4, yuan: scores.yuanRailsIndex, backstop: scores.usLiquidityBackstopRisk - 2 },
    { step: "T2", dollar: scores.dollarPullIndex, yuan: scores.yuanRailsIndex + 3, backstop: scores.usLiquidityBackstopRisk },
    { step: "T3", dollar: scores.dollarPullIndex + 4, yuan: scores.yuanRailsIndex + 7, backstop: scores.usLiquidityBackstopRisk + 8 },
  ];

  return (
    <main className="min-h-screen px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="green">CONFIRMED</Badge>
            <Badge tone="amber">REPORTED</Badge>
            <Badge tone="blue">INFERRED</Badge>
            <Badge tone="red">SCENARIO</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Multipolar World Liquidity Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Interactive model of money as membership infrastructure: dollar swap lines, Treasury collateral, sanctions, CIPS, CBDC rails, commodity settlement, and middle-state hedging.
          </p>
        </div>
        <div className="terminal-panel rounded-lg px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Active lens</p>
          <p className="mt-1 text-sm text-slate-200">{activeScenario.title}</p>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          {["Overview", "Dollar Bloc", "China Rails", "Energy", "Treasury", "Scenarios", "Country Explorer", "Sources"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replaceAll(" ", "-")}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="Dollar Pull Index" value={scores.dollarPullIndex} detail="DXY proxy, stress, swap demand, and Treasury safe-haven demand." trend="up" accent="teal" />
                <MetricCard label="Yuan Rails Index" value={scores.yuanRailsIndex} detail="CIPS growth, CNY payment share, RMB settlement, CBDC bridge adoption." trend="up" accent="red" />
                <MetricCard label="Middle-State Hedging" value={scores.middleStateHedgingIndex} detail="Security dependence plus China trade and reserve diversification." trend="flat" accent="amber" />
                <MetricCard label="Petroyuan Momentum" value={scores.petroyuanMomentumScore} detail="Gulf-China energy links, CNY settlement, dollar-peg stress, swap absence." trend="up" accent="blue" />
                <MetricCard label="U.S. Backstop Risk" value={scores.usLiquidityBackstopRisk} detail="Counterparties, line size proxy, crisis probability, collateral weakness." trend="up" accent="amber" />
                <MetricCard label="Grand Macro Statecraft" value={scores.grandMacroStatecraftScore} detail="Sanctions, export controls, defense, swaps, industry policy, payment rails." trend="up" accent="teal" />
              </div>
              <WorldMap countries={modeledCountries} selected={selectedCountry} onSelect={setSelectedCountry} mode={mapMode} onModeChange={setMapMode} />
              <ScoreExplainer explanations={scoreExplanations} />
              <CountryComparison countries={modeledCountries} onSelect={setSelectedCountry} />
            </div>
            <div className="space-y-4">
              <ScenarioControls scenario={scenario} setScenario={setScenario} controls={controls} setControls={setControls} />
              <section className="terminal-panel rounded-lg p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Scenario Readout</h2>
                <Badge className="mt-3" tone={activeScenario.tag === "SCENARIO" ? "red" : "blue"}>{activeScenario.tag}</Badge>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{activeScenario.description}</p>
                <div className="mt-4 space-y-2">
                  {activeScenario.effects.map((effect) => (
                    <div key={effect} className="border-l border-teal-400/60 pl-3 text-xs text-slate-400">{effect}</div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dollar-bloc">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <PanelList title="Dollar Liquidity Architecture" icon={Banknote} items={architectureNodes.dollar} />
            <div className="grid gap-4 lg:grid-cols-2">
              <MetricCard label="Moral Hazard Risk" value={Math.round(modeledCountries.reduce((sum, country) => sum + country.moralHazardRisk, 0) / modeledCountries.length)} detail="Dollar funding dependence + crisis frequency + weak collateral + bailout politics." accent="amber" trend="up" />
              <MetricCard label="Standing Swap Density" value={Math.round((modeledCountries.filter((country) => country.swapLineStatus === "standing").length / modeledCountries.length) * 100)} detail="Confirmed standing lines are narrow; proposed/reported support is separate." accent="teal" />
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={modeledCountries.filter((country) => country.bloc === "US_DOLLAR").map((country) => ({ name: country.iso3, risk: country.moralHazardRisk, recycling: country.treasuryRecyclingScore }))}>
                  <CartesianGrid stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#e2e8f0" }} />
                  <Bar dataKey="risk" fill="#f59e0b" />
                  <Bar dataKey="recycling" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
              <CountryTable countries={modeledCountries.filter((country) => country.bloc === "US_DOLLAR")} onSelect={setSelectedCountry} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="china-rails">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <PanelList title="China / Yuan Rails" icon={Cable} items={architectureNodes.yuan} />
            <div className="terminal-panel rounded-lg p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-100">CNY Settlement and Petroyuan Exposure</h3>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={railComparison}>
                  <CartesianGrid stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#e2e8f0" }} />
                  <Bar dataKey="yuan" fill="#ef4444" />
                  <Bar dataKey="petro" fill="#38bdf8" />
                  <Bar dataKey="dollar" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="energy">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <PanelList title="Energy Settlement Panel" icon={Fuel} items={architectureNodes.energy} />
            <CountryTable countries={modeledCountries.slice().sort((a, b) => b.petroyuanMomentum - a.petroyuanMomentum)} onSelect={setSelectedCountry} />
          </div>
        </TabsContent>

        <TabsContent value="treasury">
          <div className="grid gap-4 lg:grid-cols-2">
            <MetricCard label="Treasury Recycling Stability" value={Math.round(modeledCountries.reduce((sum, country) => sum + country.treasuryRecyclingScore, 0) / modeledCountries.length)} detail="Proxy for reserve recycling, sovereign wealth exposure, and anti-fire-sale value." accent="teal" />
            <MetricCard label="Forced-Sale Risk" value={Math.round(100 - scores.dollarPullIndex * 0.55 + scores.petroyuanMomentumScore * 0.25)} detail="Scenario proxy: weaker recycling plus higher petroyuan pressure." accent="red" trend="up" />
            <CountryTable countries={modeledCountries.slice().sort((a, b) => b.treasuryRecyclingScore - a.treasuryRecyclingScore)} onSelect={setSelectedCountry} />
            <section className="terminal-panel rounded-lg p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Swap Line as Anti-Fire-Sale Mechanism</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                In this MVP, swap-line support lowers the need for allies to liquidate Treasuries during dollar funding stress. The same mechanism can deepen dependence and raise moral-hazard risk when collateral quality or political discipline weakens.
              </p>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="scenarios">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <ScenarioControls scenario={scenario} setScenario={setScenario} controls={controls} setControls={setControls} />
            <section className="terminal-panel rounded-lg p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-100">Stress Path</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={stressPath}>
                  <CartesianGrid stroke="#1e293b" />
                  <XAxis dataKey="step" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="dollar" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="yuan" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="backstop" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="country-explorer">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_260px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search countries or ISO3 codes" className="pl-9" />
            </label>
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <select value={blocFilter} onChange={(event) => setBlocFilter(event.target.value as Bloc | "ALL")} className="h-9 w-full rounded-md border border-slate-700 bg-slate-950/70 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-teal-400">
                <option value="ALL">All blocs</option>
                {Object.entries(blocLabels).map(([bloc, label]) => (
                  <option key={bloc} value={bloc}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <CountryTable countries={filteredCountries} onSelect={setSelectedCountry} />
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-4 lg:grid-cols-2">
            {sourceNotes.map((source) => (
              <section key={source.category} className="terminal-panel rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">{source.category}</h3>
                  <Badge tone={source.tag === "CONFIRMED" ? "green" : source.tag === "REPORTED" ? "amber" : source.tag === "SCENARIO" ? "red" : "blue"}>{source.tag}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{source.note}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs">
                  <span className="font-mono uppercase tracking-wide text-slate-500">{source.source}</span>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-200">
                      Open source
                    </a>
                  ) : (
                    <span className="text-slate-600">No verified link yet</span>
                  )}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        <div className="terminal-panel rounded-lg p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-teal-300" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Bloc Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={blocCounts}>
              <XAxis dataKey="bloc" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Bar dataKey="count">
                {blocCounts.map((entry) => (
                  <Cell key={entry.bloc} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="terminal-panel rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Epistemic Rule</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">Confirmed facilities and public data are tagged separately from reported proposals, inferred scores, and scenario logic.</p>
        </div>
        <div className="terminal-panel rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Statecraft System</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">The dashboard treats swaps, tariffs, sanctions, energy settlement, defense, and reserve recycling as one combined pressure field.</p>
        </div>
      </section>

      <CountryDrawer country={selectedCountry} onClose={() => setSelectedCountry(null)} />
    </main>
  );
}

"use client";

import * as Slider from "@radix-ui/react-slider";
import { RotateCcw } from "lucide-react";
import { scenarios, type ScenarioKey } from "@/data/world-dashboard";
import { type ControlState } from "@/lib/scoring";
import { Button } from "@/components/ui/button";

const controlMeta: Array<{ key: keyof ControlState; label: string }> = [
  { key: "crisisIntensity", label: "Global crisis intensity" },
  { key: "usSwapWillingness", label: "U.S. swap-line willingness" },
  { key: "chinaSettlementAdoption", label: "China settlement adoption" },
  { key: "sanctionsIntensity", label: "Sanctions intensity" },
  { key: "energyShock", label: "Energy shock" },
];

export const defaultControls: ControlState = {
  crisisIntensity: 48,
  usSwapWillingness: 55,
  chinaSettlementAdoption: 42,
  sanctionsIntensity: 58,
  energyShock: 40,
};

export default function ScenarioControls({
  scenario,
  setScenario,
  controls,
  setControls,
}: {
  scenario: ScenarioKey;
  setScenario: (scenario: ScenarioKey) => void;
  controls: ControlState;
  setControls: (controls: ControlState) => void;
}) {
  return (
    <section className="terminal-panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Scenario Engine</h2>
          <p className="mt-1 text-xs text-slate-500">Live recalculation of bloc pressure, rail adoption, and backstop risk.</p>
        </div>
        <Button variant="ghost" className="h-8 px-2" onClick={() => setControls(defaultControls)} title="Reset sliders">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <select
        value={scenario}
        onChange={(event) => setScenario(event.target.value as ScenarioKey)}
        className="mt-4 h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-teal-400"
      >
        {scenarios.map((item) => (
          <option value={item.key} key={item.key}>
            {item.title}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-4">
        {controlMeta.map((item) => (
          <div key={item.key}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs text-slate-300">{item.label}</label>
              <span className="font-mono text-xs text-teal-300">{controls[item.key]}</span>
            </div>
            <Slider.Root
              value={[controls[item.key]]}
              max={100}
              step={1}
              onValueChange={([value]) => setControls({ ...controls, [item.key]: value })}
              className="relative flex h-5 w-full touch-none select-none items-center"
            >
              <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-slate-800">
                <Slider.Range className="absolute h-full rounded-full bg-teal-400" />
              </Slider.Track>
              <Slider.Thumb className="block h-4 w-4 rounded-full border border-teal-200 bg-slate-950 shadow focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </Slider.Root>
          </div>
        ))}
      </div>
    </section>
  );
}

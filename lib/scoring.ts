import type { CountryProfile, ScenarioKey } from "@/data/world-dashboard";

export type ControlState = {
  crisisIntensity: number;
  usSwapWillingness: number;
  chinaSettlementAdoption: number;
  sanctionsIntensity: number;
  energyShock: number;
};

export type CompositeScores = {
  dollarPullIndex: number;
  yuanRailsIndex: number;
  middleStateHedgingIndex: number;
  petroyuanMomentumScore: number;
  usLiquidityBackstopRisk: number;
  grandMacroStatecraftScore: number;
};

export type PullBreakdown = {
  dollarPull: number;
  yuanPull: number;
  balance: number;
  topDriver: string;
};

export type ScoreExplanation = {
  key: keyof CompositeScores;
  label: string;
  value: number;
  formula: string;
  drivers: Array<{ label: string; value: number }>;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const scenarioDeltas: Record<ScenarioKey, Partial<Record<keyof CompositeScores, number>>> = {
  BASELINE: {},
  DOLLAR_MILKSHAKE: {
    dollarPullIndex: 18,
    usLiquidityBackstopRisk: 10,
    grandMacroStatecraftScore: 5,
  },
  MANAGED_DOLLAR_BLOC: {
    dollarPullIndex: 10,
    yuanRailsIndex: -8,
    usLiquidityBackstopRisk: 12,
    grandMacroStatecraftScore: 8,
  },
  PETROYUAN_BREAKOUT: {
    dollarPullIndex: -9,
    yuanRailsIndex: 18,
    petroyuanMomentumScore: 22,
    grandMacroStatecraftScore: 12,
  },
  FRAGMENTED_MULTIPOLAR: {
    yuanRailsIndex: 11,
    middleStateHedgingIndex: 16,
    grandMacroStatecraftScore: 18,
  },
  SWAP_LINE_OVERREACH: {
    dollarPullIndex: 7,
    usLiquidityBackstopRisk: 24,
    grandMacroStatecraftScore: 14,
  },
};

export function calculateBlocPressure(country: CountryProfile) {
  const { dollarPull, yuanPull } = calculateCountryPulls(country);
  return clamp(Math.abs(dollarPull - yuanPull) + avg([country.sanctionsExposure, country.dollarFundingDependence]) * 0.22);
}

export function calculateCountryPulls(country: CountryProfile): PullBreakdown {
  const dollarPull =
    country.dollarFundingDependence * 0.28 +
    country.usSecurityDependence * 0.22 +
    country.energySettlementDollarShare * 0.18 +
    country.treasuryRecyclingScore * 0.2 +
    (country.swapLineStatus === "standing" ? 12 : country.swapLineStatus === "proposed" || country.swapLineStatus === "reported" ? 7 : 0);

  const yuanPull =
    country.cnySettlementExposure * 0.34 +
    country.chinaTradeDependence * 0.3 +
    country.petroyuanMomentum * 0.24 +
    country.sanctionsExposure * 0.12;

  const drivers = [
    { label: "Dollar funding", value: country.dollarFundingDependence },
    { label: "U.S. security", value: country.usSecurityDependence },
    { label: "China trade", value: country.chinaTradeDependence },
    { label: "CNY settlement", value: country.cnySettlementExposure },
    { label: "Energy dollar share", value: country.energySettlementDollarShare },
    { label: "Sanctions exposure", value: country.sanctionsExposure },
  ].sort((a, b) => b.value - a.value);

  return {
    dollarPull: clamp(dollarPull),
    yuanPull: clamp(yuanPull),
    balance: clamp(50 + (dollarPull - yuanPull) * 0.5),
    topDriver: drivers[0]?.label ?? "Mixed exposure",
  };
}

export function calculateMoralHazard(country: CountryProfile, controls: ControlState) {
  const weakCollateral = 100 - country.collateralQuality;
  const crisisFrequency = controls.crisisIntensity;
  const politicalBailoutRisk = country.swapLineStatus === "standing" ? 30 : country.swapLineStatus === "none" ? 42 : 62;
  return clamp(
    country.dollarFundingDependence * 0.32 +
      crisisFrequency * 0.24 +
      weakCollateral * 0.24 +
      politicalBailoutRisk * 0.2 +
      controls.usSwapWillingness * 0.08,
  );
}

export function calculateCompositeScores(
  countries: CountryProfile[],
  controls: ControlState,
  scenario: ScenarioKey,
): CompositeScores {
  const dollarFundingStress = controls.crisisIntensity * 0.72 + controls.sanctionsIntensity * 0.18 + controls.energyShock * 0.1;
  const swapLineDemand = avg(countries.map((country) => country.dollarFundingDependence)) * 0.5 + controls.usSwapWillingness * 0.5;
  const treasurySafeHavenDemand = avg(countries.map((country) => country.treasuryRecyclingScore)) * 0.55 + controls.crisisIntensity * 0.45;
  const cipsGrowth = avg(countries.map((country) => country.cnySettlementExposure)) * 0.55 + controls.chinaSettlementAdoption * 0.45;
  const middleHedging = avg(
    countries.map((country) =>
      avg([country.usSecurityDependence, country.chinaTradeDependence, country.sanctionsExposure, 100 - country.energySettlementDollarShare]),
    ),
  );
  const petroyuan = avg(countries.map((country) => country.petroyuanMomentum)) * 0.55 + controls.energyShock * 0.2 + controls.chinaSettlementAdoption * 0.25;
  const counterparties = countries.filter((country) => country.swapLineStatus !== "none" && country.swapLineStatus !== "unknown").length;
  const collateralWeakness = avg(countries.map((country) => 100 - country.collateralQuality));

  const base: CompositeScores = {
    dollarPullIndex: clamp(avg([dollarFundingStress, swapLineDemand, treasurySafeHavenDemand])),
    yuanRailsIndex: clamp(avg([cipsGrowth, controls.chinaSettlementAdoption, controls.sanctionsIntensity * 0.45])),
    middleStateHedgingIndex: clamp(middleHedging + controls.sanctionsIntensity * 0.08),
    petroyuanMomentumScore: clamp(petroyuan),
    usLiquidityBackstopRisk: clamp(counterparties * 4 + controls.usSwapWillingness * 0.24 + controls.crisisIntensity * 0.28 + collateralWeakness * 0.24),
    grandMacroStatecraftScore: clamp(
      avg([
        controls.sanctionsIntensity,
        controls.usSwapWillingness,
        controls.energyShock,
        controls.chinaSettlementAdoption,
        dollarFundingStress,
      ]),
    ),
  };

  const deltas = scenarioDeltas[scenario];
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [key, clamp(value + (deltas[key as keyof CompositeScores] ?? 0))]),
  ) as CompositeScores;
}

export function explainCompositeScores(
  countries: CountryProfile[],
  controls: ControlState,
  scenario: ScenarioKey,
): ScoreExplanation[] {
  const scores = calculateCompositeScores(countries, controls, scenario);
  const dollarFundingStress = clamp(controls.crisisIntensity * 0.72 + controls.sanctionsIntensity * 0.18 + controls.energyShock * 0.1);
  const swapLineDemand = clamp(avg(countries.map((country) => country.dollarFundingDependence)) * 0.5 + controls.usSwapWillingness * 0.5);
  const treasurySafeHavenDemand = clamp(avg(countries.map((country) => country.treasuryRecyclingScore)) * 0.55 + controls.crisisIntensity * 0.45);
  const cipsGrowth = clamp(avg(countries.map((country) => country.cnySettlementExposure)) * 0.55 + controls.chinaSettlementAdoption * 0.45);
  const reserveDiversification = clamp(100 - avg(countries.map((country) => country.energySettlementDollarShare)));
  const counterparties = clamp(countries.filter((country) => country.swapLineStatus !== "none" && country.swapLineStatus !== "unknown").length * 4);
  const collateralWeakness = clamp(avg(countries.map((country) => 100 - country.collateralQuality)));

  return [
    {
      key: "dollarPullIndex",
      label: "Dollar Pull Index",
      value: scores.dollarPullIndex,
      formula: "DXY/stress proxy + swap-line demand + Treasury safe-haven demand",
      drivers: [
        { label: "Dollar funding stress", value: dollarFundingStress },
        { label: "Swap-line demand", value: swapLineDemand },
        { label: "Treasury safe-haven demand", value: treasurySafeHavenDemand },
      ],
    },
    {
      key: "yuanRailsIndex",
      label: "Yuan Rails Index",
      value: scores.yuanRailsIndex,
      formula: "CIPS/CNY exposure + China settlement adoption + sanctions-driven routing",
      drivers: [
        { label: "CNY settlement exposure", value: cipsGrowth },
        { label: "China adoption slider", value: controls.chinaSettlementAdoption },
        { label: "Sanctions routing pressure", value: clamp(controls.sanctionsIntensity * 0.45) },
      ],
    },
    {
      key: "middleStateHedgingIndex",
      label: "Middle-State Hedging",
      value: scores.middleStateHedgingIndex,
      formula: "U.S. security + China trade + reserve diversification + sanctions sensitivity",
      drivers: [
        { label: "Average U.S. security dependence", value: clamp(avg(countries.map((country) => country.usSecurityDependence))) },
        { label: "Average China trade dependence", value: clamp(avg(countries.map((country) => country.chinaTradeDependence))) },
        { label: "Reserve diversification proxy", value: reserveDiversification },
        { label: "Sanctions sensitivity", value: controls.sanctionsIntensity },
      ],
    },
    {
      key: "petroyuanMomentumScore",
      label: "Petroyuan Momentum",
      value: scores.petroyuanMomentumScore,
      formula: "China energy demand + Gulf-China trade + CNY settlement + dollar-peg stress",
      drivers: [
        { label: "Country petroyuan average", value: clamp(avg(countries.map((country) => country.petroyuanMomentum))) },
        { label: "Energy shock", value: controls.energyShock },
        { label: "China settlement adoption", value: controls.chinaSettlementAdoption },
      ],
    },
    {
      key: "usLiquidityBackstopRisk",
      label: "U.S. Backstop Risk",
      value: scores.usLiquidityBackstopRisk,
      formula: "Counterparties + swap willingness + crisis probability + collateral weakness",
      drivers: [
        { label: "Counterparty count proxy", value: counterparties },
        { label: "U.S. swap willingness", value: controls.usSwapWillingness },
        { label: "Crisis probability", value: controls.crisisIntensity },
        { label: "Collateral weakness", value: collateralWeakness },
      ],
    },
    {
      key: "grandMacroStatecraftScore",
      label: "Grand Macro Statecraft",
      value: scores.grandMacroStatecraftScore,
      formula: "Sanctions + swap lines + energy stress + China rails + dollar stress",
      drivers: [
        { label: "Sanctions intensity", value: controls.sanctionsIntensity },
        { label: "Swap-line policy pressure", value: controls.usSwapWillingness },
        { label: "Energy shock", value: controls.energyShock },
        { label: "Payment-rail fragmentation", value: controls.chinaSettlementAdoption },
      ],
    },
  ];
}

export function adjustedCountryProfile(country: CountryProfile, controls: ControlState, scenario: ScenarioKey): CountryProfile {
  const scenarioYuanBoost = scenario === "PETROYUAN_BREAKOUT" ? 18 : scenario === "FRAGMENTED_MULTIPOLAR" ? 9 : 0;
  const scenarioDollarBoost = scenario === "DOLLAR_MILKSHAKE" ? 14 : scenario === "MANAGED_DOLLAR_BLOC" ? 10 : 0;
  const scenarioRiskBoost = scenario === "SWAP_LINE_OVERREACH" ? 16 : 0;

  return {
    ...country,
    dollarFundingDependence: clamp(country.dollarFundingDependence + scenarioDollarBoost + controls.crisisIntensity * 0.08),
    cnySettlementExposure: clamp(country.cnySettlementExposure + scenarioYuanBoost + controls.chinaSettlementAdoption * 0.1),
    sanctionsExposure: clamp(country.sanctionsExposure + controls.sanctionsIntensity * 0.08),
    petroyuanMomentum: clamp(country.petroyuanMomentum + controls.energyShock * 0.14 + scenarioYuanBoost),
    moralHazardRisk: clamp(calculateMoralHazard(country, controls) + scenarioRiskBoost),
  };
}

export function formatScore(score: number) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "ELEVATED";
  if (score >= 30) return "WATCH";
  return "LOW";
}

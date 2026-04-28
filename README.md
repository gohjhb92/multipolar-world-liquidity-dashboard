# Multipolar World Liquidity Dashboard

An interactive Next.js + TypeScript dashboard for exploring "money as membership infrastructure" in a potential multipolar monetary order.

The MVP models how countries can be pulled toward:

- U.S. Dollar Bloc
- China/Yuan Rails Bloc
- Middle / Hedging States
- Sanctioned / Alternative Rails
- Unknown / Neutral

It combines dollar liquidity architecture, Treasury recycling, sanctions exposure, energy settlement, CIPS/yuan rails, and scenario controls into live composite indexes.

## Epistemic Tags

The dashboard intentionally separates hard data from modeled judgment:

- `CONFIRMED`: established public frameworks or data categories, such as NY Fed standing swap-line counterparties.
- `REPORTED`: public reporting or announcements that should be verified before being treated as policy fact.
- `INFERRED`: model estimates derived from trade, reserve, security, energy, and sanctions relationships.
- `SCENARIO`: hypothetical pathways used for stress testing.

Country-level scores in `data/world-dashboard.ts` are mock starting values. They are designed to be replaced or blended with live data later.

## Main Sections

- `Overview`: map, six composite indexes, scenario controls, and scenario readout.
- `Dollar Bloc`: Fed swap lines, Treasury/ESF-style support, repo facilities, dollar pegs, and moral-hazard risk.
- `China Rails`: CIPS, bilateral RMB swaps, mBridge-style CBDC rails, CNY commodity settlement, and sanctioned-flow corridors.
- `Energy`: oil/LNG settlement exposure, Gulf stress, dollar pegs, China energy demand, and petroyuan momentum.
- `Treasury`: Treasury recycling, forced-sale risk, reserve composition proxy, and swap lines as anti-fire-sale mechanisms.
- `Scenarios`: toggleable stress regimes and slider-based recalculation.
- `Country Explorer`: country search, bloc filter, confidence tags, and detailed country drawer.
- `Sources`: source categories and how the MVP treats each one.

## Composite Scores

Scores run from 0 to 100:

- `Dollar Pull Index`
- `Yuan Rails Index`
- `Middle-State Hedging Index`
- `Petroyuan Momentum Score`
- `U.S. Liquidity Backstop Risk`
- `Grand Macro Statecraft Score`

The formulas are in `lib/scoring.ts`. They are transparent and intentionally simple so the model can be debated, extended, or replaced.

## Add Live Data Later

Recommended live-data adapters:

- IMF COFER for FX reserve composition.
- SWIFT Global Currency Tracker for payment currency shares.
- NY Fed pages for standing swap-line and FIMA/repo facility references.
- CIPS announcements for direct and indirect participant data.
- BIS publications for mBridge and wholesale CBDC background.
- U.S. Treasury TIC data for Treasury holdings.
- Energy trade datasets for oil/LNG settlement and import exposure.

A practical extension path:

1. Keep `CountryProfile` as the normalized internal schema.
2. Add `/lib/adapters/*.ts` modules for each source.
3. Store source timestamps and confidence tags per field.
4. Blend live values with inferred scores only where the source does not provide direct data.
5. Surface stale or missing data in the UI instead of silently filling gaps.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

Build check:

```bash
npm run build
```

## Extend The Model

Add or change countries in:

```text
data/world-dashboard.ts
```

Update scenarios in the `scenarios` array and scenario score deltas in:

```text
lib/scoring.ts
```

The map uses ISO3 country codes. For the MVP, "Euro Area" is represented by Germany (`DEU`) on the map so the standing ECB swap-line relationship can be visualized.

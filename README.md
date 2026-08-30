# E-Commerce Behavior Intelligence Platform & CEO Scenario Simulator

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-blue?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![DuckDB](https://img.shields.io/badge/Engine-DuckDB-FFF000?style=flat-square&logo=duckdb)](https://duckdb.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Portfolio Case Study](https://img.shields.io/badge/Portfolio-Case%20Study-indigo?style=flat-square)](#)

> **An Executive Decision Support System & Behavioral Intelligence Platform** built over **110 Million+ raw clickstream events** (~13.7 GB dataset) from a multi-category e-commerce store. Features data-derived behavioral personas, session sequence mining, a **5x5 Markov state transition probability model**, business opportunity discovery, and an interactive **CEO Scenario & Business Intervention Simulator**.

---

## 📌 Executive Summary & Key Highlights

* **Dataset Scale:** 109,949,743 clickstream events (Oct–Nov 2019) across ~160,000 SKUs, 5M+ distinct users, and 27.8M+ user sessions.
* **3-Tier Methodological Architecture:** Strict separation between **Tier 1 (Observed Truth)**, **Tier 2 (Inferred Patterns)**, and **Tier 3 (Simulated Scenarios)**.
* **Data-Derived Personas:** 6 distinct behavioral archetypes discovered via session-level feature quantiles without demographic assumptions.
* **5x5 Markov State Transition Model:** Mathematical modeling of transition probabilities across `VIEW`, `CART`, `REMOVE`, `PURCHASE`, and `EXIT` states ($\sum P = 1.0000$).
* **Deterministic Probability Redistribution Engine:** Client-side scenario simulation engine that redistributes probability mass delta proportionally, guaranteeing mathematical validity ($0 \le P \le 1, \sum P = 1.0$) and sub-millisecond slider response times.
* **Production-Ready & Vercel Optimized:** Heavy aggregations pre-computed offline into lightweight static JSON datasets (~35 KB payload total), enabling sub-millisecond initial page loads and zero serverless function cold starts.

---

## 📐 The 3-Tier Methodological Framework

To maintain statistical honesty and analytical integrity, the application strictly separates observed evidence from inferences and what-if calculations:

```text
TIER 1 — OBSERVED HISTORICAL TRUTH
109,949,743 clickstream events (Oct–Nov 2019)
        ↓
TIER 2 — INFERRED BEHAVIORAL PATTERNS
Data-derived personas, session sequence journeys,
5x5 Markov transition probability matrices & hypotheses
        ↓
TIER 3 — HYPOTHETICAL SCENARIO SIMULATION
What-if scenario simulations, deterministic probability redistribution,
and simulated purchase value impact
```

Every metric and visualization throughout the platform explicitly labels its source tier.

---

## 👥 Data-Derived Behavioral Personas

Rather than hard-coding demographic profiles, behavioral archetypes are discovered from observable clickstream feature quantiles (session depth, cart rate, removal rate, conversion speed, and catalog exploration breadth):

| Persona Archetype | Population Share | Median Views | Median Carts | Removal Rate | Conversion Rate | Primary Friction Point |
|---|---|---|---|---|---|---|
| **The Window Shopper** | 64.2% (3.58M) | 6 | 0 | 0.0% | 0.0% | High bounce rate without immediate intent hook |
| **The Intent Shopper** | 9.2% (512K) | 4 | 2 | 8.2% | 24.8% | Stockout / minor checkout payment friction |
| **The Hesitant Buyer** | 12.3% (684K) | 14 | 3 | 46.8% | 3.9% | Cart-stage price & shipping fee shock |
| **The Focused Buyer** | 5.3% (298K) | 2 | 1 | 2.1% | 39.1% | Slow page load / checkout step friction |
| **The Explorer** | 5.6% (312K) | 18 | 1 | 35.0% | 1.2% | Catalog navigation overload & filter clutter |
| **The Heavy Browser** | 3.4% (192K) | 26 | 2 | 42.1% | 1.1% | Choice paralysis & missing product specs |

*Note: Archetype names are business labels assigned **after** feature distribution clustering.*

---

## 🔄 5x5 Markov State Transition Probability Matrix

The platform models customer journey dynamics using a first-order Markov chain over 5 discrete behavioral states:

$$\text{States}: \{\text{VIEW}, \text{CART}, \text{REMOVE}, \text{PURCHASE}, \text{EXIT}\}$$

* **Derived `EXIT` State:** Defined when no subsequent event occurs within the session boundary (`user_session`).
* **Absorbing Boundary States:** Both `PURCHASE` and `EXIT` act as terminal boundary states for session-level probability evaluation.

### Platform-Wide Baseline Transition Matrix ($n = 109.9\text{M}$)

| Source State | VIEW | CART | REMOVE | PURCHASE | EXIT (Absorbing) | Source Count ($n$) | Reliability |
|---|---|---|---|---|---|---|---|
| **VIEW** | 0.6210 | 0.1842 | 0.0000 | 0.0000 | 0.1948 | 87,378,691 | HIGH |
| **CART** | 0.2010 | 0.2015 | 0.2185 | 0.3090 | 0.0700 | 14,229,908 | HIGH |
| **REMOVE** | 0.3540 | 0.1020 | 0.0480 | 0.0460 | 0.4500 | 7,183,060 | HIGH |
| **PURCHASE** | 0.0000 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 1,158,284 | HIGH |
| **EXIT** | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 1.0000 | 27,821,040 | HIGH |

$$\text{Verification}: \sum_{j} P_{ij} = 1.0000 \quad \forall i$$

---

## 🕹️ CEO Scenario Simulator & Probability Redistribution Policy

Located at `/simulator`, the decision support engine evaluates what-if business interventions (e.g. *+10% View → Cart lift* or *-15% Cart Removal*) over historical baselines.

### Deterministic Redistribution Rule
When an intervention applies a relative lift $\Delta$ to target transition probability $p_{\text{target}}' = \min(p_{\text{target}} \times (1 + \Delta), 1.0)$, the probability delta $\delta = p_{\text{target}}' - p_{\text{target}}$ is subtracted proportionally from competing non-target transitions:

$$p_i' = \frac{p_i}{\sum_{k \neq \text{target}} p_k} \times (1 - p_{\text{target}}')$$

This guarantees:
1. Every transition strictly satisfies $0 \le p_i' \le 1$.
2. Row probability sum remains normalized: $\sum P = 1.0 \pm 0.0001$.
3. Zero-lift scenarios ($\Delta = 0\%$) reproduce historical baseline numbers *exactly*.

> **⚠️ Non-Causal Simulation Disclaimer:** Scenario simulations produced by this platform represent what-if calculations based on historical behavioral transition probabilities. They are not causal forecasts, machine-learning predictions, or guaranteed business revenue outcomes.

---

## 📱 Application Modules & Navigation Structure

* **Executive Command Center (`/`):** KPI summary cards, top 10 prioritized CEO discoveries, daily & hourly event trends.
* **CEO Simulator (`/simulator`):** Interactive what-if simulation controls, lift sliders, target persona filtering, and live 5x5 Markov probability updates.
* **Behavioral User Segments (`/customers`):** Persona Explorer (cards, signatures, journey sequence flows) and Persona Comparison matrix.
* **Executive Opportunities (`/opportunities`):** Prioritized P1–P3 opportunity backlog linking behavioral leakage to conservative/aggressive revenue impacts.
* **Experiment Roadmap (`/experiments`):** Structured A/B test specification sheet with primary metrics and target lift.
* **Funnel & Leakage Analysis (`/funnel`):** Multi-grain funnel analysis (Event-based vs User-based vs Session-based) and cart drop-off breakdown.
* **Customer Journey (`/journey`):** Sequence mining visualization of top 20 observed session paths.
* **Price Sensitivity (`/pricing`):** Conversion rates and cart abandonment segmented across 5 price bands.
* **Merchandising Suite:**
  * **Brand Intelligence (`/brands`):** Performance metrics across 4,100+ brands.
  * **Categories (`/categories`):** Category tree breakdown & conversion rates.
  * **Products & Pareto 80/20 (`/products`):** Concentration risk analysis across top SKUs.
  * **Cross-Sell Matrix (`/cross-sell`):** Category co-purchase frequency & basket recommendation opportunities.
* **System Methodology (`/methodology`):** Architecture limits, processing pipeline documentation, and dataset constraints.

---

## 🛠️ Technology Stack & Architecture

* **Frontend Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, Server Components)
* **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), Vanilla CSS design system, Dark Mode UI
* **Iconography:** [Lucide React](https://lucide.dev/) SVG icons
* **Data Visualization:** [Recharts](https://recharts.org/) custom responsive charts & sortable tables
* **Analytical Engine:** [DuckDB](https://duckdb.org/) Python script pre-aggregation pipeline
* **Deployment:** [Vercel](https://vercel.com/) (Edge distribution via static JSON assets)

---

## 📂 Repository Structure

```text
├── analytics/
│   ├── scripts/
│   │   ├── 01_profile_dataset.py      # Raw dataset quality audit
│   │   ├── 02_validate_data.py        # Data hygiene & schema checks
│   │   └── 03_build_aggregates.py     # DuckDB feature extraction & JSON generation
├── app/
│   ├── layout.tsx                     # Main layout & sidebar shell
│   ├── page.tsx                       # CEO Dashboard
│   ├── simulator/                     # CEO Scenario Simulator
│   ├── customers/                     # User Segments & Persona Explorer
│   ├── funnel/                        # Funnel & Cart Leakage Analysis
│   ├── journey/                       # Customer Journey Sequence Mining
│   ├── opportunities/                 # Executive Opportunities Matrix
│   ├── experiments/                   # Experiment Roadmap & A/B Test Specs
│   ├── products/                      # Products & Pareto 80/20 Concentration
│   ├── brands/                        # Brand Intelligence
│   ├── categories/                    # Category Performance Matrix
│   ├── pricing/                       # Price Sensitivity Analysis
│   ├── cross-sell/                    # Cross-Sell & Co-Purchase Matrix
│   ├── retention/                     # Cohort & Repeat Behavior
│   └── methodology/                   # System Methodology & Limits
├── components/
│   ├── NavSidebar.tsx                 # Navigation sidebar with Lucide icons
│   ├── dashboard/                     # KPI Cards & Dashboard Charts
│   └── tables/                        # SortableTable component
├── lib/
│   ├── data.ts                        # Pre-aggregated JSON data loaders
│   └── types.ts                       # TypeScript interfaces for analytical models
├── public/data/                       # Compact precomputed static JSON datasets
├── personas_and_simulation.md         # Comprehensive methodology documentation
├── behavioral_business_report.md       # Strategic executive business report
├── opportunity_matrix.md              # Prioritized business opportunity backlog
└── package.json
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation & Development Server

```bash
# Clone the repository
git clone https://github.com/pomagrenate/eCommerce-behavior-data-from-multi-category-store.git

# Navigate into the project directory
cd eCommerce-behavior-data-from-multi-category-store

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Type Check & Production Build

```bash
# Verify TypeScript strict type compliance
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📑 Analytical Documentation & Case Studies

Detailed analytical artifacts are available directly in the root directory:
* [`personas_and_simulation.md`](./personas_and_simulation.md): In-depth mathematical formulas for feature engineering, Markov chain matrices, and probability redistribution.
* [`behavioral_business_report.md`](./behavioral_business_report.md): Executive decision report translating clickstream metrics into commercial strategy.
* [`opportunity_matrix.md`](./opportunity_matrix.md): Prioritized P1–P3 opportunity matrix.
* [`data_quality_report.md`](./data_quality_report.md): Full dataset profiling, null checks, and deduplication audit.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

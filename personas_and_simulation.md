# Data-Derived Behavioral Personas, 5x5 Markov Models & Simulation Methodology

## 1. Objective & 3-Tier Framework

This document details the behavioral feature engineering, statistical segment discovery, persona profiling, session sequence mining, 5x5 Markov state transition models, and simulation probability redistribution policy.

### The 3-Tier Methodological Framework

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

---

## 2. Feature Engineering Space

User and session behavioral features are extracted directly from clickstream events without demographic assumptions:

- **Engagement**: `total_events`, `events_per_session`, `session_duration_sec`, `active_days`.
- **Browsing**: `views_per_session`, `unique_products_viewed`, `unique_categories_viewed`, `unique_brands_viewed`.
- **Cart Behavior**: `cart_events`, `cart_rate` ($= \text{carts} / \text{views}$), `unique_products_carted`.
- **Removal Behavior**: `remove_from_cart_events`, `removal_rate` ($= \text{removes} / \text{carts}$).
- **Purchasing**: `purchase_events`, `purchase_sessions`, `purchase_rate`, `observed_purchase_value_proxy`.
- **Conversion Speed**:
  - `events_before_cart`: Count of product view events preceding the initial cart event in a session.
  - `events_before_purchase`: Count of events preceding the initial purchase event in a session.
  - `session_duration_sec`: Time delta between `MIN(event_time)` and `MAX(event_time)` for multi-event sessions.

---

## 3. Data-Derived Personas

Behavioral segments are discovered by analyzing feature distributions and quantiles across session depth, cart rate, removal rate, and conversion speed. Archetype names are business labels assigned **after** segment discovery.

| Persona Archetype | Population Share | Median Views | Median Carts | Removal Rate | Conversion Rate | Primary Friction |
|---|---|---|---|---|---|---|
| **The Window Shopper** | 64.2% (3.58M) | 6 | 0 | 0.0% | 0.0% | High bounce without intent hook |
| **The Intent Shopper** | 9.2% (512K) | 4 | 2 | 8.2% | 24.8% | Stockout / minor payment friction |
| **The Hesitant Buyer** | 12.3% (684K) | 14 | 3 | 46.8% | 3.9% | Cart-stage price & fee shock |
| **The Focused Buyer** | 5.3% (298K) | 2 | 1 | 2.1% | 39.1% | Slow page load / checkout steps |
| **The Explorer** | 5.6% (312K) | 18 | 1 | 35.0% | 1.2% | Catalog navigation overload |
| **The Heavy Browser** | 3.4% (192K) | 26 | 2 | 42.1% | 1.1% | Choice paralysis & missing specs |

---

## 4. 5x5 Markov State Transition Matrix

The behavioral model tracks transitions across 5 states: `VIEW`, `CART`, `REMOVE`, `PURCHASE`, and `EXIT`.
- **`EXIT` State Definition**: `EXIT` is a derived absorbing state defined when no subsequent event exists within the session boundary (`user_session`).
- **`PURCHASE` State Definition**: `PURCHASE` is an absorbing terminal event state.

### Platform-Wide 5x5 Transition Probability Matrix ($n = 109.9\text{M}$)

| Source State | VIEW | CART | REMOVE | PURCHASE | EXIT (Absorbing) | Source Count ($n$) | Reliability |
|---|---|---|---|---|---|---|---|
| **VIEW** | 0.6210 | 0.1842 | 0.0000 | 0.0000 | 0.1948 | 87,378,691 | HIGH |
| **CART** | 0.2010 | 0.2015 | 0.2185 | 0.3090 | 0.0700 | 14,229,908 | HIGH |
| **REMOVE** | 0.3540 | 0.1020 | 0.0480 | 0.0460 | 0.4500 | 7,183,060 | HIGH |
| **PURCHASE** | 0.0000 | 0.0000 | 0.0000 | 1.0000 | 0.0000 | 1,158,284 | HIGH |
| **EXIT** | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 1.0000 | 27,821,040 | HIGH |

*Note: All transition matrix rows strictly satisfy $\sum P = 1.0000$.*

---

## 5. Probability Redistribution & Simulation Engine

### Mathematical Redistribution Policy

When an intervention applies a relative lift $\Delta$ to a target transition probability $p_{target}' = \min(p_{target} \times (1 + \Delta), 1.0)$, the probability mass delta $\delta = p_{target}' - p_{target}$ is subtracted proportionally from the non-target transitions:

$$p_i' = \frac{p_i}{\sum_{k \neq target} p_k} \times (1 - p_{target}')$$

This guarantees that:
1. Every modified transition satisfies $0 \le p_i' \le 1$.
2. The row probability sum remains strictly normalized: $\sum P = 1.0 \pm 0.0001$.
3. Zero-lift scenarios ($\Delta = 0\%$) reproduce historical baseline numbers exactly.

---

## 6. Methodological & Non-Causal Disclaimer

> **⚠️ Disclaimer**: Scenario simulations produced by this platform represent what-if calculations based on historical behavioral transition probabilities. They are not causal forecasts, machine-learning predictions, or guaranteed revenue outcomes.

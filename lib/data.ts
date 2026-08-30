// Data loading utilities — reads JSON from public/data/ via fs at build time
// All pages are statically generated; no runtime DB needed

import fs from 'fs';
import path from 'path';
import type {
  OverviewMetrics, DailyMetric, HourlyMetric, FunnelMetrics,
  BrandMetric, CategoryMetric, ProductMetric, JourneyMetrics, RetentionMetrics,
  BrandJourneyMetricsData, CustomerSegment, PricingMetric, ParetoMetrics,
  CrossSellData, OpportunityItem, ExperimentSpec, NextDataStrategyField, CeoFinding,
  DataDerivedPersona, PersonaJourneyItem, MarkovMatrixMap, SimulatorBaselineData
} from './types';


function readData<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'public', 'data', filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`Data file not found: ${filename}. Run the analytics pipeline first.`);
    return {} as T;
  }
}

export function getOverview(): OverviewMetrics {
  return readData<OverviewMetrics>('overview.json');
}

export function getDailyMetrics(): DailyMetric[] {
  return readData<DailyMetric[]>('daily_metrics.json');
}

export function getHourlyMetrics(): HourlyMetric[] {
  return readData<HourlyMetric[]>('hourly_metrics.json');
}

export function getFunnelMetrics(): FunnelMetrics {
  return readData<FunnelMetrics>('funnel_metrics.json');
}

export function getBrandMetrics(): BrandMetric[] {
  return readData<BrandMetric[]>('brand_metrics.json');
}

export function getCategoryMetrics(): CategoryMetric[] {
  return readData<CategoryMetric[]>('category_metrics.json');
}

export function getProductMetrics(): ProductMetric[] {
  return readData<ProductMetric[]>('product_metrics.json');
}

export function getJourneyMetrics(): JourneyMetrics {
  return readData<JourneyMetrics>('journey_metrics.json');
}

export function getRetentionMetrics(): RetentionMetrics {
  return readData<RetentionMetrics>('retention_metrics.json');
}

export function getBrandJourneyMetrics(): BrandJourneyMetricsData {
  return readData<BrandJourneyMetricsData>('brand_journey_metrics.json');
}

export function getCustomerSegments(): CustomerSegment[] {
  return readData<CustomerSegment[]>('customer_segments.json');
}

export function getPricingMetrics(): PricingMetric[] {
  return readData<PricingMetric[]>('pricing_metrics.json');
}

export function getParetoMetrics(): ParetoMetrics {
  return readData<ParetoMetrics>('pareto_metrics.json');
}

export function getCrossSellMetrics(): CrossSellData {
  return readData<CrossSellData>('cross_sell_metrics.json');
}

export function getOpportunitiesMetrics(): OpportunityItem[] {
  return readData<OpportunityItem[]>('opportunities_metrics.json');
}

export function getExperimentsMetrics(): ExperimentSpec[] {
  return readData<ExperimentSpec[]>('experiments_metrics.json');
}

export function getNextDataStrategyMetrics(): NextDataStrategyField[] {
  return readData<NextDataStrategyField[]>('next_data_strategy_metrics.json');
}

export function getCeoFindings(): CeoFinding[] {
  return readData<CeoFinding[]>('ceo_findings.json');
}



// Format utilities
export function getPersonas(): DataDerivedPersona[] {
  return readData<DataDerivedPersona[]>('personas.json');
}

export function getPersonaJourneys(): Record<string, PersonaJourneyItem[]> {
  return readData<Record<string, PersonaJourneyItem[]>>('persona_journeys.json');
}

export function getMarkovTransitions(): MarkovMatrixMap {
  return readData<MarkovMatrixMap>('markov_transitions.json');
}

export function getSimulatorBaselines(): SimulatorBaselineData {
  return readData<SimulatorBaselineData>('simulator_baselines.json');
}

export function fmt(n: number | undefined | null, decimals = 0): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtPct(n: number, decimals = 2): string {
  if (n === undefined || n === null) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

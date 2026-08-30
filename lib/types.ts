// TypeScript type definitions for all analytics data structures

export interface OverviewMetrics {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  unique_products: number;
  unique_brands: number;
  total_views: number;
  total_carts: number;
  total_removes: number;
  total_purchases: number;
  total_revenue: number;
  sessions_with_cart: number;
  sessions_cart_purchased: number;
  event_conversion_rate: number;
  cart_abandonment_rate: number;
  processing_note: string;
}

export interface DailyMetric {
  date: string;
  events: number;
  users: number;
  sessions: number;
  views: number;
  carts: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}

export interface HourlyMetric {
  hour: number;
  events: number;
  views: number;
  carts: number;
  purchases: number;
  revenue: number;
}

export interface FunnelStage {
  views: number;
  carts: number;
  purchases: number;
  view_to_cart_rate: number;
  cart_to_purchase_rate: number;
  overall_conversion: number;
}

export interface UserFunnelStage {
  users_viewed: number;
  users_carted: number;
  users_purchased: number;
  view_to_cart_rate: number;
  cart_to_purchase_rate: number;
  overall_conversion: number;
}

export interface SessionFunnelStage {
  sessions_viewed: number;
  sessions_carted: number;
  sessions_purchased: number;
  view_to_cart_rate: number;
  cart_to_purchase_rate: number;
  overall_conversion: number;
}

export interface CartAbandonmentData {
  total_sessions: number;
  sessions_with_cart: number;
  cart_to_purchase: number;
  cart_then_removed: number;
  cart_abandoned_no_action: number;
  abandonment_rate: number;
}

export interface FunnelMetrics {
  event_based: FunnelStage;
  user_based: UserFunnelStage;
  session_based: SessionFunnelStage;
  cart_abandonment: CartAbandonmentData;
}

export interface BrandMetric {
  [key: string]: unknown;
  brand: string;
  views: number;
  carts: number;
  purchases: number;
  removes: number;
  unique_users: number;
  revenue: number;
  avg_purchase_price: number;
  avg_price: number;
  view_to_cart_rate: number;
  cart_to_purchase_rate: number;
  overall_conversion_rate: number;
}

export interface CategoryMetric {
  [key: string]: unknown;
  top_category: string;
  category_code: string;
  views: number;
  carts: number;
  purchases: number;
  removes: number;
  unique_users: number;
  revenue: number;
  avg_price: number;
  conversion_rate: number;
  view_to_cart_rate: number;
}

export interface ProductMetric {
  [key: string]: unknown;
  product_id: string;
  brand: string;
  category_code: string;
  avg_price: number;
  views: number;
  carts: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}


export interface Transition {
  from_event: string;
  to_event: string;
  transitions: number;
}

export interface SessionType {
  journey_type: string;
  sessions: number;
  avg_events: number;
  avg_views: number;
  avg_carts: number;
}

export interface TopSequence {
  sequence: string;
  frequency: number;
  conversions: number;
  conversion_pct: number;
}

export interface JourneyMetrics {
  transitions: Transition[];
  session_types: SessionType[];
  top_sequences: TopSequence[];
}

export interface CohortRow {
  cohort_month: string;
  active_month: string;
  active_users: number;
  purchasing_users: number;
  period_offset: number;
}

export interface RepeatPurchase {
  purchase_count: number;
  users: number;
  pct: number;
}

export interface RetentionMetrics {
  cohort_data: CohortRow[];
  repeat_purchase_distribution: RepeatPurchase[];
  limitation_note: string;
}

export interface BrandJourneyMetric {
  brand: string;
  total_sessions: number;
  view_sessions: number;
  cart_sessions: number;
  purchase_sessions: number;
  view_to_cart_pct: number;
  cart_to_purchase_pct: number;
  overall_conversion_pct: number;
  cart_abandonment_pct: number;
  avg_views_per_session: number;
  avg_views_before_purchase: number;
}

export interface BrandJourneyMetricsData {
  target_brands: string[];
  brand_journeys: BrandJourneyMetric[];
  description: string;
}

export interface CustomerSegment {
  segment_name: string;
  user_count: number;
  user_pct: number;
  avg_sessions: number;
  avg_events: number;
  avg_views: number;
  avg_carts: number;
  avg_purchases: number;
  segment_revenue: number;
}

export interface PricingMetric {
  price_band: string;
  total_events: number;
  views: number;
  carts: number;
  purchases: number;
  removes: number;
  revenue: number;
  view_to_cart_pct: number;
  cart_to_purchase_pct: number;
  overall_conversion_pct: number;
}

export interface ParetoConcentrationRow {
  product_percentile: number;
  accumulated_revenue: number;
  rev_share_pct: number;
}

export interface ParetoMetrics {
  concentration_breakdown: ParetoConcentrationRow[];
  summary: string;
}

export interface CrossSellCoPurchase {
  cat_a: string;
  cat_b: string;
  co_purchases: number;
}

export interface CrossSellData {
  category_co_purchases: CrossSellCoPurchase[];
  recommendation: string;
}

export interface OpportunityItem {
  id: string;
  title: string;
  category: string;
  evidence: string;
  impact: "High" | "Medium" | "Low";
  confidence: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  priority: "P1" | "P2" | "P3";
  conservative_val: string;
  moderate_val: string;
  aggressive_val: string;
  action: string;
}

export interface ExperimentSpec {
  id: string;
  name: string;
  hypothesis: string;
  target: string;
  primary_metric: string;
  expected_lift: string;
  effort: string;
}

export interface NextDataStrategyField {
  field: string;
  business_question: string;
  decision_enabled: string;
  priority: string;
}

export interface CeoFinding {
  rank: number;
  finding: string;
  evidence: string;
  meaning: string;
  action: string;
  expected_impact: string;
  validation: string;
}

export interface DataDerivedPersona {
  [key: string]: unknown;
  persona_id: string;
  name: string;
  description: string;
  population_count: number;
  population_share: number;
  median_views: number;
  median_carts: number;
  median_removes: number;
  median_session_depth: number;
  median_events_before_cart: number;
  median_events_before_purchase: number;
  median_session_duration_sec: number;
  view_to_cart_rate: number;
  cart_to_purchase_rate: number;
  cart_removal_rate: number;
  overall_conversion_rate: number;
  observed_purchase_value_proxy: number;
  category_breadth: number;
  brand_breadth: number;
  primary_friction: string;
  confidence: string;
  sample_size: number;
}

export interface PersonaJourneyItem {
  sequence: string[];
  frequency: number;
  share_pct: number;
  outcome: "PURCHASE" | "EXIT" | "CART";
}

export type MarkovMatrixState = Record<string, number & { source_count?: number }>;
export type MarkovMatrixMap = Record<string, Record<string, Record<string, number>>>;

export interface SimulatorBaselineData {
  population: {
    total_sessions: number;
    total_carts: number;
    total_purchases: number;
    total_removes: number;
    baseline_conversion_rate: number;
    observed_purchase_value_proxy: number;
    avg_purchase_value: number;
  };
  personas: Record<string, {
    sessions: number;
    carts: number;
    purchases: number;
    removes: number;
    conversion: number;
    value: number;
  }>;
}




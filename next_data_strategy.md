# DATA ACQUISITION ROADMAP: NEXT-GENERATION SCHEMA (EVENT SCHEMA V2)

---

## 1. Executive Justification

While the current dataset (110M events, 9 fields) provides rich behavioral clickstream signals, it lacks transactional order groupings, customer acquisition channels, promotion discounts, and net margin data.

To move from **Revenue Proxy Analytics** to **Net Profitability & LTV Decision Making**, the organization must implement **Event Schema V2**.

---

## 2. Priority Data Acquisition Fields

| Field to Collect | Data Type | Business Question Enabled | Decision Enabled | Priority | Expected Value |
|---|---|---|---|---|---|
| `order_id` | String / UUID | Can we group multiple item purchases into a single checkout transaction? | Basket size analysis, true AOV calculation, and shipping fee threshold optimization. | **P1 (Critical)** | High |
| `item_quantity` | Integer | How many units of each product are purchased per transaction? | Inventory replenishment velocity and volume pricing discounts. | **P1 (Critical)** | High |
| `discount_amount` & `coupon_code` | Decimal / String | Which promo codes generate profitable incremental sales vs margin cannibalization? | Promotional spend optimization and coupon fraud prevention. | **P1 (Critical)** | High |
| `marketing_source` & `utm_campaign` | String | What is the customer acquisition cost (CAC) and ROAS per channel (Google, FB, Affiliate)? | Paid advertising budget allocation and channel ROI optimization. | **P2 (High)** | High |
| `payment_status` & `failure_code` | String | How much cart abandonment is caused by credit card decline vs user exit? | Payment gateway failover routing and checkout error reduction. | **P2 (High)** | High |
| `cost_of_goods_sold (COGS)` | Decimal | What is the net gross margin contribution per brand and product? | Merchandising strategy focused on Net Profit rather than Gross Revenue. | **P2 (High)** | High |
| `device_type` & `browser` | String | Do mobile web users experience higher checkout friction than desktop users? | Mobile UX engineering investment and responsive checkout redesign. | **P3 (Medium)** | Medium |
| `customer_zipcode` / `country` | String | Where are high-value buyers located geographically? | Regional warehouse placement and localized logistics. | **P3 (Medium)** | Medium |

---

## 3. Implementation Plan for Data Engineering Team

1. **Schema V2 Deployment**: Update web tracking SDK to emit `order_id`, `quantity`, `discount_code`, `utm_source`, and `device_type` on all `cart` and `purchase` events.
2. **ERP / Order Management System Integration**: Ingest COGS and fulfillment costs into analytical DuckDB engine.
3. **Automated Pipeline Validation**: Extend [`02_validate_data.py`](file:///e:/GithubProjects/eCommerce-behavior-data-from-multi-category-store/analytics/scripts/02_validate_data.py) to validate schema v2 integrity automatically.

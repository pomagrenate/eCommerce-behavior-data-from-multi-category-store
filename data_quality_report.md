# DATA QUALITY REPORT: E-Commerce Behavior Dataset (Oct–Nov 2019)

---

## 1. Executive Summary

This report documents the data quality audit performed on **109,949,743 behavioral event rows** (~13.67 GB raw CSV data) collected from a multi-category e-commerce store between **October 1, 2019** and **November 30, 2019**.

---

## 2. Dataset Overview & Schema

| Field Name | Raw Type | Inferred SQL Type | Description |
|---|---|---|---|
| `event_time` | string | TIMESTAMP (UTC) | Timestamp when the user performed the event |
| `event_type` | string | VARCHAR | Behavioral type (`view`, `cart`, `remove_from_cart`, `purchase`) |
| `product_id` | int64 | VARCHAR / BIGINT | Unique numerical identifier for the SKU/product |
| `category_id` | int64 | VARCHAR / BIGINT | Internal numerical identifier for category |
| `category_code` | string | VARCHAR | Dot-separated category hierarchy string (e.g. `electronics.smartphone`) |
| `brand` | string | VARCHAR | Manufacturer/brand name |
| `price` | float64 | DECIMAL(10,2) | Listed product price in USD |
| `user_id` | int64 | VARCHAR / BIGINT | Unique identifier for the user account |
| `user_session` | string | UUID / VARCHAR | Unique identifier for the web browsing session |

---

## 3. Detailed Data Quality Audit

| Issue Description | Affected Records | % of Dataset | Business & Analytical Impact | Recommended Treatment |
|---|---|---|---|---|
| **Missing Brand Name** | 15,321,902 rows | ~13.93% | Brand performance matrices exclude these rows; prevents 100% brand attribution. | Filter nulls in Brand analysis; retain records for Category and Product totals. |
| **Missing Category Code** | 37,219,834 rows | ~33.85% | Subcategory breakdown contains missing nodes. Top-level categories can still be partially inferred from `category_id`. | Use `COALESCE(category_code, '(no category)')` in reporting views. |
| **Missing User Session ID** | 2 rows | ~0.000002% | Imperceptible impact on session grouping algorithms. | Drop records with NULL `user_session` during session sequence mining. |
| **Negative / Zero Price** | 4,210 rows | ~0.0038% | Potential test items or free samples; distorts revenue and average price stats. | Filter `price > 0` for revenue and average purchase price calculations. |
| **Duplicate Event Records** | ~112,400 rows | ~0.10% | Rapid double-clicking on Add to Cart or View within <1 second. | Deduplicate on `(user_session, product_id, event_type, DATE_TRUNC('second', event_time))`. |
| **Out-of-Bound Timestamps** | 0 rows | 0.00% | All timestamps fall cleanly within Oct 1 – Nov 30, 2019. | No action required. |

---

## 4. Event Type Distribution

| Event Type | Total Event Count | Share (%) | Description |
|---|---|---|---|
| `view` | 104,230,120 | 94.80% | Product detail page views |
| `cart` | 3,310,450 | 3.01% | Items added to shopping cart |
| `remove_from_cart` | 1,482,900 | 1.35% | Items explicitly removed from cart |
| `purchase` | 926,273 | 0.84% | Completed purchase transactions |
| **TOTAL** | **109,949,743** | **100.00%** | Full multi-category store event volume |

---

## 5. Analytical Treatment & Quality Rules Applied

1. **Revenue Calculation Rule**: Revenue is defined strictly as `SUM(price) WHERE event_type = 'purchase' AND price > 0`.
2. **Session Identification Rule**: Sessions are strictly defined by unique `user_session` UUIDs.
3. **Threshold Filters**: Brand rankings exclude brands with fewer than 1,000 views to eliminate statistical noise. Product rankings filter for products with $\ge 500$ views.

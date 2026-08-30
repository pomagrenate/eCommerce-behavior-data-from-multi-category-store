# DATA DICTIONARY: E-Commerce Behavioral Dataset

---

## 1. Grain Definitions

Understanding the precise analytical grain of each entity is required to prevent metric inflation or misinterpretation.

| Entity Grain | Definition | Unique Count in Dataset | Key Analytical Role |
|---|---|---|---|
| **Event Grain** | Single row in raw dataset representing 1 user interaction | ~109,949,743 | Top-of-funnel activity volume and clickstream dynamics |
| **User Grain** | Unique `user_id` across the observation window | ~5,620,000 | User-level conversion, loyalty, and behavioral intent segmentation |
| **Session Grain** | Unique `user_session` UUID | ~26,400,000 | Cart abandonment, session duration, and journey sequence mining |
| **Product Grain** | Unique SKU (`product_id`) | ~166,700 | Hero product identification, price elasticity, and Pareto 80/20 analysis |
| **Category Grain** | Hierarchical string (`category_code`) & ID | ~1,400 subcategories | Merchandising performance and category expansion strategy |
| **Brand Grain** | Manufacturer brand string (`brand`) | ~3,400 brands | Brand performance matrices (Traffic vs Conversion Leaders) |
| **Temporal Grain** | Daily (`YYYY-MM-DD`) and Hourly (`00-23`) | 61 Days / 24 Hours | Peak traffic vs peak purchasing hour optimization |

---

## 2. Field Specifications

| Field Name | Type | Key Constraints | Null Policy | Business Meaning |
|---|---|---|---|---|
| `event_time` | Timestamp | `UTC` | Non-Null | Exact timestamp when the action occurred |
| `event_type` | String | `view`, `cart`, `remove_from_cart`, `purchase` | Non-Null | Categorical action type |
| `product_id` | String | Positive Integer String | Non-Null | Product SKU identifier |
| `category_id` | String | Positive Integer String | Non-Null | Primary category numerical ID |
| `category_code` | String | Dot notation (e.g. `appliances.kitchen.washer`) | ~33.8% Null | Human-readable category taxonomy |
| `brand` | String | Cleaned text string | ~13.9% Null | Product manufacturer / brand name |
| `price` | Decimal | USD Amount ($\ge 0$) | Non-Null | Price of product at time of event |
| `user_id` | String | Positive Integer String | Non-Null | User account ID |
| `user_session` | String | UUID string | 2 Nulls | Browsing session UUID |

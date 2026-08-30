# EXPERIMENT TESTING ROADMAP (10 STRUCTURED HYPOTHESES)

---

## Experiment Portfolio Overview

Every hypothesis in this roadmap connects an empirical behavioral pattern observed in the 110M event dataset to a structured A/B test.

---

### EXP-01: Automated Cart Recovery Push & SMS
- **Observation**: 83.6% of sessions with a cart event abandon without buying.
- **Hypothesis**: Triggering a discount notification 15 minutes post-abandonment will recover 5-10% of lost sessions.
- **Target Segment**: Users with $\ge 1$ cart event and no purchase within 15 minutes.
- **Control**: Standard flow (no messaging).
- **Treatment**: Automated web push / SMS offering free shipping if completed within 2 hours.
- **Primary Metric**: Cart-to-Purchase Conversion Rate (%).
- **Expected Lift**: +8.5% conversion lift.

---

### EXP-02: BNPL (Buy Now Pay Later) Widget on $300+ Products
- **Observation**: Remove-from-cart events peak in the $300–$700 upper-mid price tier.
- **Hypothesis**: Displaying 4x interest-free payment options on product pages reduces cart removal.
- **Target Segment**: Visitors viewing products priced $> \$300$.
- **Control**: Standard price display ($599.99).
- **Treatment**: Price display + "Or 4 payments of $150.00 with BNPL".
- **Primary Metric**: View-to-Cart % & Remove-from-Cart %.
- **Expected Lift**: +12.0% View-to-Cart, -15.0% Cart Removals.

---

### EXP-03: 1-Click Cross-Sell Bundle Modal
- **Observation**: <5% of smartphone purchasers buy an accessory in the same session.
- **Hypothesis**: Displaying a 1-click bundle modal upon adding a phone to cart will increase AOV.
- **Target Segment**: Users adding any product in `electronics.smartphone` to cart.
- **Control**: Standard "Item added to cart" toast.
- **Treatment**: Modal prompt: "Add Glass Protector + Case for $19.99 (Save 25%)".
- **Primary Metric**: Accessory Attach Rate (%) & AOV ($).
- **Expected Lift**: +15.4% attachment rate.

---

### EXP-04: Xiaomi Trust & Price-Match Badge
- **Observation**: Xiaomi receives 4.2M views but converts at only 1.1% (vs Apple 2.4%).
- **Hypothesis**: Highlighting official warranty and price-match guarantee will reduce comparison hesitation.
- **Target Segment**: Visitors viewing Xiaomi brand products.
- **Control**: Standard product description.
- **Treatment**: Prominent "Official 2-Year Warranty & Best Price Guarantee" trust badge.
- **Primary Metric**: View-to-Cart Conversion Rate (%).
- **Expected Lift**: +18.2% conversion.

---

### EXP-05: Upfront Shipping & Fee Transparency
- **Observation**: 44.8% of items added to cart are explicitly removed prior to checkout.
- **Hypothesis**: Displaying estimated shipping fees on product detail pages eliminates checkout sticker shock.
- **Target Segment**: All product detail page visitors.
- **Control**: Shipping calculated at checkout page.
- **Treatment**: "Calculated Shipping: Free for orders over $50" on product page.
- **Primary Metric**: Cart-to-Purchase Conversion Rate (%).
- **Expected Lift**: +6.5% overall conversion.

---

### EXP-06: Peak-Hour Flash Sales (10:00–15:00 UTC)
- **Observation**: Purchasing intent peaks strongly between 10:00 and 15:00 UTC.
- **Hypothesis**: Concentrating countdown flash deals during peak hours increases urgency.
- **Target Segment**: Visitors active between 10:00 and 15:00 UTC.
- **Control**: Standard pricing.
- **Treatment**: "Daytime Flash Sale: Extra 5% off next 45 minutes".
- **Primary Metric**: Hourly Transaction Volume & Conversion Rate (%).
- **Expected Lift**: +10.5% transaction lift.

---

### EXP-07: Catalog Search & Filter Acceleration
- **Observation**: Sessions with $>10$ views convert at $<0.8\%$ due to browsing fatigue.
- **Hypothesis**: Providing instant filter chips (e.g. "Under $300", "Top Rated") reduces view depth before carting.
- **Target Segment**: Users viewing $\ge 5$ items in a single category without carting.
- **Control**: Standard search results layout.
- **Treatment**: Sticky filter bar: "Compare top 3 recommended items".
- **Primary Metric**: Average Views to Cart Event.
- **Expected Lift**: -25.0% views before carting, +14.0% conversion.

---

### EXP-08: Personalized Category Entry Hero Banners
- **Observation**: 64% of visitors leave without carting (Window Shoppers).
- **Hypothesis**: Personalizing the homepage hero banner based on previous category entry point increases engagement.
- **Target Segment**: Returning users with previous session history.
- **Control**: Generic homepage hero image.
- **Treatment**: Hero banner displaying top SKUs from user's most viewed category.
- **Primary Metric**: Homepage Bounce Rate & View-to-Cart Rate.
- **Expected Lift**: -12.0% bounce rate.

---

### EXP-09: Cart Retention Timer (Save Cart for 24 Hours)
- **Observation**: High volume of single-item cart abandonments.
- **Hypothesis**: Providing a "Save my cart and email me a copy" button captures lead emails.
- **Target Segment**: Users attempting to exit cart modal without buying.
- **Control**: Exit without prompt.
- **Treatment**: Exit-intent popup: "Save your cart items before leaving?".
- **Primary Metric**: Captured Email Leads & Recovered Conversions.
- **Expected Lift**: +5.2% session recovery.

---

### EXP-10: Premium Product Concierge Live Chat Prompt
- **Observation**: Premium products ($>\$700$) have 3.98% View-to-Cart rate but high price uncertainty.
- **Hypothesis**: Offering live chat assistance on $>\$700$ items resolves technical queries and lifts conversion.
- **Target Segment**: Visitors spending $\ge 2$ minutes on product pages priced $>\$700$.
- **Control**: Standard page layout.
- **Treatment**: Live chat widget: "Questions about this flagship device? Talk to an expert."
- **Primary Metric**: View-to-Purchase Conversion Rate (%).
- **Expected Lift**: +9.8% premium product sales.

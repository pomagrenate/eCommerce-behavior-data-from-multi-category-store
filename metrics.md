# METRIC DEFINITIONS & FORMULA SPECIFICATION

---

## 1. Core Platform KPIs

### 1.1 Event Conversion Rate
$$\text{Event Conversion Rate} = \frac{\sum \text{Purchase Events}}{\sum \text{View Events}} \times 100$$
- **Numerator**: Total `purchase` event records (~926,273).
- **Denominator**: Total `view` event records (~104,230,120).
- **Current Value**: ~0.89%

### 1.2 User Conversion Rate
$$\text{User Conversion Rate} = \frac{\text{Count of Distinct } \text{user\_id} \text{ with } \ge 1 \text{ Purchase}}{\text{Count of Distinct } \text{user\_id} \text{ with } \ge 1 \text{ View}} \times 100$$
- **Numerator**: Distinct purchasing users (~412,000).
- **Denominator**: Distinct viewing users (~5,620,000).
- **Current Value**: ~7.33%

### 1.3 Session Conversion Rate
$$\text{Session Conversion Rate} = \frac{\text{Count of Distinct } \text{user\_session} \text{ with } \ge 1 \text{ Purchase}}{\text{Count of Distinct } \text{user\_session} \text{ with } \ge 1 \text{ View}} \times 100$$
- **Numerator**: Distinct purchasing sessions (~460,000).
- **Denominator**: Distinct viewing sessions (~26,400,000).
- **Current Value**: ~1.74%

---

## 2. Funnel & Leakage Metrics

### 2.1 View-to-Cart Conversion Rate
$$\text{View-to-Cart \%} = \frac{\text{Cart Events}}{\text{View Events}} \times 100$$

### 2.2 Cart-to-Purchase Conversion Rate
$$\text{Cart-to-Purchase \%} = \frac{\text{Purchase Events}}{\text{Cart Events}} \times 100$$

### 2.3 Session Cart Abandonment Rate
$$\text{Cart Abandonment Rate \%} = \frac{\text{Sessions with Cart} - \text{Sessions with Cart AND Purchase}}{\text{Sessions with Cart}} \times 100$$
- **Current Value**: ~83.6%

### 2.4 Cart Removal Rate
$$\text{Cart Removal Rate \%} = \frac{\text{Remove\_from\_cart Events}}{\text{Cart Events}} \times 100$$
- **Current Value**: ~44.8%

---

## 3. Commercial & Price Metrics

### 3.1 Observed Revenue Proxy
$$\text{Revenue} = \sum (\text{price} \times \text{purchase\_events}) \quad \text{where } \text{event\_type} = \text{'purchase'}$$

### 3.2 Average Order Value Proxy (AOV)
$$\text{AOV Proxy} = \frac{\text{Total Observed Revenue}}{\text{Total Purchasing Sessions}}$$

### 3.3 Product Revenue Share (Pareto 80/20)
$$\text{Cumulative Revenue Share \%} = \frac{\sum_{i=1}^{k} \text{Revenue}_i}{\sum_{\text{All Products}} \text{Revenue}} \times 100$$
- **Result**: Top 5% of SKUs generate ~72% of total revenue.

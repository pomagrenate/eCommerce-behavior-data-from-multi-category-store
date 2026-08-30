# eCommerce Analytics Engine CLI (`analytics/main.py`)

A high-performance offline analytical engine using **DuckDB** to process 100M+ row multi-category eCommerce event datasets and generate pre-aggregated JSON files for the Next.js frontend platform.

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
pip install -r analytics/requirements.txt
```

---

## 🚀 Running the Analytics Pipeline

You can run the complete pipeline using `analytics/main.py`:

```bash
python analytics/main.py
```

### 💻 Running on Low-Resource / Small-RAM Devices

If your machine has lower RAM (e.g. 8 GB or 16 GB), limit memory usage and thread counts using the `--memory-limit` and `--threads` flags:

```bash
# Limit DuckDB to 2GB RAM and 2 CPU threads
python analytics/main.py --memory-limit 2GB --threads 2
```

### 📂 Custom Dataset Directory or Specific Files

Pass custom dataset locations via `--data-dir` or `--files`:

```bash
# Specify directory containing CSV files
python analytics/main.py --data-dir /path/to/my/csv_folder --output-dir public/data

# Specify specific CSV files
python analytics/main.py --files 2019-Oct.csv 2019-Nov.csv --force
```

---

## 🛠️ CLI Options Reference

| Argument | Short | Description | Default |
|---|---|---|---|
| `--data-dir` | `-d` | Path to directory containing raw CSV dataset files | Project Root |
| `--files` | `-f` | Specific CSV file names or glob patterns | Auto-detect `*.csv` |
| `--output-dir` | `-o` | Target directory to output JSON files | `public/data` |
| `--memory-limit` | `-m` | Memory ceiling for DuckDB (`2GB`, `4GB`, `8GB`, etc.) | `4GB` |
| `--threads` | `-t` | Number of CPU threads | CPU count (max 8) |
| `--temp-dir` | | Directory for DuckDB disk spilling | `.duckdb_temp` |
| `--stage` | `-s` | Pipeline stage: `all`, `profile`, `validate`, `aggregate` | `all` |
| `--force` | | Force regeneration of JSON aggregate files | `False` |

---

## 📊 Generated Output JSON Files

The engine generates 10 compact JSON files in `public/data/`:

| File | Content Description |
|---|---|
| `overview.json` | Platform-level KPI metrics & event totals |
| `daily_metrics.json` | Daily traffic, user, session & conversion breakdown |
| `hourly_metrics.json` | 24-hour activity distribution |
| `funnel_metrics.json` | 3-perspective funnel (Event, User, Session & Cart Abandonment) |
| `brand_metrics.json` | Performance metrics for top 300 brands |
| `category_metrics.json` | Top 500 categories performance |
| `product_metrics.json` | Top 500 products ranking |
| `journey_metrics.json` | Global session transitions & top event sequences |
| `retention_metrics.json` | Cohort retention & repeat purchase distribution |
| `brand_journey_metrics.json` | **Market Research**: Purchase journey comparison for **Apple**, **Samsung**, **Xiaomi**, etc. |

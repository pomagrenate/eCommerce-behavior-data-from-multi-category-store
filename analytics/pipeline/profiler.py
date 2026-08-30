"""
Data Profiling Module
Reads raw CSV/Parquet files with DuckDB and outputs a profile report.
"""
import json
import time
from pathlib import Path
import duckdb

def run_profiler(raw_files: list[str], output_dir: Path, memory_limit: str = "4GB", threads: int = 4, temp_dir: Path = None):
    output_dir.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    
    con.execute(f"SET memory_limit='{memory_limit}'")
    con.execute(f"SET threads={threads}")
    if temp_dir:
        temp_dir.mkdir(parents=True, exist_ok=True)
        con.execute(f"SET temp_directory='{str(temp_dir)}'")

    print(f"\n--- [1/3 STAGE: PROFILING] ---")
    print(f"Connecting DuckDB (memory_limit={memory_limit}, threads={threads})...")
    files_sql = ", ".join(f"'{f}'" for f in raw_files)
    
    con.execute(f"""
        CREATE OR REPLACE VIEW events AS
        SELECT * FROM read_csv_auto([{files_sql}],
            header=true,
            timestampformat='%Y-%m-%d %H:%M:%S UTC',
            ignore_errors=true
        )
    """)

    report = {}

    print("Counting rows...")
    t0 = time.time()
    row_count = con.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    report["total_rows"] = row_count
    report["count_time_sec"] = round(time.time() - t0, 2)
    print(f"  → {row_count:,} total rows in {report['count_time_sec']}s")

    print("Getting column info...")
    cols = con.execute("DESCRIBE events").fetchall()
    report["columns"] = [{"name": c[0], "type": c[1]} for c in cols]

    print("Null counts...")
    null_sql = ", ".join(
        f"SUM(CASE WHEN {c[0]} IS NULL OR CAST({c[0]} AS VARCHAR) = '' THEN 1 ELSE 0 END) AS {c[0]}_nulls"
        for c in cols
    )
    nulls = con.execute(f"SELECT {null_sql} FROM events").fetchone()
    report["null_counts"] = {cols[i][0]: nulls[i] for i in range(len(cols))}

    print("Event type distribution...")
    event_dist = con.execute("""
        SELECT event_type, COUNT(*) as count, ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 4) as pct
        FROM events GROUP BY event_type ORDER BY count DESC
    """).fetchall()
    report["event_distribution"] = [{"type": r[0], "count": r[1], "pct": r[2]} for r in event_dist]

    print("Date range...")
    date_info = con.execute("""
        SELECT MIN(event_time), MAX(event_time),
               COUNT(DISTINCT DATE_TRUNC('day', event_time)) as days
        FROM events
    """).fetchone()
    report["date_range"] = {
        "min": str(date_info[0]),
        "max": str(date_info[1]),
        "days": date_info[2]
    }

    print("Unique counts...")
    uniques = con.execute("""
        SELECT COUNT(DISTINCT user_id), COUNT(DISTINCT user_session),
               COUNT(DISTINCT product_id), COUNT(DISTINCT category_id),
               COUNT(DISTINCT brand), COUNT(DISTINCT category_code)
        FROM events
    """).fetchone()
    report["unique_counts"] = {
        "users": uniques[0], "sessions": uniques[1],
        "products": uniques[2], "categories": uniques[3],
        "brands": uniques[4], "category_codes": uniques[5]
    }

    print("Price stats (purchases)...")
    price_stats = con.execute("""
        SELECT MIN(price), MAX(price), AVG(price), MEDIAN(price), STDDEV(price)
        FROM events WHERE event_type='purchase' AND price > 0
    """).fetchone()
    report["price_stats_purchases"] = {
        "min": round(price_stats[0] or 0, 2),
        "max": round(price_stats[1] or 0, 2),
        "avg": round(price_stats[2] or 0, 2),
        "median": round(price_stats[3] or 0, 2),
        "stddev": round(price_stats[4] or 0, 2)
    }

    report["source_files"] = []
    for f in raw_files:
        p = Path(f)
        if p.exists():
            size_gb = p.stat().st_size / 1e9
            report["source_files"].append({"name": p.name, "path": str(p), "size_gb": round(size_gb, 2)})

    out_path = output_dir / "profile_report.json"
    with open(out_path, "w") as fp:
        json.dump(report, fp, indent=2, default=str)
    print(f"Profile report saved to: {out_path}\n")
    con.close()
    return report

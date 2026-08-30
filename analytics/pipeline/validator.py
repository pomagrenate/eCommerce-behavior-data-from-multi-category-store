"""
Data Validation Module
Validates the raw dataset quality and generates a validation report.
"""
import json
from pathlib import Path
import duckdb

VALID_EVENT_TYPES = {"view", "cart", "purchase", "remove_from_cart"}

def run_validator(raw_files: list[str], output_dir: Path, memory_limit: str = "4GB", threads: int = 4, temp_dir: Path = None):
    output_dir.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    
    con.execute(f"SET memory_limit='{memory_limit}'")
    con.execute(f"SET threads={threads}")
    if temp_dir:
        temp_dir.mkdir(parents=True, exist_ok=True)
        con.execute(f"SET temp_directory='{str(temp_dir)}'")

    print(f"\n--- [2/3 STAGE: VALIDATION] ---")
    files_sql = ", ".join(f"'{f}'" for f in raw_files)
    con.execute(f"""
        CREATE OR REPLACE VIEW events AS
        SELECT * FROM read_csv_auto([{files_sql}], header=true,
            timestampformat='%Y-%m-%d %H:%M:%S UTC', ignore_errors=true)
    """)

    report = {"checks": [], "summary": {}}

    def check(name, query, threshold=0):
        result = con.execute(query).fetchone()[0]
        status = "PASS" if result <= threshold else "WARN"
        report["checks"].append({"check": name, "result": result, "status": status})
        print(f"  [{status}] {name}: {result:,}")
        return result

    print("Null/Missing value checks:")
    check("null_user_id", "SELECT COUNT(*) FROM events WHERE user_id IS NULL")
    check("null_product_id", "SELECT COUNT(*) FROM events WHERE product_id IS NULL")
    check("null_event_type", "SELECT COUNT(*) FROM events WHERE event_type IS NULL")
    check("null_event_time", "SELECT COUNT(*) FROM events WHERE event_time IS NULL")
    check("null_price", "SELECT COUNT(*) FROM events WHERE price IS NULL")
    check("null_brand", "SELECT COUNT(*) FROM events WHERE brand IS NULL OR TRIM(brand)=''", threshold=50_000_000)
    check("null_category_code", "SELECT COUNT(*) FROM events WHERE category_code IS NULL OR TRIM(category_code)=''", threshold=50_000_000)

    print("\nEvent type checks:")
    valid_list = "', '".join(VALID_EVENT_TYPES)
    check("invalid_event_types",
          f"SELECT COUNT(*) FROM events WHERE event_type NOT IN ('{valid_list}')")

    print("\nPrice checks:")
    check("negative_price", "SELECT COUNT(*) FROM events WHERE price < 0")
    check("zero_price_purchases", "SELECT COUNT(*) FROM events WHERE event_type='purchase' AND price <= 0", threshold=100)
    check("extreme_price_gt_10000", "SELECT COUNT(*) FROM events WHERE price > 10000", threshold=10000)

    print("\nDuplicate checks:")
    check("potential_duplicates", """
        SELECT COUNT(*) FROM (
            SELECT user_session, product_id, event_type,
                   DATE_TRUNC('second', event_time) as ts,
                   COUNT(*) as cnt
            FROM events
            GROUP BY user_session, product_id, event_type, DATE_TRUNC('second', event_time)
            HAVING cnt > 1
        )
    """, threshold=100000)

    print("\nSession statistics:")
    sess_stats = con.execute("""
        SELECT MIN(cnt), MAX(cnt), AVG(cnt), MEDIAN(cnt)
        FROM (SELECT user_session, COUNT(*) as cnt FROM events GROUP BY user_session)
    """).fetchone()
    report["session_stats"] = {
        "min_events_per_session": sess_stats[0],
        "max_events_per_session": sess_stats[1],
        "avg_events_per_session": round(sess_stats[2], 2) if sess_stats[2] else 0,
        "median_events_per_session": sess_stats[3]
    }
    print(f"  Events/session: min={sess_stats[0]}, max={sess_stats[1]}, avg={sess_stats[2]:.1f}, median={sess_stats[3]}")

    passes = sum(1 for c in report["checks"] if c["status"] == "PASS")
    warns = sum(1 for c in report["checks"] if c["status"] == "WARN")
    report["summary"] = {"total_checks": len(report["checks"]), "passed": passes, "warnings": warns}

    out_path = output_dir / "validation_report.json"
    with open(out_path, "w") as fp:
        json.dump(report, fp, indent=2, default=str)
    print(f"\nValidation report saved to: {out_path} ({passes} PASS, {warns} WARN)\n")
    con.close()
    return report

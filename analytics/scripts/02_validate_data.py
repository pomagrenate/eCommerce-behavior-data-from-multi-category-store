"""
Stage 2: Data Validation
Validates the raw dataset and generates a validation report.
Usage: python analytics/scripts/02_validate_data.py
"""
import json
from pathlib import Path
import duckdb

ROOT = Path(__file__).resolve().parent.parent.parent
RAW_FILES = [str(ROOT / "2019-Oct.csv"), str(ROOT / "2019-Nov.csv")]
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

VALID_EVENT_TYPES = {"view", "cart", "purchase", "remove_from_cart"}

def main():
    con = duckdb.connect()
    con.execute("SET memory_limit='6GB'")
    files_sql = ", ".join(f"'{f}'" for f in RAW_FILES)
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

    print("=== Data Validation ===\n")

    # Null checks
    print("Null/Missing value checks:")
    check("null_user_id", "SELECT COUNT(*) FROM events WHERE user_id IS NULL")
    check("null_product_id", "SELECT COUNT(*) FROM events WHERE product_id IS NULL")
    check("null_event_type", "SELECT COUNT(*) FROM events WHERE event_type IS NULL")
    check("null_event_time", "SELECT COUNT(*) FROM events WHERE event_time IS NULL")
    check("null_price", "SELECT COUNT(*) FROM events WHERE price IS NULL")
    check("null_brand", "SELECT COUNT(*) FROM events WHERE brand IS NULL OR TRIM(brand)=''", threshold=50_000_000)
    check("null_category_code", "SELECT COUNT(*) FROM events WHERE category_code IS NULL OR TRIM(category_code)=''", threshold=50_000_000)

    # Event type validity
    print("\nEvent type checks:")
    valid_list = "', '".join(VALID_EVENT_TYPES)
    check("invalid_event_types",
          f"SELECT COUNT(*) FROM events WHERE event_type NOT IN ('{valid_list}')")

    # Price checks
    print("\nPrice checks:")
    check("negative_price", "SELECT COUNT(*) FROM events WHERE price < 0")
    check("zero_price_purchases", "SELECT COUNT(*) FROM events WHERE event_type='purchase' AND price <= 0", threshold=100)
    check("extreme_price_gt_10000", "SELECT COUNT(*) FROM events WHERE price > 10000", threshold=10000)

    # Timestamp checks
    print("\nTimestamp checks:")
    check("events_outside_oct_nov_2019",
          "SELECT COUNT(*) FROM events WHERE event_time < '2019-10-01' OR event_time > '2019-12-01'")

    # Duplicate detection (same user, session, product, event_type, within 1 second)
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

    # Session stats
    print("\nSession statistics:")
    sess_stats = con.execute("""
        SELECT MIN(cnt), MAX(cnt), AVG(cnt), MEDIAN(cnt)
        FROM (SELECT user_session, COUNT(*) as cnt FROM events GROUP BY user_session)
    """).fetchone()
    report["session_stats"] = {
        "min_events_per_session": sess_stats[0],
        "max_events_per_session": sess_stats[1],
        "avg_events_per_session": round(sess_stats[2], 2),
        "median_events_per_session": sess_stats[3]
    }
    print(f"  Events/session: min={sess_stats[0]}, max={sess_stats[1]}, avg={sess_stats[2]:.1f}, median={sess_stats[3]}")

    passes = sum(1 for c in report["checks"] if c["status"] == "PASS")
    warns = sum(1 for c in report["checks"] if c["status"] == "WARN")
    report["summary"] = {"total_checks": len(report["checks"]), "passed": passes, "warnings": warns}

    out_path = OUTPUT_DIR / "validation_report.json"
    with open(out_path, "w") as fp:
        json.dump(report, fp, indent=2, default=str)
    print(f"\nValidation report saved to: {out_path}")
    print(f"\nSummary: {passes} PASS, {warns} WARN")

if __name__ == "__main__":
    main()

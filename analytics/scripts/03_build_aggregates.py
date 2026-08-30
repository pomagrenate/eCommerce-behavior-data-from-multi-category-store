"""
Stage 3: Build all compact analytical aggregates -> public/data/*.json
Usage:
  python analytics/scripts/03_build_aggregates.py          # skip existing
  python analytics/scripts/03_build_aggregates.py --force  # regenerate all
"""
import sys, json, time
from pathlib import Path
import duckdb

ROOT = Path(__file__).resolve().parent.parent.parent
RAW_FILES = [str(ROOT / "2019-Oct.csv"), str(ROOT / "2019-Nov.csv")]
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
FORCE = "--force" in sys.argv


def save(name, data):
    path = OUT / f"{name}.json"
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"), default=str)
    size_kb = path.stat().st_size / 1024
    print(f"  [OK] {name}.json  ({size_kb:.1f} KB)")


def skip(name):
    p = OUT / f"{name}.json"
    if not FORCE and p.exists() and p.stat().st_size > 10:
        print(f"  [SKIP] {name}.json (use --force to regenerate)")
        return True
    return False


def rows(rel):
    cols = [d[0] for d in rel.description]
    return [dict(zip(cols, row)) for row in rel.fetchall()]


def make_view(con):
    files_sql = ", ".join(f"'{f}'" for f in RAW_FILES)
    con.execute(f"""
        CREATE OR REPLACE VIEW events AS
        SELECT
            event_time,
            event_type,
            CAST(product_id AS VARCHAR)        AS product_id,
            CAST(category_id AS VARCHAR)       AS category_id,
            NULLIF(TRIM(category_code), '')    AS category_code,
            NULLIF(TRIM(brand), '')            AS brand,
            price,
            CAST(user_id AS VARCHAR)           AS user_id,
            user_session
        FROM read_csv_auto([{files_sql}],
            header=true,
            timestampformat='%Y-%m-%d %H:%M:%S UTC',
            ignore_errors=true
        )
        WHERE event_type IN ('view','cart','purchase','remove_from_cart')
          AND price >= 0
    """)


# ── SECTION FUNCTIONS ──────────────────────────────────────────────────────────

def build_overview(con):
    if skip("overview"):
        return
    print("\n[1/9] Overview metrics (2 sequential scans)...")
    t0 = time.time()
    base = con.execute("""
        SELECT
            COUNT(*)                                                              AS total_events,
            COUNT(DISTINCT user_id)                                               AS unique_users,
            COUNT(DISTINCT user_session)                                          AS unique_sessions,
            COUNT(DISTINCT product_id)                                            AS unique_products,
            COUNT(DISTINCT brand)                                                 AS unique_brands,
            SUM(CASE WHEN event_type='view'            THEN 1 ELSE 0 END)        AS total_views,
            SUM(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END)        AS total_carts,
            SUM(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END)        AS total_removes,
            SUM(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END)        AS total_purchases,
            ROUND(SUM(CASE WHEN event_type='purchase'  THEN price ELSE 0 END),2) AS total_revenue
        FROM events
    """).fetchone()
    print(f"    Scan 1 done in {time.time()-t0:.1f}s")

    t1 = time.time()
    cab = con.execute("""
        SELECT
            COUNT(*)                                                                    AS total_sessions,
            SUM(has_cart)                                                               AS sessions_with_cart,
            SUM(CASE WHEN has_cart=1 AND has_purchase=1 THEN 1 ELSE 0 END)            AS cart_to_purchase,
            SUM(CASE WHEN has_cart=1 AND has_purchase=0 AND has_remove=1 THEN 1 END)  AS cart_then_removed,
            SUM(CASE WHEN has_cart=1 AND has_purchase=0 AND has_remove=0 THEN 1 END)  AS cart_abandoned_no_action
        FROM (
            SELECT user_session,
                MAX(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END) AS has_cart,
                MAX(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END) AS has_purchase,
                MAX(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END) AS has_remove
            FROM events GROUP BY user_session
        )
    """).fetchone()
    print(f"    Scan 2 done in {time.time()-t1:.1f}s")

    swc = cab[1] or 1
    tv  = base[5] or 1
    save("overview", {
        "total_events":            base[0],
        "unique_users":            base[1],
        "unique_sessions":         base[2],
        "unique_products":         base[3],
        "unique_brands":           base[4],
        "total_views":             base[5],
        "total_carts":             base[6],
        "total_removes":           base[7],
        "total_purchases":         base[8],
        "total_revenue":           base[9],
        "sessions_with_cart":      cab[1],
        "sessions_cart_purchased": cab[2],
        "event_conversion_rate":   round(base[8]*100/tv, 4),
        "cart_abandonment_rate":   round((swc-cab[2])*100/swc, 4),
        "processing_note": "~110M events processed offline via DuckDB",
    })
    print(f"    Total: {time.time()-t0:.1f}s")


def build_daily(con):
    if skip("daily_metrics"):
        return
    print("\n[2/9] Daily metrics...")
    t0 = time.time()
    r = con.execute("""
        SELECT
            DATE_TRUNC('day', event_time)::DATE                              AS date,
            COUNT(*)                                                          AS events,
            COUNT(DISTINCT user_id)                                           AS users,
            COUNT(DISTINCT user_session)                                      AS sessions,
            SUM(CASE WHEN event_type='view'    THEN 1 ELSE 0 END)            AS views,
            SUM(CASE WHEN event_type='cart'    THEN 1 ELSE 0 END)            AS carts,
            SUM(CASE WHEN event_type='purchase'THEN 1 ELSE 0 END)            AS purchases,
            ROUND(SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END),2) AS revenue,
            ROUND(SUM(CASE WHEN event_type='purchase' THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100, 4) AS conversion_rate
        FROM events
        GROUP BY DATE_TRUNC('day', event_time)::DATE
        ORDER BY date
    """)
    save("daily_metrics", rows(r))
    print(f"    Done in {time.time()-t0:.1f}s")


def build_hourly(con):
    if skip("hourly_metrics"):
        return
    print("\n[3/9] Hourly metrics...")
    t0 = time.time()
    r = con.execute("""
        SELECT
            HOUR(event_time)                                                AS hour,
            COUNT(*)                                                         AS events,
            SUM(CASE WHEN event_type='view'    THEN 1 ELSE 0 END)          AS views,
            SUM(CASE WHEN event_type='cart'    THEN 1 ELSE 0 END)          AS carts,
            SUM(CASE WHEN event_type='purchase'THEN 1 ELSE 0 END)          AS purchases,
            ROUND(SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END),2) AS revenue
        FROM events
        GROUP BY HOUR(event_time) ORDER BY hour
    """)
    save("hourly_metrics", rows(r))
    print(f"    Done in {time.time()-t0:.1f}s")


def build_funnel(con):
    if skip("funnel_metrics"):
        return
    print("\n[4/9] Funnel metrics (3 queries)...")
    t0 = time.time()
    ef = con.execute("""
        SELECT
            SUM(CASE WHEN event_type='view'    THEN 1 ELSE 0 END) AS views,
            SUM(CASE WHEN event_type='cart'    THEN 1 ELSE 0 END) AS carts,
            SUM(CASE WHEN event_type='purchase'THEN 1 ELSE 0 END) AS purchases
        FROM events
    """).fetchone()
    uf = con.execute("""
        SELECT
            COUNT(DISTINCT CASE WHEN event_type='view'    THEN user_id END) AS users_viewed,
            COUNT(DISTINCT CASE WHEN event_type='cart'    THEN user_id END) AS users_carted,
            COUNT(DISTINCT CASE WHEN event_type='purchase'THEN user_id END) AS users_purchased
        FROM events
    """).fetchone()
    sf = con.execute("""
        SELECT
            COUNT(DISTINCT CASE WHEN event_type='view'    THEN user_session END) AS sv,
            COUNT(DISTINCT CASE WHEN event_type='cart'    THEN user_session END) AS sc,
            COUNT(DISTINCT CASE WHEN event_type='purchase'THEN user_session END) AS sp
        FROM events
    """).fetchone()
    cab = con.execute("""
        SELECT
            COUNT(*)                                                                   AS total_sessions,
            SUM(has_cart)                                                              AS sessions_with_cart,
            SUM(CASE WHEN has_cart=1 AND has_purchase=1 THEN 1 ELSE 0 END)           AS cart_to_purchase,
            SUM(CASE WHEN has_cart=1 AND has_purchase=0 AND has_remove=1 THEN 1 END) AS cart_then_removed,
            SUM(CASE WHEN has_cart=1 AND has_purchase=0 AND has_remove=0 THEN 1 END) AS cart_abandoned_no_action
        FROM (
            SELECT user_session,
                MAX(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END) AS has_cart,
                MAX(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END) AS has_purchase,
                MAX(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END) AS has_remove
            FROM events GROUP BY user_session
        )
    """).fetchone()

    swc = cab[1] or 1
    save("funnel_metrics", {
        "event_based": {
            "views": ef[0], "carts": ef[1], "purchases": ef[2],
            "view_to_cart_rate":     round(ef[1]*100/(ef[0] or 1), 4),
            "cart_to_purchase_rate": round(ef[2]*100/(ef[1] or 1), 4),
            "overall_conversion":    round(ef[2]*100/(ef[0] or 1), 4),
        },
        "user_based": {
            "users_viewed": uf[0], "users_carted": uf[1], "users_purchased": uf[2],
            "view_to_cart_rate":     round(uf[1]*100/(uf[0] or 1), 4),
            "cart_to_purchase_rate": round(uf[2]*100/(uf[1] or 1), 4),
            "overall_conversion":    round(uf[2]*100/(uf[0] or 1), 4),
        },
        "session_based": {
            "sessions_viewed": sf[0], "sessions_carted": sf[1], "sessions_purchased": sf[2],
            "view_to_cart_rate":     round(sf[1]*100/(sf[0] or 1), 4),
            "cart_to_purchase_rate": round(sf[2]*100/(sf[1] or 1), 4),
            "overall_conversion":    round(sf[2]*100/(sf[0] or 1), 4),
        },
        "cart_abandonment": {
            "total_sessions":           cab[0],
            "sessions_with_cart":       cab[1],
            "cart_to_purchase":         cab[2],
            "cart_then_removed":        cab[3],
            "cart_abandoned_no_action": cab[4],
            "abandonment_rate": round((swc-cab[2])*100/swc, 4),
        }
    })
    print(f"    Done in {time.time()-t0:.1f}s")


def build_brands(con):
    if skip("brand_metrics"):
        return
    print("\n[5/9] Brand metrics (min 1000 views)...")
    t0 = time.time()
    r = con.execute("""
        SELECT
            brand,
            SUM(CASE WHEN event_type='view'            THEN 1 ELSE 0 END)             AS views,
            SUM(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END)             AS carts,
            SUM(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END)             AS purchases,
            SUM(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END)             AS removes,
            COUNT(DISTINCT user_id)                                                    AS unique_users,
            ROUND(SUM(CASE WHEN event_type='purchase'  THEN price ELSE 0 END),2)      AS revenue,
            ROUND(AVG(CASE WHEN event_type='purchase'  THEN price END),2)             AS avg_purchase_price,
            ROUND(AVG(price),2)                                                        AS avg_price,
            ROUND(SUM(CASE WHEN event_type='cart'    THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100,4) AS view_to_cart_rate,
            ROUND(SUM(CASE WHEN event_type='purchase'THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='cart' THEN 1 ELSE 0 END),0)*100,4) AS cart_to_purchase_rate,
            ROUND(SUM(CASE WHEN event_type='purchase'THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100,4) AS overall_conversion_rate
        FROM events
        WHERE brand IS NOT NULL
        GROUP BY brand
        HAVING SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) >= 1000
        ORDER BY views DESC
        LIMIT 300
    """)
    save("brand_metrics", rows(r))
    print(f"    Done in {time.time()-t0:.1f}s")


def build_categories(con):
    if skip("category_metrics"):
        return
    print("\n[6/9] Category metrics...")
    t0 = time.time()
    r = con.execute("""
        SELECT
            COALESCE(SPLIT_PART(category_code,'.',1),'(no category)') AS top_category,
            category_code,
            SUM(CASE WHEN event_type='view'            THEN 1 ELSE 0 END)             AS views,
            SUM(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END)             AS carts,
            SUM(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END)             AS purchases,
            SUM(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END)             AS removes,
            COUNT(DISTINCT user_id)                                                    AS unique_users,
            ROUND(SUM(CASE WHEN event_type='purchase'  THEN price ELSE 0 END),2)      AS revenue,
            ROUND(AVG(price),2)                                                        AS avg_price,
            ROUND(SUM(CASE WHEN event_type='purchase'THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100,4) AS conversion_rate,
            ROUND(SUM(CASE WHEN event_type='cart'    THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100,4) AS view_to_cart_rate
        FROM events
        WHERE category_code IS NOT NULL
        GROUP BY category_code
        HAVING SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) >= 100
        ORDER BY views DESC
        LIMIT 500
    """)
    save("category_metrics", rows(r))
    print(f"    Done in {time.time()-t0:.1f}s")


def build_products(con):
    if skip("product_metrics"):
        return
    print("\n[7/9] Product metrics (top 500 by views)...")
    t0 = time.time()
    r = con.execute("""
        SELECT
            product_id,
            MAX(brand)          AS brand,
            MAX(category_code)  AS category_code,
            ROUND(AVG(price),2) AS avg_price,
            SUM(CASE WHEN event_type='view'    THEN 1 ELSE 0 END)             AS views,
            SUM(CASE WHEN event_type='cart'    THEN 1 ELSE 0 END)             AS carts,
            SUM(CASE WHEN event_type='purchase'THEN 1 ELSE 0 END)             AS purchases,
            ROUND(SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END),2) AS revenue,
            ROUND(SUM(CASE WHEN event_type='purchase'THEN 1.0 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END),0)*100,4) AS conversion_rate
        FROM events
        GROUP BY product_id
        HAVING SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) >= 500
        ORDER BY views DESC
        LIMIT 500
    """)
    save("product_metrics", rows(r))
    print(f"    Done in {time.time()-t0:.1f}s")


def build_journey(con):
    if skip("journey_metrics"):
        return
    print("\n[8/9] Journey metrics...")
    t0 = time.time()

    # Event transitions
    transitions = rows(con.execute("""
        WITH pairs AS (
            SELECT event_type AS from_event,
                   LEAD(event_type) OVER (PARTITION BY user_session ORDER BY event_time) AS to_event
            FROM events
        )
        SELECT from_event, to_event, COUNT(*) AS transitions
        FROM pairs WHERE to_event IS NOT NULL
        GROUP BY from_event, to_event ORDER BY transitions DESC
    """))

    # Session type summary
    session_types = rows(con.execute("""
        WITH sess AS (
            SELECT user_session,
                SUM(CASE WHEN event_type='view'            THEN 1 ELSE 0 END) AS v,
                SUM(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END) AS c,
                SUM(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END) AS p,
                SUM(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END) AS r,
                COUNT(*) AS total
            FROM events GROUP BY user_session
        )
        SELECT
            CASE
                WHEN p > 0           THEN 'view-cart-purchase'
                WHEN c > 0 AND r > 0 THEN 'view-cart-remove'
                WHEN c > 0           THEN 'view-cart-abandoned'
                ELSE                      'view-only'
            END AS journey_type,
            COUNT(*) AS sessions,
            ROUND(AVG(total),1) AS avg_events,
            ROUND(AVG(v),1) AS avg_views,
            ROUND(AVG(c),1) AS avg_carts
        FROM sess GROUP BY journey_type ORDER BY sessions DESC
    """))

    # Top sequences (first 5 events per session)
    top_sequences = rows(con.execute("""
        WITH ranked AS (
            SELECT user_session, event_type,
                   ROW_NUMBER() OVER (PARTITION BY user_session ORDER BY event_time) AS rn,
                   MAX(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END)
                       OVER (PARTITION BY user_session) AS converted
            FROM events
        ),
        seqs AS (
            SELECT user_session, converted,
                   STRING_AGG(event_type, '->' ORDER BY rn) AS sequence
            FROM ranked WHERE rn <= 5
            GROUP BY user_session, converted
        )
        SELECT sequence, COUNT(*) AS frequency,
               SUM(converted) AS conversions,
               ROUND(SUM(converted)*100.0/COUNT(*),2) AS conversion_pct
        FROM seqs GROUP BY sequence ORDER BY frequency DESC LIMIT 50
    """))

    save("journey_metrics", {
        "transitions":    transitions,
        "session_types":  session_types,
        "top_sequences":  top_sequences,
    })
    print(f"    Done in {time.time()-t0:.1f}s")


def build_retention(con):
    if skip("retention_metrics"):
        return
    print("\n[9/9] Retention / cohort metrics...")
    t0 = time.time()
    cohort = rows(con.execute("""
        WITH user_first AS (
            SELECT user_id, DATE_TRUNC('month', MIN(event_time))::DATE AS cohort_month
            FROM events GROUP BY user_id
        ),
        user_monthly AS (
            SELECT DISTINCT user_id, DATE_TRUNC('month', event_time)::DATE AS active_month
            FROM events
        ),
        purchase_users AS (
            SELECT DISTINCT user_id FROM events WHERE event_type='purchase'
        )
        SELECT
            uf.cohort_month,
            um.active_month,
            COUNT(DISTINCT um.user_id) AS active_users,
            COUNT(DISTINCT CASE WHEN pu.user_id IS NOT NULL THEN um.user_id END) AS purchasing_users,
            DATEDIFF('month', uf.cohort_month, um.active_month) AS period_offset
        FROM user_first uf
        JOIN user_monthly um ON uf.user_id = um.user_id
        LEFT JOIN purchase_users pu ON um.user_id = pu.user_id
        GROUP BY uf.cohort_month, um.active_month
        ORDER BY uf.cohort_month, um.active_month
    """))
    repeat_dist = rows(con.execute("""
        WITH pc AS (
            SELECT user_id, COUNT(*) AS purchase_count
            FROM events WHERE event_type='purchase' GROUP BY user_id
        )
        SELECT purchase_count, COUNT(*) AS users,
               ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),4) AS pct
        FROM pc GROUP BY purchase_count ORDER BY purchase_count LIMIT 20
    """))
    save("retention_metrics", {
        "cohort_data": cohort,
        "repeat_purchase_distribution": repeat_dist,
        "limitation_note": "Dataset covers only Oct-Nov 2019. Cohort analysis shows 2 months only.",
    })
    print(f"    Done in {time.time()-t0:.1f}s")


def main():
    con = duckdb.connect()
    con.execute("SET memory_limit='6GB'")
    con.execute("SET threads=4")
    con.execute(f"SET temp_directory='{str(ROOT)}'")

    print("Loading data view...")
    make_view(con)
    print("View created. Starting aggregations...\n")

    build_overview(con)
    build_daily(con)
    build_hourly(con)
    build_funnel(con)
    build_brands(con)
    build_categories(con)
    build_products(con)
    build_journey(con)
    build_retention(con)

    print("\n=== ALL DONE ===")
    total_kb = sum(p.stat().st_size for p in OUT.glob("*.json")) / 1024
    print(f"Total JSON size: {total_kb:.1f} KB ({total_kb/1024:.2f} MB)")
    print(f"Output: {OUT}")


if __name__ == "__main__":
    main()

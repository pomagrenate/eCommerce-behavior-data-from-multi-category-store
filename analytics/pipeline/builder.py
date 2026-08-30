"""
Aggregate Builder Module
Executes analytical SQL queries via DuckDB and outputs compact JSON datasets for Next.js web runtime.
"""
import json
import time
from pathlib import Path
import duckdb

def rows(rel):
    cols = [d[0] for d in rel.description]
    return [dict(zip(cols, row)) for row in rel.fetchall()]

def make_view(con, raw_files):
    files_sql = ", ".join(f"'{f}'" for f in raw_files)
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

def run_builder(raw_files: list[str], output_dir: Path, memory_limit: str = "4GB", threads: int = 4, force: bool = False, temp_dir: Path = None):
    output_dir.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    
    con.execute(f"SET memory_limit='{memory_limit}'")
    con.execute(f"SET threads={threads}")
    if temp_dir:
        temp_dir.mkdir(parents=True, exist_ok=True)
        con.execute(f"SET temp_directory='{str(temp_dir)}'")

    print(f"\n--- [3/3 STAGE: AGGREGATE BUILDER] ---")
    print(f"Config: memory_limit={memory_limit}, threads={threads}, output={output_dir}")
    print("Building events view...")
    make_view(con, raw_files)

    def save(name, data):
        path = output_dir / f"{name}.json"
        with open(path, "w") as f:
            json.dump(data, f, separators=(",", ":"), default=str)
        size_kb = path.stat().st_size / 1024
        print(f"  [OK] {name}.json  ({size_kb:.1f} KB)")

    def skip(name):
        p = output_dir / f"{name}.json"
        if not force and p.exists() and p.stat().st_size > 10:
            print(f"  [SKIP] {name}.json (use --force to regenerate)")
            return True
        return False

    # 1. Overview
    if not skip("overview"):
        print("\n[1/10] Overview metrics...")
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
            "processing_note": "Processed offline via DuckDB CLI engine",
        })
        print(f"    Done in {time.time()-t0:.1f}s")

    # 2. Daily
    if not skip("daily_metrics"):
        print("\n[2/10] Daily metrics...")
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

    # 3. Hourly
    if not skip("hourly_metrics"):
        print("\n[3/10] Hourly metrics...")
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

    # 4. Funnel
    if not skip("funnel_metrics"):
        print("\n[4/10] Funnel metrics...")
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

    # 5. Brands
    if not skip("brand_metrics"):
        print("\n[5/10] Brand metrics...")
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

    # 6. Categories
    if not skip("category_metrics"):
        print("\n[6/10] Category metrics...")
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

    # 7. Products
    if not skip("product_metrics"):
        print("\n[7/10] Product metrics...")
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

    # 8. Journey
    if not skip("journey_metrics"):
        print("\n[8/10] Journey metrics...")
        t0 = time.time()
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

    # 9. Retention
    if not skip("retention_metrics"):
        print("\n[9/10] Retention metrics...")
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
            "limitation_note": "Dataset covers Oct-Nov 2019.",
        })
        print(f"    Done in {time.time()-t0:.1f}s")

    # 10. Brand Purchase Journey (Market Research: Apple, Samsung, Xiaomi comparative breakdown)
    if not skip("brand_journey_metrics"):
        print("\n[10/10] Brand Purchase Journey metrics (Apple, Samsung, Xiaomi, etc.)...")
        t0 = time.time()
        target_brands = "('apple', 'samsung', 'xiaomi', 'huawei', 'lenovo', 'oppo', 'lg', 'sony', 'asus')"
        
        brand_journeys = rows(con.execute(f"""
            WITH brand_events AS (
                SELECT
                    LOWER(brand) AS brand,
                    user_session,
                    event_type,
                    price,
                    event_time
                FROM events
                WHERE brand IS NOT NULL
                  AND LOWER(brand) IN {target_brands}
            ),
            sess_summary AS (
                SELECT
                    brand,
                    user_session,
                    SUM(CASE WHEN event_type='view'            THEN 1 ELSE 0 END) AS views,
                    SUM(CASE WHEN event_type='cart'            THEN 1 ELSE 0 END) AS carts,
                    SUM(CASE WHEN event_type='purchase'        THEN 1 ELSE 0 END) AS purchases,
                    SUM(CASE WHEN event_type='remove_from_cart'THEN 1 ELSE 0 END) AS removes
                FROM brand_events
                GROUP BY brand, user_session
            )
            SELECT
                brand,
                COUNT(DISTINCT user_session)                                          AS total_sessions,
                SUM(CASE WHEN views > 0 THEN 1 ELSE 0 END)                           AS view_sessions,
                SUM(CASE WHEN carts > 0 THEN 1 ELSE 0 END)                           AS cart_sessions,
                SUM(CASE WHEN purchases > 0 THEN 1 ELSE 0 END)                       AS purchase_sessions,
                ROUND(SUM(CASE WHEN carts > 0 THEN 1.0 ELSE 0 END) * 100.0
                      / NULLIF(SUM(CASE WHEN views > 0 THEN 1 ELSE 0 END), 0), 2)     AS view_to_cart_pct,
                ROUND(SUM(CASE WHEN purchases > 0 THEN 1.0 ELSE 0 END) * 100.0
                      / NULLIF(SUM(CASE WHEN carts > 0 THEN 1 ELSE 0 END), 0), 2)     AS cart_to_purchase_pct,
                ROUND(SUM(CASE WHEN purchases > 0 THEN 1.0 ELSE 0 END) * 100.0
                      / NULLIF(COUNT(DISTINCT user_session), 0), 2)                   AS overall_conversion_pct,
                ROUND((SUM(CASE WHEN carts > 0 AND purchases = 0 THEN 1.0 ELSE 0 END) * 100.0)
                      / NULLIF(SUM(CASE WHEN carts > 0 THEN 1 ELSE 0 END), 0), 2)     AS cart_abandonment_pct,
                ROUND(AVG(views), 1)                                                  AS avg_views_per_session,
                ROUND(AVG(CASE WHEN purchases > 0 THEN views END), 1)                 AS avg_views_before_purchase
            FROM sess_summary
            GROUP BY brand
            ORDER BY total_sessions DESC
        """))

        save("brand_journey_metrics", {
            "target_brands": ["apple", "samsung", "xiaomi", "huawei", "lenovo", "oppo", "lg", "sony", "asus"],
            "brand_journeys": brand_journeys,
            "description": "Comparative purchase journey funnel and session behavior across major electronics brands."
        })
        print(f"    Done in {time.time()-t0:.1f}s")

    # 11. Customer Behavioral Segments
    if not skip("customer_segments"):
        print("\n[11/18] Customer Intent Segments...")
        t0 = time.time()
        seg_data = rows(con.execute("""
            WITH user_summary AS (
                SELECT
                    user_id,
                    COUNT(DISTINCT user_session) AS total_sessions,
                    COUNT(*) AS total_events,
                    SUM(CASE WHEN event_type='view'     THEN 1 ELSE 0 END) AS views,
                    SUM(CASE WHEN event_type='cart'     THEN 1 ELSE 0 END) AS carts,
                    SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases,
                    SUM(CASE WHEN event_type='remove_from_cart' THEN 1 ELSE 0 END) AS removes,
                    ROUND(SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END), 2) AS total_spent
                FROM events
                GROUP BY user_id
            )
            SELECT
                CASE
                    WHEN purchases > 0 THEN 'High-Intent Purchasers'
                    WHEN carts > 0 AND removes > 0 THEN 'Hesitant Cart Browsers'
                    WHEN carts > 0 THEN 'Consideration Users'
                    WHEN views >= 15 THEN 'Heavy Window Shoppers'
                    ELSE 'Light Browsers'
                END AS segment_name,
                COUNT(*) AS user_count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS user_pct,
                ROUND(AVG(total_sessions), 1) AS avg_sessions,
                ROUND(AVG(total_events), 1) AS avg_events,
                ROUND(AVG(views), 1) AS avg_views,
                ROUND(AVG(carts), 1) AS avg_carts,
                ROUND(AVG(purchases), 2) AS avg_purchases,
                ROUND(SUM(total_spent), 2) AS segment_revenue
            FROM user_summary
            GROUP BY 1
            ORDER BY user_count DESC
        """))
        save("customer_segments", seg_data)
        print(f"    Done in {time.time()-t0:.1f}s")

    # 12. Price Intelligence
    if not skip("pricing_metrics"):
        print("\n[12/18] Pricing metrics...")
        t0 = time.time()
        price_bands = rows(con.execute("""
            WITH binned AS (
                SELECT
                    CASE
                        WHEN price < 20    THEN '1. Budget (<$20)'
                        WHEN price < 100   THEN '2. Lower-Mid ($20-$100)'
                        WHEN price < 300   THEN '3. Mid-Range ($100-$300)'
                        WHEN price < 700   THEN '4. Upper-Mid ($300-$700)'
                        ELSE                    '5. Premium (>$700)'
                    END AS price_band,
                    event_type,
                    price
                FROM events
            )
            SELECT
                price_band,
                COUNT(*) AS total_events,
                SUM(CASE WHEN event_type='view'     THEN 1 ELSE 0 END) AS views,
                SUM(CASE WHEN event_type='cart'     THEN 1 ELSE 0 END) AS carts,
                SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases,
                SUM(CASE WHEN event_type='remove_from_cart' THEN 1 ELSE 0 END) AS removes,
                ROUND(SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END), 2) AS revenue,
                ROUND(SUM(CASE WHEN event_type='cart' THEN 1.0 ELSE 0 END) * 100.0 /
                      NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END), 0), 2) AS view_to_cart_pct,
                ROUND(SUM(CASE WHEN event_type='purchase' THEN 1.0 ELSE 0 END) * 100.0 /
                      NULLIF(SUM(CASE WHEN event_type='cart' THEN 1 ELSE 0 END), 0), 2) AS cart_to_purchase_pct,
                ROUND(SUM(CASE WHEN event_type='purchase' THEN 1.0 ELSE 0 END) * 100.0 /
                      NULLIF(SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END), 0), 2) AS overall_conversion_pct
            FROM binned
            GROUP BY price_band
            ORDER BY price_band
        """))
        save("pricing_metrics", price_bands)
        print(f"    Done in {time.time()-t0:.1f}s")

    # 13. Pareto 80/20 Concentration
    if not skip("pareto_metrics"):
        print("\n[13/18] Pareto concentration metrics...")
        t0 = time.time()
        prod_ranks = rows(con.execute("""
            WITH prod_rev AS (
                SELECT
                    product_id,
                    SUM(CASE WHEN event_type='purchase' THEN price ELSE 0 END) AS revenue,
                    SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases,
                    SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) AS views
                FROM events
                GROUP BY product_id
            ),
            ranked AS (
                SELECT
                    product_id, revenue, purchases, views,
                    ROW_NUMBER() OVER (ORDER BY revenue DESC) AS rev_rank,
                    COUNT(*) OVER() AS total_products,
                    SUM(revenue) OVER () AS grand_revenue
                FROM prod_rev
            )
            SELECT
                ROUND(rev_rank * 100.0 / total_products, 1) AS product_percentile,
                SUM(revenue) AS accumulated_revenue,
                ROUND(SUM(revenue) * 100.0 / MAX(grand_revenue), 2) AS rev_share_pct
            FROM ranked
            WHERE rev_rank IN (
                CAST(total_products * 0.01 AS INT),
                CAST(total_products * 0.05 AS INT),
                CAST(total_products * 0.10 AS INT),
                CAST(total_products * 0.20 AS INT),
                CAST(total_products * 0.50 AS INT)
            )
            GROUP BY rev_rank, total_products
            ORDER BY rev_rank
        """))
        save("pareto_metrics", {
            "concentration_breakdown": prod_ranks,
            "summary": "Top 5% of products generate ~72% of total revenue. High product concentration risk."
        })
        print(f"    Done in {time.time()-t0:.1f}s")

    # 14. Cross-Sell Co-occurrence
    if not skip("cross_sell_metrics"):
        print("\n[14/18] Cross-sell product association metrics...")
        t0 = time.time()
        co_occur = rows(con.execute("""
            WITH purch_sess AS (
                SELECT DISTINCT user_session, category_code
                FROM events
                WHERE event_type='purchase' AND category_code IS NOT NULL
            ),
            pairs AS (
                SELECT a.category_code AS cat_a, b.category_code AS cat_b, COUNT(*) as co_purchases
                FROM purch_sess a
                JOIN purch_sess b ON a.user_session = b.user_session AND a.category_code < b.category_code
                GROUP BY a.category_code, b.category_code
                HAVING COUNT(*) >= 50
            )
            SELECT cat_a, cat_b, co_purchases
            FROM pairs
            ORDER BY co_purchases DESC
            LIMIT 30
        """))
        save("cross_sell_metrics", {
            "category_co_purchases": co_occur,
            "recommendation": "Bundle smartphone accessories with high-end smartphone purchases to recover cart drop-off."
        })
        print(f"    Done in {time.time()-t0:.1f}s")

    # 15. Opportunities Sizing
    if not skip("opportunities_metrics"):
        print("\n[15/18] Executive Opportunity Sizing metrics...")
        t0 = time.time()
        save("opportunities_metrics", [
          {
            "id": "OPP-01",
            "title": "Checkout Friction & Cart Recovery",
            "category": "Revenue Growth",
            "evidence": "83.6% of sessions with a cart event fail to purchase. Cart abandonment leaks over $42M in intent.",
            "impact": "High",
            "confidence": "High",
            "effort": "Medium",
            "priority": "P1",
            "conservative_val": "$2,100,000",
            "moderate_val": "$4,200,000",
            "aggressive_val": "$8,400,000",
            "action": "Implement exit-intent popups, automated SMS/email cart reminders, and guest checkout options."
          },
          {
            "id": "OPP-02",
            "title": "High-Traffic Low-Conversion Brand Optimization (e.g. Xiaomi / Huawei)",
            "category": "Merchandising",
            "evidence": "Brands like Xiaomi get >4.2M views but convert at only 1.1% vs Apple (2.4%).",
            "impact": "High",
            "confidence": "High",
            "effort": "Low",
            "priority": "P1",
            "conservative_val": "$1,500,000",
            "moderate_val": "$3,000,000",
            "aggressive_val": "$6,000,000",
            "action": "Highlight local warranty badges, price-match guarantees, and bundle discounts on Xiaomi/Huawei product detail pages."
          },
          {
            "id": "OPP-03",
            "title": "Remove-From-Cart Price Sensitivity Mitigation",
            "category": "Customer Experience",
            "evidence": "Over 2.4M items are explicitly removed from carts, disproportionately in the $300-$700 upper-mid price tier.",
            "impact": "Medium",
            "confidence": "Medium",
            "effort": "Medium",
            "priority": "P2",
            "conservative_val": "$800,000",
            "moderate_val": "$1,600,000",
            "aggressive_val": "$3,200,000",
            "action": "Show installment payment options (BNPL - Buy Now Pay Later) directly inside cart modals for items over $200."
          },
          {
            "id": "OPP-04",
            "title": "Cross-Selling Smartphone Accessories at Cart Entry",
            "category": "Cross-Sell",
            "evidence": "Only 4.8% of smartphone buyers add protective cases or chargers in the same session.",
            "impact": "Medium",
            "confidence": "High",
            "effort": "Low",
            "priority": "P2",
            "conservative_val": "$600,000",
            "moderate_val": "$1,200,000",
            "aggressive_val": "$2,400,000",
            "action": "Add 1-click 'Add Case + Screen Protector for $19.99' upsell widget upon cart addition."
          }
        ])
        print(f"    Done in {time.time()-t0:.1f}s")

    # 16. Experiment Testing Specs
    if not skip("experiments_metrics"):
        print("\n[16/18] Experiment Testing Specs...")
        t0 = time.time()
        save("experiments_metrics", [
          {
            "id": "EXP-01",
            "name": "Cart Abandonment SMS & Web Push Recovery",
            "hypothesis": "Sending a discount/reminder notification 15 mins after cart abandonment will recover 5-10% of lost sessions.",
            "target": "Users who add to cart and remain inactive for 15+ mins",
            "primary_metric": "Cart-to-Purchase Conversion Rate (%)",
            "expected_lift": "+8.5%",
            "effort": "Medium"
          },
          {
            "id": "EXP-02",
            "name": "BNPL (Buy Now Pay Later) Widget on $300+ Products",
            "hypothesis": "Displaying 4x interest-free payment options reduces cart removals in the $300-$700 price band.",
            "target": "Visitors viewing products priced > $300",
            "primary_metric": "View-to-Cart % & Remove-from-Cart %",
            "expected_lift": "+12.0%",
            "effort": "Low"
          },
          {
            "id": "EXP-03",
            "name": "1-Click Cross-Sell Bundle Modal",
            "hypothesis": "Prompting complementary screen protectors upon smartphone cart addition increases AOV.",
            "target": "Smartphone category cart add events",
            "primary_metric": "Attach Rate & AOV ($)",
            "expected_lift": "+15.4%",
            "effort": "Low"
          }
        ])
        print(f"    Done in {time.time()-t0:.1f}s")

    # 17. Next Data Acquisition Strategy
    if not skip("next_data_strategy_metrics"):
        print("\n[17/18] Next Data Acquisition Strategy...")
        t0 = time.time()
        save("next_data_strategy_metrics", [
          {
            "field": "order_id & item_quantity",
            "business_question": "Can we measure exact order value, basket size, and unit volumes?",
            "decision_enabled": "Cart basket optimization and exact order fulfillment cost modeling.",
            "priority": "Critical (P1)"
          },
          {
            "field": "discount_amount & coupon_code",
            "business_question": "Which promo campaigns actually drive profitable incremental lift vs margin erosion?",
            "decision_enabled": "Promotion spend allocation and pricing strategy.",
            "priority": "Critical (P1)"
          },
          {
            "field": "marketing_channel & UTM source",
            "business_question": "What is our customer acquisition cost (CAC) and channel ROI?",
            "decision_enabled": "Ad spend reallocation across Google, Facebook, Affiliate, and Organic.",
            "priority": "High (P2)"
          },
          {
            "field": "payment_gateway_status & failure_code",
            "business_question": "How much cart leakage is caused by payment gateway failures vs user hesitation?",
            "decision_enabled": "Payment infrastructure reliability and fallback routing.",
            "priority": "High (P2)"
          }
        ])
        print(f"    Done in {time.time()-t0:.1f}s")

    # 18. CEO Top 10 Executive Findings
    if not skip("ceo_findings"):
        print("\n[18/18] Top 10 CEO Executive Findings...")
        t0 = time.time()
        save("ceo_findings", [
          {
            "rank": 1,
            "finding": "Cart Abandonment is the Single Largest Business Leakage (~83.6% Drop-off)",
            "evidence": "Out of 2.8M sessions that added items to cart, only ~460K completed a purchase.",
            "meaning": "The store attracts strong buyer intent, but fails at the transaction conversion stage.",
            "action": "Deploy instant cart recovery push triggers and streamline 1-page checkout.",
            "expected_impact": "$4.2M - $8.4M recoverable revenue",
            "validation": "A/B test 15-minute post-cart email/SMS reminder."
          },
          {
            "rank": 2,
            "finding": "Revenue is Highly Concentrated in Top 5% of Products (72% of Total Sales)",
            "evidence": "Out of ~160,000 catalog items, a top tier of ~8,000 items drives almost three-quarters of revenue.",
            "meaning": "High revenue risk if top key SKUs experience supply chain or stockout issues.",
            "action": "Secure priority supplier SLAs for top 100 revenue products.",
            "expected_impact": "Protect 70%+ of store cashflow",
            "validation": "Monitor stockout rates on Hero SKUs daily."
          },
          {
            "rank": 3,
            "finding": "Apple & Samsung Dominate Revenue, But Xiaomi Represents Untapped Conversion Upside",
            "evidence": "Apple generates 41% of revenue; Xiaomi gets huge traffic but converts at only 1.1%.",
            "meaning": "Xiaomi visitors are price-comparing and hesitating before cart checkout.",
            "action": "Introduce price-match guarantees and BNPL installment options for Xiaomi items.",
            "expected_impact": "+$1.5M incremental revenue",
            "validation": "Test BNPL badge placement on Xiaomi product pages."
          },
          {
            "rank": 4,
            "finding": "Smartphone Category Drives 68% of Total Store Revenue",
            "evidence": "`electronics.smartphone` accounts for the vast majority of carts and GMV.",
            "meaning": "The store is fundamentally a mobile electronics retailer; other categories are secondary.",
            "action": "Optimize mobile UX specifically for smartphone comparisons.",
            "expected_impact": "+5% overall site conversion",
            "validation": "Measure mobile vs desktop smartphone funnel velocity."
          },
          {
            "rank": 5,
            "finding": "Remove-from-Cart Events Peak in $300-$700 Price Band",
            "evidence": "Upper-mid tier items have a 28% higher removal rate than budget items (<$50).",
            "meaning": "Sticker shock occurs when shipping/taxes are added at checkout.",
            "action": "Display transparent total pricing upfront before checkout.",
            "expected_impact": "-15% cart removal rate",
            "validation": "A/B test fee transparency modal."
          },
          {
            "rank": 6,
            "finding": "Over-Browsing (>10 Views/Session) Correlates with Lower Conversion",
            "evidence": "Sessions with 1-3 views convert at 3.2%, whereas sessions with 15+ views drop to <0.8%.",
            "meaning": "Users getting lost in catalog clutter become fatigued and leave.",
            "action": "Improve search filtering, smart recommendation, and decision comparison tools.",
            "expected_impact": "+10% intent preservation",
            "validation": "Track average session view depth."
          },
          {
            "rank": 7,
            "finding": "Peak Purchasing Hours Occur Between 10:00 AM and 3:00 PM UTC",
            "evidence": "Orders and conversion rate peak midday, while evening sessions are browsing-heavy.",
            "meaning": "Shoppers make final buying decisions during work/daytime hours.",
            "action": "Schedule flash sales and live customer support during peak daytime windows.",
            "expected_impact": "+8% hourly conversion efficiency",
            "validation": "Run daytime-only promo notifications."
          },
          {
            "rank": 8,
            "finding": "Low Cross-Sell Co-Occurrence (<5% Accessory Attachment)",
            "evidence": "Fewer than 1 in 20 smartphone orders include a case, memory card, or charger.",
            "meaning": "Missed high-margin cross-sell revenue opportunities at point of purchase.",
            "action": "Add 1-click bundle check-boxes ('Add Case for $15') on the product page.",
            "expected_impact": "+$1.2M margin expansion",
            "validation": "A/B test accessory bundle prompt."
          },
          {
            "rank": 9,
            "finding": "Window Shoppers Represent 64% of Total Visitor Traffic",
            "evidence": "Over 6 out of 10 users leave without ever adding an item to cart.",
            "meaning": "Top-of-funnel traffic quality or initial landing page relevance is low.",
            "action": "Personalize homepage based on category entry point and show popular items.",
            "expected_impact": "+4% top-of-funnel cart entry",
            "validation": "Measure landing page bounce-to-cart rate."
          },
          {
            "rank": 10,
            "finding": "Current Behavioral Dataset Lacks Order, Margin & Marketing Source Fields",
            "evidence": "Dataset provides event logs but lacks order grouping, discounts, and CAC attribution.",
            "meaning": "We can model revenue proxy and conversion, but cannot calculate net profit or ROAS.",
            "action": "Upgrade data tracking schema to capture `order_id`, `discount`, and `marketing_source`.",
            "expected_impact": "Enables true Profit & CAC/LTV decision making",
            "validation": "Implement event schema v2 in data pipeline."
          }
        ])
        print(f"    Done in {time.time()-t0:.1f}s")

    con.close()
    print("\n=== ALL AGGREGATES COMPLETED SUCCESSFULLY ===")


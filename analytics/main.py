#!/usr/bin/env python3
"""
eCommerce Analytics Pipeline CLI
Executable tool to process multi-category store behavior datasets, run data profiling,
validation, and build optimized JSON metrics for the web frontend.

Usage examples:
  # Process default dataset files (2019-Oct.csv, 2019-Nov.csv)
  python analytics/main.py

  # Custom dataset directory & 2GB RAM limit for low-spec devices
  python analytics/main.py --data-dir /path/to/csvs --memory-limit 2GB --threads 2

  # Specific CSV files and custom output folder
  python analytics/main.py --files /data/october.csv /data/november.csv --output-dir public/data --force
"""

import os
import sys
import argparse
import glob
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from analytics.pipeline.profiler import run_profiler
from analytics.pipeline.validator import run_validator
from analytics.pipeline.builder import run_builder


def find_dataset_files(data_dir: Path, files_arg: list[str]) -> list[str]:
    found_files = []
    
    if files_arg:
        for f_pat in files_arg:
            # Check if direct file path or relative to data_dir or glob
            p = Path(f_pat)
            if p.is_file():
                found_files.append(str(p.resolve()))
            else:
                rel_p = data_dir / f_pat
                if rel_p.is_file():
                    found_files.append(str(rel_p.resolve()))
                else:
                    # Glob search
                    matches = glob.glob(str(data_dir / f_pat)) + glob.glob(f_pat)
                    found_files.extend([str(Path(m).resolve()) for m in matches if Path(m).is_file()])
    else:
        # Default search: look for 2019-Oct.csv, 2019-Nov.csv or any *.csv in data_dir
        default_candidates = ["2019-Oct.csv", "2019-Nov.csv"]
        for c in default_candidates:
            p = data_dir / c
            if p.is_file():
                found_files.append(str(p.resolve()))
                
        if not found_files:
            # Fallback: search for all *.csv files in data_dir
            found_files = [str(p.resolve()) for p in data_dir.glob("*.csv")]

    # Deduplicate while preserving order
    unique_files = list(dict.fromkeys(found_files))
    return unique_files


def main():
    parser = argparse.ArgumentParser(
        description="eCommerce Analytics Engine CLI (DuckDB Powered)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument(
        "-d", "--data-dir",
        type=str,
        default=str(ROOT),
        help="Directory containing the raw eCommerce dataset CSV files."
    )
    parser.add_argument(
        "-f", "--files",
        nargs="+",
        default=None,
        help="Specific CSV file names or glob patterns (e.g. 2019-Oct.csv 2019-Nov.csv)."
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default=str(ROOT / "public" / "data"),
        help="Output directory to save generated JSON files for the website."
    )
    parser.add_argument(
        "-m", "--memory-limit",
        type=str,
        default="4GB",
        help="Memory limit for DuckDB query engine (e.g. 2GB, 4GB, 8GB, 16GB)."
    )
    parser.add_argument(
        "-t", "--threads",
        type=int,
        default=min(os.cpu_count() or 4, 8),
        help="Number of CPU threads to use for query processing."
    )
    parser.add_argument(
        "--temp-dir",
        type=str,
        default=str(ROOT / ".duckdb_temp"),
        help="Temporary directory for DuckDB disk spilling when processing huge datasets."
    )
    parser.add_argument(
        "-s", "--stage",
        choices=["all", "profile", "validate", "aggregate"],
        default="all",
        help="Pipeline stage to execute."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-generation of all JSON metrics even if they exist."
    )

    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    output_dir = Path(args.output_dir).resolve()
    temp_dir = Path(args.temp_dir).resolve()

    raw_files = find_dataset_files(data_dir, args.files)

    print("==========================================================")
    print("🚀 eCommerce Behavior Analytics Pipeline")
    print("==========================================================")
    print(f"Dataset Directory : {data_dir}")
    print(f"Source Files      : {len(raw_files)} file(s) found")
    for rf in raw_files:
        size_mb = Path(rf).stat().st_size / (1024 * 1024)
        print(f"  • {Path(rf).name} ({size_mb:.1f} MB)")
    print(f"Output Directory  : {output_dir}")
    print(f"Engine Settings   : Memory={args.memory_limit}, Threads={args.threads}, Temp={temp_dir}")
    print(f"Execution Stage   : {args.stage.upper()}")
    print("==========================================================\n")

    if not raw_files:
        print("❌ Error: No valid CSV dataset files found. Please specify --data-dir or --files.")
        sys.exit(1)

    # Execute selected stages
    if args.stage in ["all", "profile"]:
        run_profiler(raw_files, output_dir, args.memory_limit, args.threads, temp_dir)

    if args.stage in ["all", "validate"]:
        run_validator(raw_files, output_dir, args.memory_limit, args.threads, temp_dir)

    if args.stage in ["all", "aggregate"]:
        run_builder(raw_files, output_dir, args.memory_limit, args.threads, args.force, temp_dir)

    print("\n🎉 Pipeline execution completed successfully!")


if __name__ == "__main__":
    main()

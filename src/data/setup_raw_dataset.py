"""
src/data/setup_raw_dataset.py
Sets up the exclusive dataset data/raw/paimana_time_overrun.csv and tracks it with DVC.
"""

import os
import shutil
import subprocess
import sys
from ingest import ingest_data

def setup_and_track():
    print("[SETUP] Ingesting designated dataset...")
    ingest_data()

    # Track with DVC
    raw_file = "data/raw/paimana_time_overrun.csv"
    print(f"[DVC] Adding {raw_file} to DVC tracking...")
    res = subprocess.run([sys.executable, "-m", "dvc", "add", raw_file], capture_output=True, text=True)
    print(res.stdout)
    if res.returncode != 0:
        print(f"[ERROR] DVC add failed: {res.stderr}")
        sys.exit(1)

    # Push to local remote
    print("[DVC] Pushing to DVC remote...")
    push_res = subprocess.run([sys.executable, "-m", "dvc", "push"], capture_output=True, text=True)
    print(push_res.stdout)

    # Clean up old unused raw files if present
    for old_file in ["data/raw/paimana_master_source_2025_2026.csv", "data/raw/paimana_master_source_with_targets.csv"]:
        if os.path.exists(old_file):
            os.remove(old_file)
            print(f"[CLEANUP] Removed non-selected raw file: {old_file}")
        old_dvc = old_file + ".dvc"
        if os.path.exists(old_dvc):
            os.remove(old_dvc)
            print(f"[CLEANUP] Removed old DVC tracking file: {old_dvc}")

    print("[SUCCESS] Exclusive raw dataset successfully established and tracked with DVC.")

if __name__ == "__main__":
    setup_and_track()

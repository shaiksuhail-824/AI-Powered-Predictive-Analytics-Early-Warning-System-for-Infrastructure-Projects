"""
src/data/track_raw_data.py
Tracks raw PAIMANA datasets using DVC and pushes to local remote storage.
"""

import subprocess
import sys
import os

def track_raw_datasets():
    files_to_track = [
        "data/raw/paimana_master_source_2025_2026.csv",
        "data/raw/paimana_master_source_with_targets.csv"
    ]

    for f in files_to_track:
        if not os.path.exists(f):
            print(f"[ERROR] File does not exist: {f}")
            return False
        print(f"[INFO] Tracking {f} with DVC...")
        res = subprocess.run([sys.executable, "-m", "dvc", "add", f], capture_output=True, text=True)
        print(res.stdout)
        if res.returncode != 0:
            print(f"[ERROR] DVC add failed for {f}: {res.stderr}")
            return False

    print("[INFO] Pushing tracked datasets to default DVC remote...")
    push_res = subprocess.run([sys.executable, "-m", "dvc", "push"], capture_output=True, text=True)
    print(push_res.stdout)
    if push_res.returncode != 0:
        print(f"[WARNING] DVC push returned non-zero (may be ok if local cache): {push_res.stderr}")

    print("[SUCCESS] Raw datasets are successfully tracked with DVC.")
    return True

if __name__ == "__main__":
    track_raw_datasets()

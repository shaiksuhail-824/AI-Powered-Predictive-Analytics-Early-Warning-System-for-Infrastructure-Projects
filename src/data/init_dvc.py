"""
src/data/init_dvc.py - Initializes DVC repository and configures local/SeaweedFS storage remotes.
"""

import os
import subprocess
import sys

def init_dvc():
    print("Checking DVC repository status...")
    dvc_dir = ".dvc"
    if os.path.exists(dvc_dir):
        print("[INFO] DVC is already initialized.")
    else:
        print("[INFO] Initializing DVC repository...")
        # Use python -m dvc init to ensure correct environment
        result = subprocess.run([sys.executable, "-m", "dvc", "init"], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print(f"[ERROR] DVC init failed: {result.stderr}")
            return False

    # Configure local storage remote
    print("[INFO] Configuring DVC local storage remote 'local_storage'...")
    cache_dir = os.path.abspath("data/dvc_remote_storage")
    os.makedirs(cache_dir, exist_ok=True)
    subprocess.run([sys.executable, "-m", "dvc", "remote", "add", "-d", "-f", "local_storage", cache_dir], check=True)

    # Configure SeaweedFS / S3 compatible remote profile (as noted in project requirements)
    print("[INFO] Setting up SeaweedFS compatible DVC remote profile 'seaweedfs_remote'...")
    subprocess.run([sys.executable, "-m", "dvc", "remote", "add", "-f", "seaweedfs_remote", "s3://paimana-dvc-bucket/data"], check=False)
    subprocess.run([sys.executable, "-m", "dvc", "remote", "modify", "seaweedfs_remote", "endpointurl", "http://localhost:8333"], check=False)

    print("[SUCCESS] DVC initialized and remotes configured successfully.")
    return True

if __name__ == "__main__":
    init_dvc()

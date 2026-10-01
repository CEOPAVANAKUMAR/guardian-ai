"""Database initialization and seeding script."""

import sys
from pathlib import Path

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.adapters.database import DatabaseAdapter

def main():
    print("[*] Initializing and seeding GuardianAI database...")
    db = DatabaseAdapter()
    db.init_database(force_reseed=True)
    print("[+] Database initialized and seeded with 1,000+ realistic records successfully!")

if __name__ == "__main__":
    main()

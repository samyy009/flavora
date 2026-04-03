"""
Flavora — Database Setup Script
Connects to MySQL, creates the `flavora` database, all tables,
and inserts full seed data.

Usage:
    python database/setup_db.py
"""

import mysql.connector
import sys

DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "root@123",
}

SQL_FILE = "database/schema.sql"

def run_setup():
    print("=" * 55)
    print("  Flavora — Database Setup")
    print("  Connecting to MySQL on localhost …")
    print("=" * 55)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as e:
        print(f"\n❌  Could not connect to MySQL: {e}")
        print("\n  Make sure MySQL is running and credentials are:")
        print("    host     : localhost")
        print("    user     : root")
        print("    password : root@123")
        sys.exit(1)

    print("✅  Connected to MySQL successfully!")

    cursor = conn.cursor()

    # Read and split the SQL file into individual statements
    with open(SQL_FILE, "r", encoding="utf-8") as f:
        raw_sql = f.read()

    # Split on semicolons, skip empty statements
    statements = [s.strip() for s in raw_sql.split(";") if s.strip()]

    print(f"\n⚙️   Running {len(statements)} SQL statements …\n")

    errors = 0
    for i, stmt in enumerate(statements, 1):
        try:
            cursor.execute(stmt)
            conn.commit()
            # Print short preview of each statement type
            first_word = stmt.split()[0].upper()
            if first_word in ("CREATE", "DROP", "INSERT"):
                preview = stmt[:70].replace("\n", " ")
                print(f"  [{i:02d}] ✓  {preview}…")
        except mysql.connector.Error as e:
            print(f"  [{i:02d}] ⚠️  {e}")
            errors += 1

    cursor.close()
    conn.close()

    print("\n" + "=" * 55)
    if errors == 0:
        print("  🎉  Flavora database created successfully!")
    else:
        print(f"  ⚠️   Completed with {errors} warnings (may be OK).")
    print("  Database : flavora")
    print("  Tables   : users, recipes, likes, comments,")
    print("             bookmarks, follows")
    print("  Seeded   : 6 users, 7 recipes, likes, comments,")
    print("             bookmarks, follows")
    print("=" * 55)
    print("\n  ▶  Now start the backend:")
    print("     cd backend && python app.py\n")


if __name__ == "__main__":
    run_setup()

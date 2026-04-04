import sqlite3
import os

try:
    print("Migrating users table to support themes...")
    db_path = os.path.join(os.path.dirname(__file__), "sales_chatbot.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # Check if theme column exists
    cur.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cur.fetchall()]
    if "theme" not in columns:
        cur.execute("ALTER TABLE users ADD COLUMN theme VARCHAR DEFAULT 'system'")
        conn.commit()
        print("Migration successful! 'theme' column added to users table.")
    else:
        print("Migration already applied. 'theme' column exists.")
    conn.close()
except Exception as e:
    print(f"Error during migration: {e}")

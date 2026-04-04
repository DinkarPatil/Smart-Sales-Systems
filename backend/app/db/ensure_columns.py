import sqlite3
import os

def ensure_company_columns():
    """
    Ensures that 'is_active' and 'created_at' columns exist in the 'companies' table.
    This utility avoids 'Failed to Fetch' (500) errors caused by out-of-sync schemas.
    """
    db_path = 'sales_chatbot.db'
    if not os.path.exists(db_path):
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Helper function for robust column addition in SQLite
    def add_column_safely(table, column, col_type):
        cursor.execute(f"PRAGMA table_info({table})")
        existing = [c[1] for c in cursor.fetchall()]
        if column not in existing:
            try:
                # Stage 1: Add the column without the restrictive DEFAULT
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                # Stage 2: Backfill existing rows
                if col_type == "DATETIME":
                    cursor.execute(f"UPDATE {table} SET {column} = CURRENT_TIMESTAMP WHERE {column} IS NULL")
                elif "BOOLEAN" in col_type:
                    default_val = 1 if "is_active" in column else 0
                    cursor.execute(f"UPDATE {table} SET {column} = ? WHERE {column} IS NULL", (default_val,))
                elif "VARCHAR" in col_type and column == "theme":
                    cursor.execute(f"UPDATE {table} SET {column} = 'system' WHERE {column} IS NULL")
                print(f"Successfully injected '{column}' into '{table}' unit.")
            except Exception as e:
                print(f"Failed to inject '{column}' into '{table}': {e}")

    # Synchronize Companies Unit
    add_column_safely("companies", "is_active", "BOOLEAN")
    add_column_safely("companies", "created_at", "DATETIME")
    add_column_safely("companies", "admin_suspended", "BOOLEAN")
    add_column_safely("companies", "manager_suspended", "BOOLEAN")
    
    # Synchronize Users Unit (CRITICAL FOR AUTH)
    add_column_safely("users", "created_at", "DATETIME")
    add_column_safely("users", "is_active", "BOOLEAN") # Ensuring visibility for Admin activation
    add_column_safely("users", "role", "String") # Ensuring role structure
    add_column_safely("users", "theme", "VARCHAR") # Feature: Dynamic User Themes
            
    # Create user_companies association table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_companies (
            user_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            PRIMARY KEY (user_id, company_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
    """)
    print("Ensured 'user_companies' table exists.")

    # Migration: Move existing company_id from users to user_companies
    cursor.execute("SELECT id, company_id FROM users WHERE company_id IS NOT NULL")
    existing_assignments = cursor.fetchall()
    
    for u_id, c_id in existing_assignments:
        cursor.execute("INSERT OR IGNORE INTO user_companies (user_id, company_id) VALUES (?, ?)", (u_id, c_id))
    
    if existing_assignments:
        print(f"Migrated {len(existing_assignments)} company assignments to the new association table.")
            
    conn.commit()
    conn.close()

    # Consolidated Purge: Remove duplicate database to avoid future confusion
    duplicate_db = 'sales_rag.db'
    if os.path.exists(duplicate_db):
        try:
            os.remove(duplicate_db)
            print("Purged duplicate database (sales_rag.db) to consolidate storage.")
        except:
            pass

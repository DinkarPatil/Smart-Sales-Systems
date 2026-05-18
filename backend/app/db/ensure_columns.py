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
    
    # Synchronize Queries Unit (CRITICAL FOR OWNER DASHBOARD SLA)
    add_column_safely("queries", "is_escalated", "BOOLEAN")
    add_column_safely("queries", "escalated_at", "DATETIME")
    add_column_safely("queries", "deadline_at", "DATETIME")
    add_column_safely("queries", "priority", "String")
    add_column_safely("queries", "tokens", "Integer")
    
    # Synchronize Products Unit
    add_column_safely("products", "base_price", "Integer")
    add_column_safely("products", "max_discount_pct", "Integer")
    add_column_safely("products", "manual_content", "TEXT")
            
    # Create user_companies association table (legacy simple join — kept for one release).
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_companies (
            user_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            PRIMARY KEY (user_id, company_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
        )
    """)
    print("Ensured 'user_companies' table exists (legacy).")

    # Migration: Move existing company_id from users to user_companies
    cursor.execute("SELECT id, company_id FROM users WHERE company_id IS NOT NULL")
    existing_assignments = cursor.fetchall()
    for u_id, c_id in existing_assignments:
        cursor.execute("INSERT OR IGNORE INTO user_companies (user_id, company_id) VALUES (?, ?)", (u_id, c_id))
    if existing_assignments:
        print(f"Migrated {len(existing_assignments)} company assignments to the legacy association table.")

    # Create the new rich user_company_assignments table (D1 from build prompt 01).
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_company_assignments (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            role_in_company TEXT NOT NULL,
            manager_id TEXT,
            assigned_by TEXT,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_primary BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'active',
            UNIQUE (user_id, company_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
            FOREIGN KEY (manager_id) REFERENCES users (id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_uca_user ON user_company_assignments(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_uca_company ON user_company_assignments(company_id)")
    print("Ensured 'user_company_assignments' table exists.")

    # Backfill UCA rows from users.company_id for Manager/Agent/SalesRep/Reviewer/Curator users.
    backfill_roles = ("Manager", "Agent", "SalesRep", "Reviewer", "Curator")
    cursor.execute(
        f"SELECT id, company_id, role FROM users WHERE company_id IS NOT NULL AND role IN ({','.join('?' * len(backfill_roles))})",
        backfill_roles,
    )
    rich_assignments = cursor.fetchall()
    import uuid as _uuid
    for u_id, c_id, role in rich_assignments:
        # role_in_company: collapse legacy SalesRep into Agent.
        ric = "Agent" if role == "SalesRep" else role
        new_id = str(_uuid.uuid4())
        cursor.execute(
            "INSERT OR IGNORE INTO user_company_assignments "
            "(id, user_id, company_id, role_in_company, is_primary, status) "
            "VALUES (?, ?, ?, ?, 1, 'active')",
            (new_id, u_id, c_id, ric),
        )
    if rich_assignments:
        print(f"Backfilled {len(rich_assignments)} user_company_assignments rows.")

    # Create auth_events table (for Admin + Auditor).
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_events (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            kind TEXT NOT NULL,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ae_user ON auth_events(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ae_kind ON auth_events(kind)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_ae_created ON auth_events(created_at)")
    print("Ensured 'auth_events' table exists.")
        
    # FORCE SYNC: Ensure dinkar10012@gmail.com has a company_id!
    cursor.execute("SELECT id FROM companies LIMIT 1")
    first_company = cursor.fetchone()
    if not first_company:
        import uuid
        new_comp_id = str(uuid.uuid4())
        cursor.execute("INSERT INTO companies (id, name, description) VALUES (?, ?, ?)", (new_comp_id, "Neural Nexus Auto-Generated", "System created company"))
        first_company = (new_comp_id,)
    
    # Apply to user
    cursor.execute("UPDATE users SET company_id = ? WHERE email = 'dinkar10012@gmail.com' AND (company_id IS NULL OR company_id = '')", (first_company[0],))
            
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

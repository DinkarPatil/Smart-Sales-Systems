import sqlite3
import os

db_path = r'c:\Users\Dinkar\Desktop\Sales RAG Systems\backend\sales_chatbot.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update status values to PascalCase
    cursor.execute("UPDATE queries SET status = 'Pending' WHERE status = 'pending'")
    cursor.execute("UPDATE queries SET status = 'Resolved' WHERE status = 'resolved'")
    cursor.execute("UPDATE queries SET status = 'Escalated' WHERE status = 'escalated'")
    
    # Perform a count of changes
    changes = conn.total_changes
    conn.commit()
    print(f"Updated {changes} rows in queries table.")
    conn.close()
else:
    print(f"Database not found at {db_path}")

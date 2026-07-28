import pandas as pd
import sqlite3
import os
import time

excel_file = "نتيجة ثانوية عامة نظام حديث.xlsx"
db_file = "students.db"

print("Starting Excel to SQLite conversion...")
start_time = time.time()

# Read Excel file
print("Reading Excel sheet (this may take a minute)...")
df = pd.read_excel(excel_file)
print(f"Excel read complete in {time.time() - start_time:.2f} seconds. Rows: {len(df)}")

# Clean up column names or types if needed
# Columns are ['seating_no', 'arabic_name', 'total_degree', 'student_case_desc']

# Connect to SQLite
print("Connecting to SQLite database...")
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Drop table if exists
cursor.execute("DROP TABLE IF EXISTS students")

# Write to SQLite
print("Writing data to SQLite...")
df.to_sql("students", conn, if_exists="replace", index=False)

# Create index for fast seating_no search
print("Creating index on seating_no...")
cursor.execute("CREATE UNIQUE INDEX idx_seating_no ON students (seating_no)")

conn.commit()
conn.close()

db_size = os.path.getsize(db_file)
print(f"Conversion complete in {time.time() - start_time:.2f} seconds!")
print(f"Database file size: {db_size / (1024*1024):.2f} MB")

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

def create_database():
    """Create PostgreSQL database"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password="postgres",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Create cursor
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'creative_hack'")
        exists = cursor.fetchone()
        
        if not exists:
            # Create database
            cursor.execute("CREATE DATABASE creative_hack")
            print("Database 'creative_hack' created")
        else:
            print("Database 'creative_hack' already exists")
        
        # Close connection
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Database creation error: {e}")
        return False

if __name__ == "__main__":
    create_database()

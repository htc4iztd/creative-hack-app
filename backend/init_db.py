import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Add application path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models and database settings
from app.database import engine
from app.models import models

def create_database():
    """Create PostgreSQL database"""
    try:
        print("Trying to connect to PostgreSQL...")
        # Connect to default postgres database
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password="postgres",
            port="5432",
            database="postgres"  # Connect to existing database
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
        print(f"Database creation error: {str(e)}")
        print("Please check if PostgreSQL is installed correctly.")
        print("Please check if PostgreSQL service is running.")
        print("Please check if username and password are correct.")
        return False

def create_tables():
    """Create database tables"""
    try:
        print("Trying to create database tables...")
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created")
        return True
    except OperationalError as e:
        print(f"Table creation error: {str(e)}")
        print("Cannot connect to database. Please check if PostgreSQL is running.")
        return False
    except Exception as e:
        print(f"Table creation error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting database initialization...")
    if create_database():
        create_tables()
    print("Database initialization completed")

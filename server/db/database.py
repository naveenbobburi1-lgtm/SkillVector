from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy import create_engine
from typing import Generator
import os
from dotenv import load_dotenv
load_dotenv()
db_uri = os.getenv("DATABASE_URL")
if not db_uri:
    raise RuntimeError("DATABASE_URL environment variable is required")

# Supabase (and some platforms) may give 'postgres://' — SQLAlchemy requires 'postgresql://'
if db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_uri, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
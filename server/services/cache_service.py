from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from db.models import LearningPath, MarketInsightsCache
from config import MARKET_INSIGHTS_TTL_HOURS


def invalidate_learning_path(user_id: int, db: Session):
    """Deletes the existing learning path for a user to force regeneration."""
    db.query(LearningPath).filter(LearningPath.user_id == user_id).delete()
    db.commit()


def invalidate_market_insights_cache(user_id: int, db: Session):
    """Deletes cached market insights for a user to force regeneration."""
    db.query(MarketInsightsCache).filter(MarketInsightsCache.user_id == user_id).delete()
    db.commit()


def get_valid_cache(user_id: int, role: str, db: Session):
    """Returns cached market insights if within TTL and role matches, else None."""
    cache = db.query(MarketInsightsCache).filter(
        MarketInsightsCache.user_id == user_id,
        MarketInsightsCache.role == role
    ).first()
    if not cache:
        return None
    age = datetime.now(timezone.utc) - cache.created_at.replace(tzinfo=timezone.utc)
    if age > timedelta(hours=MARKET_INSIGHTS_TTL_HOURS):
        # Expired — delete and return None
        db.delete(cache)
        db.commit()
        return None
    return cache

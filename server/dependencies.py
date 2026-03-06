from fastapi import Depends, HTTPException
from db.models import UserDB
from auth import get_current_user


def require_admin(current_user: UserDB = Depends(get_current_user)):
    """Dependency that ensures the current user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

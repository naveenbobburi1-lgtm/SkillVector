from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import UserDB
from auth import hash_password, verify_password, create_access_token, get_current_user
import schemas.UserSchemas as schemas

router = APIRouter()


@router.post("/register")
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        new_user = UserDB(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")
    return {"message": "User registered successfully", "user_id": new_user.id}


@router.post("/login")
async def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.hashed_password or db_user.hashed_password == "google_oauth_user":
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In. Please sign in with Google.")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact an administrator.")
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id}


@router.post("/auth/google")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    """
    Accept a Google OAuth2 access_token from the frontend (@react-oauth/google),
    verify it by calling Google's userinfo endpoint, then create/find the user
    and return a Skillvector JWT.
    """
    import httpx
    body = await request.json()
    access_token = body.get("credential")   # access_token passed as 'credential'
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing Google access token")

    # Verify token by fetching userinfo from Google (server-side validation)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired Google token")
        idinfo = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach Google servers")

    email: str = idinfo.get("email", "")
    name: str = idinfo.get("name") or email.split("@")[0]
    picture: str = idinfo.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google token")

    # Find or create user
    user = db.query(UserDB).filter(UserDB.email == email).first()
    is_new_user = False
    if not user:
        is_new_user = True
        base_username = name[:50]
        username = base_username
        counter = 1
        while db.query(UserDB).filter(UserDB.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        user = UserDB(
            username=username,
            email=email,
            hashed_password="google_oauth_user",
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create user")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact an administrator.")

    skillvector_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": skillvector_token,
        "token_type": "bearer",
        "user_id": user.id,
        "is_new_user": is_new_user,
        "name": user.username,
        "picture": picture,
    }

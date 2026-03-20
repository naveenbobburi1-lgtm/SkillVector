from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import UserDB, PasswordReset
from auth import hash_password, verify_password, create_access_token, get_current_user
import schemas.UserSchemas as schemas
import smtplib
import os
import random
import string
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()

# SMTP Configuration
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email: str, otp: str) -> bool:
    """Send OTP email using SMTP"""
    import logging
    logger = logging.getLogger(__name__)

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD env vars.")
        raise HTTPException(
            status_code=500,
            detail="Email service is not configured. Please contact the administrator."
        )

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        msg['Subject'] = 'SkillVector - Password Reset OTP'
        
        body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
        .otp-box {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }}
        .otp-code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #888; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your SkillVector account password. Use the OTP below:</p>
        <div class="otp-box">
            <div class="otp-code">{otp}</div>
        </div>
        <p><strong>This OTP is valid for 10 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
            <p>© 2026 SkillVector Inc.</p>
        </div>
    </div>
</body>
</html>
"""
        msg.attach(MIMEText(body, 'html'))
        
        logger.info(f"Attempting to send OTP email to {email}")
        logger.info(f"SMTP Email: {SMTP_EMAIL}")
        
        # Try TLS on port 587 first
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, email, msg.as_string())
            server.quit()
            logger.info(f"OTP email sent successfully to {email}")
            return True
        except Exception as tls_err:
            logger.warning(f"TLS connection failed, trying SSL: {tls_err}")
            # Try SSL on port 465
            try:
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, email, msg.as_string())
                server.quit()
                logger.info(f"OTP email sent successfully (SSL) to {email}")
                return True
            except Exception as ssl_err:
                logger.error(f"SSL connection also failed: {ssl_err}")
                raise
                
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        raise HTTPException(status_code=500, detail="Email service authentication failed. Please ensure your SMTP_PASSWORD is a valid Gmail App Password (16 characters). Generate it from your Google Account > Security > 2-Step Verification > App Passwords.")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")


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


@router.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate and send OTP to user's email"""
    user = db.query(UserDB).filter(UserDB.email == request.email).first()
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, an OTP will be sent"}
    
    # Check if user uses Google OAuth (no password set)
    if user.hashed_password == "google_oauth_user" or not user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In. Please sign in with Google instead."
        )
    
    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Delete any existing OTP for this email
    db.query(PasswordReset).filter(PasswordReset.email == request.email).delete()
    
    # Create new OTP record
    reset_record = PasswordReset(
        email=request.email,
        otp=otp,
        expires_at=expires_at
    )
    db.add(reset_record)
    
    # Send OTP email first — only commit the OTP record if email succeeds
    try:
        send_otp_email(request.email, otp)
        db.commit()
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")
    
    return {"message": "If the email exists, an OTP will be sent"}


@router.post("/verify-otp")
async def verify_otp(request: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verify the OTP sent to user's email"""
    reset_record = db.query(PasswordReset).filter(
        PasswordReset.email == request.email,
        PasswordReset.otp == request.otp
    ).first()
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if reset_record.expires_at < datetime.now(timezone.utc):
        db.delete(reset_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    return {"message": "OTP verified successfully", "verified": True}


@router.post("/reset-password")
async def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password after OTP verification"""
    reset_record = db.query(PasswordReset).filter(
        PasswordReset.email == request.email,
        PasswordReset.otp == request.otp
    ).first()
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if reset_record.expires_at < datetime.now(timezone.utc):
        db.delete(reset_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Update user's password
    user = db.query(UserDB).filter(UserDB.email == request.email).first()
    if user:
        user.hashed_password = hash_password(request.new_password)
    
    # Delete the OTP record
    db.delete(reset_record)
    db.commit()
    
    return {"message": "Password reset successfully"}

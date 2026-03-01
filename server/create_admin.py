"""One-time script to create an admin user."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from db.database import SessionLocal, init_db
from db.models import UserDB
import bcrypt

init_db()
db = SessionLocal()

existing = db.query(UserDB).filter(UserDB.email == "admin@skillvector.com").first()
if existing:
    existing.is_admin = True
    db.commit()
    print(f"Made existing user '{existing.username}' an admin")
else:
    hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin = UserDB(username="admin", email="admin@skillvector.com", hashed_password=hashed, is_admin=True, is_active=True)
    db.add(admin)
    db.commit()
    print("Created admin user")

print("Email:    admin@skillvector.com")
print("Password: admin123")
db.close()

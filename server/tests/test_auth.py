"""
Tests for authentication utilities: password hashing and JWT token creation/verification.
"""
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

# Set test environment variables before importing auth module
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing")
os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")

from auth import hash_password, verify_password, create_access_token, ALGORITHM
from jose import jwt


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        result = hash_password("mypassword123")
        assert isinstance(result, str)

    def test_hash_produces_different_hashes(self):
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2  # bcrypt salts should differ

    def test_verify_correct_password(self):
        password = "test_password_123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_verify_empty_password(self):
        hashed = hash_password("some_password")
        assert verify_password("", hashed) is False


class TestJWT:
    def test_create_access_token_returns_string(self):
        token = create_access_token(data={"sub": "user@example.com"})
        assert isinstance(token, str)

    def test_token_contains_correct_email(self):
        email = "test@example.com"
        token = create_access_token(data={"sub": email})
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[ALGORITHM])
        assert payload["sub"] == email

    def test_token_has_expiration(self):
        token = create_access_token(data={"sub": "user@test.com"})
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_token_expiration_is_in_future(self):
        token = create_access_token(data={"sub": "user@test.com"})
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > datetime.now(timezone.utc)

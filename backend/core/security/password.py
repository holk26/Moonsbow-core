from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    # bcrypt truncates at 72 bytes, so we truncate at 71 characters to be safe
    return pwd_context.hash(plain[:71])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:71], hashed)

import logging
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security.jwt import create_access_token
from backend.core.security.password import hash_password, verify_password
from backend.core.config.settings import get_settings
from backend.modules.auth.repository import UserRepository
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> UserResponse:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )
        hashed = hash_password(data.password)
        user = await self.repo.create(
            email=data.email,
            password_hash=hashed,
            full_name=data.full_name,
            tenant_id=data.tenant_id,
        )
        return UserResponse.model_validate(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        from fastapi import HTTPException, status
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return TokenResponse(access_token=token)

    async def verify_token(self, token: str) -> UserResponse:
        from backend.core.security.jwt import decode_token
        from fastapi import HTTPException, status
        import uuid
        try:
            payload = decode_token(token)
            user_id = uuid.UUID(payload.get("sub"))
        except (ValueError, Exception):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return UserResponse.model_validate(user)

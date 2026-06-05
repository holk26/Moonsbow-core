import logging
import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security.jwt import create_access_token, decode_token
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
        try:
            existing = await self.repo.get_by_email(data.email)
            if existing:
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
            
            # Emit event
            from backend.core.events.dispatcher import get_dispatcher
            dispatcher = get_dispatcher()
            await dispatcher.publish(
                "user.created",
                payload={"user_id": str(user.id), "email": user.email, "tenant_id": str(data.tenant_id) if data.tenant_id else None},
                app_id=None,
            )

            # Dispatch sync webhook to all active apps for autonomous architecture
            from backend.core.sync.dispatcher import get_sync_dispatcher
            sync_dispatcher = get_sync_dispatcher()
            await sync_dispatcher.dispatch(
                event_type="sync.user.created",
                payload={
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "tenant_id": str(data.tenant_id) if data.tenant_id else None,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                },
                db=self.db,
            )

            return UserResponse.model_validate(user)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"REGISTRATION_ERROR_V2: {str(e)}",
            )

    async def login(self, data: LoginRequest) -> TokenResponse:
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

        # Build extra claims from user's tenant for offline validation
        extra_claims = {}
        if user.tenant_id:
            from backend.modules.tenants.repository import TenantRepository
            tenant_repo = TenantRepository(self.db)
            tenant = await tenant_repo.get_by_id(user.tenant_id)
            if tenant:
                extra_claims = {
                    "tenant_id": str(tenant.id),
                    "tenant_slug": tenant.slug,
                    "tenant_plan": tenant.plan,
                }

        token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            extra_claims=extra_claims,
        )
        return TokenResponse(access_token=token)

    async def verify_token(self, token: str) -> UserResponse:
        try:
            payload = decode_token(token)
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
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

    async def list_users(self, page: int = 1, size: int = 20) -> tuple[list[UserResponse], int]:
        users, total = await self.repo.list_all(page=page, size=size)
        return [UserResponse.model_validate(u) for u in users], total

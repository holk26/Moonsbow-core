import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plugins.lms.models import Course, Enrollment

logger = logging.getLogger(__name__)


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, course_id: uuid.UUID) -> Course | None:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Course]:
        result = await self.db.execute(
            select(Course).where(Course.tenant_id == tenant_id).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> Course:
        course = Course(**data)
        self.db.add(course)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def update(self, course: Course, **kwargs) -> Course:
        for key, value in kwargs.items():
            setattr(course, key, value)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def delete(self, course: Course) -> None:
        await self.db.delete(course)
        await self.db.flush()


class EnrollmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Enrollment:
        enrollment = Enrollment(**data)
        self.db.add(enrollment)
        await self.db.flush()
        await self.db.refresh(enrollment)
        return enrollment

    async def get_by_course(self, course_id: uuid.UUID) -> list[Enrollment]:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.course_id == course_id)
        )
        return list(result.scalars().all())

import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.plugins.lms.repository import CourseRepository, EnrollmentRepository
from backend.plugins.lms.schemas import CourseCreate, CourseUpdate, CourseResponse, EnrollmentCreate, EnrollmentResponse

logger = logging.getLogger(__name__)


class LMSService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    async def create_course(self, data: CourseCreate) -> CourseResponse:
        course = await self.course_repo.create(data.model_dump())
        return CourseResponse.model_validate(course)

    async def get_course(self, course_id: uuid.UUID) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        return CourseResponse.model_validate(course)

    async def list_courses(self, tenant_id: uuid.UUID, page: int = 1, size: int = 20) -> list[CourseResponse]:
        offset = (page - 1) * size
        courses = await self.course_repo.list_by_tenant(tenant_id=tenant_id, offset=offset, limit=size)
        return [CourseResponse.model_validate(c) for c in courses]

    async def update_course(self, course_id: uuid.UUID, data: CourseUpdate) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        updates = data.model_dump(exclude_unset=True)
        course = await self.course_repo.update(course, **updates)
        return CourseResponse.model_validate(course)

    async def delete_course(self, course_id: uuid.UUID) -> None:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        await self.course_repo.delete(course)

    async def enroll_student(self, data: EnrollmentCreate) -> EnrollmentResponse:
        enrollment = await self.enrollment_repo.create(data.model_dump())
        return EnrollmentResponse.model_validate(enrollment)

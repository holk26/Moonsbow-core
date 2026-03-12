import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.plugins.lms.service import LMSService
from backend.plugins.lms.schemas import CourseCreate, CourseUpdate, CourseResponse, EnrollmentCreate, EnrollmentResponse

router = APIRouter(prefix="/lms", tags=["lms"])


@router.post("/courses", response_model=CourseResponse, status_code=201)
async def create_course(
    data: CourseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = LMSService(db)
    return await service.create_course(data)


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = LMSService(db)
    return await service.get_course(course_id)


@router.get("/tenant/{tenant_id}/courses", response_model=list[CourseResponse])
async def list_courses(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = LMSService(db)
    return await service.list_courses(tenant_id=tenant_id, page=page, size=size)


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    data: CourseUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = LMSService(db)
    return await service.update_course(course_id, data)


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(
    course_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = LMSService(db)
    await service.delete_course(course_id)


@router.post("/enrollments", response_model=EnrollmentResponse, status_code=201)
async def enroll_student(
    data: EnrollmentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = LMSService(db)
    return await service.enroll_student(data)

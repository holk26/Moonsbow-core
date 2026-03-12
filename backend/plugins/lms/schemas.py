import uuid
from pydantic import BaseModel, ConfigDict


class CourseCreate(BaseModel):
    tenant_id: uuid.UUID
    title: str
    description: str | None = None
    instructor_id: uuid.UUID | None = None
    price: float = 0.0
    max_students: int | None = None
    category: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_published: bool | None = None
    price: float | None = None
    max_students: int | None = None
    category: str | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    description: str | None
    instructor_id: uuid.UUID | None
    is_published: bool
    price: float
    max_students: int | None
    category: str | None


class EnrollmentCreate(BaseModel):
    tenant_id: uuid.UUID
    course_id: uuid.UUID
    student_id: uuid.UUID


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    course_id: uuid.UUID
    student_id: uuid.UUID
    status: str
    progress: float

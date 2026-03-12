from backend.core.events.event_types import EventType
from backend.core.events.dispatcher import get_dispatcher


async def emit_course_created(course_id: str, tenant_id: str, title: str) -> None:
    dispatcher = get_dispatcher()
    await dispatcher.publish(
        EventType.COURSE_CREATED,
        {"course_id": course_id, "tenant_id": tenant_id, "title": title},
    )


async def emit_student_enrolled(course_id: str, student_id: str, tenant_id: str) -> None:
    dispatcher = get_dispatcher()
    await dispatcher.publish(
        EventType.COURSE_ENROLLED,
        {"course_id": course_id, "student_id": student_id, "tenant_id": tenant_id},
    )

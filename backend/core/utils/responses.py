from typing import Any
from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": None,
        },
    )


def paginated_response(
    items: list,
    total: int,
    page: int,
    size: int,
    message: str = "Success",
) -> dict:
    pages = (total + size - 1) // size if size > 0 else 0
    return {
        "success": True,
        "message": message,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        },
    }

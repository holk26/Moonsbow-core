import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_app(client: AsyncClient):
    # Login first
    await client.post("/api/v1/auth/register", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    response = await client.post(
        "/api/v1/apps/",
        json={"name": "Test App", "slug": "test-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test App"
    assert data["slug"] == "test-app"
    assert data["api_key"].startswith("mb_")
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_apps(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    response = await client.get(
        "/api/v1/apps/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_rotate_app_key(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    # Create app
    create = await client.post(
        "/api/v1/apps/",
        json={"name": "Rotate App", "slug": "rotate-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    app_id = create.json()["id"]
    old_key = create.json()["api_key"]

    # Rotate
    response = await client.post(
        f"/api/v1/apps/{app_id}/rotate-key",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    new_key = response.json()["api_key"]
    assert new_key != old_key

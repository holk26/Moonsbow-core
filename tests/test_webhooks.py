import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_webhook(client: AsyncClient):
    # Setup: register and login
    await client.post("/api/v1/auth/register", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    # Create app
    app_resp = await client.post(
        "/api/v1/apps/",
        json={"name": "Webhook App", "slug": "webhook-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    api_key = app_resp.json()["api_key"]

    # Create webhook using API Key
    response = await client.post(
        "/api/v1/webhooks/",
        json={"event_types": ["user.created"], "url": "https://example.com/webhook"},
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["event_types"] == ["user.created"]
    assert data["url"] == "https://example.com/webhook"
    assert len(data["secret"]) > 0


@pytest.mark.asyncio
async def test_list_webhooks(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    app_resp = await client.get(
        "/api/v1/apps/",
        headers={"Authorization": f"Bearer {token}"},
    )
    api_key = app_resp.json()[0]["api_key"]

    response = await client.get(
        "/api/v1/webhooks/",
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1

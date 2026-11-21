from __future__ import annotations

import asyncio
from collections.abc import Coroutine
from typing import Any

import httpx
import pytest

from app.core.limiter import limiter
from app.core.storage import InMemoryRepository, set_repository_for_testing
from app.main import create_app


def _run(coro: Coroutine[Any, Any, Any]) -> Any:
    return asyncio.run(coro)


@pytest.fixture()
def app_instance():
    repo = InMemoryRepository(json_path=None)
    set_repository_for_testing(repo)
    limiter.reset()
    app = create_app()
    yield app
    set_repository_for_testing(None)


def test_health_frontend_and_security_headers(app_instance):
    async def scenario():
        transport = httpx.ASGITransport(app=app_instance)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
            assert resp.status_code == 200
            assert resp.json()["status"] == "ok"
            assert resp.headers["x-content-type-options"] == "nosniff"
            assert resp.headers["x-frame-options"] == "DENY"
            assert "content-security-policy" in resp.headers

            home = await client.get("/")
            assert home.status_code == 200
            assert "DevQuest Atelier" in home.text

    _run(scenario())


def test_signup_login_me_and_logout_revocation(app_instance):
    async def scenario():
        transport = httpx.ASGITransport(app=app_instance)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            signup = await client.post(
                "/auth/signup",
                json={"username": "atelier_dev", "password": "StrongPassword123"},
            )
            assert signup.status_code == 201
            token = signup.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            me = await client.get("/users/me", headers=headers)
            assert me.status_code == 200
            assert me.json()["username"] == "atelier_dev"
            assert me.json()["exp"] == 0

            # Logout must revoke token immediately
            logout = await client.post("/auth/logout", headers=headers)
            assert logout.status_code == 200

            me_after = await client.get("/users/me", headers=headers)
            assert me_after.status_code == 401

            # Login again works with bcrypt hash
            login = await client.post(
                "/auth/login",
                json={"username": "atelier_dev", "password": "StrongPassword123"},
            )
            assert login.status_code == 200
            assert login.json()["access_token"] != token

    _run(scenario())


def test_duplicate_username_and_weak_password_rejected(app_instance):
    async def scenario():
        transport = httpx.ASGITransport(app=app_instance)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            weak = await client.post(
                "/auth/signup",
                json={"username": "weakuser", "password": "onlyletters"},
            )
            assert weak.status_code == 422

            ok = await client.post(
                "/auth/signup",
                json={"username": "hero_01", "password": "Password123"},
            )
            assert ok.status_code == 201

            dup = await client.post(
                "/auth/signup",
                json={"username": "HERO_01", "password": "Password123"},
            )
            assert dup.status_code == 409

    _run(scenario())


def test_quest_completion_idempotent_and_leaderboard(app_instance):
    async def scenario():
        transport = httpx.ASGITransport(app=app_instance)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/auth/signup",
                json={"username": "mapper_01", "password": "Password123"},
            )
            headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

            first = await client.post(
                "/users/me/quests/lesson-1/complete",
                json={"exp_reward": 80, "solo_level": "Relational"},
                headers=headers,
            )
            assert first.status_code == 200
            assert first.json()["newly_completed"] is True
            assert first.json()["awarded_exp"] == 80
            assert first.json()["user"]["exp"] == 80

            # Completing same quest again should NOT double-award EXP
            second = await client.post(
                "/users/me/quests/lesson-1/complete",
                json={"exp_reward": 80, "solo_level": "Extended Abstract"},
                headers=headers,
            )
            assert second.status_code == 200
            assert second.json()["newly_completed"] is False
            assert second.json()["awarded_exp"] == 0
            assert second.json()["user"]["exp"] == 80
            assert second.json()["user"]["solo_history"]["lesson-1"] == "Extended Abstract"

            # Invalid quest ID rejected
            bad = await client.post(
                "/users/me/quests/invalid-999/complete",
                json={"exp_reward": 80, "solo_level": "Relational"},
                headers=headers,
            )
            assert bad.status_code == 400

            lb = await client.get("/leaderboard")
            assert lb.status_code == 200
            assert lb.json()[0]["username"] == "mapper_01"
            assert lb.json()[0]["exp"] == 80

    _run(scenario())


def test_ai_solo_analyzer_detects_levels_and_accessibility(app_instance):
    async def scenario():
        transport = httpx.ASGITransport(app=app_instance)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            r1 = await client.post(
                "/ai/solo-analyze",
                json={
                    "code": "",
                    "quest_title": "โครงกระดูกหน้าเว็บแรก",
                    "required_tags": ["h1", "p"],
                },
            )
            assert r1.status_code == 200
            assert r1.json()["solo_level"] == "Pre-structural"

            r2 = await client.post(
                "/ai/solo-analyze",
                json={
                    "code": (
                        "<main><article><h1>DevQuest</h1>"
                        "<p>เรียนรู้ HTML อย่างเป็นระบบ</p></article></main>"
                    ),
                    "quest_title": "โครงกระดูกหน้าเว็บแรก",
                    "required_tags": ["h1", "p"],
                },
            )
            assert r2.status_code == 200
            assert r2.json()["solo_level"] == "Extended Abstract"
            assert r2.json()["structure_score"] == 100

            r3 = await client.post(
                "/ai/solo-analyze",
                json={
                    "code": "<figure><img src='cat.png'>",
                    "quest_title": "ภาพถ่าย",
                    "required_tags": ["figure", "img", "figcaption"],
                },
            )
            assert r3.status_code == 200
            assert "figure" in r3.json()["unclosed_tags"]
            assert r3.json()["structure_score"] < 90

    _run(scenario())

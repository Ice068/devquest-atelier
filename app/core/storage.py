from __future__ import annotations

import json
import logging
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class UserRepository(Protocol):
    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None: ...
    def get_user_by_username(self, username: str) -> dict[str, Any] | None: ...
    def create_user(self, username: str, password_hash: str) -> dict[str, Any]: ...
    def add_exp(self, user_id: str, amount: int) -> dict[str, Any] | None: ...
    def complete_quest(
        self,
        user_id: str,
        quest_id: str,
        exp_reward: int,
        solo_level: str,
    ) -> tuple[dict[str, Any] | None, bool]: ...
    def get_leaderboard(self, limit: int = 10) -> list[dict[str, Any]]: ...
    def revoke_token(self, jti: str, expires_at: int) -> None: ...
    def is_token_revoked(self, jti: str) -> bool: ...


class InMemoryRepository:
    """Thread-safe in-memory repository (also base for local JSON persistence)."""

    def __init__(self, json_path: Path | None = None) -> None:
        self._lock = threading.RLock()
        self._json_path = json_path
        self._users: dict[str, dict[str, Any]] = {}
        self._revoked: dict[str, int] = {}
        if self._json_path:
            self._load()

    def _load(self) -> None:
        if not self._json_path or not self._json_path.exists():
            return
        try:
            raw = json.loads(self._json_path.read_text(encoding="utf-8"))
            self._users = raw.get("users", {})
            self._revoked = raw.get("revoked_tokens", {})
        except Exception as exc:
            logger.warning("Could not load local db (%s); starting fresh", exc)

    def _save(self) -> None:
        if not self._json_path:
            return
        self._json_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "users": self._users,
            "revoked_tokens": self._revoked,
        }
        tmp_path = self._json_path.with_suffix(".tmp")
        tmp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(self._json_path)

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        with self._lock:
            user = self._users.get(user_id)
            return dict(user) if user else None

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        target = username.lower()
        with self._lock:
            for user in self._users.values():
                if user["username_lower"] == target:
                    return dict(user)
            return None

    def create_user(self, username: str, password_hash: str) -> dict[str, Any]:
        with self._lock:
            user_id = uuid4().hex
            now = datetime.now(UTC).isoformat()
            doc: dict[str, Any] = {
                "id": user_id,
                "username": username,
                "username_lower": username.lower(),
                "password_hash": password_hash,
                "exp": 0,
                "completed_quests": [],
                "solo_history": {},
                "streak_days": 1,
                "created_at": now,
                "updated_at": now,
            }
            self._users[user_id] = doc
            self._save()
            return dict(doc)

    def add_exp(self, user_id: str, amount: int) -> dict[str, Any] | None:
        with self._lock:
            user = self._users.get(user_id)
            if not user:
                return None
            user["exp"] = int(user.get("exp", 0)) + amount
            user["updated_at"] = datetime.now(UTC).isoformat()
            self._save()
            return dict(user)

    def complete_quest(
        self,
        user_id: str,
        quest_id: str,
        exp_reward: int,
        solo_level: str,
    ) -> tuple[dict[str, Any] | None, bool]:
        with self._lock:
            user = self._users.get(user_id)
            if not user:
                return None, False
            completed: list[str] = list(user.get("completed_quests", []))
            already_done = quest_id in completed
            if not already_done:
                completed.append(quest_id)
                user["completed_quests"] = completed
                user["exp"] = int(user.get("exp", 0)) + exp_reward
            solo_history = dict(user.get("solo_history", {}))
            solo_history[quest_id] = solo_level
            user["solo_history"] = solo_history
            user["updated_at"] = datetime.now(UTC).isoformat()
            self._save()
            return dict(user), not already_done

    def get_leaderboard(self, limit: int = 10) -> list[dict[str, Any]]:
        with self._lock:
            ranked = sorted(
                self._users.values(),
                key=lambda u: (-int(u.get("exp", 0)), u.get("created_at", "")),
            )[:limit]
            return [
                {
                    "username": u["username"],
                    "exp": int(u.get("exp", 0)),
                    "completed_count": len(u.get("completed_quests", [])),
                }
                for u in ranked
            ]

    def revoke_token(self, jti: str, expires_at: int) -> None:
        with self._lock:
            now = int(datetime.now(UTC).timestamp())
            self._revoked = {k: v for k, v in self._revoked.items() if v > now}
            self._revoked[jti] = expires_at
            self._save()

    def is_token_revoked(self, jti: str) -> bool:
        with self._lock:
            exp = self._revoked.get(jti)
            if exp is None:
                return False
            if exp <= int(datetime.now(UTC).timestamp()):
                self._revoked.pop(jti, None)
                return False
            return True


class FirestoreRepository:
    """Production Firebase Firestore repository via Firebase Admin SDK."""

    def __init__(self, credentials_path: str) -> None:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
        self._db = firestore.client()
        self._firestore = firestore

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        snap = self._db.collection("users").document(user_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict() or {}
        data["id"] = snap.id
        return data

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        query = (
            self._db.collection("users")
            .where("username_lower", "==", username.lower())
            .limit(1)
            .stream()
        )
        for snap in query:
            data = snap.to_dict() or {}
            data["id"] = snap.id
            return data
        return None

    def create_user(self, username: str, password_hash: str) -> dict[str, Any]:
        user_id = uuid4().hex
        now = datetime.now(UTC).isoformat()
        doc: dict[str, Any] = {
            "id": user_id,
            "username": username,
            "username_lower": username.lower(),
            "password_hash": password_hash,
            "exp": 0,
            "completed_quests": [],
            "solo_history": {},
            "streak_days": 1,
            "created_at": now,
            "updated_at": now,
        }
        self._db.collection("users").document(user_id).set(doc)
        return doc

    def add_exp(self, user_id: str, amount: int) -> dict[str, Any] | None:
        ref = self._db.collection("users").document(user_id)
        snap = ref.get()
        if not snap.exists:
            return None
        ref.update(
            {
                "exp": self._firestore.Increment(amount),
                "updated_at": datetime.now(UTC).isoformat(),
            }
        )
        updated = ref.get().to_dict() or {}
        updated["id"] = user_id
        return updated

    def complete_quest(
        self,
        user_id: str,
        quest_id: str,
        exp_reward: int,
        solo_level: str,
    ) -> tuple[dict[str, Any] | None, bool]:
        ref = self._db.collection("users").document(user_id)
        snap = ref.get()
        if not snap.exists:
            return None, False
        data = snap.to_dict() or {}
        completed = list(data.get("completed_quests", []))
        newly_completed = quest_id not in completed
        updates: dict[str, Any] = {
            f"solo_history.{quest_id}": solo_level,
            "updated_at": datetime.now(UTC).isoformat(),
        }
        if newly_completed:
            completed.append(quest_id)
            updates["completed_quests"] = completed
            updates["exp"] = self._firestore.Increment(exp_reward)
        ref.update(updates)
        updated = ref.get().to_dict() or {}
        updated["id"] = user_id
        return updated, newly_completed

    def get_leaderboard(self, limit: int = 10) -> list[dict[str, Any]]:
        snaps = (
            self._db.collection("users")
            .order_by("exp", direction=self._firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        result: list[dict[str, Any]] = []
        for snap in snaps:
            u = snap.to_dict() or {}
            result.append(
                {
                    "username": u.get("username", "anonymous"),
                    "exp": int(u.get("exp", 0)),
                    "completed_count": len(u.get("completed_quests", [])),
                }
            )
        return result

    def revoke_token(self, jti: str, expires_at: int) -> None:
        self._db.collection("revoked_tokens").document(jti).set(
            {
                "expires_at": expires_at,
                "revoked_at": datetime.now(UTC).isoformat(),
            }
        )

    def is_token_revoked(self, jti: str) -> bool:
        snap = self._db.collection("revoked_tokens").document(jti).get()
        return snap.exists


_repository_instance: UserRepository | None = None


def get_repository() -> UserRepository:
    global _repository_instance
    if _repository_instance is not None:
        return _repository_instance

    settings = get_settings()
    if settings.storage_backend == "firestore":
        cred_path = Path(settings.firebase_credentials_path)
        if cred_path.exists():
            logger.info("Using Firebase Firestore storage backend")
            _repository_instance = FirestoreRepository(str(cred_path))
            return _repository_instance
        logger.warning(
            "Firebase credentials not found at %s; falling back to local JSON storage",
            cred_path,
        )

    if settings.storage_backend == "memory":
        _repository_instance = InMemoryRepository(json_path=None)
    else:
        _repository_instance = InMemoryRepository(json_path=Path(settings.local_db_path))
    return _repository_instance


def set_repository_for_testing(repo: UserRepository | None) -> None:
    global _repository_instance
    _repository_instance = repo

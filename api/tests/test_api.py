import hashlib
import unittest
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from api._lib.deps import get_supabase, require_jwt
from api.index import app, get_onboarding_supabase


class MemoryQuery:
    def __init__(self, db, table):
        self.db = db
        self.table = table
        self.filters = []
        self.operation = "select"
        self.values = None
        self.max_rows = None
        self.columns = None

    def select(self, columns="*", **_kwargs):
        if columns != "*":
            self.columns = [column.strip() for column in columns.split(",")]
        return self

    def eq(self, column, value):
        self.filters.append((column, "eq", value))
        return self

    def is_(self, column, value):
        self.filters.append((column, "is", None if value == "null" else value))
        return self

    def gte(self, column, value):
        self.filters.append((column, "gte", value))
        return self

    def lte(self, column, value):
        self.filters.append((column, "lte", value))
        return self

    def lt(self, column, value):
        self.filters.append((column, "lt", value))
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, value):
        self.max_rows = value
        return self

    def insert(self, values):
        self.operation = "insert"
        self.values = dict(values)
        return self

    def update(self, values):
        self.operation = "update"
        self.values = dict(values)
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def _matches(self, row):
        for column, operator, value in self.filters:
            actual = row.get(column)
            if operator in ("eq", "is") and actual != value:
                return False
            if operator == "gte" and (actual is None or actual < value):
                return False
            if operator == "lte" and (actual is None or actual > value):
                return False
            if operator == "lt" and (actual is None or actual >= value):
                return False
        return True

    def execute(self):
        rows = self.db.rows.setdefault(self.table, [])
        matched = [row for row in rows if self._matches(row)]
        if self.operation == "insert":
            row = dict(self.values)
            row.setdefault("id", str(uuid.uuid4()))
            if self.table == "journals":
                row.setdefault("journal_id", str(uuid.uuid4()))
            now = datetime.now(timezone.utc).isoformat()
            row.setdefault("created_at", now)
            row.setdefault("updated_at", now)
            rows.append(row)
            return SimpleNamespace(data=[dict(row)])
        if self.operation == "update":
            for row in matched:
                row.update(self.values)
            return SimpleNamespace(data=[dict(row) for row in matched])
        if self.operation == "delete":
            for row in matched:
                rows.remove(row)
            return SimpleNamespace(data=[dict(row) for row in matched])
        data = [dict(row) for row in matched]
        if self.columns is not None:
            data = [
                {column: row.get(column) for column in self.columns}
                for row in data
            ]
        if self.max_rows is not None:
            data = data[: self.max_rows]
        return SimpleNamespace(data=data)


class MemorySupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        return MemoryQuery(self, name)


class APITests(unittest.TestCase):
    def setUp(self):
        self.key_a = "dfm_live_user_a"
        self.key_b = "dfm_live_user_b"
        now = datetime.now(timezone.utc).isoformat()
        self.entry_a = str(uuid.uuid4())
        self.entry_b = str(uuid.uuid4())
        self.db = MemorySupabase(
            {
                "api_keys": [
                    {
                        "id": "key-a",
                        "user_id": "user-a",
                        "key_hash": hashlib.sha256(self.key_a.encode()).hexdigest(),
                        "scopes": ["read", "write"],
                        "revoked_at": None,
                    },
                    {
                        "id": "key-b",
                        "user_id": "user-b",
                        "key_hash": hashlib.sha256(self.key_b.encode()).hexdigest(),
                        "scopes": ["read", "write", "delete"],
                        "revoked_at": None,
                    },
                ],
                "journals": [
                    {
                        "journal_id": self.entry_a,
                        "user_id": "user-a",
                        "type": "memory",
                        "title": "A",
                        "content": "private A",
                        "created_at": now,
                    },
                    {
                        "journal_id": self.entry_b,
                        "user_id": "user-b",
                        "type": "letter",
                        "title": "B",
                        "content": "private B",
                        "created_at": now,
                    },
                ],
                "profiles": [],
            }
        )
        app.dependency_overrides[get_supabase] = lambda: self.db
        app.dependency_overrides[get_onboarding_supabase] = lambda: self.db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_public_crisis_resources(self):
        response = self.client.get("/v1/crisis-resources?region=us")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["resources"][0]["phone"], "988")

    def test_missing_api_key_is_401(self):
        response = self.client.get("/v1/entries")
        self.assertEqual(response.status_code, 401)

    def test_mobile_signup_contract_returns_personal_key(self):
        payload = {
            "account": {
                "id": "new-user",
                "email": "new@example.com",
                "name": "New Person",
            },
            "api_key": {
                "id": "new-key",
                "name": "DFM Voice iPhone",
                "key": "dfm_live_new",
                "key_hint": "dfm_live_new",
                "scopes": ["read", "write"],
                "created_at": "2026-08-09T00:00:00Z",
            },
        }
        with (
            patch("api.index.direct_backend.ENABLED", False),
            patch("api.index.service.create_mobile_account", return_value=payload) as create_account,
        ):
            response = self.client.post(
                "/v1/onboarding/signup",
                json={
                    "name": "  New Person  ",
                    "email": "NEW@example.com",
                    "password": "long-enough-password",
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["api_key"]["key"], "dfm_live_new")
        request = create_account.call_args.args[1]
        self.assertEqual(request.name, "New Person")
        self.assertEqual(request.email, "new@example.com")

    def test_mobile_signup_does_not_require_an_existing_api_key(self):
        with (
            patch("api.index.direct_backend.ENABLED", True),
            patch("api.index.direct_backend.authorize", return_value=False),
            patch("api.index.direct_backend.DEMO_API_KEY", "dfm_live_preseeded"),
            patch("api.index.service.create_mobile_account") as create_account,
        ):
            response = self.client.post(
                "/v1/onboarding/signup",
                json={
                    "name": "New Person",
                    "email": "new@example.com",
                    "password": "long-enough-password",
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["api_key"]["key"], "dfm_live_preseeded")
        create_account.assert_not_called()

    def test_mobile_signup_rejects_bad_identity_data(self):
        response = self.client.post(
            "/v1/onboarding/signup",
            json={"name": "A", "email": "not-email", "password": "short"},
        )
        self.assertEqual(response.status_code, 422)

    def test_provider_proxy_route_is_removed(self):
        request = {
            "model": "claude-haiku-4-5",
            "max_tokens": 128,
            "messages": [{"role": "user", "content": "hello"}],
        }
        response = self.client.post("/v1/agent/messages", json=request)
        self.assertEqual(response.status_code, 404)

    def test_cross_user_entries_are_isolated(self):
        response = self.client.get(
            "/v1/entries", headers={"x-api-key": self.key_a}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["journal_id"] for row in response.json()], [self.entry_a])
        response = self.client.get(
            f"/v1/letters/{self.entry_b}", headers={"x-api-key": self.key_a}
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_requires_confirmation_and_scope(self):
        response = self.client.delete(
            f"/v1/entries/{self.entry_a}", headers={"x-api-key": self.key_a}
        )
        self.assertEqual(response.status_code, 400)
        response = self.client.delete(
            f"/v1/entries/{self.entry_a}?confirm=true",
            headers={"x-api-key": self.key_a},
        )
        self.assertEqual(response.status_code, 403)

    def test_openapi_contract(self):
        spec = self.client.get("/v1/openapi.json").json()
        self.assertTrue(spec["servers"])
        self.assertEqual(
            spec["components"]["securitySchemes"]["ApiKeyAuth"]["name"],
            "x-api-key",
        )

    def test_api_key_is_shown_once_and_stored_hashed(self):
        app.dependency_overrides[require_jwt] = lambda: "user-a"
        response = self.client.post(
            "/v1/keys", json={"name": "demo", "scopes": ["read", "write"]}
        )
        self.assertEqual(response.status_code, 201)
        raw = response.json()["key"]
        self.assertTrue(raw.startswith("dfm_live_"))
        stored = self.db.rows["api_keys"][-1]
        self.assertNotIn(raw, stored.values())
        self.assertEqual(stored["key_hash"], hashlib.sha256(raw.encode()).hexdigest())
        listing = self.client.get("/v1/keys").json()
        self.assertNotIn("key_hash", listing[-1])
        self.assertNotIn("key", listing[-1])


if __name__ == "__main__":
    unittest.main()

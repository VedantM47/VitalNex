"""
In-memory stand-in for the Supabase PostgREST client, for API tests without a network.

- FakeClient(store) acts as the service role (no RLS).
- FakeClient(store, uid, role) acts as a signed-in user. Row visibility and allowed writes
  mirror the policies in supabase/migrations/20261026000001_p1_auth_persistence.sql, so the
  API's choice of client (RLS-scoped vs service role) is exercised. The SQL policies
  themselves are proven by supabase/tests/rls.sql.

Only the query-builder calls the API uses are implemented.
"""

import copy
import hashlib
import re
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any, Callable, Dict, List, Optional

EMBED = re.compile(r"(\w+)!(\w+)\(([^)]*)\)")

# parent table -> [(child table, fk column, action)]
CASCADES = {
    "profiles": [
        ("risk_assessments", "user_id", "cascade"), ("review_queue", "patient_id", "cascade"),
        ("share_tokens", "user_id", "cascade"), ("consents", "user_id", "cascade"),
        ("health_profiles", "user_id", "cascade"), ("appointments", "patient_id", "cascade"),
        ("assistant_logs", "user_id", "cascade"), ("data_requests", "user_id", "set_null"),
        ("audit_logs", "user_id", "set_null"),
    ],
    "risk_assessments": [("review_queue", "assessment_id", "cascade"),
                         ("clinician_overrides", "assessment_id", "cascade"),
                         ("appointments", "assessment_id", "set_null")],
    "share_tokens": [("share_access_log", "token_id", "cascade")],
}
DEFAULTS = {
    "review_queue": {"status": "pending", "assigned_to": None, "reviewed_by": None, "reviewed_at": None,
                     "clinician_note": None},
    "data_requests": {"status": "pending", "completed_at": None},
    "share_tokens": {"revoked_at": None},
    "consents": {"withdrawn_at": None, "granted_at": None, "notice_version": "v1"},
    "risk_assessments": {"assessment_mode": "live", "review_status": "not_required", "emergency_flag": False},
}
TIME_COL = {"share_access_log": "accessed_at"}
REASON_CODES = ("clinical_history_not_captured", "symptoms_present", "input_likely_wrong",
                "model_overestimates", "model_underestimates", "other")


class RLSDenied(Exception):
    """Like PostgREST 42501: the policy does not allow this write."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class FakeStore:
    def __init__(self):
        self.tables: Dict[str, List[dict]] = {}
        self.deleted_auth_users: List[str] = []

    def rows(self, table: str) -> List[dict]:
        return self.tables.setdefault(table, [])

    def add(self, table: str, **row) -> dict:
        row = {**DEFAULTS.get(table, {}), **row}
        row.setdefault("id", str(uuid.uuid4()))
        row.setdefault(TIME_COL.get(table, "created_at"), now_iso())
        self.rows(table).append(row)
        return row

    def check_constraints(self, table: str, row: dict) -> None:
        """The CHECK constraints the API relies on (P1 migration)."""
        if table == "clinician_overrides":
            assert row["reason_code"] in REASON_CODES, "clinician_overrides.reason_code check"
            assert row["reason_code"] != "other" or (row.get("note") or "").strip(), "other needs a note"
            assert row["clinician_band"] in ("Low", "Moderate", "High")
            assert row["model_band"] in ("Low", "Moderate", "High", "not_confident")
        if table == "share_tokens":
            assert re.fullmatch(r"[0-9a-f]{64}", row["token_hash"]), "token_hash must be a sha256 hex digest"

    # helpers used by the RLS emulation
    def role_of(self, uid) -> Optional[str]:
        return next((p["role"] for p in self.rows("profiles") if p["id"] == uid), None)

    def has_consent(self, uid, purpose) -> bool:
        return any(c["user_id"] == uid and c["purpose"] == purpose and c["granted"] and c["withdrawn_at"] is None
                   for c in self.rows("consents"))

    def delete_cascade(self, table: str, row: dict) -> None:
        self.tables[table] = [r for r in self.rows(table) if r is not row]
        for child, col, action in CASCADES.get(table, []):
            for c in list(self.rows(child)):
                if c.get(col) == row["id"]:
                    if action == "cascade":
                        self.delete_cascade(child, c)
                    else:
                        c[col] = None


def _get(row: dict, col: str):
    if "->>" in col:
        base, key = col.split("->>")
        v = (row.get(base) or {}).get(key)
        return None if v is None else str(v)
    return row.get(col)


class Query:
    def __init__(self, client: "FakeClient", table: str):
        self.c, self.table = client, table
        self.op, self.payload, self.cols = "select", None, "*"
        self.filters: List[Callable[[dict], bool]] = []
        self.count, self.head = None, False
        self._order: List[tuple] = []
        self._limit: Optional[int] = None
        self._offset = 0
        self.on_conflict = None

    # operations
    def select(self, cols="*", count=None, head=False):
        self.cols, self.count, self.head = cols, count, head
        return self

    def insert(self, payload):
        self.op, self.payload = "insert", payload
        return self

    def upsert(self, payload, on_conflict=None):
        self.op, self.payload, self.on_conflict = "upsert", payload, on_conflict
        return self

    def update(self, payload):
        self.op, self.payload = "update", payload
        return self

    def delete(self):
        self.op = "delete"
        return self

    # filters
    def eq(self, col, v):
        self.filters.append(lambda r: _get(r, col) == v)
        return self

    def neq(self, col, v):
        self.filters.append(lambda r: _get(r, col) != v)
        return self

    def in_(self, col, vs):
        vs = list(vs)
        self.filters.append(lambda r: _get(r, col) in vs)
        return self

    def is_(self, col, v):
        assert v == "null"
        self.filters.append(lambda r: _get(r, col) is None)
        return self

    def gte(self, col, v):
        self.filters.append(lambda r: _get(r, col) is not None and str(_get(r, col)) >= str(v))
        return self

    def gt(self, col, v):
        self.filters.append(lambda r: _get(r, col) is not None and str(_get(r, col)) > str(v))
        return self

    def lte(self, col, v):
        self.filters.append(lambda r: _get(r, col) is not None and str(_get(r, col)) <= str(v))
        return self

    def lt(self, col, v):
        self.filters.append(lambda r: _get(r, col) is not None and str(_get(r, col)) < str(v))
        return self

    def order(self, col, desc=False, **_):
        self._order.append((col, desc))
        return self

    def limit(self, n):
        self._limit = n
        return self

    def range(self, start, end):
        self._offset, self._limit = start, end - start + 1
        return self

    # execution
    def _visible(self) -> List[dict]:
        return [r for r in self.c.store.rows(self.table) if self.c.can_see(self.table, r)]

    def _matching(self) -> List[dict]:
        return [r for r in self._visible() if all(f(r) for f in self.filters)]

    def _project(self, row: dict) -> dict:
        cols = self.cols
        embeds = EMBED.findall(cols)
        plain = [c.strip() for c in EMBED.sub("", cols).split(",") if c.strip()]
        out = copy.deepcopy(row) if "*" in plain else {c: copy.deepcopy(row.get(c)) for c in plain}
        for target, fk, sub in embeds:
            local = fk[len(self.table) + 1: -len("_fkey")]
            hit = next((t for t in self.c.store.rows(target)
                        if t["id"] == row.get(local) and self.c.can_see(target, t)), None)
            fields = [f.strip() for f in sub.split(",")]
            out[target] = None if hit is None else {f: hit.get(f) for f in fields}
        return out

    async def execute(self):
        s = self.c.store
        if self.op == "select":
            rows = self._matching()
            for col, desc in reversed(self._order):
                rows.sort(key=lambda r: (_get(r, col) is None, _get(r, col) or ""), reverse=desc)
            total = len(rows)
            rows = rows[self._offset:]
            if self._limit is not None:
                rows = rows[: self._limit]
            data = [] if self.head else [self._project(r) for r in rows]
            return SimpleNamespace(data=data, count=total if self.count else None)
        if self.op in ("insert", "upsert"):
            items = self.payload if isinstance(self.payload, list) else [self.payload]
            out = []
            for item in items:
                existing = None
                if self.op == "upsert" and self.on_conflict:
                    keys = self.on_conflict.split(",")
                    existing = next((r for r in s.rows(self.table)
                                     if all(r.get(k) == item.get(k) for k in keys)), None)
                if existing is not None:
                    self.c.check_write(self.table, "update", existing, item)
                    existing.update(copy.deepcopy(item))
                    out.append(copy.deepcopy(existing))
                else:
                    self.c.check_write(self.table, "insert", None, item)
                    s.check_constraints(self.table, item)
                    out.append(copy.deepcopy(s.add(self.table, **copy.deepcopy(item))))
            return SimpleNamespace(data=out, count=None)
        if self.op == "update":
            out = []
            for r in self._matching():
                if not self.c.may_write(self.table, "update", r, self.payload):
                    continue  # RLS: rows the user may not update are silently skipped
                r.update(copy.deepcopy(self.payload))
                out.append(copy.deepcopy(r))
            return SimpleNamespace(data=out, count=None)
        if self.op == "delete":
            if self.c.uid is not None:
                raise RLSDenied(f"no delete policy on {self.table}")
            rows = self._matching()
            for r in rows:
                s.delete_cascade(self.table, r)
            return SimpleNamespace(data=[copy.deepcopy(r) for r in rows], count=None)
        raise NotImplementedError(self.op)


class RPC:
    def __init__(self, client, name, params):
        self.c, self.name, self.params = client, name, params

    async def execute(self):
        if self.c.uid is not None:
            raise RLSDenied("rpc is service-role only")
        assert self.name == "resolve_share_token"
        h = hashlib.sha256(self.params["p_token"].encode()).hexdigest()
        t = next((r for r in self.c.store.rows("share_tokens") if r["token_hash"] == h), None)
        if t is None:
            return SimpleNamespace(data={"status": "not_found"})
        if t["revoked_at"]:
            return SimpleNamespace(data={"status": "revoked"})
        if datetime.fromisoformat(str(t["expires_at"])) <= datetime.now(timezone.utc):
            return SimpleNamespace(data={"status": "expired"})
        self.c.store.add("share_access_log", token_id=t["id"], accessor_role=self.params.get("p_accessor_role", "public"))
        return SimpleNamespace(data={"status": "valid", "token_id": t["id"], "user_id": t["user_id"],
                                     "scope": t["scope"], "expires_at": t["expires_at"]})


class FakeClient:
    def __init__(self, store: FakeStore, uid: Optional[str] = None):
        self.store, self.uid = store, uid

    @property
    def role(self):
        return self.store.role_of(self.uid)

    def table(self, name):
        return Query(self, name)

    from_ = table

    def rpc(self, name, params=None):
        return RPC(self, name, params or {})

    async def aclose(self):
        pass

    # ---- RLS emulation (user clients only) ----
    def clinician_can_view(self, patient_id) -> bool:
        return self.role == "doctor" and self.store.has_consent(patient_id, "share_with_clinician")

    def can_see(self, table: str, r: dict) -> bool:
        if self.uid is None:
            return True
        uid, s = self.uid, self.store
        if table == "profiles":
            return r["id"] == uid or (r.get("role") == "patient" and self.clinician_can_view(r["id"]))
        if table in ("risk_assessments", "health_profiles"):
            return r["user_id"] == uid or self.clinician_can_view(r["user_id"])
        if table == "review_queue":
            return r["patient_id"] == uid or self.clinician_can_view(r["patient_id"])
        if table == "clinician_overrides":
            asm = next((a for a in s.rows("risk_assessments") if a["id"] == r["assessment_id"]), None)
            return bool(asm) and (asm["user_id"] == uid or self.clinician_can_view(asm["user_id"]))
        if table in ("consents", "share_tokens", "data_requests", "assistant_logs"):
            return r.get("user_id") == uid
        if table == "share_access_log":
            return any(t["id"] == r["token_id"] and t["user_id"] == uid for t in s.rows("share_tokens"))
        if table == "audit_logs":
            return self.role == "admin" or r.get("user_id") == uid
        if table == "appointments":
            return r["patient_id"] == uid
        return False

    def may_write(self, table: str, op: str, row: Optional[dict], new: dict) -> bool:
        if self.uid is None:
            return True
        uid = self.uid
        if table == "consents":
            return (row is None or row["user_id"] == uid) and new.get("user_id", uid) == uid
        if table == "profiles" and op == "update":
            return row["id"] == uid and not ({"role", "email", "is_demo", "id"} & set(new))
        if table == "share_tokens" and op == "update":
            # P1 policy + P7 guard: the owner may only set revoked_at once.
            return row["user_id"] == uid and set(new) == {"revoked_at"} and row["revoked_at"] is None
        if table == "data_requests" and op == "insert":
            return new.get("user_id") == uid and new.get("status", "pending") == "pending"
        return False

    def check_write(self, table, op, row, new):
        if not self.may_write(table, op, row, new):
            raise RLSDenied(f"RLS: {op} on {table} not allowed")


# ---- wiring into the FastAPI app ----

SECRET = "test-only-jwt-secret-at-least-32-bytes-long"


def bearer(uid: str) -> dict:
    import time

    import jwt

    claims = {"sub": uid, "aud": "authenticated", "exp": int(time.time()) + 3600, "role": "authenticated"}
    return {"Authorization": f"Bearer {jwt.encode(claims, SECRET, algorithm='HS256')}"}


def install(monkeypatch, store: FakeStore):
    """Route every database call of the API to `store`. Returns a cleanup callable."""
    import sys

    from apps.api.core import auth
    from apps.api.core import db as core_db
    from apps.api.core.config import settings
    from apps.api.main import app
    from apps.api.services import audit_service, data_rights_service

    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://vitalnex-test.invalid")
    monkeypatch.setattr(settings, "SUPABASE_SECRET_KEY", "test-service-key")
    monkeypatch.setattr(settings, "SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")

    async def lookup_role(uid):
        return store.role_of(uid)

    def service():
        return FakeClient(store)

    monkeypatch.setattr(auth, "lookup_role", lookup_role)
    monkeypatch.setattr(core_db, "service_db", service)
    monkeypatch.setattr(audit_service, "service_db", service)
    monkeypatch.setattr(sys.modules["apps.api.services.prediction_service"], "service_db", service)
    monkeypatch.setattr(sys.modules["apps.api.services.doctor_service"], "service_db", service)

    async def delete_auth_user(uid):
        store.deleted_auth_users.append(uid)
        return True

    monkeypatch.setattr(data_rights_service, "delete_auth_user", delete_auth_user)

    async def user_db_override(user: auth.CurrentUser = auth.Depends(auth.get_current_user)):
        yield FakeClient(store, user.id)

    app.dependency_overrides[auth.get_user_db] = user_db_override
    return lambda: app.dependency_overrides.pop(auth.get_user_db, None)

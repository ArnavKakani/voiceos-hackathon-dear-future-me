from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


EntryKind = Literal[
    "letter",
    "note",
    "accomplishment",
    "reflection",
    "memory",
    "proud_moment",
    "time_capsule",
]
Provenance = Literal["USER_MEMORY", "AI_SUMMARY", "AI_INFERENCE"]


class EntryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: EntryKind
    title: str | None = Field(default=None, max_length=240)
    content: str = Field(min_length=1, max_length=100_000)
    transcript: str | None = Field(default=None, max_length=100_000)
    tags: list[str] = Field(default_factory=list, max_length=50)
    context: str | None = Field(default=None, max_length=10_000)
    revisit_at: datetime | None = None
    audio_path: str | None = Field(default=None, max_length=500)
    provenance: Provenance = "USER_MEMORY"


class EntryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=240)
    content: str | None = Field(default=None, min_length=1, max_length=100_000)
    transcript: str | None = Field(default=None, max_length=100_000)
    tags: list[str] | None = Field(default=None, max_length=50)
    context: str | None = Field(default=None, max_length=10_000)
    revisit_at: datetime | None = None
    audio_path: str | None = Field(default=None, max_length=500)
    provenance: Provenance | None = None


class FutureLetterCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=240)
    content: str = Field(min_length=1, max_length=100_000)
    revisit_at: datetime
    context: str | None = Field(default=None, max_length=10_000)
    tags: list[str] = Field(default_factory=list, max_length=50)
    transcript: str | None = Field(default=None, max_length=100_000)
    audio_path: str | None = Field(default=None, max_length=500)


class APIKeyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="default", min_length=1, max_length=80)
    scopes: list[Literal["read", "write", "delete"]] = Field(
        default_factory=lambda: ["read", "write"]
    )

    @model_validator(mode="after")
    def deduplicate_scopes(self):
        self.scopes = list(dict.fromkeys(self.scopes))
        return self


class APIKeyIssued(BaseModel):
    id: str
    name: str
    key: str
    key_hint: str
    scopes: list[str]
    created_at: str


class MobileSignupCreate(BaseModel):
    """Minimal first-run contract used by the iPhone voice app."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", "email")
    @classmethod
    def trim_identity_fields(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email_shape(cls, value: str) -> str:
        normalized = value.lower()
        local, separator, domain = normalized.partition("@")
        if not separator or not local or "." not in domain:
            raise ValueError("Enter a valid email address")
        return normalized


class AudioUploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    journal_id: str
    content_type: Literal["audio/m4a", "audio/mp4", "audio/x-m4a"] = "audio/m4a"

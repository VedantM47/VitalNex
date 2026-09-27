"""
User Profile Pydantic Schemas.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


class ProfileBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field("patient", pattern="^(patient|doctor|researcher|admin)$")
    phone_number: Optional[str] = None
    preferred_language: str = Field("en", pattern="^(en|hi|mr)$")
    avatar_url: Optional[str] = None
    is_demo: bool = False


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = None
    preferred_language: Optional[str] = Field(None, pattern="^(en|hi|mr)$")
    avatar_url: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

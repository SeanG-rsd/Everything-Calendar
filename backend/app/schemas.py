from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


# --- Auth ---


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Modules ---


ModuleCategory = Literal["list", "totals"]


class ModuleCreate(BaseModel):
    name: str
    category: ModuleCategory
    schema_definition: dict = {}
    is_active: bool = True


class ModuleUpdate(BaseModel):
    name: str | None = None
    category: ModuleCategory | None = None
    schema_definition: dict | None = None
    is_active: bool | None = None


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    category: str
    schema_definition: dict
    is_active: bool
    created_at: datetime


# --- Entries ---


class EntryCreate(BaseModel):
    module_id: int
    status: str = "active"
    payload: dict = {}


class EntryUpdate(BaseModel):
    status: str | None = None
    payload: dict | None = None


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    status: str
    payload: dict
    created_at: datetime
    updated_at: datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/modules", tags=["modules"])


def _get_owned_module(module_id: int, current_user: models.User, db: Session) -> models.Module:
    module = (
        db.query(models.Module)
        .filter(models.Module.id == module_id, models.Module.user_id == current_user.id)
        .first()
    )
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


@router.get("", response_model=list[schemas.ModuleOut])
def list_modules(
    is_active: bool | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Module).filter(models.Module.user_id == current_user.id)
    if is_active is not None:
        query = query.filter(models.Module.is_active == is_active)
    return query.order_by(models.Module.id).all()


@router.post("", response_model=schemas.ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: schemas.ModuleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.Module)
        .filter(models.Module.user_id == current_user.id, models.Module.name == payload.name)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Module name already exists"
        )

    module = models.Module(user_id=current_user.id, **payload.model_dump())
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("/{module_id}", response_model=schemas.ModuleOut)
def get_module(
    module_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_module(module_id, current_user, db)


@router.put("/{module_id}", response_model=schemas.ModuleOut)
def update_module(
    module_id: int,
    payload: schemas.ModuleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = _get_owned_module(module_id, current_user, db)
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] != module.name:
        existing = (
            db.query(models.Module)
            .filter(
                models.Module.user_id == current_user.id,
                models.Module.name == updates["name"],
                models.Module.id != module.id,
            )
            .first()
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Module name already exists"
            )

    for field, value in updates.items():
        setattr(module, field, value)

    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = _get_owned_module(module_id, current_user, db)

    has_entries = db.query(models.Entry).filter(models.Entry.module_id == module.id).first()
    if has_entries is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a module with existing entries; deactivate it instead",
        )

    db.delete(module)
    db.commit()

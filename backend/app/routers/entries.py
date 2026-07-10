from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/entries", tags=["entries"])


def _user_module_ids(current_user: models.User, db: Session):
    return (
        db.query(models.Module.id)
        .filter(models.Module.user_id == current_user.id)
        .scalar_subquery()
    )


def _get_owned_entry(entry_id: int, current_user: models.User, db: Session) -> models.Entry:
    entry = (
        db.query(models.Entry)
        .filter(
            models.Entry.id == entry_id,
            models.Entry.module_id.in_(_user_module_ids(current_user, db)),
        )
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


def _get_owned_module(module_id: int, current_user: models.User, db: Session) -> models.Module:
    module = (
        db.query(models.Module)
        .filter(models.Module.id == module_id, models.Module.user_id == current_user.id)
        .first()
    )
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


@router.get("", response_model=list[schemas.EntryOut])
def list_entries(
    module_id: int | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Entry).filter(
        models.Entry.module_id.in_(_user_module_ids(current_user, db))
    )
    if module_id is not None:
        query = query.filter(models.Entry.module_id == module_id)
    if status_filter is not None:
        query = query.filter(models.Entry.status == status_filter)

    return query.order_by(models.Entry.id).offset(offset).limit(limit).all()


@router.post("", response_model=schemas.EntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: schemas.EntryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_module(payload.module_id, current_user, db)

    entry = models.Entry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=schemas.EntryOut)
def get_entry(
    entry_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_entry(entry_id, current_user, db)


@router.put("/{entry_id}", response_model=schemas.EntryOut)
def update_entry(
    entry_id: int,
    payload: schemas.EntryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = _get_owned_entry(entry_id, current_user, db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = _get_owned_entry(entry_id, current_user, db)
    db.delete(entry)
    db.commit()

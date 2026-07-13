from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

_DEFAULT_MODULES: tuple[tuple[str, str], ...] = (
    ("To-Dos", "list"),
    ("Homework", "list"),
    ("Long-Term Goals", "list"),
    ("Daily Diet", "totals"),
    ("Daily Goals", "totals"),
    ("Daily Workout", "totals"),
)


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = models.User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    for name, category in _DEFAULT_MODULES:
        db.add(models.Module(user_id=user.id, name=name, category=category, schema_definition={}))
    db.commit()

    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )

    token = create_access_token(subject=str(user.id))
    return schemas.Token(access_token=token)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

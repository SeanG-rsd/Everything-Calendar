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
    ("Savings Goals", "totals"),
)

_DEFAULT_ENTRIES: dict[str, tuple[dict, ...]] = {
    "To-Dos": (
        {"status": "active", "payload": {"title": "Buy groceries"}},
        {"status": "done", "payload": {"title": "Reply to emails"}},
        {"status": "active", "payload": {"title": "Walk the dog"}},
    ),
    "Homework": (
        {"status": "active", "payload": {"title": "Finish math worksheet"}},
        {"status": "active", "payload": {"title": "Read chapter 4"}},
        {"status": "done", "payload": {"title": "Submit lab report"}},
    ),
    "Long-Term Goals": (
        {"status": "active", "payload": {"title": "Learn to play guitar"}},
        {"status": "active", "payload": {"title": "Run a half marathon"}},
    ),
    "Daily Diet": (
        {"status": "active", "payload": {"name": "Banana", "calories": 105}},
        {"status": "active", "payload": {"name": "Grilled chicken breast", "calories": 231}},
        {"status": "active", "payload": {"calories": 350}},
    ),
    "Daily Goals": (
        {"status": "active", "payload": {"title": "Read 20 pages", "target": 20, "current": 20, "unit": "pages"}},
        {"status": "active", "payload": {"title": "Meditate", "target": 10, "current": 5, "unit": "min"}},
        {"status": "active", "payload": {"title": "Drink water", "target": 8, "current": 6, "unit": "cups"}},
    ),
    "Daily Workout": (
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Push", "title": "Bench Press", "targetSets": 3, "targetReps": 8},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Push", "title": "Overhead Press", "targetSets": 3, "targetReps": 8},
        },
        {
            "status": "active",
            "payload": {
                "kind": "template",
                "day": "Push",
                "title": "Triceps Pushdown",
                "targetSets": 3,
                "targetReps": 12,
            },
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Pull", "title": "Deadlift", "targetSets": 3, "targetReps": 5},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Pull", "title": "Pull-ups", "targetSets": 3, "targetReps": 8},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Pull", "title": "Barbell Row", "targetSets": 3, "targetReps": 8},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Legs", "title": "Squat", "targetSets": 3, "targetReps": 5},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Legs", "title": "Leg Press", "targetSets": 3, "targetReps": 10},
        },
        {
            "status": "active",
            "payload": {"kind": "template", "day": "Legs", "title": "Calf Raise", "targetSets": 3, "targetReps": 15},
        },
    ),
    "Savings Goals": (
        {"status": "active", "payload": {"title": "Emergency Fund", "target": 5000, "current": 1200}},
        {"status": "active", "payload": {"title": "New Laptop", "target": 1500, "current": 600}},
        {"status": "active", "payload": {"title": "Vacation", "target": 3000, "current": 450}},
    ),
}


def _ensure_default_modules(user: models.User, db: Session) -> None:
    modules_by_name = {
        module.name: module
        for module in db.query(models.Module).filter(models.Module.user_id == user.id).all()
    }
    for name, category in _DEFAULT_MODULES:
        if name not in modules_by_name:
            module = models.Module(user_id=user.id, name=name, category=category, schema_definition={})
            db.add(module)
            db.flush()
            modules_by_name[name] = module
    db.commit()

    for name, seed_entries in _DEFAULT_ENTRIES.items():
        module = modules_by_name.get(name)
        if module is None:
            continue
        has_entries = db.query(models.Entry).filter(models.Entry.module_id == module.id).first()
        if has_entries is not None:
            continue
        for seed in seed_entries:
            db.add(models.Entry(module_id=module.id, status=seed["status"], payload=seed["payload"]))
    db.commit()


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = models.User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    _ensure_default_modules(user, db)

    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )

    _ensure_default_modules(user, db)

    token = create_access_token(subject=str(user.id))
    return schemas.Token(access_token=token)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

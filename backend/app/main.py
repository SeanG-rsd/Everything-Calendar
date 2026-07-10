from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, entries, modules

app = FastAPI(title="EverythingCalendar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(modules.router)
app.include_router(entries.router)


@app.get("/health")
def health():
    return {"status": "ok"}

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.db import init_db
from app.routers import auth, files, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Sujitverse Files API",
    version="0.5.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": app.version}

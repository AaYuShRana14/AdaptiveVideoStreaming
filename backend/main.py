from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router.upload import router as upload_router
from contextlib import asynccontextmanager
from database import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload_router, prefix="/upload")

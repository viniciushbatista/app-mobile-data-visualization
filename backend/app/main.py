from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import admin, health, mesorregiao, municipio

app = FastAPI(
    title="API Biogás PB",
    description="Rebanho municipal e por mesorregião — Paraíba",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(mesorregiao.router, prefix="/mesorregiao", tags=["mesorregiao"])
app.include_router(municipio.router, prefix="/municipio", tags=["municipio"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])


@app.get("/")
def root():
    return {
        "message": "API Biogás PB",
        "docs": "/docs",
        "health": "/health",
    }

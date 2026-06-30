from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import admin, energia, health, mesorregiao, municipio, previsao

app = FastAPI(
    title="API Biogás PB",
    description="Rebanho, potencial energético e mesorregião — Paraíba",
    version="0.3.0",
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
app.include_router(energia.router, prefix="/energia", tags=["energia"])
app.include_router(previsao.router, prefix="/previsao", tags=["previsao"])


@app.get("/")
def root():
    return {
        "message": "API Biogás PB",
        "docs": "/docs",
        "health": "/health",
    }

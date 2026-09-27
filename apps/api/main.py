"""
VITALNEX Backend API Application.
Health. Humanity. High-Tech.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid

from apps.api.core.config import settings
from apps.api.routers.v1 import api_v1_router
from apps.api.routers.v1.health import router as health_root_router

app = FastAPI(
    title="VITALNEX Clinical Intelligence & Connected Care API",
    description=(
        "Production-grade backend services for VITALNEX: clinical risk prediction, "
        "AI Trust Passport, doctor care discovery, conversational assistance, and AI governance."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Include Root Health
app.include_router(health_root_router)

# Include v1 API routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "product": "VITALNEX",
        "tagline": "Health. Humanity. High-Tech.",
        "status": "online",
        "documentation": "/docs",
        "v1_api": settings.API_V1_PREFIX,
        "demo_mode": settings.DEMO_MODE,
        "disclaimer": "Research and decision-support prototype. Not a medical diagnosis.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)

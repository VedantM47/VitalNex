"""
VITALNEX Backend API Application.
Health. Humanity. High-Tech.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid

from contextlib import asynccontextmanager

from apps.api.core.config import settings
from apps.api.services import screening
from apps.api.routers.v1 import api_v1_router
from apps.api.routers.v1.health import router as health_root_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the three disease models once at startup (docs/PROMPTS.md P4).
    screening.models()
    # Assistant (SPEC §5): load the local encoder, intent head and FAQ embeddings once. If the
    # encoder cache is missing, the assistant still answers emergencies / medicine rules and says so.
    from apps.api.services.assistant_service import warm_up
    from fastapi.concurrency import run_in_threadpool
    await run_in_threadpool(warm_up)
    yield


app = FastAPI(
    lifespan=lifespan,
    title="VITALNEX Screening & Care-Navigation API",
    description=(
        "MVP backend for VITALNEX (demo accounts only, not a diagnostic tool): screening levels for "
        "diabetes, heart disease and stroke, AI Trust Passport, demo doctor booking, assistant, and AI governance."
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
    # The "My data" export reads its file name from this header in the browser.
    expose_headers=["Content-Disposition"],
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

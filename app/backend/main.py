import importlib
import logging
import os
import pkgutil
import traceback
from contextlib import asynccontextmanager
from datetime import datetime

from core.config import settings
from fastapi import FastAPI, HTTPException, Request, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.database import initialize_database, close_database
from services.mock_data import initialize_mock_data
from services.auth import initialize_admin_user


def setup_logging():
    if os.environ.get("IS_LAMBDA") == "true":
        return

    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"{log_dir}/app_{timestamp}.log"

    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logging.basicConfig(
        level=logging.DEBUG,
        format=log_format,
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )

    logging.getLogger("uvicorn").setLevel(logging.DEBUG)
    logging.getLogger("fastapi").setLevel(logging.DEBUG)

    logger = logging.getLogger(__name__)
    logger.info("=== Logging system initialized ===")
    logger.info(f"Log file: {log_file}")
    logger.info("Log level: INFO")
    logger.info(f"Timestamp: {timestamp}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)
    logger.info("=== Application startup initiated ===")

    await initialize_database()
    await initialize_mock_data()
    await initialize_admin_user()

    logger.info("=== Application startup completed successfully ===")
    yield

    await close_database()


app = FastAPI(
    title="FastAPI Modular Template",
    description="A best-practice FastAPI template with modular architecture",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def include_routers_from_package(app: FastAPI, package_name: str = "routers") -> None:
    logger = logging.getLogger(__name__)

    try:
        pkg = importlib.import_module(package_name)
    except Exception as exc:
        logger.debug("Routers package '%s' not loaded: %s", package_name, exc)
        return

    for _, module_name, is_pkg in pkgutil.walk_packages(
        pkg.__path__, pkg.__name__ + "."
    ):
        if is_pkg:
            continue

        try:
            module = importlib.import_module(module_name)
        except Exception as exc:
            logger.warning("Failed to import module '%s': %s", module_name, exc)
            continue

        if hasattr(module, "router") and isinstance(module.router, APIRouter):
            app.include_router(module.router)
            logger.info("Included router: %s.router", module_name)


setup_logging()
include_routers_from_package(app, "routers")


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc

    logger = logging.getLogger(__name__)
    logger.error(f"Exception: {type(exc).__name__}: {str(exc)}\n{traceback.format_exc()}")

    is_dev = os.getenv("ENVIRONMENT", "prod").lower() == "dev"

    if is_dev:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": traceback.format_exc()},
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal Server Error"},
        )


@app.get("/")
def root():
    return {"message": "FastAPI Modular Template is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
import os

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
    )


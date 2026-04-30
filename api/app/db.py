from sqlmodel import SQLModel, Session, create_engine
from app.config import settings

engine = create_engine(
    f"sqlite:///{settings.db_path}",
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    # Import models so SQLModel registers them before create_all
    from app import models  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

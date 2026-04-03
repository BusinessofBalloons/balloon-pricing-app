from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String, func


class Balloon_sizes(Base):
    __tablename__ = "balloon_sizes"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    size_name = Column(String, nullable=False)
    price_per_balloon = Column(Float, nullable=False)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String, func


class Balloon_settings(Base):
    __tablename__ = "balloon_settings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    hourly_labor_rate = Column(Float, nullable=True)
    overhead_percent = Column(Float, nullable=True)
    markup_percent = Column(Float, nullable=True)
    logo_object_key = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
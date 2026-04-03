from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String, func


class Saved_designs(Base):
    __tablename__ = "saved_designs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    design_name = Column(String, nullable=False)
    labor_hours = Column(Float, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    hardware_cost = Column(Float, nullable=True)
    overhead_percent = Column(Float, nullable=True)
    markup_percent = Column(Float, nullable=True)
    balloon_cost = Column(Float, nullable=True)
    labor_cost = Column(Float, nullable=True)
    subtotal = Column(Float, nullable=True)
    overhead_amount = Column(Float, nullable=True)
    markup_amount = Column(Float, nullable=True)
    msrp = Column(Float, nullable=True)
    perceived_value_add = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    balloon_details = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
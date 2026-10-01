"""SQLAlchemy models for optional ORM mapping in GuardianAI."""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    inactive = Column(Integer, default=0)
    created_at = Column(String(64), nullable=False)

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    product = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    region = Column(String(64), nullable=False)
    date = Column(String(64), nullable=False)

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(128), unique=True, nullable=False)
    customer_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(64), nullable=False)
    due_date = Column(String(64), nullable=False)

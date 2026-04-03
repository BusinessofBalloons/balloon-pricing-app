import json
import logging
from datetime import datetime
from typing import Any, List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.saved_designs import Saved_designsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/saved_designs", tags=["saved_designs"])


# ---------- Pydantic Schemas ----------
class Saved_designsData(BaseModel):
    """Entity data schema (for create/update)"""
    design_name: str
    labor_hours: float = None
    hourly_rate: float = None
    hardware_cost: float = None
    overhead_percent: float = None
    markup_percent: float = None
    balloon_cost: float = None
    labor_cost: float = None
    subtotal: float = None
    overhead_amount: float = None
    markup_amount: float = None
    msrp: float = None
    perceived_value_add: float = None
    final_price: float = None
    balloon_details: str = None
    notes: str = None


class Saved_designsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    design_name: Optional[str] = None
    labor_hours: Optional[float] = None
    hourly_rate: Optional[float] = None
    hardware_cost: Optional[float] = None
    overhead_percent: Optional[float] = None
    markup_percent: Optional[float] = None
    balloon_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    subtotal: Optional[float] = None
    overhead_amount: Optional[float] = None
    markup_amount: Optional[float] = None
    msrp: Optional[float] = None
    perceived_value_add: Optional[float] = None
    final_price: Optional[float] = None
    balloon_details: Optional[str] = None
    notes: Optional[str] = None


class Saved_designsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    design_name: str
    labor_hours: Optional[float] = None
    hourly_rate: Optional[float] = None
    hardware_cost: Optional[float] = None
    overhead_percent: Optional[float] = None
    markup_percent: Optional[float] = None
    balloon_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    subtotal: Optional[float] = None
    overhead_amount: Optional[float] = None
    markup_amount: Optional[float] = None
    msrp: Optional[float] = None
    perceived_value_add: Optional[float] = None
    final_price: Optional[float] = None
    balloon_details: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Saved_designsListResponse(BaseModel):
    """List response schema"""
    items: List[Saved_designsResponse]
    total: int
    skip: int
    limit: int


class Saved_designsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Saved_designsData]


class Saved_designsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Saved_designsUpdateData


class Saved_designsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Saved_designsBatchUpdateItem]


class Saved_designsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Saved_designsListResponse)
async def query_saved_designss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query saved_designss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying saved_designss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Saved_designsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} saved_designss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying saved_designss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Saved_designsListResponse)
async def query_saved_designss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query saved_designss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying saved_designss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Saved_designsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} saved_designss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying saved_designss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Saved_designsResponse)
async def get_saved_designs(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single saved_designs by ID (user can only see their own records)"""
    logger.debug(f"Fetching saved_designs with id: {id}, fields={fields}")
    
    service = Saved_designsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Saved_designs with id {id} not found")
            raise HTTPException(status_code=404, detail="Saved_designs not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching saved_designs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Saved_designsResponse, status_code=201)
async def create_saved_designs(
    data: Saved_designsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new saved_designs"""
    logger.debug(f"Creating new saved_designs with data: {data}")
    
    service = Saved_designsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create saved_designs")
        
        logger.info(f"Saved_designs created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating saved_designs: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating saved_designs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Saved_designsResponse], status_code=201)
async def create_saved_designss_batch(
    request: Saved_designsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple saved_designss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} saved_designss")
    
    service = Saved_designsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} saved_designss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Saved_designsResponse])
async def update_saved_designss_batch(
    request: Saved_designsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple saved_designss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} saved_designss")
    
    service = Saved_designsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} saved_designss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Saved_designsResponse)
async def update_saved_designs(
    id: int,
    data: Saved_designsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing saved_designs (requires ownership)"""
    logger.debug(f"Updating saved_designs {id} with data: {data}")

    service = Saved_designsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Saved_designs with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Saved_designs not found")
        
        logger.info(f"Saved_designs {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating saved_designs {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating saved_designs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_saved_designss_batch(
    request: Saved_designsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple saved_designss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} saved_designss")
    
    service = Saved_designsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} saved_designss successfully")
        return {"message": f"Successfully deleted {deleted_count} saved_designss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_saved_designs(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single saved_designs by ID (requires ownership)"""
    logger.debug(f"Deleting saved_designs with id: {id}")
    
    service = Saved_designsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Saved_designs with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Saved_designs not found")
        
        logger.info(f"Saved_designs {id} deleted successfully")
        return {"message": "Saved_designs deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved_designs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
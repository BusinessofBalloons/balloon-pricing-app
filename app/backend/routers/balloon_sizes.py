import json
import logging
from datetime import datetime
from typing import Any, List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.balloon_sizes import Balloon_sizesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/balloon_sizes", tags=["balloon_sizes"])


# ---------- Pydantic Schemas ----------
class Balloon_sizesData(BaseModel):
    """Entity data schema (for create/update)"""
    size_name: str
    price_per_balloon: float
    sort_order: int = None


class Balloon_sizesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    size_name: Optional[str] = None
    price_per_balloon: Optional[float] = None
    sort_order: Optional[int] = None


class Balloon_sizesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    size_name: str
    price_per_balloon: float
    sort_order: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Balloon_sizesListResponse(BaseModel):
    """List response schema"""
    items: List[Balloon_sizesResponse]
    total: int
    skip: int
    limit: int


class Balloon_sizesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Balloon_sizesData]


class Balloon_sizesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Balloon_sizesUpdateData


class Balloon_sizesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Balloon_sizesBatchUpdateItem]


class Balloon_sizesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Balloon_sizesListResponse)
async def query_balloon_sizess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query balloon_sizess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying balloon_sizess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Balloon_sizesService(db)
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
        logger.debug(f"Found {result['total']} balloon_sizess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying balloon_sizess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Balloon_sizesListResponse)
async def query_balloon_sizess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query balloon_sizess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying balloon_sizess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Balloon_sizesService(db)
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
        logger.debug(f"Found {result['total']} balloon_sizess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying balloon_sizess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Balloon_sizesResponse)
async def get_balloon_sizes(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single balloon_sizes by ID (user can only see their own records)"""
    logger.debug(f"Fetching balloon_sizes with id: {id}, fields={fields}")
    
    service = Balloon_sizesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Balloon_sizes with id {id} not found")
            raise HTTPException(status_code=404, detail="Balloon_sizes not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching balloon_sizes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Balloon_sizesResponse, status_code=201)
async def create_balloon_sizes(
    data: Balloon_sizesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new balloon_sizes"""
    logger.debug(f"Creating new balloon_sizes with data: {data}")
    
    service = Balloon_sizesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create balloon_sizes")
        
        logger.info(f"Balloon_sizes created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating balloon_sizes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating balloon_sizes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Balloon_sizesResponse], status_code=201)
async def create_balloon_sizess_batch(
    request: Balloon_sizesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple balloon_sizess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} balloon_sizess")
    
    service = Balloon_sizesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} balloon_sizess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Balloon_sizesResponse])
async def update_balloon_sizess_batch(
    request: Balloon_sizesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple balloon_sizess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} balloon_sizess")
    
    service = Balloon_sizesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} balloon_sizess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Balloon_sizesResponse)
async def update_balloon_sizes(
    id: int,
    data: Balloon_sizesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing balloon_sizes (requires ownership)"""
    logger.debug(f"Updating balloon_sizes {id} with data: {data}")

    service = Balloon_sizesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Balloon_sizes with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Balloon_sizes not found")
        
        logger.info(f"Balloon_sizes {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating balloon_sizes {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating balloon_sizes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_balloon_sizess_batch(
    request: Balloon_sizesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple balloon_sizess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} balloon_sizess")
    
    service = Balloon_sizesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} balloon_sizess successfully")
        return {"message": f"Successfully deleted {deleted_count} balloon_sizess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_balloon_sizes(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single balloon_sizes by ID (requires ownership)"""
    logger.debug(f"Deleting balloon_sizes with id: {id}")
    
    service = Balloon_sizesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Balloon_sizes with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Balloon_sizes not found")
        
        logger.info(f"Balloon_sizes {id} deleted successfully")
        return {"message": "Balloon_sizes deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting balloon_sizes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
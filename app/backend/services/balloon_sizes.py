import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.balloon_sizes import Balloon_sizes

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Balloon_sizesService:
    """Service layer for Balloon_sizes operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Balloon_sizes]:
        """Create a new balloon_sizes"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Balloon_sizes(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created balloon_sizes with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating balloon_sizes: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for balloon_sizes {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Balloon_sizes]:
        """Get balloon_sizes by ID (user can only see their own records)"""
        try:
            query = select(Balloon_sizes).where(Balloon_sizes.id == obj_id)
            if user_id:
                query = query.where(Balloon_sizes.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching balloon_sizes {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of balloon_sizess (user can only see their own records)"""
        try:
            query = select(Balloon_sizes)
            count_query = select(func.count(Balloon_sizes.id))
            
            if user_id:
                query = query.where(Balloon_sizes.user_id == user_id)
                count_query = count_query.where(Balloon_sizes.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Balloon_sizes, field):
                        query = query.where(getattr(Balloon_sizes, field) == value)
                        count_query = count_query.where(getattr(Balloon_sizes, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Balloon_sizes, field_name):
                        query = query.order_by(getattr(Balloon_sizes, field_name).desc())
                else:
                    if hasattr(Balloon_sizes, sort):
                        query = query.order_by(getattr(Balloon_sizes, sort))
            else:
                query = query.order_by(Balloon_sizes.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching balloon_sizes list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Balloon_sizes]:
        """Update balloon_sizes (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Balloon_sizes {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated balloon_sizes {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating balloon_sizes {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete balloon_sizes (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Balloon_sizes {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted balloon_sizes {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting balloon_sizes {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Balloon_sizes]:
        """Get balloon_sizes by any field"""
        try:
            if not hasattr(Balloon_sizes, field_name):
                raise ValueError(f"Field {field_name} does not exist on Balloon_sizes")
            result = await self.db.execute(
                select(Balloon_sizes).where(getattr(Balloon_sizes, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching balloon_sizes by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Balloon_sizes]:
        """Get list of balloon_sizess filtered by field"""
        try:
            if not hasattr(Balloon_sizes, field_name):
                raise ValueError(f"Field {field_name} does not exist on Balloon_sizes")
            result = await self.db.execute(
                select(Balloon_sizes)
                .where(getattr(Balloon_sizes, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Balloon_sizes.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching balloon_sizess by {field_name}: {str(e)}")
            raise
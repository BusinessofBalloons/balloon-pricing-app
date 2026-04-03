import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.balloon_settings import Balloon_settings

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Balloon_settingsService:
    """Service layer for Balloon_settings operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Balloon_settings]:
        """Create a new balloon_settings"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Balloon_settings(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created balloon_settings with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating balloon_settings: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for balloon_settings {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Balloon_settings]:
        """Get balloon_settings by ID (user can only see their own records)"""
        try:
            query = select(Balloon_settings).where(Balloon_settings.id == obj_id)
            if user_id:
                query = query.where(Balloon_settings.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching balloon_settings {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of balloon_settingss (user can only see their own records)"""
        try:
            query = select(Balloon_settings)
            count_query = select(func.count(Balloon_settings.id))
            
            if user_id:
                query = query.where(Balloon_settings.user_id == user_id)
                count_query = count_query.where(Balloon_settings.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Balloon_settings, field):
                        query = query.where(getattr(Balloon_settings, field) == value)
                        count_query = count_query.where(getattr(Balloon_settings, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Balloon_settings, field_name):
                        query = query.order_by(getattr(Balloon_settings, field_name).desc())
                else:
                    if hasattr(Balloon_settings, sort):
                        query = query.order_by(getattr(Balloon_settings, sort))
            else:
                query = query.order_by(Balloon_settings.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching balloon_settings list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Balloon_settings]:
        """Update balloon_settings (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Balloon_settings {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated balloon_settings {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating balloon_settings {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete balloon_settings (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Balloon_settings {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted balloon_settings {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting balloon_settings {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Balloon_settings]:
        """Get balloon_settings by any field"""
        try:
            if not hasattr(Balloon_settings, field_name):
                raise ValueError(f"Field {field_name} does not exist on Balloon_settings")
            result = await self.db.execute(
                select(Balloon_settings).where(getattr(Balloon_settings, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching balloon_settings by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Balloon_settings]:
        """Get list of balloon_settingss filtered by field"""
        try:
            if not hasattr(Balloon_settings, field_name):
                raise ValueError(f"Field {field_name} does not exist on Balloon_settings")
            result = await self.db.execute(
                select(Balloon_settings)
                .where(getattr(Balloon_settings, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Balloon_settings.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching balloon_settingss by {field_name}: {str(e)}")
            raise
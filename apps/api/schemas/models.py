"""
Model Registry & Version Pydantic Schemas.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime


class ModelVersionItem(BaseModel):
    id: str
    version_tag: str
    status: str  # 'development', 'staging', 'production', 'archived'
    framework: str
    accuracy: Optional[float] = None
    roc_auc: Optional[float] = None
    f1_score: Optional[float] = None
    fairness_disparity_ratio: Optional[float] = None
    created_at: datetime
    metadata: Dict[str, Any] = {}


class ModelRegistryItem(BaseModel):
    id: str
    model_name: str
    description: str
    framework: str
    task_type: str
    current_production_version: Optional[str] = None
    versions: List[ModelVersionItem] = []

from fastapi import FastAPI, Query, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from typing import List, Optional, Dict, Set, Tuple, Union
import pandas as pd
import numpy as np
from functools import lru_cache
from contextlib import asynccontextmanager
import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from model import RecommendationModel

# Global variable to store the model
model_instance = None

# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.request_history = {}
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean up old entries
        self.request_history = {
            ip: timestamps for ip, timestamps in self.request_history.items()
            if timestamps and timestamps[-1] > current_time - self.period
        }
        
        # Check if client has history
        if client_ip not in self.request_history:
            self.request_history[client_ip] = []
        
        # Check rate limit
        client_history = self.request_history[client_ip]
        if len(client_history) >= self.calls:
            oldest_allowed = current_time - self.period
            if client_history[0] > oldest_allowed:
                return HTTPException(
                    status_code=429, 
                    detail=f"Rate limit exceeded. Maximum {self.calls} calls per {self.period} seconds."
                )
            # Remove older requests outside the window
            while client_history and client_history[0] <= oldest_allowed:
                client_history.pop(0)
        
        # Add current request timestamp
        client_history.append(current_time)
        
        # Process the request
        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model at startup
    global model_instance
    try:
        model_instance = RecommendationModel()
        logger.info("Model loaded successfully during application startup!")
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise
    
    yield
    
    # Clean up resources when the application shuts down
    try:
        model_instance = None
        logger.info("Model resources released during application shutdown!")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Update your FastAPI initialization to include the lifespan
app = FastAPI(
    title="Model Prediction API",
    description="API that uses a model to recommend game ids with support for single or multiple seed items",
    version="2.0.0",
    lifespan=lifespan
)

# Add rate limiting - 100 requests per minute
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

def get_model():
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    return model_instance

# Enhanced cache for common predictions - now supports multiple IDs/indices
@lru_cache(maxsize=1000)
def cached_predict_by_id(ids_tuple: Tuple[str, ...], n: int, excluded_ids_tuple: Optional[Tuple[str, ...]] = None):
    model = get_model()
    ids = list(ids_tuple)
    excluded_ids = list(excluded_ids_tuple) if excluded_ids_tuple else None
    
    # Handle single ID case for backward compatibility
    if len(ids) == 1:
        return model.predict_by_id(ids[0], n, excluded_ids)
    else:
        return model.predict_by_id(ids, n, excluded_ids)

@lru_cache(maxsize=1000)
def cached_predict_by_index(indices_tuple: Tuple[int, ...], n: int, excluded_ids_tuple: Optional[Tuple[str, ...]] = None):
    model = get_model()
    indices = list(indices_tuple)
    excluded_ids = list(excluded_ids_tuple) if excluded_ids_tuple else None
    
    # Handle single index case for backward compatibility
    if len(indices) == 1:
        return model.predict_by_index(indices[0], n, excluded_ids)
    else:
        return model.predict_by_index(indices, n, excluded_ids)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Game Recommender API v2.0 - Now with multi-item support!"}

@app.get("/model/predict_by_id", response_model=List[int])
async def predict_by_id(
    id: Optional[str] = Query(None, description="Single input ID to find similar items"), 
    ids: Optional[List[str]] = Query(None, description="Multiple input IDs to find similar items (round-robin recommendations)"),
    n: int = Query(5, description="Number of similar items to return"),
    excluded_ids: Optional[List[str]] = Query(None, description="IDs to exclude from recommendations")
):
    """
    Get recommendations based on one or more game IDs.
    
    Use either 'id' for single item or 'ids' for multiple items.
    When using multiple IDs, recommendations are returned in round-robin fashion.
    """
    # Validate input - must provide either id or ids, but not both
    if id is not None and ids is not None:
        raise HTTPException(
            status_code=400, 
            detail="Please provide either 'id' for single item or 'ids' for multiple items, not both"
        )
    
    if id is None and ids is None:
        raise HTTPException(
            status_code=400, 
            detail="Please provide either 'id' for single item or 'ids' for multiple items"
        )
    
    # Handle single ID case
    if id is not None:
        input_ids = (id,)
    else:
        # Handle multiple IDs case
        if not ids or len(ids) == 0:
            raise HTTPException(status_code=400, detail="IDs list cannot be empty")
        input_ids = tuple(ids)
    
    # Convert excluded_ids list to tuple for caching
    excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
    
    # Run prediction in a threadpool to avoid blocking
    return await run_in_threadpool(
        lambda: cached_predict_by_id(input_ids, n, excluded_ids_tuple)
    )

@app.get("/model/predict_by_index", response_model=List[int])
async def predict_by_index(
    index: Optional[int] = Query(None, description="Single dataframe index to find similar items"), 
    indices: Optional[List[int]] = Query(None, description="Multiple dataframe indices to find similar items (round-robin recommendations)"),
    n: int = Query(5, description="Number of similar items to return"),
    excluded_ids: Optional[List[str]] = Query(None, description="IDs to exclude from recommendations")
):
    """
    Get recommendations based on one or more dataframe indices.
    
    Use either 'index' for single item or 'indices' for multiple items.
    When using multiple indices, recommendations are returned in round-robin fashion.
    """
    # Validate input - must provide either index or indices, but not both
    if index is not None and indices is not None:
        raise HTTPException(
            status_code=400, 
            detail="Please provide either 'index' for single item or 'indices' for multiple items, not both"
        )
    
    if index is None and indices is None:
        raise HTTPException(
            status_code=400, 
            detail="Please provide either 'index' for single item or 'indices' for multiple items"
        )
    
    # Handle single index case
    if index is not None:
        input_indices = (index,)
    else:
        # Handle multiple indices case
        if not indices or len(indices) == 0:
            raise HTTPException(status_code=400, detail="Indices list cannot be empty")
        input_indices = tuple(indices)
    
    # Convert excluded_ids list to tuple for caching
    excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
    
    # Run prediction in a threadpool to avoid blocking
    return await run_in_threadpool(
        lambda: cached_predict_by_index(input_indices, n, excluded_ids_tuple)
    )

# Additional convenience endpoints for bulk operations
@app.post("/model/predict_by_id_bulk", response_model=List[int])
async def predict_by_id_bulk(
    request: Dict[str, Union[List[str], int, List[str]]]
):
    """
    POST endpoint for bulk ID-based predictions.
    
    Request body should contain:
    {
        "ids": ["id1", "id2", "id3"],
        "n": 10,
        "excluded_ids": ["excluded1", "excluded2"]  // optional
    }
    """
    try:
        ids = request.get("ids")
        n = request.get("n", 5)
        excluded_ids = request.get("excluded_ids")
        
        if not ids or not isinstance(ids, list):
            raise HTTPException(status_code=400, detail="'ids' must be a non-empty list")
        
        if not isinstance(n, int) or n <= 0:
            raise HTTPException(status_code=400, detail="'n' must be a positive integer")
        
        # Convert to tuples for caching
        ids_tuple = tuple(ids)
        excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
        
        return await run_in_threadpool(
            lambda: cached_predict_by_id(ids_tuple, n, excluded_ids_tuple)
        )
        
    except Exception as e:
        logger.error(f"Error in predict_by_id_bulk: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/model/predict_by_index_bulk", response_model=List[int])
async def predict_by_index_bulk(
    request: Dict[str, Union[List[int], int, List[str]]]
):
    """
    POST endpoint for bulk index-based predictions.
    
    Request body should contain:
    {
        "indices": [1, 2, 3],
        "n": 10,
        "excluded_ids": ["excluded1", "excluded2"]  // optional
    }
    """
    try:
        indices = request.get("indices")
        n = request.get("n", 5)
        excluded_ids = request.get("excluded_ids")
        
        if not indices or not isinstance(indices, list):
            raise HTTPException(status_code=400, detail="'indices' must be a non-empty list")
        
        if not isinstance(n, int) or n <= 0:
            raise HTTPException(status_code=400, detail="'n' must be a positive integer")
        
        # Convert to tuples for caching
        indices_tuple = tuple(indices)
        excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
        
        return await run_in_threadpool(
            lambda: cached_predict_by_index(indices_tuple, n, excluded_ids_tuple)
        )
        
    except Exception as e:
        logger.error(f"Error in predict_by_index_bulk: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint that also verifies the model is loaded."""
    try:
        model = get_model()
        return {
            "status": "healthy", 
            "model_loaded": True,
            "items_count": len(model.df),
            "version": "2.0.0",
            "features": ["single_item_recommendations", "multi_item_recommendations", "round_robin_mixing"]
        }
    except HTTPException:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "items_count": 0,
            "version": "2.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
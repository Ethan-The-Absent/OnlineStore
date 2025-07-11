from fastapi import FastAPI, Query, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from typing import List, Optional, Dict, Set, Tuple
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
    description="API that uses a model to recommend game ids",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiting - 100 requests per minute
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

def get_model():
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    return model_instance

# Cache for common predictions
@lru_cache(maxsize=1000)
def cached_predict_by_id(id: str, n: int, excluded_ids_tuple: Optional[Tuple[str, ...]] = None):
    model = get_model()
    excluded_ids = list(excluded_ids_tuple) if excluded_ids_tuple else None
    return model.predict_by_id(id, n, excluded_ids)

@lru_cache(maxsize=1000)
def cached_predict_by_index(index: int, n: int, excluded_ids_tuple: Optional[Tuple[str, ...]] = None):
    model = get_model()
    excluded_ids = list(excluded_ids_tuple) if excluded_ids_tuple else None
    return model.predict_by_index(index, n, excluded_ids)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Game Recommender API"}

@app.get("/model/predict_by_id", response_model=List[int])
async def predict_by_id(
    id: str = Query(..., description="Input ID to find similar items"), 
    n: int = Query(5, description="Number of similar items to return"),
    excluded_ids: Optional[List[str]] = Query(None, description="IDs to exclude from recommendations")
):
    # Convert list to tuple for caching
    excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
    
    # Run prediction in a threadpool to avoid blocking
    return await run_in_threadpool(
        lambda: cached_predict_by_id(id, n, excluded_ids_tuple)
    )

@app.get("/model/predict_by_index", response_model=List[int])
async def predict_by_index(
    index: int = Query(..., description="Dataframe index to find similar items"), 
    n: int = Query(5, description="Number of similar items to return"),
    excluded_ids: Optional[List[str]] = Query(None, description="IDs to exclude from recommendations")
):
    # Convert list to tuple for caching
    excluded_ids_tuple = tuple(excluded_ids) if excluded_ids else None
    
    # Run prediction in a threadpool to avoid blocking
    return await run_in_threadpool(
        lambda: cached_predict_by_index(index, n, excluded_ids_tuple)
    )

@app.get("/health")
async def health_check():
    """Health check endpoint that also verifies the model is loaded."""
    try:
        model = get_model()
        return {
            "status": "healthy", 
            "model_loaded": True,
            "items_count": len(model.df)
        }
    except HTTPException:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "items_count": 0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

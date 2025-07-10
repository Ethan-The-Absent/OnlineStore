from fastapi import FastAPI, Query, Depends, HTTPException
from typing import List, Optional
import pandas as pd
import numpy as np
from functools import lru_cache

app = FastAPI(
    title="Model Prediction API",
    description="API that uses a model to recommend game ids",
    version="1.0.0"
)

# Model class to encapsulate the recommendation logic
class RecommendationModel:
    def __init__(self):
        # Load your data and model here
        self.df = self._load_dataframe()
        self.similarity_matrix = self._load_similarity_matrix()
        print("Model loaded successfully!")
        
    def _load_dataframe(self):
        processed_games_df = pd.read_parquet('../Data/processed_games.parquet')
        return processed_games_df
    
    def _load_similarity_matrix(self):
        similarity_df = pd.read_parquet('../Data/games_similarity_matrix.parquet')
        return similarity_df
    
    def predict_by_id(self, id_value: str, n: int = 5) -> list:
        """Get recommendation indices for an item by its ID"""
        try:
            # Find the index of the item with the given ID
            item_idx = self.df[self.df['id'] == id_value].index
            
            if len(item_idx) == 0:
                print(f"Item with ID {id_value} not found in the database.")
                return []
                
            # Get recommendations using the index
            return self.predict_by_index(item_idx[0], n)
            
        except Exception as e:
            print(f"Error in predict_by_id: {str(e)}")
            return []
    
    def predict_by_index(self, index: int, n: int = 5) -> list:
        """Get recommendation indices by dataframe index"""
        try:
            # Check if index exists in the dataframe
            if index < 0 or index >= len(self.df):
                print(f"Index {index} out of range.")
                return []
            
            # Get similarity scores for this item
            similarity_scores = self.similarity_matrix.loc[index].sort_values(ascending=False)
            
            # Get indices of top N similar items (excluding itself)
            similar_indices = similarity_scores.iloc[1:n+1].index.tolist()
            
            return similar_indices
            
        except Exception as e:
            print(f"Error in predict_by_index: {str(e)}")
            return []


# Create a singleton pattern for the model to avoid reloading
@lru_cache(maxsize=1)
def get_model():
    return RecommendationModel()

# Load the model at startup
@app.on_event("startup")
async def startup_event():
    get_model()  # Initialize the model

@app.get("/")
def read_root():
    return {"message": "Welcome to the Game Recommender API"}

@app.get("/model/predict_by_id", response_model=List[int])
def predict_by_id(id: str = Query(..., description="Input ID to find similar items"), 
            n: int = Query(5, description="Number of similar items to return"),
            model: RecommendationModel = Depends(get_model)):
    return model.predict_by_id(id, n)

@app.get("/model/predict_by_index", response_model=List[int])
def predict_by_index(index: int = Query(..., description="Dataframe index to find similar items"), 
                     n: int = Query(5, description="Number of similar items to return"),
                     model: RecommendationModel = Depends(get_model)):
    return model.predict_by_index(index, n)

@app.get("/health")
def health_check(model: RecommendationModel = Depends(get_model)):
    """Health check endpoint that also verifies the model is loaded."""
    return {
        "status": "healthy", 
        "model_loaded": True,
        "items_count": len(model.df)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import pandas as pd
from typing import List, Optional, Dict, Set

# Model class to encapsulate the recommendation logic
class RecommendationModel:
    def __init__(self):
        # Load your data and model here
        self.df = self._load_dataframe()
        self.similarity_matrix = self._load_similarity_matrix()
        # Create an index mapping game IDs to dataframe indices for faster lookups
        self._create_id_index()
        print("Model loaded successfully!")
        
    def _load_dataframe(self):
        processed_games_df = pd.read_parquet('../Data/processed_games.parquet')
        return processed_games_df
    
    def _load_similarity_matrix(self):
        similarity_df = pd.read_parquet('../Data/games_similarity_matrix.parquet')
        return similarity_df
    
    def _create_id_index(self):
        """Create a dictionary mapping game IDs to dataframe indices for O(1) lookups"""
        self.id_to_index: Dict[str, int] = {}
        # Check what columns are available in the dataframe
        id_column = self.df.index if 'id' not in self.df.columns else self.df['id']
        for idx, game_id in enumerate(id_column):
            self.id_to_index[str(game_id)] = idx

    
    def get_indices_from_ids(self, ids: List[str]) -> Set[int]:
        """Convert a list of game IDs to a set of dataframe indices using the index"""
        indices = set()
        for game_id in ids:
            if game_id in self.id_to_index:
                indices.add(self.id_to_index[game_id])
        return indices
    
    def predict_by_id(self, id_value: str, n: int = 5, excluded_ids: List[str] = None) -> list:
        """Get recommendation indices for an item by its ID"""
        try:
            # Use the index for O(1) lookup
            if id_value not in self.id_to_index:
                print(f"Item with ID {id_value} not found in the database.")
                return []
            
            item_idx = self.id_to_index[id_value]
            # Get recommendations using the index
            return self.predict_by_index(item_idx, n, excluded_ids)
            
        except Exception as e:
            print(f"Error in predict_by_id: {str(e)}")
            return []
    
    def predict_by_index(self, index: int, n: int = 5, excluded_ids: List[str] = None) -> list:
        """Get recommendation indices by dataframe index"""
        try:
            # Check if index exists in the dataframe
            if index < 0 or index >= len(self.df):
                print(f"Index {index} out of range.")
                return []
            
            # Calculate how many candidates we need based on exclusion list size
            exclude_size = 0 if not excluded_ids else len(excluded_ids)
            
            # For better performance, determine the number of candidates to fetch initially
            # We want n + exclude_size, but also add a buffer to reduce the chance of needing more fetches
            buffer_factor = 1.2  # 20% buffer
            candidate_count = min(
                int((n + exclude_size) * buffer_factor), 
                len(self.similarity_matrix.loc[index]) - 1
            )
            
            # Get similarity scores for this item
            similarity_scores = self.similarity_matrix.loc[index].sort_values(ascending=False)
            
            # If no exclusion, we can return directly for maximum performance
            if not excluded_ids or len(excluded_ids) == 0:
                return similarity_scores.iloc[1:n+1].index.tolist()
            
            # Convert excluded_ids to indices using our fast lookup index
            exclude_indices = self.get_indices_from_ids(excluded_ids)
            
            # Add the query index itself to the exclusion set
            exclude_indices.add(index)
            
            # Get top candidates
            top_candidates = similarity_scores.iloc[1:candidate_count+1]
            
            # Filter out excluded indices efficiently
            result = []
            for idx in top_candidates.index:
                if idx not in exclude_indices:
                    result.append(idx)
                    if len(result) >= n:
                        break
            
            # If we still need more recommendations, fetch more in batches
            if len(result) < n:
                remaining_needed = n - len(result)
                batch_size = max(remaining_needed * 2, exclude_size)  # Adjust batch size based on exclusion list
                offset = candidate_count + 1
                
                while len(result) < n and offset < len(similarity_scores):
                    # Fetch the next batch
                    next_batch_size = min(batch_size, len(similarity_scores) - offset)
                    next_batch = similarity_scores.iloc[offset:offset+next_batch_size]
                    offset += next_batch_size
                    
                    # Process this batch
                    for idx in next_batch.index:
                        if idx not in exclude_indices:
                            result.append(idx)
                            if len(result) >= n:
                                break
                    
                    # If we've gone through all items and still don't have enough, break
                    if next_batch_size < batch_size:
                        break
            
            return result
            
        except Exception as e:
            print(f"Error in predict_by_index: {str(e)}")
            return []

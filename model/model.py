import pandas as pd
from typing import List, Optional, Dict, Set, Union
from collections import defaultdict

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
    
    def predict_by_id(self, id_values: Union[str, List[str]], n: int = 5, excluded_ids: List[str] = None) -> list:
        """Get recommendation indices for item(s) by ID(s)
        
        Args:
            id_values: Single ID string or list of ID strings
            n: Total number of recommendations to return
            excluded_ids: List of IDs to exclude from recommendations
            
        Returns:
            List of recommendation indices in round-robin order from all input items
        """
        try:
            # Handle single ID case for backward compatibility
            if isinstance(id_values, str):
                id_values = [id_values]
            
            # Convert IDs to indices, filtering out invalid ones
            valid_indices = []
            for id_value in id_values:
                if id_value in self.id_to_index:
                    valid_indices.append(self.id_to_index[id_value])
                else:
                    print(f"Item with ID {id_value} not found in the database.")
            
            if not valid_indices:
                print("No valid IDs found in the database.")
                return []
            
            # Use the index-based method
            return self.predict_by_index(valid_indices, n, excluded_ids)
            
        except Exception as e:
            print(f"Error in predict_by_id: {str(e)}")
            return []
    
    def predict_by_index(self, indices: Union[int, List[int]], n: int = 5, excluded_ids: List[str] = None) -> list:
        """Get recommendation indices by dataframe index(es) in round-robin order
        
        Args:
            indices: Single index or list of indices
            n: Total number of recommendations to return
            excluded_ids: List of IDs to exclude from recommendations
            
        Returns:
            List of recommendation indices in round-robin order from all input items
        """
        try:
            # Handle single index case for backward compatibility
            if isinstance(indices, int):
                indices = [indices]
            
            # Validate indices
            valid_indices = []
            for idx in indices:
                if 0 <= idx < len(self.df):
                    valid_indices.append(idx)
                else:
                    print(f"Index {idx} out of range.")
            
            if not valid_indices:
                print("No valid indices provided.")
                return []
            
            # Calculate how many candidates we need based on exclusion list size
            exclude_size = 0 if not excluded_ids else len(excluded_ids)
            
            # Convert excluded_ids to indices using our fast lookup index
            exclude_indices = self.get_indices_from_ids(excluded_ids) if excluded_ids else set()
            
            # Add the query indices themselves to the exclusion set
            exclude_indices.update(valid_indices)
            
            # Get recommendations for each index
            recommendations_per_index = {}
            
            for idx in valid_indices:
                recommendations_per_index[idx] = self._get_single_index_recommendations(
                    idx, n, exclude_indices
                )
            
            # Round-robin merge the recommendations
            result = self._round_robin_merge(recommendations_per_index, n)
            
            return result
            
        except Exception as e:
            print(f"Error in predict_by_index: {str(e)}")
            return []
    
    def _get_single_index_recommendations(self, index: int, n: int, exclude_indices: Set[int]) -> List[int]:
        """Get recommendations for a single index, optimized for performance"""
        try:
            # For better performance, determine the number of candidates to fetch initially
            # We want more than n to account for exclusions, but also add a buffer
            buffer_factor = 1.5  # 50% buffer
            candidate_count = min(
                int(n * buffer_factor + len(exclude_indices)), 
                len(self.similarity_matrix.loc[index]) - 1
            )
            
            # Get similarity scores for this item
            similarity_scores = self.similarity_matrix.loc[index].sort_values(ascending=False)
            
            # If no exclusion, we can return directly for maximum performance
            if not exclude_indices or len(exclude_indices) == 0:
                return similarity_scores.iloc[1:n+1].index.tolist()
            
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
                batch_size = max(remaining_needed * 2, len(exclude_indices))  # Adjust batch size based on exclusion list
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
            print(f"Error in _get_single_index_recommendations: {str(e)}")
            return []
    
    def _round_robin_merge(self, recommendations_per_index: Dict[int, List[int]], n: int) -> List[int]:
        """Merge recommendations from multiple indices in round-robin fashion"""
        result = []
        seen = set()
        
        # Find the maximum length of any recommendation list
        max_length = max(len(recs) for recs in recommendations_per_index.values()) if recommendations_per_index else 0
        
        # Round-robin through all recommendation lists
        for position in range(max_length):
            for idx in recommendations_per_index:
                if len(result) >= n:
                    break
                    
                recs = recommendations_per_index[idx]
                if position < len(recs):
                    rec_idx = recs[position]
                    if rec_idx not in seen:
                        result.append(rec_idx)
                        seen.add(rec_idx)
            
            if len(result) >= n:
                break
        
        return result[:n]

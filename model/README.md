# Game Recommender Model
- Item-Item based model. 
- Initial dataset: https://www.gigasheet.com/sample-data/top-1000-steam-games-2023

## Setup
0. To prepare the model, run data_processing/raw_data_processing.ipynb (processes the raw data & create a similarity matrix for the model to use)
<br> ^If you want to create a synthetic dataset, consider running the data_processing/generate_synthetic_data.ipynb notebook as well.
1. pip install -r requirements.txt
2. python server.py 


### Endpoint Calls
- GET http://localhost:8000/
- GET http://localhost:8000/health
- GET http://localhost:8000/model/predict_by_index?index=18&n=5&excluded_ids=47&excluded_ids=134


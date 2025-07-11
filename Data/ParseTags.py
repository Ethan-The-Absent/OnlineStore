import csv
import json
import ast
import pandas as pd

def convert_tags_to_json(input_csv, output_csv):
    """
    Process a CSV file to add a new column with JSON-formatted tags.
    
    Args:
        input_csv (str): Path to the input CSV file
        output_csv (str): Path to the output CSV file
    """
    try:
        # Read the CSV file into a pandas DataFrame
        df = pd.read_csv(input_csv)
        
        # Check if 'tags' column exists
        if 'tags' not in df.columns:
            print("Error: 'tags' column not found in the CSV file.")
            return
        
        # Function to convert Python dict string to JSON
        def convert_to_json(tags_str):
            if pd.isna(tags_str) or tags_str == '':
                return '{}'
            
            try:
                # Convert string representation of dict to actual Python dict
                # ast.literal_eval is safer than eval() for parsing Python literals
                tags_dict = ast.literal_eval(tags_str)
                
                # Convert Python dict to JSON string
                json_str = json.dumps(tags_dict)
                return json_str
            except (SyntaxError, ValueError) as e:
                print(f"Error parsing tags: {tags_str}")
                print(f"Error details: {e}")
                return '{}'
        
        # Apply the conversion function to create a new column
        df['tags_json'] = df['tags'].apply(convert_to_json)
        
        # Write the updated DataFrame to a new CSV file
        df.to_csv(output_csv, index=False)
        
        print(f"Successfully processed {len(df)} rows.")
        print(f"Output saved to {output_csv}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Replace these with your actual file paths
    input_file = "Top 1000 Steam Games 2023 export 2025-07-09 14-37-02.csv"  # Your original CSV file
    output_file = "Top 1000 Steam Games 2023 export 2025-07-09 14-37-02_json_tags.csv"  # The new CSV file with JSON tags
    
    convert_tags_to_json(input_file, output_file)

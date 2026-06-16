import pandas as pd
from google import genai
from google.genai import types
import os
import json
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def heuristic_protected_status(columns):
    """
    Fallback heuristic to identify protected columns without AI.
    """
    protected_keywords = ['gender', 'race', 'ethnicity', 'age', 'religion', 'sexual', 'orientation', 'disability', 'medical', 'pii', 'ssn', 'email', 'phone']
    target_keywords = ['approved', 'score', 'label', 'status', 'outcome', 'target', 'y', 'class']
    
    results = {}
    found_target = False
    for col in columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in protected_keywords):
            results[col] = "protected"
        elif not found_target and any(keyword == col_lower or keyword in col_lower for keyword in target_keywords):
            results[col] = "target"
            found_target = True
        else:
            results[col] = "not protected"
            
    # If no target found by keyword, guess the last column if it's not protected
    if not found_target and len(columns) > 0:
        last_col = columns[-1]
        if results[last_col] != "protected":
            results[last_col] = "target"
            
    return results

def get_protected_status_from_df(df):
    """
    Reads the first 11 rows of a DataFrame and uses Gemini to identify protected columns.
    Returns a dictionary mapping column names to 'protected', 'not protected', or 'target'.
    """
    if df is None or df.empty:
        return {"error": "DataFrame is empty"}

    # Use the first 11 rows for context
    try:
        df_sample = df.head(11)
    except Exception as e:
        return {"error": f"Failed to get sample: {str(e)}"}

    # Vertex AI Configuration using ADC
    try:
        config = types.GenerateContentConfig(
            # Forces structured JSON formatting natively
            response_mime_type="application/json",
            
            # Keeps the model completely objective and deterministic
            temperature=0.0
        )

        import google.auth
        credentials, default_project_id = google.auth.default()
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or default_project_id
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-south1")
        
        client = genai.Client(vertexai=True, project=project_id, location=location)
        
        data_preview = df_sample.to_string(index=False)
        prompt = f"""
        Analyze the following CSV data sample (first 11 rows) and identify:
        1. Which columns contain "protected" demographic information (e.g., Race, Gender, Age, Religion, Ethnicity, Disability, Sexual Orientation).
           CRITICAL: Do NOT classify merit, performance, financial, or score metrics (like GPA, interview scores, years of experience, number of previous jobs) as protected, even if they are confidential.
        2. Which are "not protected" (this includes all merit, performance, and non-demographic variables).
        3. Which single column is the most likely "target" or outcome variable (e.g., 'Approved', 'Score', 'Label', 'Status', 'hiring_decision_hired').
        4. Category of the entire dataset (e.g., "loan applications", "employee records", "customer data", "HR data", etc.) if possible.
        5. ID columns should be classified as "id" and not "protected" since they are not sensitive by themselves.
        CSV Data Sample:
        {data_preview}

        Return a JSON object where each key is a column name from the CSV and 
        each value is one of: "protected", "not protected", or "target".
        Also include an additional key "dataset_category" with your best guess of the dataset's category.
        """

        response = client.models.generate_content(
            model=os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config=config
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Warning: Gemini API call failed ({e}). Using heuristic fallback.")
        return heuristic_protected_status(df.columns)

if __name__ == "__main__":
    # Default to data/users.csv if no argument is provided
    target_csv = sys.argv[1] if len(sys.argv) > 1 else "data/users.csv"
    
    # Run the analysis
    import pandas as pd
    df = pd.read_csv(target_csv)
    result = get_protected_status_from_df(df)
    
    # Print the JSON output to stdout
    print(json.dumps(result, indent=2))

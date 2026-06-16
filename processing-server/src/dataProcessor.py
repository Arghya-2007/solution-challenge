import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer

def preprocess_dataset(df):
    # Copy the DataFrame to avoid modifying the original dataset
    df = df.copy()
    
    # 1. DROPPING CRITERIA:
    # Drop columns where missing values exceed 60%
    missing_pct = df.isnull().mean()
    cols_to_drop = [col for col in df.columns if missing_pct[col] > 0.60]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        
    # Process remaining columns
    for col in df.columns:
        if df[col].isnull().any():
            # Flag that this column had missing data (Crucial for Bias Detection downstream)
            df[f"{col}_was_missing"] = df[col].isnull().astype(int)
            
            # Check if column is numerical (Integers, Floats) or categorical
            # Force categorical for codes, IDs, flags, and identity columns
            col_lower = col.lower()
            is_categorical_name = "id" in col_lower or "code" in col_lower or "flag" in col_lower or "identity" in col_lower
            
            if pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col]) and not is_categorical_name:
                
                # Evaluate column skewness
                skewness = df[col].skew()
                
                # Fallback to median if skewness is NaN due to lack of variance/data points
                if pd.isna(skewness):
                    strategy = 'median'
                else:
                    strategy = 'median' if abs(skewness) > 1 else 'mean'
                
                imputer = SimpleImputer(strategy=strategy)
                # .ravel() flattens the 2D output back to 1D to prevent Pandas assignment errors
                df[col] = imputer.fit_transform(df[[col]]).ravel()
                
            else:
                # Handle categorical/object columns
                # If it's a code/id column that was parsed as float, impute with mode
                if is_categorical_name and pd.api.types.is_numeric_dtype(df[col]):
                    imputer = SimpleImputer(strategy='most_frequent')
                    df[col] = imputer.fit_transform(df[[col]]).ravel()
                else:
                    # If it's a strict Pandas 'category' dtype, expand categories first
                    if isinstance(df[col].dtype, pd.CategoricalDtype):
                        if "Unknown" not in df[col].cat.categories:
                            df[col] = df[col].cat.add_categories("Unknown")
                    
                    # Fill missing cells with "Unknown" string literal
                    imputer = SimpleImputer(strategy='constant', fill_value='Unknown')
                    df[col] = imputer.fit_transform(df[[col]]).ravel()
                
    return df
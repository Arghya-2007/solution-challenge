import pandas as pd
import os

def convert_to_csv(input_path):
    """
    Converts various file formats to CSV.
    Supported: .tsv, .xlsx, .xls, .json
    """
    ext = os.path.splitext(input_path)[1].lower()
    output_path = os.path.splitext(input_path)[0] + '.csv'
    
    if ext == '.csv':
        return input_path
    
    try:
        if ext == '.tsv':
            df = pd.read_csv(input_path, sep='\t')
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(input_path)
        elif ext == '.json':
            df = pd.read_json(input_path)
        elif ext == '.xml':
            df = pd.read_xml(input_path)
        else:
            raise ValueError(f"Unsupported format: {ext}")
            
        df.to_csv(output_path, index=False)
        return output_path
    except Exception as e:
        print(f"Error converting {input_path} to CSV: {e}")
        return None

def convert_all_to_csv(directory='.'):
    """
    Recursively finds all supported files in the directory and converts them to CSV.
    Supported: .tsv, .xlsx, .xls, .json, .xml, .csv
    """
    converted_files = []
    supported_extensions = ['.tsv', '.xlsx', '.xls', '.json', '.xml', '.csv']
    
    for root, dirs, files in os.walk(directory):
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in supported_extensions:
                input_path = os.path.join(root, file)
                if ext == '.csv':
                    converted_files.append((input_path, input_path))
                else:
                    csv_path = convert_to_csv(input_path)
                    if csv_path:
                        converted_files.append((input_path, csv_path))
    return converted_files

def clean_data(rows):
    """
    Placeholder for data cleaning logic.
    """
    cleaned_rows = []
    for row in rows:
        # Example: strip whitespace from all fields
        cleaned_rows.append([str(val).strip() for val in row])
    return cleaned_rows

def validate_data(headers, rows):
    """
    Placeholder for data validation logic.
    """
    if not headers:
        return False, "Missing headers"
    for i, row in enumerate(rows):
        if len(row) != len(headers):
            return False, f"Row {i} has inconsistent column count"
    return True, "Valid"

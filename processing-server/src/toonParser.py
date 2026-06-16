import csv
import os
try:
    from .dataParser import clean_data, validate_data
except (ImportError, ValueError):
    from dataParser import clean_data, validate_data

def csv_to_toon(csv_file_path, toon_file_path=None):
    """
    Converts a CSV file to TOON (Token-Oriented Object Notation) format.
    """
    if not toon_file_path:
        toon_file_path = os.path.splitext(csv_file_path)[0] + '.toon'
    
    # Use the filename (without extension) as the object name
    object_name = os.path.basename(csv_file_path).split('.')[0]
    
    with open(csv_file_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        try:
            headers = [h.strip() for h in next(reader)]
        except StopIteration:
            # Empty file
            return None
            
        rows = list(reader)
        
    # Clean and validate data
    rows = clean_data(rows)
    is_valid, msg = validate_data(headers, rows)
    if not is_valid:
        print(f"Warning: {csv_file_path} is invalid: {msg}")
        # Proceed anyway or handle as needed
        
    count = len(rows)
        
    # TOON Tabular Array format: name[count]{header1,header2,...}:
    #   val1,val2,...
    toon_content = f"{object_name}[{count}]{{{','.join(headers)}}}:\n"
    for row in rows:
        # Simple join; complex quoting could be added if needed
        toon_content += f"  {','.join(row)}\n"
        
    with open(toon_file_path, mode='w', encoding='utf-8') as f:
        f.write(toon_content)
    
    return toon_file_path

def convert_all_csv(directory='.'):
    """
    Recursively finds all CSV files in the directory and converts them to TOON.
    """
    converted_files = []
    for root, dirs, files in os.walk(directory):
        # Skip .git and other hidden directories
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if file.endswith('.csv'):
                csv_path = os.path.join(root, file)
                toon_path = csv_to_toon(csv_path)
                if toon_path:
                    converted_files.append((csv_path, toon_path))
    return converted_files

if __name__ == "__main__":
    print("Starting CSV to TOON conversion...")
    results = convert_all_csv()
    for csv_p, toon_p in results:
        print(f"Converted: {csv_p} -> {toon_p}")
    print(f"Finished. Total files converted: {len(results)}")

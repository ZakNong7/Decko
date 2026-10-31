import sqlite3
import re
import os

db_path = '/Users/zakky/.gemini/antigravity/conversations/310b4b92-d6e3-407a-ae08-101e3e86dc13.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get step 408 payload
cursor.execute('SELECT step_payload FROM steps WHERE idx = 408;')
payload = cursor.fetchone()[0]
text = payload.decode('utf-8', errors='ignore')

# We search for the pattern:
# [R|N|L]file:///.../client/src/pages/(Board|Dashboard).jsx followed by some spaces/control characters and then 'import '
# Let's use regex to find this exact pattern!
targets = ['Board.jsx', 'Dashboard.jsx']

for name in targets:
    # Match the URI followed by 'import' within 10 characters
    pattern = r'file:///[^\s]*client/src/pages/' + re.escape(name) + r'[\s\x00-\x1f]*import\s'
    match = re.search(pattern, text)
    if match:
        start_pos = match.start()
        # Find 'import ' which starts the actual code
        import_pos = text.find('import ', start_pos)
        
        # Grab content until the next file URI or markdown section or control block
        # We can search for the next 'file:///' after the import
        next_file_pos = text.find('file:///', import_pos + 10)
        if next_file_pos == -1:
            next_file_pos = len(text)
            
        code_block = text[import_pos:next_file_pos]
        
        # Clean trailing binary characters
        last_brace = code_block.rfind('}')
        if last_brace != -1:
            code_block = code_block[:last_brace+1]
            
        # Clean line numbers
        cleaned_lines = []
        for line in code_block.split('\n'):
            line_match = re.match(r'^\s*\d+:\s?(.*)', line)
            if line_match:
                cleaned_lines.append(line_match.group(1))
            else:
                cleaned_lines.append(line)
        cleaned_code = '\n'.join(cleaned_lines)
        
        target_path = f'/Users/zakky/Documents/Zakky/Proyek 1/CODE/Decko/client/src/pages/{name}'
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'w') as f:
            f.write(cleaned_code)
        print(f"Extracted {name} (length: {len(cleaned_code)}) to {target_path}")
    else:
        print(f"Could not find exact code boundary pattern for {name}")

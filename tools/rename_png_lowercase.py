#!/usr/bin/env python3
"""
Script to rename all PNG files to lowercase in a directory
Works on Windows, Mac, and Linux
"""

import os
import sys
from pathlib import Path


def rename_png_to_lowercase(directory='.'):
    """Rename all PNG files in the specified directory to lowercase."""
    
    target_dir = Path(directory)
    
    if not target_dir.exists():
        print(f"❌ Error: Directory '{directory}' does not exist")
        return
    
    if not target_dir.is_dir():
        print(f"❌ Error: '{directory}' is not a directory")
        return
    
    print(f"🔄 Renaming PNG files to lowercase in: {target_dir.absolute()}")
    print()
    
    count = 0
    skipped = 0
    
    # Find all PNG files (case-insensitive search)
    png_files = []
    for ext in ['*.png', '*.PNG', '*.Png', '*.pNg', '*.PNg', '*.pNG', '*.PnG', '*.pnG']:
        png_files.extend(target_dir.glob(ext))
    
    # Remove duplicates
    png_files = list(set(png_files))
    
    if not png_files:
        print("ℹ️  No PNG files found in directory")
        return
    
    for file_path in png_files:
        original_name = file_path.name
        lowercase_name = original_name.lower()
        
        # Only rename if names are different
        if original_name != lowercase_name:
            new_path = file_path.parent / lowercase_name
            
            # Check if target already exists
            if new_path.exists() and new_path != file_path:
                print(f"⚠️  Skipped: {original_name} (lowercase version already exists)")
                skipped += 1
            else:
                try:
                    file_path.rename(new_path)
                    print(f"✅ Renamed: {original_name} → {lowercase_name}")
                    count += 1
                except Exception as e:
                    print(f"❌ Error renaming {original_name}: {e}")
    
    print()
    if count == 0 and skipped == 0:
        print("✨ No files needed renaming (all PNG files already lowercase)")
    else:
        if count > 0:
            print(f"✨ Done! Renamed {count} file(s)")
        if skipped > 0:
            print(f"⚠️  Skipped {skipped} file(s) (lowercase versions already exist)")


if __name__ == "__main__":
    # Get directory from command line argument or use current directory
    directory = sys.argv[1] if len(sys.argv) > 1 else '.'
    rename_png_to_lowercase(directory)

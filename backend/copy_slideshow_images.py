import shutil
import os

brain_dir = r"C:\Users\habin\.gemini\antigravity-ide\brain\f86244fe-ae28-42fd-9a47-5b902e3c5ebd"
assets_dir = r"c:\hasa_prox\htdocs\agritracking\src\assets"

files_to_copy = {
    "livestock_pasture_1791562173841.jpg": "livestock.jpg",
    "banana_farming_1791562200911.jpg": "banana_hd.jpg",
    "rice_farming_1791562220158.jpg": "rice_hd.jpg",
    "crop_monitoring_1791562259958.jpg": "crops_hd.jpg"
}

for src_name, dst_name in files_to_copy.items():
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(assets_dir, dst_name)
    if os.path.exists(src_path):
        shutil.copyfile(src_path, dst_path)
        print(f"Copied {src_name} -> {dst_name} ({os.path.getsize(dst_path)} bytes)")
    else:
        print(f"File not found: {src_path}")

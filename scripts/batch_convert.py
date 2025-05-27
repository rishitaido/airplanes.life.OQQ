# scripts/batch_convert.py
import os
import subprocess

RAW_DIR = "static/assets/raw"
OUT_DIR = "static/assets/3d"
CONVERT_SCRIPT = "scripts/convert.py"

# Supported input formats
VALID_EXTENSIONS = [".blend", ".obj", ".fbx"]

def run_conversion(input_path, output_path):
    print(f"🔁 Converting: {input_path} → {output_path}")
    subprocess.run([
        "blender", "--background", "--python", CONVERT_SCRIPT, "--",
        input_path, output_path
    ])

def main():
    if not os.path.exists(OUT_DIR):
        os.makedirs(OUT_DIR)

    for file in os.listdir(RAW_DIR):
        ext = os.path.splitext(file)[1].lower()
        if ext in VALID_EXTENSIONS:
            input_path = os.path.join(RAW_DIR, file)
            output_name = os.path.splitext(file)[0] + ".glb"
            output_path = os.path.join(OUT_DIR, output_name)
            run_conversion(input_path, output_path)
        else:
            print(f"⚠️ Skipping unsupported file: {file}")

if __name__ == "__main__":
    main()

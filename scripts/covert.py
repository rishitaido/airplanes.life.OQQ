# convert.py
import bpy # type: ignore
import sys
import os

input_file = sys.argv[-2]
output_file = sys.argv[-1]

ext = os.path.splitext(input_file)[1].lower()

if ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=input_file)
elif ext == ".obj":
    bpy.ops.import_scene.obj(filepath=input_file)
elif ext == ".blend":
    bpy.ops.wm.open_mainfile(filepath=input_file)
else:
    raise Exception("Unsupported format")

bpy.ops.export_scene.gltf(filepath=output_file, export_format='GLB')

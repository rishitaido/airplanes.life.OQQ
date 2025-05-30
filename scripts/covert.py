"""
Run via:  blender --background --python scripts/convert.py -- <in> <out>
"""

import bpy, sys, pathlib # type: ignore

inp, out = map(pathlib.Path, sys.argv[-2:])

bpy.ops.wm.read_factory_settings(use_empty=True)

suffix = inp.suffix.lower()
if suffix in {".fbx"}:
    bpy.ops.import_scene.fbx(filepath=str(inp))
elif suffix in {".obj"}:
    bpy.ops.import_scene.obj(filepath=str(inp))
elif suffix in {".dae"}:
    bpy.ops.wm.collada_import(filepath=str(inp))
else:
    raise SystemExit(f"Unsupported format: {suffix}")

# optional: apply scale/rot so Three.js axes look right
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath=str(out),
    export_format='GLB',
    export_texcoords=True,
    export_apply=True,
)

"""Extrude the canonical src/app/icon.svg polygon; never change brand originals."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/assets/nexora-emblem'
EXPORT = ROOT / 'public/assets/brand/3d'
SOURCE.mkdir(parents=True, exist_ok=True)
EXPORT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

# Exact outline from the official favicon, normalized around the icon center.
points = [(276.7,42.1),(274.6,256.0),(106.5,133.8),(106.5,378.2),
          (232.0,469.9),(233.1,250.5),(401.2,372.8),(401.2,133.8)]
curve = bpy.data.curves.new('Canonical Nexora N', 'CURVE')
curve.dimensions = '2D'
curve.fill_mode = 'BOTH'
curve.resolution_u = 1
curve.extrude = .16
curve.bevel_depth = .028
curve.bevel_resolution = 3
poly = curve.splines.new('POLY')
poly.points.add(len(points)-1)
for point, (x,y) in zip(poly.points, points):
    point.co = ((x-256)/135, (256-y)/135, 0, 1)
poly.use_cyclic_u = True
obj = bpy.data.objects.new('Nexora emblem — canonical silhouette', curve)
obj.rotation_euler[0] = math.pi / 2
bpy.context.collection.objects.link(obj)
mat = bpy.data.materials.new('Anodized indigo titanium')
mat.diffuse_color = (.28,.34,.92,1)
mat.use_nodes = True
shader = mat.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = mat.diffuse_color
shader.inputs['Metallic'].default_value = .72
shader.inputs['Roughness'].default_value = .23
shader.inputs['Coat Weight'].default_value = .45
shader.inputs['Coat Roughness'].default_value = .18
curve.materials.append(mat)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.convert(target='MESH')
for face in obj.data.polygons:
    face.use_smooth = True
normal = obj.modifiers.new('Weighted edge normals', 'WEIGHTED_NORMAL')
bpy.ops.object.modifier_apply(modifier=normal.name)

bpy.ops.object.camera_add(location=(3,-8,1))
camera = bpy.context.object
camera.rotation_euler = (Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 4.8
bpy.context.scene.camera = camera
for name, pos, color, energy, size in [
    ('Cool softbox',(-3,-4,5),(.60,.73,1),1000,4),
    ('Lavender rim',(3,-1,2),(.66,.45,1),900,3),
    ('White edge',(0,-4,-3),(1,1,1),700,3)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.color = color
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (-light.location).to_track_quat('-Z','Y').to_euler()
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.world.color = (.10,.13,.24)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'nexora-emblem.blend'))
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath=str(EXPORT / 'nexora-emblem.glb'),
    export_format='GLB', use_selection=True, export_animations=False)
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(SOURCE / 'emblem-preview.png')
bpy.ops.render.render(write_still=True)

"""Refine the preserved prototype for review; never promote it automatically."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/assets/nexora-mascot'
EXPORT = ROOT / 'public/assets/mascot/3d'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'nexora-prototype.blend'))
bpy.context.preferences.filepaths.save_version = 0
head = bpy.data.objects['Head']
ink = bpy.data.materials['Ink outlines']
white = bpy.data.materials['Porcelain face and gloves']
for material in bpy.data.materials:
    node = material.node_tree.nodes.get('Principled BSDF') if material.use_nodes else None
    if not node:
        continue
    cloth = any(word in material.name for word in ['shirt', 'trousers', 'Collar', 'tie'])
    node.inputs['Roughness'].default_value = .88 if cloth else .58
    node.inputs['Specular IOR Level'].default_value = .22 if cloth else .32
    if cloth:
        node.inputs['Sheen Weight'].default_value = .18

# Concave four-point diamonds follow the official star eyes, rather than cross prisms.
for obj in list(bpy.data.objects):
    if any(obj.name.startswith(name) for name in ['Star eye', 'Eye white inset', 'Eye inner ink']):
        bpy.data.objects.remove(obj, do_unlink=True)

def star_eye(name, x, z, radius, y, material):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '2D'
    curve.fill_mode = 'BOTH'
    curve.resolution_u = 8
    curve.extrude = .003
    spline = curve.splines.new('BEZIER')
    coords = [(0,1),(.34,.36),(.73,0),(.32,-.35),(0,-1),(-.32,-.35),(-.73,0),(-.34,.36)]
    spline.bezier_points.add(len(coords)-1)
    for index, (point, (u,v)) in enumerate(zip(spline.bezier_points, coords)):
        point.co = (u*radius, v*radius, 0)
        point.handle_left_type = 'VECTOR' if index % 2 == 0 else 'AUTO'
        point.handle_right_type = 'VECTOR' if index % 2 == 0 else 'AUTO'
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.parent = head
    obj.location = (x,y,z)
    obj.rotation_euler[0] = math.pi/2
    curve.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return obj

for side in (-1,1):
    star_eye('Refined ink star', side*.47, .13, .33, -.405, ink)
    star_eye('Star reflected white', side*.47-.025, .15, .255, -.415, white)
    star_eye('Star pupil ink', side*.47+.01, .135, .23, -.423, ink)

# A single index finger and folded fingers give the signature coaching gesture.
for obj in list(bpy.data.objects):
    if obj.name.startswith('Raised finger'):
        bpy.data.objects.remove(obj, do_unlink=True)
arm = bpy.data.objects['Welcoming arm']
def glove(name, location, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=(0,0,0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = arm
    obj.location = location
    obj.scale = scale
    obj.data.materials.append(white)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
glove('Coaching index finger', (-.92,-.025,.79), (.065,.085,.23))
glove('Folded fingers', (-.78,-.09,.62), (.13,.09,.095))

# Slow, restrained anticipation; preserve actual application-state clip names.
for action in bpy.data.actions:
    for slot in action.slots:
        for layer in action.layers:
            for strip in layer.strips:
                bag = strip.channelbag(slot)
                if not bag:
                    continue
                for curve in bag.fcurves:
                    for point in curve.keyframe_points:
                        point.interpolation = 'BEZIER'
                        point.handle_left_type = 'AUTO_CLAMPED'
                        point.handle_right_type = 'AUTO_CLAMPED'

scene = bpy.context.scene
scene.frame_set(1)
for obj in scene.objects:
    obj.select_set(obj.type not in {'LIGHT','CAMERA'})
bpy.ops.export_scene.gltf(filepath=str(EXPORT/'nexora-refined.glb'), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='NLA_TRACKS', export_nla_strips=True, export_lights=False, export_cameras=False)
scene.cycles.samples = 32
scene.render.filepath = str(SOURCE/'refined-preview.png')
scene.camera.location = (.9,-10,3.7)
scene.camera.rotation_euler = (Vector((0,0,2.2))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale = 5.2
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'nexora-refined.blend'))
bpy.ops.render.render(write_still=True)
print('NEXORA_REFINEMENT_REVIEW_ONLY', EXPORT/'nexora-refined.glb')

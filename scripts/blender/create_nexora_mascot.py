"""Deterministic stylized prototype from public/assets/mascot/mascot-reference.png.
Run: blender --background --python scripts/blender/create_nexora_mascot.py
No canonical images are modified. Geometry, source, preview and named clips only.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/assets/nexora-mascot'
EXPORT = ROOT / 'public/assets/mascot/3d'
SOURCE.mkdir(parents=True, exist_ok=True)
EXPORT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

def material(name, color, roughness=.55):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

white = material('Porcelain face and gloves', (.93, .92, .93))
outline = material('Ink outlines', (.026, .022, .04))
purple = material('Lavender shirt', (.43, .28, .82))
collar_mat = material('Collar lavender', (.56, .40, .91))
tie_mat = material('Violet tie', (.11, .035, .38))
trousers = material('Charcoal trousers', (.075, .082, .12))
handle_mat = material('Graphite handle', (.22, .23, .29))
pink = material('Rose cheeks', (.96, .25, .46))
metal = material('Buckle', (.63, .66, .72), .28)

def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj

rig = empty('Nexora')
head = empty('Head', rig, (0, 0, 3.12))

def finish(obj, name, mat, parent):
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = parent
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def box(name, location, dimensions, mat, parent=rig, bevel=.07):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new('Soft corners', 'BEVEL')
    mod.width = bevel
    mod.segments = 4
    bpy.ops.object.modifier_apply(modifier=mod.name)
    normal = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=normal.name)
    return finish(obj, name, mat, parent)

def ball(name, location, scale, mat, parent=rig):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, parent)

def rod(name, a, b, radius, mat, parent=rig):
    a, b = Vector(a), Vector(b)
    obj = ball(name, (a+b)/2, (radius, radius, (b-a).length/2+radius*.45), mat, parent)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return obj

def flat_shape(name, coords, y, mat, parent=rig):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x, y, z) for x, z in coords], [], [tuple(range(len(coords)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, parent)

def star(name, x, z, radius, y, mat):
    points = []
    for i in range(8):
        angle = math.pi/2 + i*math.pi/4
        r = radius if i%2 == 0 else radius*.33
        points.append((x+math.cos(angle)*r, z+math.sin(angle)*r*1.24))
    return flat_shape(name, points, y, mat, head)

# Large rounded briefcase face and graphite carry handle define the identity.
box('Head charcoal rim', (0, 0, 0), (2.22, .64, 1.78), outline, head, .23)
box('Porcelain face', (0, -.285, 0), (2.10, .18, 1.65), white, head, .20)
box('Handle top', (0, 0, 1.14), (.88, .31, .19), handle_mat, head, .08)
box('Handle left', (-.37, 0, .94), (.18, .31, .38), handle_mat, head, .07)
box('Handle right', (.37, 0, .94), (.18, .31, .38), handle_mat, head, .07)
for x in (-.47, .47):
    star('Star eye', x, .13, .34, -.388, outline)
    star('Eye white inset', x-.035, .15, .265, -.393, white)
    star('Eye inner ink', x+.015, .15, .235, -.398, outline)
    ball('Rosy cheek', (x*1.32, -.398, -.34), (.19, .025, .105), pink, head)

curve = bpy.data.curves.new('Smile', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = .025
curve.bevel_resolution = 2
spline = curve.splines.new('POLY')
spline.points.add(16)
for i, point in enumerate(spline.points):
    t = i/16
    point.co = (-.19+.38*t, -.404, -.22-.11*math.sin(t*math.pi), 1)
smile = bpy.data.objects.new('Friendly smile', curve)
bpy.context.collection.objects.link(smile)
smile.parent = head
curve.materials.append(outline)
bpy.context.view_layer.objects.active = smile
smile.select_set(True)
bpy.ops.object.convert(target='MESH')
smile.select_set(False)

box('Shirt', (0, 0, 1.87), (.95, .56, .99), purple, bevel=.16)
flat_shape('Left collar', [(-.37,2.29),(-.05,2.22),(-.21,2.03)], -.30, collar_mat)
flat_shape('Right collar', [(.37,2.29),(.05,2.22),(.21,2.03)], -.30, collar_mat)
flat_shape('Tie', [(-.075,2.17),(.075,2.17),(.1,1.58),(0,1.45),(-.1,1.58)], -.316, tie_mat)
box('Tie knot', (0, -.315, 2.16), (.17, .075, .17), tie_mat, bevel=.025)
box('Waistband', (0, -.015, 1.40), (1.0, .57, .14), outline, bevel=.025)
box('Belt buckle', (0, -.316, 1.41), (.25, .035, .16), metal, bevel=.02)
box('Buckle center', (0, -.342, 1.41), (.17, .025, .09), outline, bevel=.015)
for side in (-1,1):
    leg = box('Trouser leg', (side*.29, 0, .86), (.42,.52,1.0), trousers, bevel=.06)
    leg.rotation_euler[1] = side*-.09
    box('Shoe', (side*.35,-.12,.28), (.48,.76,.30), outline, bevel=.13)
    ball('Shoe highlight', (side*.38,-.40,.39), (.07,.035,.035), metal)

# Shoulder pivots: object-level animation avoids a costly skeletal rig.
left_arm = empty('Welcoming arm', rig, (-.48,0,2.16))
rod('Left upper sleeve', (0,0,0),(-.34,0,-.16),.17,purple,left_arm)
rod('Raised sleeve', (-.34,0,-.16),(-.79,0,.27),.15,purple,left_arm)
box('White cuff', (-.81,-.01,.29),(.28,.34,.12),white,left_arm,.035)
ball('Waving palm',(-.85,-.025,.52),(.18,.12,.20),white,left_arm)
for i in range(3):
    rod('Raised finger',(-.99+i*.12,-.025,.61),(-1.04+i*.13,-.025,.85-abs(i-1)*.05),.058,white,left_arm)
rod('Thumb',(-.70,-.04,.49),(-.60,-.04,.65),.07,white,left_arm)
right_arm = empty('Resting arm', rig, (.48,0,2.16))
rod('Right upper sleeve',(0,0,0),(.34,0,-.30),.17,purple,right_arm)
rod('Right forearm',(.34,0,-.30),(.17,-.08,-.58),.15,purple,right_arm)
box('Right cuff',(.17,-.08,-.58),(.26,.32,.12),white,right_arm,.035)
ball('Resting glove',(.14,-.16,-.72),(.15,.13,.19),white,right_arm)

def clip(obj, name, path, frames):
    original = tuple(getattr(obj, path))
    for frame, value in frames:
        setattr(obj, path, value)
        obj.keyframe_insert(data_path=path, frame=frame)
    action = obj.animation_data.action
    action.name = name + '_' + obj.name
    track = obj.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    obj.animation_data.action = None
    setattr(obj, path, original)

clip(rig,'idle','location',[(1,(0,0,0)),(41,(0,0,.035)),(81,(0,0,0))])
clip(rig,'speaking','rotation_euler',[(1,(0,0,0)),(17,(0,.025,.018)),(33,(0,-.025,-.018)),(49,(0,0,0))])
clip(right_arm,'speaking','rotation_euler',[(1,(0,0,0)),(25,(0,-.12,.06)),(49,(0,0,0))])
clip(head,'listening','rotation_euler',[(1,(0,0,0)),(31,(0,-.08,0)),(61,(0,0,0))])
clip(head,'thinking','rotation_euler',[(1,(0,0,0)),(31,(.06,.05,0)),(61,(0,0,0))])
clip(left_arm,'wave','rotation_euler',[(1,(0,0,0)),(13,(0,-.20,0)),(25,(0,.12,0)),(37,(0,-.20,0)),(49,(0,0,0))])
clip(head,'error','rotation_euler',[(1,(0,0,0)),(21,(0,.045,0)),(41,(0,0,0))])

# Export only the mascot; lights and camera stay in the small review source.
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    obj.select_set(True)
bpy.context.scene.render.fps = 24
bpy.context.scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(EXPORT/'nexora-prototype.glb'), export_format='GLB',
    use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
    export_nla_strips=True, export_lights=False, export_cameras=False)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.world.color = (.35,.35,.35)
for name, pos, energy, size in [('Key',(-3,-5,7),650,5),('Fill',(4,-2,4),400,4),('Rim',(2,3,6),600,3)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0,0,2.2))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.8,-10,4.2))
camera = bpy.context.object
camera.rotation_euler = (Vector((0,0,2.2))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 5.1
scene.camera = camera
scene.view_settings.view_transform = 'AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'nexora-prototype.blend'))
scene.render.filepath = str(SOURCE/'prototype-preview.png')
bpy.ops.render.render(write_still=True)
print('NEXORA_EXPORT_COMPLETE', EXPORT/'nexora-prototype.glb')

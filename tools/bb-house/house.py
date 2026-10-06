# ══════════════════════════════════════════════════════════════════════
# tools/bb-house/house.py — the Big Brother house, built and rendered in Blender
# ══════════════════════════════════════════════════════════════════════
#
# The viewer's rooms (spec 2026-10-01 §4.7.1, mockup v2) are renders of one
# house: every room is modelled once, and a THEME swaps its materials, its
# light and its signature props, the way the real house is redressed every
# season. Run inside Blender 5.1 (the MCP bridge execs this file):
#
#   exec(open(r'<repo>/tools/bb-house/house.py').read()); build('kitchen', 'default'); render('kitchen', 'default')
#
# Output: assets/bb/house/<theme>/<room>.webp, 1920x1080, Cycles on the GPU.
#
# The camera is a TV camera: eye level, fixed, looking into the room, with
# open floor in the foreground where the viewer stands the houseguests.
import bpy, bmesh, math, os
from mathutils import Vector

REPO = r'C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db'
OUT = os.path.join(REPO, 'assets', 'bb', 'house')

def hexc(h, a=1.0):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    # sRGB -> linear, which is what the shader inputs expect
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)

# ══════════════════════════════════════════════════════════════════════
# THEMES. Every room reads its colours and materials from here.
# ══════════════════════════════════════════════════════════════════════
THEMES = {
    # The house as it is most seasons: a dark, saturated set with gloss and
    # gold, a supergraphic on the wall and LED in every edge.
    'default': {
        'name': 'The House',
        'wall': '#1d2536', 'wall2': '#283249', 'ceiling': '#14171e', 'accent': '#f0c040', 'accent2': '#2f7bff', 'pop': '#ff4f7a', 'deep': '#121a2c',
        'cabinet': '#f3f0ea', 'island': '#1c3f8f', 'counter': 'marble', 'splash': '#2f7bff',
        'floor_a': '#8f887e', 'floor_b': '#878076', 'floor_rough': 0.22,
        'wood_a': '#c08a58', 'wood_b': '#8a5a34', 'fabric': '#f0c040', 'fabric2': '#2b5fa8', 'metal': '#c8c8c8', 'handle': '#d4a64a',
        'light': '#ffd29a', 'fill': '#cfe0ff', 'world': '#0d1018', 'led': '#2f7bff', 'led2': '#f0c040',
        'graphic': ['#121a2c', '#2f7bff', '#f0c040', '#121a2c', '#ff4f7a'],
    },
}

# ══════════════════════════════════════════════════════════════════════
# TOTAL DRAMA LOOKS. Big Brother as if it were in the Total Drama world: the
# same rooms, drawn the way the show draws a set. Nearly flat colour, a hard
# shadow shape rather than a gradient, thin lines in a darker shade of each
# thing's own colour (never black), a dusty palette, nothing falls to black.
# Three takes on it; the user keeps one.
# ══════════════════════════════════════════════════════════════════════
TD_PALETTE = {
    'wall': '#566a8b', 'wall2': '#667b9c', 'ceiling': '#d2c4a4', 'accent': '#e2ab3a', 'accent2': '#3f7cc1', 'pop': '#d65a6c', 'deep': '#2f3d5c',
    'cabinet': '#efe4c9', 'island': '#3f5f98', 'splash': '#5a95c9', 'floor_a': '#c6a679', 'floor_b': '#bd9c6e', 'floor_rough': 0.6,
    'wood_a': '#b98552', 'wood_b': '#94653b', 'fabric': '#e2ab3a', 'metal': '#b9c1c9', 'handle': '#c99a45', 'floor_scale': 1.7, 'grout': '#9c8058',
    'light': '#fff0c8', 'fill': '#e8eefc', 'world': '#9fb1c9', 'led': '#8cc8ff', 'led2': '#ffd66b',
    'graphic': ['#2f3d5c', '#3f7cc1', '#e2ab3a', '#2f3d5c', '#d65a6c'],
}
TD_STAGE = {
    'wall': '#7c3340', 'wall2': '#8d4250', 'ceiling': '#4d252c', 'accent': '#e8a33d', 'accent2': '#3d8c84', 'pop': '#e0673f', 'deep': '#3b1f2b',
    'cabinet': '#ead7b4', 'island': '#2f6a66', 'splash': '#d98a4c', 'floor_a': '#d89b6b', 'floor_b': '#cd9061', 'floor_rough': 0.6,
    'wood_a': '#a9683b', 'wood_b': '#7e4a28', 'fabric': '#3d8c84', 'metal': '#c9bba4', 'handle': '#d6a24a', 'floor_scale': 1.7, 'grout': '#a8704a',
    'light': '#ffd28e', 'fill': '#ffe6cf', 'world': '#8a4c50', 'led': '#ffb45e', 'led2': '#ffd28e',
    'graphic': ['#3b1f2b', '#e8a33d', '#3d8c84', '#3b1f2b', '#e0673f'],
}
# Each season's house, in the Total Drama look: overrides on TD_PALETTE. `wallpaper` dresses every wall
# that a room does not paint itself; `sky` is the yard's.
THEME_TD = {
    'temptation': {   # BB19: the Den. Red velvet, gold, the garden's emerald, dark wood
        'wall': '#7a2b37', 'wall2': '#8e3a46', 'ceiling': '#4a2027', 'accent': '#d9a441', 'accent2': '#2f6b4f', 'pop': '#c43d4f', 'deep': '#3a1820',
        'cabinet': '#e8d3b0', 'island': '#7a2b37', 'splash': '#2f6b4f', 'floor_a': '#6a4433', 'floor_b': '#5e3b2c', 'grout': '#3d2018',
        'wood_a': '#8a5532', 'wood_b': '#6b3e22', 'fabric': '#c43d4f', 'fabric2': '#7a2b37', 'metal': '#d9a441', 'handle': '#d9a441',
        'light': '#ffcf8a', 'world': '#7a3a40', 'led': '#ff7a6e', 'led2': '#ffcf8a', 'sky': '#e9a07e',
        'graphic': ['#3a1820', '#c43d4f', '#d9a441', '#3a1820', '#2f6b4f'], 'wallpaper': ('stripes', '#7a2b37', '#6c2431'),
    },
    'machine': {      # BB26: the house an AI runs. White, teal light, a grid in every wall
        'wall': '#e6ecee', 'wall2': '#d4dde0', 'ceiling': '#f2f6f7', 'accent': '#3ad6c4', 'accent2': '#2a8fb8', 'pop': '#ff6b8a', 'deep': '#1d2b33',
        'cabinet': '#ffffff', 'island': '#1d2b33', 'splash': '#3ad6c4', 'floor_a': '#cfd8dc', 'floor_b': '#c6d0d4', 'grout': '#9fb0b6',
        'wood_a': '#b7c4c9', 'wood_b': '#9fb0b6', 'fabric': '#2a8fb8', 'fabric2': '#1d2b33', 'metal': '#c9d6db', 'handle': '#3ad6c4',
        'light': '#e6fffb', 'world': '#b9d6dc', 'led': '#3ad6c4', 'led2': '#7ef0e2', 'sky': '#bfe9ee',
        'graphic': ['#1d2b33', '#3ad6c4', '#e6ecee', '#1d2b33', '#2a8fb8'], 'wallpaper': ('grid', '#e6ecee', '#9fd9d2'),
    },
    'mystery': {      # BB27: a hotel with secrets. Green stripes, dark wood, brass
        'wall': '#2f5446', 'wall2': '#3b6656', 'ceiling': '#d8c9a3', 'accent': '#c9a24a', 'accent2': '#4fbf8b', 'pop': '#9c3b3b', 'deep': '#1f2f2a',
        'cabinet': '#5a3a26', 'island': '#2f5446', 'splash': '#e6dcc4', 'floor_a': '#5e3e2a', 'floor_b': '#563827', 'grout': '#3a2618',
        'wood_a': '#6e4a30', 'wood_b': '#4f321f', 'fabric': '#9c3b3b', 'fabric2': '#2f5446', 'metal': '#c9a24a', 'handle': '#c9a24a',
        'light': '#ffd99a', 'world': '#556b5e', 'led': '#ffd99a', 'led2': '#c9a24a', 'sky': '#8fb3a6',
        'graphic': ['#1f2f2a', '#2f5446', '#c9a24a', '#1f2f2a', '#9c3b3b'], 'wallpaper': ('stripes', '#2f5446', '#386152'),
    },
    'high-rollers': { # BB23's room, taken seriously: felt green, casino red, gold
        'wall': '#1f4a35', 'wall2': '#2a5a42', 'ceiling': '#2a1f22', 'accent': '#d4ad3c', 'accent2': '#b32a36', 'pop': '#e8463f', 'deep': '#1a1416',
        'cabinet': '#2a1f22', 'island': '#b32a36', 'splash': '#d4ad3c', 'floor_a': '#8a2230', 'floor_b': '#7a1d2a', 'grout': '#4a1018',
        'wood_a': '#5a3020', 'wood_b': '#40200f', 'fabric': '#b32a36', 'fabric2': '#1f4a35', 'metal': '#d4ad3c', 'handle': '#d4ad3c',
        'light': '#ffd57a', 'world': '#3a2a2a', 'led': '#ff4a5a', 'led2': '#ffd57a', 'sky': '#4a3a5a',
        'graphic': ['#1a1416', '#b32a36', '#d4ad3c', '#1a1416', '#1f4a35'], 'wallpaper': ('stripes', '#1f4a35', '#1b4230'),
    },
    'summer-camp': {  # BB21: a camp. Pine boards, plaid red, forest green, lantern light
        'wall': '#a8743f', 'wall2': '#b9834c', 'ceiling': '#8a5c30', 'accent': '#f2c14e', 'accent2': '#3f7d5a', 'pop': '#c8463c', 'deep': '#3a2a1c',
        'cabinet': '#7a5230', 'island': '#3f7d5a', 'splash': '#c8463c', 'floor_a': '#9a6a3a', 'floor_b': '#8f6034', 'grout': '#6a4424',
        'wood_a': '#b9834c', 'wood_b': '#8a5c30', 'fabric': '#c8463c', 'fabric2': '#3f7d5a', 'metal': '#9aa0a0', 'handle': '#3a2a1c',
        'light': '#ffcf7a', 'world': '#7a9a7a', 'led': '#ffcf7a', 'led2': '#f2c14e', 'sky': '#9bd0e8',
        'graphic': ['#3a2a1c', '#c8463c', '#f2c14e', '#3a2a1c', '#3f7d5a'], 'wallpaper': ('boards', '#a8743f', '#9a6936'),
    },
    'summer-school': {  # BB11: a high school. Cream halls, school blue, gold, red
        'wall': '#e8e2cf', 'wall2': '#d9d1b8', 'ceiling': '#f2eee2', 'accent': '#f2c14e', 'accent2': '#3b82c4', 'pop': '#d6453d', 'deep': '#24395c',
        'cabinet': '#ffffff', 'island': '#3b82c4', 'splash': '#7dd3fc', 'floor_a': '#e3dcc6', 'floor_b': '#cfc6ac', 'grout': '#b3aa90',
        'wood_a': '#c49a62', 'wood_b': '#a47a48', 'fabric': '#d6453d', 'fabric2': '#3b82c4', 'metal': '#9fb3c8', 'handle': '#24395c',
        'light': '#fff6dc', 'world': '#b8c8d8', 'led': '#7dd3fc', 'led2': '#f2c14e', 'sky': '#9fd4f2',
        'graphic': ['#24395c', '#3b82c4', '#f2c14e', '#24395c', '#d6453d'], 'wallpaper': ('band', '#e8e2cf', '#3b82c4'),
    },
}

TD_LOOKS = {
    # A: cel. Two soft bands under the fill, lines in each thing's own darker colour.
    'a': {'palette': TD_PALETTE, 'bands': [(0.0, (0.72, 0.7, 0.86)), (0.3, (0.88, 0.87, 0.95)), (0.7, (1, 1, 1))], 'ink': 'material', 'thick': 1.7},
    # B: flat. One colour per thing, darkened only where a shadow actually falls.
    'b': {'palette': TD_PALETTE, 'bands': [(0.0, (0.7, 0.68, 0.84)), (0.45, (1, 1, 1))], 'ink': 'material', 'thick': 1.5},
    # C: the stage. A warm theatrical palette, brown ink, cel bands.
    'c': {'palette': TD_STAGE, 'bands': [(0.0, (0.7, 0.62, 0.76)), (0.3, (0.88, 0.82, 0.88)), (0.7, (1, 1, 1))], 'ink': '#3a2420', 'thick': 2.0},
}

# ══════════════════════════════════════════════════════════════════════
# Scene helpers
# ══════════════════════════════════════════════════════════════════════
def clear():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.curves, bpy.data.node_groups):
        for d in list(coll):
            if d.users == 0:
                coll.remove(d)

_MATS = {}
def _bsdf(m):
    m.use_nodes = True
    nt = m.node_tree
    return nt, nt.nodes.get('Principled BSDF')

def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0, coat=0.0, alpha=1.0, transmission=0.0):
    key = (name,)
    if key in _MATS and _MATS[key].name in bpy.data.materials:
        return _MATS[key]
    m = bpy.data.materials.new(name)
    nt, p = _bsdf(m)
    if isinstance(color, str): m['tdcolor'] = color
    if emit: m['tdemit'] = emit
    p.inputs['Base Color'].default_value = hexc(color) if isinstance(color, str) else color
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if coat:
        p.inputs['Coat Weight'].default_value = coat
    if transmission:
        p.inputs['Transmission Weight'].default_value = transmission
    if emit:
        p.inputs['Emission Color'].default_value = hexc(emit)
        p.inputs['Emission Strength'].default_value = strength
    _MATS[key] = m
    return m

def _ramp(nt, stops):
    r = nt.nodes.new('ShaderNodeValToRGB')
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], hexc(stops[0][1])
    el[1].position, el[1].color = stops[-1][0], hexc(stops[-1][1])
    for pos, c in stops[1:-1]:
        e = el.new(pos); e.color = hexc(c)
    return r

def mat_wood(name, a, b, rough=0.45, scale=1.0, horizontal=True):
    m = bpy.data.materials.new(name); m['tdcolor'] = a; m['tdgrain'] = b
    nt, p = _bsdf(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1.2 * scale, 14 * scale, 1.2 * scale) if horizontal else (14 * scale, 1.2 * scale, 1.2 * scale)
    wv = nt.nodes.new('ShaderNodeTexWave')
    wv.inputs['Scale'].default_value = 2.0
    wv.inputs['Distortion'].default_value = 6.0
    wv.inputs['Detail'].default_value = 3.0
    ns = nt.nodes.new('ShaderNodeTexNoise')
    ns.inputs['Scale'].default_value = 40
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'FLOAT'
    mix.inputs['Factor'].default_value = 0.25
    r = _ramp(nt, [(0.0, b), (0.55, a), (1.0, a)])
    L = nt.links
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    L.new(mp.outputs['Vector'], wv.inputs['Vector'])
    L.new(mp.outputs['Vector'], ns.inputs['Vector'])
    L.new(wv.outputs['Fac'], mix.inputs['A'])
    L.new(ns.outputs['Fac'], mix.inputs['B'])
    L.new(mix.outputs['Result'], r.inputs['Fac'])
    L.new(r.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    return m

def mat_marble(name, base='#f4f2ee', vein='#9a948c', rough=0.18):
    m = bpy.data.materials.new(name); m['tdcolor'] = base; m['tdflat'] = 1
    nt, p = _bsdf(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ns = nt.nodes.new('ShaderNodeTexNoise')
    ns.inputs['Scale'].default_value = 1.6
    ns.inputs['Detail'].default_value = 12
    ns.inputs['Distortion'].default_value = 4.5
    r = _ramp(nt, [(0.0, base), (0.47, base), (0.5, vein), (0.53, base), (1.0, base)])
    nt.links.new(tc.outputs['Object'], ns.inputs['Vector'])
    nt.links.new(ns.outputs['Fac'], r.inputs['Fac'])
    nt.links.new(r.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = 0.3
    return m

def mat_planks(name, a, b, seam='#6b4a2e', scale=1.0, rough=0.5):
    """A plank floor: long boards, staggered, two tones, a thin seam."""
    m = bpy.data.materials.new(name); m['tdcolor'] = a
    nt, p = _bsdf(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.008
    br.inputs['Brick Width'].default_value = 1.6
    br.inputs['Row Height'].default_value = 0.22
    br.offset = 0.5
    br.inputs['Color1'].default_value = hexc(a)
    br.inputs['Color2'].default_value = hexc(b)
    br.inputs['Mortar'].default_value = hexc(seam)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    return m

def mat_tiles(name, a, b, grout='#8f887d', scale=1.2, rough=0.35):
    m = bpy.data.materials.new(name); m['tdcolor'] = a
    nt, p = _bsdf(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.006
    br.inputs['Brick Width'].default_value = 1.0
    br.inputs['Row Height'].default_value = 1.0
    br.offset = 0.0
    br.inputs['Color1'].default_value = hexc(a)
    br.inputs['Color2'].default_value = hexc(b)
    br.inputs['Mortar'].default_value = hexc(grout)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = 0.15
    return m

def _link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob

NOINK = ('Slat', 'Jar', 'Plate', 'Leaf', 'Bloom', 'Fruit', 'Mug', 'DoorLine', 'Handle', 'UHandle', 'Trim', 'Can', 'Cord', 'LED', 'Bulb', 'ShadeIn', 'Soil')

def box(name, size, loc, material=None, bevel=0.012, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me))
    ob.location = loc
    ob.rotation_euler = [math.radians(r) for r in rot]
    if material: me.materials.append(material)
    if bevel:
        mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = 3; mod.limit_method = 'ANGLE'
    return ob

def cyl(name, r, h, loc, material=None, verts=48, rot=(0, 0, 0), r2=None, bevel=0.004):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    ob = _link(bpy.data.objects.new(name, me))
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    if material: me.materials.append(material)
    if bevel:
        mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = 2; mod.limit_method = 'ANGLE'
    return ob

def sphere(name, r, loc, material=None, scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=r)
    bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    ob = _link(bpy.data.objects.new(name, me))
    ob.location = loc; ob.scale = scale
    if material: me.materials.append(material)
    return ob

def area(name, size, loc, power, color='#ffffff', rot=(0, 0, 0), shape='RECTANGLE'):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = shape
    if shape in ('RECTANGLE', 'ELLIPSE'):
        ld.size, ld.size_y = size
    else:
        ld.size = size[0]
    ld.energy = power
    ld.color = hexc(color)[:3]
    ob = _link(bpy.data.objects.new(name, ld))
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    return ob

def point(name, loc, power, color='#ffffff', radius=0.05):
    ld = bpy.data.lights.new(name, 'POINT')
    ld.energy = power; ld.color = hexc(color)[:3]; ld.shadow_soft_size = radius
    ob = _link(bpy.data.objects.new(name, ld))
    ob.location = loc
    return ob

def camera(loc, rot, lens=26, dof=None):
    cd = bpy.data.cameras.new('TVCam')
    cd.lens = lens
    if dof:
        cd.dof.use_dof = True; cd.dof.focus_distance = dof[0]; cd.dof.aperture_fstop = dof[1]
    ob = _link(bpy.data.objects.new('TVCam', cd))
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.scene.camera = ob
    return ob

def world(color, strength=0.4):
    w = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = hexc(color)
    bg.inputs['Strength'].default_value = strength

# ══════════════════════════════════════════════════════════════════════
# Shared architecture and dressing
# ══════════════════════════════════════════════════════════════════════
def mat_graphic(name, colors, scale=0.35, angle=35, rough=0.6):
    """A supergraphic: bold diagonal bands of the theme's colours, hard-edged."""
    m = bpy.data.materials.new(name); m['tdcolor'] = colors[1]
    nt, p = _bsdf(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (math.radians(90), math.radians(angle), 0)
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    gr = nt.nodes.new('ShaderNodeTexGradient')
    mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'FRACT'
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
    el = r.color_ramp.elements
    n = len(colors)
    el[0].position, el[0].color = 0.0, hexc(colors[0])
    el[1].position, el[1].color = 1.0 / n, hexc(colors[1])
    for i, c in enumerate(colors[2:], start=2):
        e = el.new(i / n); e.color = hexc(c)
    L = nt.links
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    L.new(mp.outputs['Vector'], gr.inputs['Vector'])
    L.new(gr.outputs['Fac'], mth.inputs[0])
    L.new(mth.outputs['Value'], r.inputs['Fac'])
    L.new(r.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    return m

def _wallvec(nt):
    """(along the wall, up the wall): x + y runs along a back wall and a side wall alike."""
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    L = nt.links
    L.new(tc.outputs['Object'], sep.inputs[0])
    L.new(sep.outputs['X'], add.inputs[0]); L.new(sep.outputs['Y'], add.inputs[1])
    L.new(add.outputs[0], comb.inputs['X']); L.new(sep.outputs['Z'], comb.inputs['Y'])
    return comb.outputs[0]

def mat_wallpaper(name, kind, a, b):
    m = bpy.data.materials.new(name); m['tdcolor'] = a
    nt, p = _bsdf(m)
    v = _wallvec(nt)
    L = nt.links
    if kind in ('boards', 'grid'):
        br = nt.nodes.new('ShaderNodeTexBrick')
        br.inputs['Color1'].default_value = hexc(a); br.inputs['Color2'].default_value = hexc(a)
        br.inputs['Mortar'].default_value = hexc(b)
        if kind == 'boards':      # vertical pine boards
            sw = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ')
            L.new(v, sw.inputs[0]); L.new(sw.outputs['Y'], cb.inputs['X']); L.new(sw.outputs['X'], cb.inputs['Y'])
            v = cb.outputs[0]
            br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = 3.0; br.inputs['Row Height'].default_value = 0.18
            br.inputs['Mortar Size'].default_value = 0.006; br.offset = 0.0
        else:                     # a panel grid
            br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = 0.8; br.inputs['Row Height'].default_value = 0.8
            br.inputs['Mortar Size'].default_value = 0.008; br.offset = 0.0
        L.new(v, br.inputs['Vector']); L.new(br.outputs['Color'], p.inputs['Base Color'])
    else:
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(v, sep.inputs[0])
        r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
        if kind == 'stripes':     # wide vertical stripes
            mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 3.2
            fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'
            L.new(sep.outputs['X'], mul.inputs[0]); L.new(mul.outputs[0], fr.inputs[0]); L.new(fr.outputs[0], r.inputs['Fac'])
            r.color_ramp.elements[0].color = hexc(a); r.color_ramp.elements[1].position = 0.5; r.color_ramp.elements[1].color = hexc(b)
        else:                     # 'band': a painted stripe at waist height, the way a school corridor is painted
            L.new(sep.outputs['Y'], r.inputs['Fac'])
            r.color_ramp.elements[0].color = hexc(b); r.color_ramp.elements[1].position = 0.32; r.color_ramp.elements[1].color = hexc(a)
            e = r.color_ramp.elements.new(0.27); e.color = hexc('#ffffff')
        L.new(r.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.8
    return m

SPOTS = []
def spot(kind, loc, rot_z=0, size=1.0):
    """A place a season can dress: 'wall' (a feature hung facing rot_z) or 'floor' (a free-standing prop)."""
    SPOTS.append({'kind': kind, 'loc': loc, 'rot': rot_z, 'size': size})

def shell(T, W=9.0, D=7.0, H=3.2, floor_mat=None, wall_mat=None, roof=True):
    wp = T.get('wallpaper')
    wall = wall_mat or (mat_wallpaper('wall', *wp) if wp else mat('wall', T['wall'], 0.8))
    fl = floor_mat or mat_tiles('floor', T['floor_a'], T['floor_b'], grout=T.get('grout', '#5e584f'), scale=T.get('floor_scale', 0.75), rough=T['floor_rough'])
    box('Floor', (W + 6, D + 6, 0.1), (0, D / 2 - 1, -0.05), fl, bevel=0)
    box('BackWall', (W, 0.2, H), (0, D + 0.1, H / 2), wall, bevel=0)
    box('LeftWall', (0.2, D + 6, H), (-W / 2 - 0.1, D / 2 - 1, H / 2), wall, bevel=0)
    box('RightWall', (0.2, D + 6, H), (W / 2 + 0.1, D / 2 - 1, H / 2), wall, bevel=0)
    if roof:
        box('Ceiling', (W + 2, D + 6, 0.1), (0, D / 2 - 1, H + 0.05), mat('ceiling', T['ceiling'], 0.9), bevel=0)
        box('Cove', (W - 0.2, 0.06, 0.04), (0, D - 0.05, H - 0.1), mat('cove', '#ffffff', emit=T['light'], strength=14), bevel=0)
    box('Skirt', (W, 0.03, 0.08), (0, D - 0.015, 0.04), mat('skirt', T['deep'], 0.5), bevel=0.003)

def downlights(T, xs, ys, H, power=55, cone=70):
    """Recessed ceiling cans: a lit disc and a real spot below each."""
    disc = mat('can', '#ffffff', emit=T['light'], strength=40)
    trim = mat('cantrim', '#2a2d33', 0.4, 0.6)
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            cyl(f'Trim{i}{j}', 0.08, 0.01, (x, y, H - 0.004), trim, bevel=0)
            cyl(f'Can{i}{j}', 0.055, 0.012, (x, y, H - 0.008), disc, bevel=0)
            ld = bpy.data.lights.new(f'Spot{i}{j}', 'SPOT')
            ld.energy = power; ld.color = hexc(T['light'])[:3]; ld.spot_size = math.radians(cone); ld.spot_blend = 0.6; ld.shadow_soft_size = 0.06
            ob = _link(bpy.data.objects.new(f'Spot{i}{j}', ld)); ob.location = (x, y, H - 0.03)

def plant(name, loc, height=1.4, pot='#e9e4dc', leaf='#356b34', spread=0.45):
    """A potted fiddle-leaf: a pot, a stem, leaves fanned up and out."""
    x, y, z = loc
    cyl(f'{name}Pot', 0.2, 0.42, (x, y, z + 0.21), mat(f'{name}pot', pot, 0.35, coat=0.4), r2=0.16)
    cyl(f'{name}Soil', 0.185, 0.02, (x, y, z + 0.41), mat('soil', '#2b1f17', 0.9), bevel=0)
    cyl(f'{name}Stem', 0.018, height * 0.8, (x, y, z + 0.42 + height * 0.4), mat('stem', '#4a3a28', 0.7), bevel=0)
    lm = mat(f'{name}leaf', leaf, 0.45, coat=0.3)
    lm2 = mat(f'{name}leaf2', '#4f8a3f', 0.45, coat=0.3)
    k = 0
    for tier in range(6):
        zt = z + 0.55 + tier * height * 0.14
        for a in range(4):
            ang = a * math.tau / 4 + tier * 0.7
            r = spread * (0.45 + 0.1 * (tier % 3))
            ob = sphere(f'{name}Leaf{k}', 0.13, (x + r * 0.55 * math.cos(ang), y + r * 0.55 * math.sin(ang), zt), lm if k % 3 else lm2, scale=(1.0, 0.18, 1.45))
            ob.rotation_euler = (math.radians(30 * math.sin(ang)), math.radians(35 * math.cos(ang)), ang + math.pi / 2)
            k += 1

def two_way_mirrors(T, x, ys, z0=0.55, h=2.0, w=1.1):
    """The walls are full of mirrors the cameras look through: dark glass, thin frames."""
    glass = mat('mirror', '#06080b', rough=0.03, metal=1.0)
    frame = mat('mirror_frame', '#0e1118', 0.4, 0.5)
    sgn = -1 if x < 0 else 1
    streak = mat('streak', '#8fa3c4', 0.2)
    for i, y in enumerate(ys):
        box(f'MirrorFrame{i}', (0.03, w + 0.08, h + 0.08), (x - 0.01 * sgn, y, z0 + h / 2), frame, bevel=0.004)
        box(f'Mirror{i}', (0.02, w, h), (x - 0.025 * sgn, y, z0 + h / 2), glass, bevel=0)
        for k, (dy, wd) in enumerate(((-0.15, 0.14), (0.12, 0.06)) if T.get('grout') else ()):
            box(f'Streak{i}{k}', (0.004, wd, h * 0.8), (x - 0.037 * sgn, y + dy, z0 + h / 2), streak, bevel=0, rot=(28, 0, 0))

def neon_eye(loc, scale=1.0, rot=(90, 0, 0), color='#ffffff', glow='#3fe0e6'):
    """The eye, as a neon sign: an almond tube, an iris ring, a lit pupil."""
    def tube(name, pts, cyclic, depth, m):
        cv = bpy.data.curves.new(name, 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = depth; cv.bevel_resolution = 4
        sp = cv.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1); sp.use_cyclic_u = cyclic
        for bp, (co, hl, hr) in zip(sp.bezier_points, pts):
            bp.co, bp.handle_left, bp.handle_right = co, hl, hr
        ob = _link(bpy.data.objects.new(name, cv)); ob.data.materials.append(m)
        return ob
    s = scale
    ring = mat('neon_white', color, emit=color, strength=12)
    glowm = mat('neon_glow', glow, emit=glow, strength=16)
    outline = tube('EyeNeon', [((-0.6 * s, 0, 0), (-0.6 * s, -0.12 * s, 0), (-0.6 * s, 0.12 * s, 0)),
                               ((0, 0.34 * s, 0), (-0.32 * s, 0.34 * s, 0), (0.32 * s, 0.34 * s, 0)),
                               ((0.6 * s, 0, 0), (0.6 * s, 0.12 * s, 0), (0.6 * s, -0.12 * s, 0)),
                               ((0, -0.34 * s, 0), (0.32 * s, -0.34 * s, 0), (-0.32 * s, -0.34 * s, 0))], True, 0.016 * s, ring)
    k = 0.5523 * 0.2 * s
    r = 0.2 * s
    iris = tube('IrisNeon', [((r, 0, 0), (r, -k, 0), (r, k, 0)), ((0, r, 0), (k, r, 0), (-k, r, 0)),
                             ((-r, 0, 0), (-r, k, 0), (-r, -k, 0)), ((0, -r, 0), (-k, -r, 0), (k, -r, 0))], True, 0.014 * s, glowm)
    pupil = cyl('PupilNeon', 0.07 * s, 0.01, (0, 0, 0), glowm, bevel=0)
    plate = box('NeonPlate', (1.4 * s, 0.86 * s, 0.012), (0, 0, -0.03), mat('acrylic', '#0b0e14', 0.15, coat=1.0), bevel=0.01)
    root = _link(bpy.data.objects.new('NeonEye', None))
    for o in (outline, iris, pupil, plate): o.parent = root
    root.location = loc; root.rotation_euler = [math.radians(a) for a in rot]
    point('NeonGlow', (loc[0] + 0.3, loc[1], loc[2]), 25, glow, 0.3)
    return root

# ══════════════════════════════════════════════════════════════════════
# ROOMS
# ══════════════════════════════════════════════════════════════════════
def room_kitchen(T):
    W, D, H = 9.0, 7.0, 3.1
    shell(T, W, D, H)
    cab = mat('cabinet', T['cabinet'], 0.18, coat=0.6)
    island = mat('island', T['island'], 0.22, coat=0.5)
    top = mat_marble('counter') if T['counter'] == 'marble' else mat('counter', T['counter'], 0.3)
    metal = mat('steel', T['metal'], 0.22, 1.0)
    handle = mat('handle', T['handle'], 0.25, 1.0)
    wood = mat_wood('wood', T['wood_a'], T['wood_b'])
    gap = mat('gap', '#07080a', 0.9)

    # the left wall is the house's supergraphic, and the cameras' mirrors are cut into it
    box('Graphic', (0.02, D + 2, H), (-W / 2 + 0.01, D / 2 - 0.5, H / 2), mat_graphic('graphic', T['graphic'], scale=0.32), bevel=0)
    two_way_mirrors(T, -W / 2 + 0.03, (2.0, 4.6), z0=0.6, h=1.9, w=1.4)

    # back run: gloss lowers, marble, a blue tile splash, open lit shelving, the hood
    y = D - 0.32
    box('LowerRun', (6.6, 0.6, 0.86), (0.3, y, 0.45), cab)
    box('Toekick', (6.6, 0.56, 0.09), (0.3, y + 0.02, 0.045), gap, bevel=0)
    box('ToeLED', (6.6, 0.01, 0.01), (0.3, y - 0.27, 0.02), mat('led2', '#ffffff', emit=T['led'], strength=30), bevel=0)
    box('BackTop', (6.64, 0.64, 0.04), (0.3, y, 0.9), top, bevel=0.006)
    for i in range(7):
        x = -2.7 + i * 0.95
        box(f'DoorLine{i}', (0.006, 0.005, 0.76), (x + 0.475, y - 0.302, 0.47), gap, bevel=0)
        box(f'Handle{i}', (0.36, 0.02, 0.014), (x, y - 0.31, 0.8), handle, bevel=0.004)
    box('Splash', (6.6, 0.02, 0.66), (0.3, D - 0.01, 1.25), mat_tiles('splash', T['splash'], T['splash'], grout='#e9e6e0', scale=9.0, rough=0.08), bevel=0)
    for side, x0 in (('L', -1.85), ('R', 2.35)):
        for k, z in enumerate((1.78, 2.25)):
            box(f'Shelf{side}{k}', (1.9, 0.3, 0.045), (x0, D - 0.15, z), wood, bevel=0.006)
            box(f'ShelfLED{side}{k}', (1.86, 0.01, 0.006), (x0, D - 0.04, z - 0.026), mat('ledw', '#ffffff', emit=T['light'], strength=20), bevel=0)
    cols = [T['accent'], '#ffffff', T['accent2'], '#e8dccb', T['pop'], T['deep']]
    for side, x0 in (('L', -1.85), ('R', 2.35)):
        for k, z in enumerate((1.78, 2.25)):
            for j in range(6):
                c = cols[(j + k + (side == 'R')) % len(cols)]
                if (j + k) % 3 == 2:
                    for q in range(3):
                        box(f'Plate{side}{k}{j}{q}', (0.24, 0.24, 0.012), (x0 - 0.8 + j * 0.32, D - 0.15, z + 0.03 + q * 0.016), mat(f'plate{c}', c, 0.2, coat=0.6), bevel=0.004)
                else:
                    cyl(f'Jar{side}{k}{j}', 0.055 + 0.01 * (j % 2), 0.16 + 0.05 * ((j + k) % 2), (x0 - 0.8 + j * 0.32, D - 0.15, z + 0.11 + 0.025 * ((j + k) % 2)), mat(f'jar{c}', c, 0.2, coat=0.5))
    # slatted oak across the back wall above the splash, grazed by light from the cove
    slat = mat_wood('slat', T['wood_a'], T['wood_b'], rough=0.55, horizontal=False)
    for i in range(60):
        box(f'Slat{i}', (0.07, 0.04, H - 1.58), (-4.45 + i * 0.15, D - 0.02, 1.58 + (H - 1.58) / 2), slat, bevel=0.004)
    neon_eye((0.3, D - 0.08, 2.5), 0.62, rot=(90, 0, 0))
    box('Cooktop', (0.8, 0.5, 0.012), (0.3, y, 0.925), mat('glasstop', '#0a0a0c', 0.06, 0.2), bevel=0.003)
    box('TallUnit', (1.4, 0.72, H - 0.02), (4.0, D - 0.37, (H - 0.02) / 2), island)
    box('Fridge', (1.0, 0.05, 2.2), (4.0, D - 0.75, 1.15), metal)
    box('FridgeGap', (0.008, 0.01, 2.15), (4.0, D - 0.78, 1.15), gap, bevel=0)
    for dx in (-0.06, 0.06):
        box(f'FridgeHandle{dx}', (0.02, 0.05, 0.9), (4.0 + dx, D - 0.8, 1.2), handle, bevel=0.004)

    # the coffee corner: the machine, the empty pot, the mugs
    box('CoffeeMachine', (0.34, 0.38, 0.44), (-2.55, D - 0.36, 1.14), mat('coffeeblack', '#151515', 0.3, 0.4))
    cyl('CoffeePot', 0.075, 0.16, (-2.55, D - 0.5, 1.0), mat('potglass', '#ddeeff', 0.03, transmission=1.0))
    for i in range(4):
        cyl(f'Mug{i}', 0.042, 0.095, (-2.05 + i * 0.13, D - 0.42, 0.97), mat(f'mug{i}', cols[i], 0.25, coat=0.6))
    box('Board', (0.45, 0.02, 0.32), (1.55, D - 0.08, 1.08), wood, rot=(-8, 0, 0))
    plant('ShelfPlant', (3.05, D - 0.35, 0.92), height=0.5, pot='#ffffff', spread=0.25)

    # the island: deep blue gloss, waterfall marble, LED under the overhang, five stools
    box('IslandBase', (3.4, 0.95, 0.88), (0, 3.9, 0.44), island)
    box('IslandTop', (3.7, 1.2, 0.05), (0, 3.9, 0.915), top, bevel=0.008)
    for x in (-1.825, 1.825):
        box(f'Waterfall{x}', (0.05, 1.2, 0.94), (x, 3.9, 0.47), top, bevel=0.008)
    box('IslandLED', (3.3, 0.01, 0.01), (0, 3.39, 0.86), mat('ledacc', '#ffffff', emit=T['led2'], strength=40), bevel=0)
    stool = mat('stool', T['fabric'], 0.5)
    leg = mat('stoolleg', '#16181c', 0.3, 0.9)
    for i, x in enumerate((-1.3, -0.65, 0.0, 0.65, 1.3)):
        cyl(f'Seat{i}', 0.2, 0.09, (x, 3.02, 0.69), stool, r2=0.19)
        box(f'Back{i}', (0.34, 0.05, 0.2), (x, 2.85, 0.86), stool, bevel=0.022, rot=(-10, 0, 0))
        cyl(f'Post{i}', 0.02, 0.62, (x, 3.02, 0.33), leg)
        cyl(f'Base{i}', 0.17, 0.02, (x, 3.02, 0.012), leg)
        cyl(f'Ring{i}', 0.14, 0.012, (x, 3.02, 0.26), leg)
    cyl('Bowl', 0.2, 0.08, (-0.75, 3.95, 0.98), mat('bowl', '#ffffff', 0.15, coat=0.7), r2=0.13)
    for i, (dx, dy, c) in enumerate([(0, 0, '#f2b134'), (0.09, 0.05, '#e5532d'), (-0.08, 0.06, '#9ccc3c'), (0.04, -0.08, '#f2b134'), (-0.05, -0.06, '#e5532d')]):
        sphere(f'Fruit{i}', 0.055, (-0.75 + dx, 3.95 + dy, 1.06 + 0.02 * (i % 2)), mat(f'fruit{c}', c, 0.35, coat=0.6))
    cyl('Vase', 0.07, 0.32, (0.9, 3.95, 1.1), mat('vase', '#ffffff', 0.15, coat=0.7))
    for i in range(9):
        a = i / 9 * math.tau
        sphere(f'Bloom{i}', 0.05, (0.9 + 0.07 * math.cos(a), 3.95 + 0.07 * math.sin(a), 1.4 + 0.06 * (i % 3)), mat(f'bloom{i % 3}', [T['pop'], '#ffffff', T['accent']][i % 3], 0.5))

    # three pendants: brass domes, warm
    shade = mat('shade', T['handle'], 0.25, 1.0)
    inner = mat('shadein', '#fff3dc', emit=T['light'], strength=6)
    bulb = mat('bulb', '#ffffff', emit=T['light'], strength=35)
    for i, x in enumerate((-1.15, 0, 1.15)):
        cyl(f'Cord{i}', 0.004, 1.15, (x, 3.9, H - 0.575), mat('cord', '#111111', 0.6), bevel=0)
        sphere(f'Shade{i}', 0.22, (x, 3.9, H - 1.18), shade, scale=(1, 1, 0.55))
        cyl(f'ShadeIn{i}', 0.2, 0.01, (x, 3.9, H - 1.2), inner, bevel=0)
        sphere(f'Bulb{i}', 0.05, (x, 3.9, H - 1.25), bulb)
        point(f'PendantL{i}', (x, 3.9, H - 1.32), 85, T['light'], 0.05)

    # right wall: a lit doorway to the hall, and a tall plant
    box('DoorFrame', (0.08, 1.5, 2.4), (W / 2 - 0.02, 2.4, 1.2), mat('doorframe', T['deep'], 0.4), bevel=0.004)
    box('DoorHall', (0.04, 1.34, 2.3), (W / 2 + 0.03, 2.4, 1.15), mat('hall', '#ffffff', emit=T['accent2'], strength=1.2), bevel=0)
    plant('Fig', (W / 2 - 0.55, 4.6, 0), height=1.7, pot=T['deep'])

    spot('wall', (W / 2 - 0.03, 3.7, 1.8), -90, 0.8)
    spot('floor', (-3.55, 3.3, 0))
    downlights(T, (-3.0, -1.0, 1.0, 3.0), (1.6, 5.4), H, power=45)
    area('CeilSoft', (6, 3), (0, 3.6, H - 0.05), 90, T['light'])
    area('Fill', (5, 2), (0, -2.0, 2.0), 150, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    area('SlatWash', (8.5, 0.25), (0, D - 0.45, H - 0.08), 260, T['light'], rot=(28, 0, 0))
    camera((0, -1.4, 1.42), (87, 0, 0), lens=22, dof=(5.3, 4.0))


# ── furniture shared by every room ─────────────────────────────────────
def _group(name, loc, rot_z=0):
    root = _link(bpy.data.objects.new(name, None))
    root.location = loc; root.rotation_euler = (0, 0, math.radians(rot_z))
    return root

def _child(root, ob):
    ob.parent = root
    return ob

def sofa(name, loc, length, rot_z, fabric, pillows=(), depth=0.95, legs='#2a2a2e'):
    """A low modern sofa: plinth, back, arms, seat cushions, a few throw pillows."""
    g = _group(name, loc, rot_z)
    fm = mat(f'{name}fab', fabric, 0.75)
    _child(g, box(f'{name}Base', (length, depth, 0.24), (0, 0, 0.2), fm, bevel=0.03))
    _child(g, box(f'{name}Back', (length, 0.24, 0.5), (0, depth / 2 - 0.12, 0.55), fm, bevel=0.06))
    for sx in (-1, 1):
        _child(g, box(f'{name}Arm{sx}', (0.22, depth, 0.36), (sx * (length / 2 - 0.11), 0, 0.46), fm, bevel=0.05))
    n = max(1, int((length - 0.44) // 0.8))
    cw = (length - 0.44) / n
    for i in range(n):
        _child(g, box(f'{name}Seat{i}', (cw - 0.02, depth - 0.3, 0.16), (-length / 2 + 0.22 + cw * (i + 0.5), -0.12, 0.4), fm, bevel=0.05))
    for i, c in enumerate(pillows):
        x = -length / 2 + 0.45 + i * (length - 0.9) / max(1, len(pillows) - 1)
        ob = _child(g, box(f'{name}Pillow{i}', (0.42, 0.14, 0.4), (x, depth / 2 - 0.32, 0.66), mat(f'pillow{c}', c, 0.8), bevel=0.06))
        ob.rotation_euler = (math.radians(-12), 0, math.radians(8 * (1 if i % 2 else -1)))
    lm = mat('sofaleg', legs, 0.4, 0.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, cyl(f'{name}Leg{sx}{sy}', 0.025, 0.08, (sx * (length / 2 - 0.12), sy * (depth / 2 - 0.12), 0.04), lm))
    return g

def armchair(name, loc, rot_z, fabric, legs='#2a2a2e'):
    g = _group(name, loc, rot_z)
    fm = mat(f'{name}fab', fabric, 0.7)
    _child(g, box(f'{name}Seat', (0.8, 0.78, 0.2), (0, 0, 0.42), fm, bevel=0.05))
    _child(g, box(f'{name}Back', (0.8, 0.18, 0.62), (0, 0.33, 0.78), fm, bevel=0.07))
    for sx in (-1, 1):
        _child(g, box(f'{name}Arm{sx}', (0.14, 0.72, 0.28), (sx * 0.38, 0.02, 0.62), fm, bevel=0.05))
    lm = mat('chairleg', legs, 0.4, 0.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, cyl(f'{name}Leg{sx}{sy}', 0.022, 0.32, (sx * 0.32, sy * 0.3, 0.16), lm))
    return g

def floor_lamp(name, loc, T, shade='#f3ead6'):
    x, y, z = loc
    pm = mat('lamppole', '#2a2a2e', 0.35, 0.8)
    cyl(f'{name}Base', 0.16, 0.03, (x, y, 0.015), pm)
    cyl(f'{name}Pole', 0.015, 1.5, (x, y, 0.78), pm)
    cyl(f'{name}Shade', 0.2, 0.32, (x, y, 1.62), mat(f'{name}shade', shade, 0.6), r2=0.15)
    sphere(f'Bulb{name}', 0.05, (x, y, 1.55), mat('bulb', '#ffffff', emit=T['light'], strength=30))
    point(f'{name}L', (x, y, 1.55), 40, T['light'], 0.08)

def mat_damask(name, a, b, scale=6.0):
    """Damask-style wallpaper: a diamond trellis in two tones, the memory wall's backing."""
    m = bpy.data.materials.new(name); m['tdcolor'] = a
    nt, p = _bsdf(m)
    v = _wallvec(nt)
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(45))
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = scale
    br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.035; br.offset = 0.0
    br.inputs['Color1'].default_value = hexc(a); br.inputs['Color2'].default_value = hexc(a)
    br.inputs['Mortar'].default_value = hexc(b)
    nt.links.new(v, mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.85
    return m

MEM_PANEL_W, MEM_PANEL_H, MEM_GAP = 1.35, 2.15, 0.3

def memory_wall(T, cx, y, z0):
    """The memory wall (BB US): two tall wallpapered panels, each trimmed in gold; the viewer hangs a
    framed portrait for every houseguest, staggered in two columns per panel, so the wall always holds
    exactly the season's cast. Painted here: the panels, the trim, and the plaque under them."""
    paper = mat_damask('memdamask', _darker(T['pop'], 0.5), _darker(T['pop'], 0.68))
    gold = mat('memgold', T['accent'], 0.3, 1.0)
    for i, sx in enumerate((-1, 1)):
        x = cx + sx * (MEM_PANEL_W + MEM_GAP) / 2
        box(f'MemPanel{i}', (MEM_PANEL_W, 0.04, MEM_PANEL_H), (x, y - 0.02, z0 + MEM_PANEL_H / 2), paper, bevel=0)
        for (w_, h_, dx, dz) in ((MEM_PANEL_W + 0.1, 0.05, 0, MEM_PANEL_H / 2 + 0.025), (MEM_PANEL_W + 0.1, 0.05, 0, -MEM_PANEL_H / 2 - 0.025),
                                 (0.05, MEM_PANEL_H, -MEM_PANEL_W / 2 - 0.025, 0), (0.05, MEM_PANEL_H, MEM_PANEL_W / 2 + 0.025, 0)):
            box(f'MemTrim{i}{dx}{dz}', (w_, 0.06, h_), (x + dx, y - 0.03, z0 + MEM_PANEL_H / 2 + dz), gold, bevel=0)
        cyl(f'MemLamp{i}', 0.05, 0.12, (x, y - 0.12, z0 + MEM_PANEL_H + 0.12), gold, rot=(90, 0, 0))
        area(f'MemWash{i}', (MEM_PANEL_W, 0.2), (x, y - 0.5, z0 + MEM_PANEL_H + 0.25), 70, T['light'], rot=(40, 0, 0))

def ring_light(name, loc, r, T):
    """A ring chandelier: a lit torus on three cables."""
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.035, location=loc)
    ob = bpy.context.active_object; ob.name = name
    ob.data.materials.append(mat('ringlight', '#ffffff', emit=T['light'], strength=22))
    for i in range(3):
        a = i * math.tau / 3
        cyl(f'{name}Cable{i}', 0.003, 0.9, (loc[0] + r * math.cos(a), loc[1] + r * math.sin(a), loc[2] + 0.45), mat('cord', '#111111', 0.6), bevel=0)
    point(f'{name}L', loc, 220, T['light'], 0.6)
    return ob

def room_living(T):
    """The living room on a live night (BB27): two long sofas facing each other down the sides, the
    nominees' two chairs at the back under the memory wall, the coffee table between, stools at the front."""
    W, D, H = 10.0, 7.5, 3.2
    shell(T, W, D, H, floor_mat=mat_planks('planks', T['wood_a'], T['wood_b'], seam=T['wood_b'], scale=0.9, rough=T['floor_rough']))
    box('Graphic', (0.02, D + 2, H), (-W / 2 + 0.01, D / 2 - 0.5, H / 2), mat_graphic('graphic', T['graphic'], scale=0.3, angle=-35), bevel=0)
    two_way_mirrors(T, -W / 2 + 0.03, (2.0, 5.2), z0=0.6, h=1.9, w=1.5)
    memory_wall(T, 0, D - 0.06, 0.95)
    # the nominees' chairs, side by side at the back, facing the room
    for sx in (-1, 1):
        armchair(f'NomChair{sx}', (sx * 0.6, LIVING_NOM_Y, 0), 0, T['pop'])
    # the two long sofas, facing each other (a sofa faces its local -y; +90 turns it to face +x)
    sofa('LeftSofa', (-LIVING_SOFA_X, LIVING_SOFA_Y, 0), LIVING_SOFA_L, 90, T['fabric2'], pillows=(T['accent'], '#ffffff', T['pop'], T['accent']))
    sofa('RightSofa', (LIVING_SOFA_X, LIVING_SOFA_Y, 0), LIVING_SOFA_L, -90, T['fabric2'], pillows=(T['pop'], T['accent'], '#ffffff', T['pop']))
    box('Rug', (4.0, 4.2, 0.012), (0, LIVING_SOFA_Y, 0.006), mat('rug', T['accent'], 0.95), bevel=0)
    box('RugField', (3.6, 3.8, 0.014), (0, LIVING_SOFA_Y, 0.008), mat('rugfield', T['deep'], 0.95), bevel=0)
    wood = mat_wood('tablewood', T['wood_a'], T['wood_b'])
    box('CoffeeTop', (1.0, 2.2, 0.06), (0, LIVING_SOFA_Y, 0.42), wood, bevel=0.01)
    for sy in (-1, 1):
        box(f'CoffeeLeg{sy}', (0.8, 0.08, 0.38), (0, LIVING_SOFA_Y + sy * 0.9, 0.19), mat('tablebase', T['deep'], 0.4), bevel=0)
    for i, (dy, c) in enumerate(((-0.4, T['accent']), (0.1, '#ffffff'), (0.5, T['pop']))):
        box(f'Book{i}', (0.3, 0.22, 0.04), (0.1, LIVING_SOFA_Y + dy, 0.47), mat(f'book{c}', c, 0.6), bevel=0.004)
    cyl('Candle', 0.06, 0.14, (-0.25, LIVING_SOFA_Y - 0.2, 0.52), mat('candle', '#ffffff', 0.5))
    # two stools at the front corners of the rug
    for sx in (-1, 1):
        cyl(f'Stool{sx}', 0.24, 0.42, (sx * 1.65, 1.35, 0.21), mat('stool', T['accent'], 0.7))
    floor_lamp('LampL', (-4.3, D - 0.6, 0), T)
    floor_lamp('LampR', (4.3, D - 0.6, 0), T)
    plant('PlantL', (-4.2, 1.2, 0), height=1.5, pot=T['deep'])
    box('SlideFrame', (0.1, 2.4, 2.5), (W / 2 - 0.02, 1.9, 1.25), mat('slideframe', '#2a2d33', 0.4, 0.6), bevel=0.004)
    box('SlideGlass', (0.04, 2.2, 2.35), (W / 2 + 0.01, 1.9, 1.2), mat('daylight', '#ffffff', emit='#cfe9ff', strength=2.5), bevel=0)
    neon_eye((W / 2 - 0.05, 5.6, 2.35), 0.5, rot=(90, 0, -90))
    ring_light('Ring', (0, LIVING_SOFA_Y, H - 0.45), 0.85, T)
    spot('wall', (3.75, D - 0.03, 1.9), 0, 0.9)
    spot('wall', (-3.75, D - 0.03, 1.9), 0, 0.9)
    spot('floor', (4.2, 6.2, 0))
    downlights(T, (-3.4, 3.4), (2.0, 6.2), H, power=40)
    area('CeilSoft', (6, 3), (0, 4.0, H - 0.05), 80, T['light'])
    area('Fill', (5, 2), (0, -2.0, 2.0), 150, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    camera((0, -1.5, 1.6), (85.5, 0, 0), lens=22, dof=(6.0, 4.0))

LIVING_NOM_Y = 5.9
LIVING_SOFA_X, LIVING_SOFA_Y, LIVING_SOFA_L = 2.75, 3.6, 3.8

def bed(name, loc, T, width=1.1, length=2.0, headboard='#3f7cc1', duvet='#efe4c9', throw=None, pillows=('#ffffff', '#ffffff'), hb_h=1.4, tufts=True):
    """A bed with its head against the back wall: frame, mattress, duvet, pillows, a throw, an upholstered headboard."""
    x, y, z = loc
    frame = mat('bedframe', T['deep'], 0.5)
    box(f'{name}Frame', (width + 0.1, length + 0.05, 0.3), (x, y - length / 2, 0.15), frame)
    box(f'{name}Mattress', (width, length, 0.22), (x, y - length / 2, 0.41), mat('mattress', '#f4f1ea', 0.8), bevel=0.04)
    box(f'{name}Duvet', (width + 0.06, length * 0.72, 0.1), (x, y - length * 0.62, 0.55), mat(f'duvet{duvet}', duvet, 0.85), bevel=0.04)
    if throw:
        box(f'{name}Throw', (width + 0.1, 0.45, 0.06), (x, y - length + 0.35, 0.6), mat(f'throw{throw}', throw, 0.9), bevel=0.02)
    for i, c in enumerate(pillows):
        dx = (i - (len(pillows) - 1) / 2) * (width / max(1, len(pillows)))
        ob = box(f'{name}Pillow{i}', (width / len(pillows) - 0.06, 0.34, 0.16), (x + dx, y - 0.25, 0.6), mat(f'pillow{c}', c, 0.8), bevel=0.05)
        ob.rotation_euler = (math.radians(-18), 0, 0)
    hb = mat(f'headboard{headboard}', headboard, 0.7)
    box(f'{name}Head', (width + 0.3, 0.12, hb_h), (x, y + 0.02, hb_h / 2), hb, bevel=0.05)
    if tufts:
        n = 4
        for i in range(n):
            box(f'{name}Tuft{i}', (0.02, 0.01, hb_h - 0.25), (x - (width + 0.3) / 2 + (i + 1) * (width + 0.3) / (n + 1), y - 0.045, hb_h / 2), mat(f'tuft{headboard}', _darker(headboard), 0.7), bevel=0)

def _darker(hexcol, k=0.78):
    h = hexcol.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % (int(r * k), int(g * k), int(b * k))

def nightstand(name, loc, T, lamp=True):
    x, y, z = loc
    box(f'{name}Body', (0.5, 0.42, 0.55), (x, y, 0.275), mat_wood('standwood', T['wood_a'], T['wood_b']))
    box(f'{name}Drawer', (0.42, 0.01, 0.16), (x, y - 0.215, 0.4), mat('drawerface', _darker(T['wood_a'], 0.9), 0.5), bevel=0)
    if lamp:
        cyl(f'{name}LampBase', 0.08, 0.26, (x, y, 0.68), mat('lampbase', T['accent'], 0.3, coat=0.6), r2=0.05)
        cyl(f'{name}LampShade', 0.16, 0.2, (x, y, 0.9), mat('lampshade', '#f6ead0', 0.6), r2=0.12)
        sphere(f'Bulb{name}', 0.04, (x, y, 0.86), mat('bulb', '#ffffff', emit=T['light'], strength=30))
        point(f'{name}L', (x, y, 0.88), 25, T['light'], 0.06)

def fairy_wall(T, x0, x1, z0, z1, y, n=60, seed=3):
    """A wall of small warm lights."""
    import random
    rnd = random.Random(seed)
    m = mat('fairy', '#ffffff', emit=T['light'], strength=20)
    for i in range(n):
        sphere(f'Fairy{i}', 0.025, (rnd.uniform(x0, x1), y, rnd.uniform(z0, z1)), m)

def neon_text(name, text, loc, size, color, rot=(90, 0, 0), strength=10, extrude=0.02):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = text; cu.size = size; cu.extrude = extrude; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    ob = _link(bpy.data.objects.new(name, cu))
    ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    ob.data.materials.append(mat(f'{name}neon', color, emit=color, strength=strength))
    return ob

def ring(name, loc, r, thick, m, rot=(90, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=thick, major_segments=96, minor_segments=12, location=loc,
                                     rotation=[math.radians(a) for a in rot])
    ob = bpy.context.active_object; ob.name = name; ob.data.materials.append(m)
    for f in ob.data.polygons: f.use_smooth = True
    return ob

def chandelier(name, loc, T, r=0.45):
    x, y, z = loc
    crystal = mat('crystal', '#ffffff', emit='#fff4dc', strength=4)
    gold = mat('gold', T['accent'], 0.25, 1.0)
    ring(f'{name}Hoop', (x, y, z), r, 0.015, gold, rot=(0, 0, 0))
    ring(f'{name}Hoop2', (x, y, z - 0.22), r * 0.65, 0.012, gold, rot=(0, 0, 0))
    for tier, (rr, zz, n) in enumerate(((r, z - 0.08, 18), (r * 0.65, z - 0.3, 12))):
        for i in range(n):
            a = i * math.tau / n
            sphere(f'Bulb{name}{tier}{i}', 0.03, (x + rr * math.cos(a), y + rr * math.sin(a), zz), crystal).visible_shadow = False
    cyl(f'{name}Rod', 0.006, 0.7, (x, y, z + 0.35), mat('cord', '#111111', 0.6), bevel=0)
    point(f'{name}L', (x, y, z - 0.15), 90, T['light'], 0.3).data.use_shadow = False

def room_bedroom(T):
    """A bedroom: three beds in a row, tall headboards, lamps between, a wall of little lights."""
    W, D, H = 9.0, 6.5, 3.1
    shell(T, W, D, H, floor_mat=mat_planks('planks', T['wood_a'], T['wood_b'], seam=T['wood_b'], scale=0.9, rough=T['floor_rough']))
    box('BedWall', (W, 0.02, H), (0, D - 0.005, H / 2), mat('bedwall', T['deep'], 0.85), bevel=0)
    fairy_wall(T, -4.2, 4.2, 1.7, 2.9, D - 0.03)
    heads = [T['accent'], T['accent2'], T['pop']]
    duvets = ['#efe4c9', '#ffffff', '#efe4c9']
    for i, x in enumerate((-2.7, 0, 2.7)):
        bed(f'Bed{i}', (x, D - 0.08, 0), T, width=1.3, length=2.1, headboard=heads[i], duvet=duvets[i], throw=heads[(i + 1) % 3],
            pillows=('#ffffff', heads[(i + 2) % 3]))
    for x in (-1.35, 1.35):
        nightstand(f'Stand{x}', (x, D - 0.3, 0), T)
    two_way_mirrors(T, -W / 2 + 0.03, (2.0, 4.4), z0=0.6, h=1.9, w=1.3)
    box('Rug', (6.5, 1.6, 0.012), (0, 3.3, 0.006), mat('rug', T['accent2'], 0.95), bevel=0)
    box('Dresser', (0.5, 1.6, 0.9), (W / 2 - 0.3, 2.8, 0.45), mat('dresser', T['cabinet'], 0.4))
    for i in range(3):
        box(f'DresserLine{i}', (0.01, 1.5, 0.006), (W / 2 - 0.56, 2.8, 0.3 + i * 0.25), mat('gap', '#07080a', 0.9), bevel=0)
    plant('PlantR', (W / 2 - 0.4, 4.6, 0), height=1.3, pot=T['accent'])
    neon_eye((W / 2 - 0.05, 2.8, 2.1), 0.42, rot=(90, 0, -90))
    spot('wall', (W / 2 - 0.03, 5.7, 1.75), -90, 0.8)
    spot('floor', (-3.0, 2.4, 0))
    downlights(T, (-3.0, 3.0), (2.0, 5.0), H, power=30)
    area('CeilSoft', (6, 3), (0, 3.5, H - 0.05), 60, T['light'])
    area('Fill', (5, 2), (0, -2.0, 2.0), 140, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    camera((0, -1.3, 1.5), (85.5, 0, 0), lens=22, dof=(6.0, 4.0))

def room_hoh(T):
    """The Head of Household suite: one big bed, a gold headboard, a lounge chair, the basket and the letter."""
    W, D, H = 8.0, 6.0, 3.0
    shell(T, W, D, H, floor_mat=mat_planks('planks', T['wood_a'], T['wood_b'], seam=T['wood_b'], scale=0.9, rough=T['floor_rough']))
    # a gold arch behind the bed: the room is a reward and looks like one
    box('HohWall', (W, 0.02, H), (0, D - 0.005, H / 2), mat('hohwall', T['wall2'], 0.85), bevel=0)
    box('Arch', (2.8, 0.03, 1.6), (0, D - 0.02, 0.8), mat('arch', T['accent'], 0.6), bevel=0)
    cyl('ArchTop', 1.4, 0.03, (0, D - 0.02, 1.6), mat('arch', T['accent'], 0.6), rot=(90, 0, 0), verts=96, bevel=0)
    box('ArchInner', (2.4, 0.035, 1.6), (0, D - 0.035, 0.8), mat('archinner', T['deep'], 0.7), bevel=0)
    cyl('ArchInnerTop', 1.2, 0.035, (0, D - 0.035, 1.6), mat('archinner', T['deep'], 0.7), rot=(90, 0, 0), verts=96, bevel=0)
    bed('HohBed', (0, D - 0.1, 0), T, width=2.0, length=2.2, headboard=T['accent'], duvet='#ffffff', throw=T['pop'],
        pillows=(T['accent'], '#ffffff', '#ffffff', T['accent']), hb_h=1.6)
    nightstand('StandL', (-1.55, D - 0.3, 0), T)
    nightstand('StandR', (1.55, D - 0.3, 0), T)
    # the letter from home, framed, on the right stand; the snack basket on the bed
    box('Frame', (0.22, 0.03, 0.28), (1.68, D - 0.35, 0.69), mat('frame', T['accent'], 0.3, 0.8), bevel=0.004, rot=(-10, 0, 0))
    box('Photo', (0.17, 0.03, 0.22), (1.68, D - 0.37, 0.69), mat('photo', '#e9d8b8', 0.5), bevel=0, rot=(-10, 0, 0))
    cyl('Basket', 0.28, 0.2, (0.6, D - 1.6, 0.72), mat('basket', '#c9955a', 0.8), r2=0.22)
    for i, c in enumerate((T['pop'], T['accent2'], '#f2b134', '#ffffff', T['accent'])):
        box(f'Snack{i}', (0.1, 0.06, 0.18), (0.48 + i * 0.06, D - 1.6 + 0.05 * (i % 2), 0.88), mat(f'snack{c}', c, 0.4), bevel=0.01, rot=(0, 10 * (i - 2), 0))
    # left: the lounge chair under a reading lamp; right: a small desk and the mini fridge
    armchair('Lounge', (-2.9, 3.3, 0), 30, T['accent2'])
    floor_lamp('LampL', (-3.5, 4.4, 0), T)
    box('Desk', (1.2, 0.55, 0.75), (3.1, D - 0.4, 0.375), mat('desk', T['cabinet'], 0.4))
    box('MiniFridge', (0.5, 0.5, 0.6), (3.4, 3.4, 0.3), mat('steel', T['metal'], 0.22, 1.0))
    plant('PlantR', (3.5, 2.3, 0), height=1.2, pot=T['deep'])
    two_way_mirrors(T, -W / 2 + 0.03, (1.7,), z0=0.6, h=1.9, w=1.2)
    spot('wall', (-W / 2 + 0.03, 4.9, 1.85), 90, 0.8)
    spot('floor', (-2.3, 2.0, 0))
    neon_text('HohSign', 'HOH', (0, D - 0.06, 2.62), 0.38, T['accent'], strength=14)
    drape = mat('drape', T['pop'], 0.85)
    drape2 = mat('drape2', _darker(T['pop'], 0.82), 0.85)
    for sx in (-1, 1):
        for i in range(7):
            cyl(f'Drape{sx}{i}', 0.075, 2.85, (sx * (1.62 + i * 0.1), D - 0.14 - 0.03 * (i % 2), 1.43), drape if i % 2 else drape2, verts=16)
        box(f'DrapeRod{sx}', (0.9, 0.04, 0.04), (sx * 1.95, D - 0.14, 2.88), mat('gold', T['accent'], 0.25, 1.0), bevel=0)
    # panelled moulding on the back wall either side
    trim = mat('moulding', _darker(T['wall2'], 0.86), 0.6)
    for sx in (-1, 1):
        for zc, hh in ((0.75, 0.9), (1.95, 1.1)):
            xc = sx * 3.05
            for (dx, dz, w_, h_) in ((0, hh / 2, 1.3, 0.04), (0, -hh / 2, 1.3, 0.04), (-0.65, 0, 0.04, hh), (0.65, 0, 0.04, hh)):
                box(f'Mould{sx}{zc}{dx}{dz}', (w_, 0.025, h_), (xc + dx, D - 0.02, zc + dz), trim, bevel=0)
    chandelier('Chand', (0, 1.9, H - 0.5), T)
    box('Bench', (1.7, 0.45, 0.42), (0, 3.4, 0.21), mat('bench', T['pop'], 0.7), bevel=0.04)
    for i in range(4):
        sphere(f'BenchTuft{i}', 0.018, (-0.6 + i * 0.4, 3.4, 0.425), mat('benchtuft', _darker(T['pop'], 0.7), 0.7))
    # the desk: a round gold mirror, flowers, a champagne bucket
    cyl('MirrorRound', 0.42, 0.04, (3.1, D - 0.03, 1.5), mat('gold', T['accent'], 0.25, 1.0), rot=(90, 0, 0), verts=64)
    cyl('MirrorGlass', 0.36, 0.045, (3.1, D - 0.035, 1.5), mat('mirror', '#06080b', rough=0.03, metal=1.0), rot=(90, 0, 0), verts=64)
    cyl('DeskVase', 0.07, 0.24, (2.75, D - 0.4, 0.87), mat('vase', '#ffffff', 0.15, coat=0.7))
    for i in range(7):
        a = i * math.tau / 7
        sphere(f'Bloom{i}', 0.055, (2.75 + 0.07 * math.cos(a), D - 0.4 + 0.07 * math.sin(a), 1.06 + 0.05 * (i % 3)), mat(f'bloom{i % 2}', [T['pop'], '#ffffff'][i % 2], 0.5))
    cyl('Bucket', 0.11, 0.2, (3.45, D - 0.4, 0.85), mat('steel', T['metal'], 0.22, 1.0), r2=0.09)
    cyl('Bottle', 0.035, 0.32, (3.45, D - 0.4, 1.0), mat('bottle', '#2f5a3a', 0.2), rot=(12, 0, 0))
    box('Rug', (3.4, 2.4, 0.012), (0, 2.8, 0.006), mat('rug', T['pop'], 0.95), bevel=0)
    downlights(T, (-2.6, 2.6), (2.0, 4.6), H, power=30)
    area('CeilSoft', (5, 3), (0, 3.2, H - 0.05), 60, T['light'])
    area('Fill', (5, 2), (0, -2.0, 2.0), 140, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    camera((0, -1.1, 1.5), (85.5, 0, 0), lens=22, dof=(5.0, 4.0))

def room_dr(T):
    """The Diary Room: the chair, the backdrop behind it, the eye. Tighter, like the real cut."""
    W, D, H = 5.0, 3.6, 3.0
    shell(T, W, D, H, wall_mat=mat('drwall', T['deep'], 0.85), floor_mat=mat('drfloor', _darker(T['deep'], 0.8), 0.6))
    # backdrop: vertical panels with light between them
    box('DrBackdrop', (W, 0.02, H), (0, D - 0.01, H / 2), mat_graphic('drgraphic', [T['deep'], _darker(T['wall2'], 0.8), T['deep'], _darker(T['accent2'], 0.6)], scale=0.9, angle=60), bevel=0)
    # the chair sits in the middle of a target of light: the iris, and the house is the eye
    box('DrDisc', (3.3, 0.02, 3.3), (0, D - 0.05, 1.25), mat('drdiscbg', T['deep'], 0.6), bevel=0)
    for i, (r, c) in enumerate(((0.95, T['accent2']), (1.22, T['pop']), (1.5, T['accent']))):
        ring(f'DrRing{i}', (0, D - 0.08, 1.15), r, 0.035, mat(f'drring{i}', '#ffffff', emit=c, strength=10))
    neon_eye((W / 2 - 0.05, 1.6, 2.3), 0.38, rot=(90, 0, -90))
    spot('wall', (-W / 2 + 0.03, 1.7, 1.75), 90, 0.7)
    # pedestals either side, lit from the top
    for sx in (-1, 1):
        cyl(f'Pedestal{sx}', 0.22, 1.0, (sx * 1.85, D - 0.7, 0.5), mat('pedestal', T['wall2'], 0.5))
        cyl(f'PedLight{sx}', 0.18, 0.02, (sx * 1.85, D - 0.7, 1.01), mat('pedlight', '#ffffff', emit=T['light'], strength=20), bevel=0)
    # the side table: the tissue box, the water glass
    cyl('SideTable', 0.24, 0.04, (1.15, 1.55, 0.55), mat('sidetable', T['accent'], 0.4))
    cyl('SideStem', 0.03, 0.55, (1.15, 1.55, 0.275), mat('chairleg', '#2a2a2e', 0.4, 0.6))
    box('Tissues', (0.2, 0.12, 0.1), (1.1, 1.55, 0.62), mat('tissuebox', T['accent2'], 0.6), bevel=0.005)
    sphere('Tissue', 0.045, (1.1, 1.55, 0.69), mat('tissue', '#ffffff', 0.9), scale=(1.2, 0.6, 0.8))
    cyl('WaterGlass', 0.035, 0.12, (1.27, 1.5, 0.63), mat('potglass', '#ddeeff', 0.03, transmission=1.0))
    for i, (r, c) in enumerate(((1.75, T['accent']), (1.55, T['deep']))):
        cyl(f'DrRug{i}', r, 0.006 + i * 0.002, (0, 1.95, 0.003 + i * 0.002), mat(f'drrug{i}', c, 0.95), bevel=0)
    # the chair: a big rounded throne, the room's whole personality
    fm = mat('drchair', T['accent'], 0.6)
    inner = mat('drchairin', T['accent2'], 0.7)
    # an egg chair: a tall rounded shell, a deep cushion inside it
    sphere('DrShell', 0.8, (0, 2.15, 1.05), fm, scale=(1.0, 0.55, 1.12))
    sphere('DrHollow', 0.66, (0, 1.72, 1.02), inner, scale=(0.84, 0.3, 0.98))
    cyl('DrSeat', 0.62, 0.22, (0, 1.85, 0.5), fm)
    cyl('DrCushion', 0.56, 0.08, (0, 1.82, 0.64), inner)
    cyl('DrBase', 0.45, 0.3, (0, 1.95, 0.15), mat('drbase', T['deep'], 0.4))
    cyl('DrStage', 1.2, 0.08, (0, 1.95, 0.04), mat('drstage', T['wall2'], 0.5))
    box('DrStageLED', (2.2, 0.01, 0.01), (0, 0.8, 0.07), mat('ledacc', '#ffffff', emit=T['led2'], strength=30), bevel=0)
    area('DrKey', (2, 1), (0, -0.5, 2.4), 300, T['light'], rot=(-60, 0, 0))
    world(T['world'], 0.4)
    camera((0, -2.0, 1.3), (88, 0, 0), lens=24, dof=(4.0, 4.0))

def room_yard(T):
    """The backyard: high walls, open sky, the pool, the hot tub, loungers, string lights."""
    W, D, H = 14.0, 10.0, 4.2
    shell(T, W, D, H, floor_mat=mat('turf', '#7fae55', 0.9), wall_mat=mat('yardwall', T['wall2'], 0.85), roof=False)
    # a mural on the back wall: the eye, huge, painted
    box('Mural', (7.0, 0.02, 3.2), (0, D - 0.01, 2.2), mat('mural', T['accent2'], 0.8), bevel=0)
    neon_eye((0, D - 0.06, 2.5), 2.0, rot=(90, 0, 0))
    # the pool, the deck round it, the hot tub
    box('Deck', (8.0, 4.2, 0.12), (-1.0, 5.6, 0.06), mat('deck', '#e7dcc4', 0.7), bevel=0)
    box('Pool', (6.4, 2.8, 0.13), (-1.0, 5.6, 0.07), mat('pool', '#45b6d6', 0.1), bevel=0)
    for i in range(7):
        box(f'Ripple{i}', (0.8 + 0.3 * (i % 3), 0.015, 0.005), (-3.6 + i * 0.9, 4.7 + 0.35 * (i % 4), 0.14), mat('ripple', '#d6f4fb', 0.2), bevel=0)
    cyl('HotTub', 1.0, 0.55, (4.6, 6.6, 0.28), mat('tubshell', T['cabinet'], 0.4))
    cyl('HotTubWater', 0.88, 0.02, (4.6, 6.6, 0.55), mat('pool', '#45b6d6', 0.1))
    # loungers along the front of the pool, an umbrella
    for i, x in enumerate((-3.4, -2.0, -0.6)):
        g = _group(f'Lounger{i}', (x, 3.2, 0), 0)
        _child(g, box(f'LgBed{i}', (0.65, 1.8, 0.12), (0, 0, 0.35), mat('lounger', '#ffffff', 0.5)))
        b = _child(g, box(f'LgBack{i}', (0.65, 0.7, 0.1), (0, 0.85, 0.62), mat('lounger', '#ffffff', 0.5)))
        b.rotation_euler = (math.radians(55), 0, 0)
        _child(g, box(f'LgPad{i}', (0.6, 1.6, 0.06), (0, -0.05, 0.44), mat(f'pad{i}', [T['accent'], T['pop'], T['accent2']][i], 0.8)))
        for sx in (-1, 1):
            for sy in (-1, 1):
                _child(g, cyl(f'LgLeg{i}{sx}{sy}', 0.02, 0.3, (sx * 0.28, sy * 0.8, 0.15), mat('chairleg', '#2a2a2e', 0.4, 0.6)))
    cyl('UmbPole', 0.03, 2.4, (0.8, 3.6, 1.2), mat('chairleg', '#2a2a2e', 0.4, 0.6))
    cyl('Umbrella', 1.3, 0.35, (0.8, 3.6, 2.35), mat('umbrella', T['pop'], 0.7), r2=0.05)
    # string lights zig-zagging over the yard
    bulb = mat('fairy', '#ffffff', emit=T['light'], strength=20)
    cord = mat('cord', '#111111', 0.6)
    for k in range(4):
        y0 = 2.5 + k * 1.9
        for i in range(14):
            t = i / 13
            x = -W / 2 + 0.3 + t * (W - 0.6)
            z = H - 0.4 - 0.5 * math.sin(math.pi * t)
            sphere(f'Bulb{k}{i}', 0.05, (x, y0, z), bulb).visible_shadow = False
    # planters along the side walls, a basketball hoop on the right wall
    for i, y in enumerate((3.0, 6.0, 8.8)):
        plant(f'PlanterL{i}', (-W / 2 + 0.6, y, 0), height=1.6, pot=T['deep'])
    spot('wall', (-4.9, D - 0.03, 2.3), 0, 1.6)
    spot('floor', (3.6, 2.3, 0))
    box('Backboard', (0.05, 1.2, 0.8), (W / 2 - 0.05, 7.0, 3.0), mat('backboard', '#ffffff', 0.4), bevel=0.01)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.23, minor_radius=0.015, location=(W / 2 - 0.35, 7.0, 2.7))
    rim = bpy.context.active_object; rim.name = 'HoopRim'; rim.data.materials.append(mat('hoop', '#e0673f', 0.4, 0.6))
    sky = bpy.context.scene.world
    world(T.get('sky', '#8fc8ef'), 1.0)
    sd = bpy.data.lights.new('Sun', 'SUN'); sd.energy = 4.0
    sun = _link(bpy.data.objects.new('Sun', sd))
    sun.rotation_euler = (math.radians(45), 0, math.radians(-30))
    camera((0, -1.6, 1.6), (85, 0, 0), lens=20, dof=(7.0, 4.0))

def room_storage(T):
    """The storage room: shelves to the ceiling, the slop, the second fridge."""
    W, D, H = 7.0, 4.5, 3.0
    shell(T, W, D, H, wall_mat=mat('storewall', T['cabinet'], 0.85), floor_mat=mat_tiles('storefloor', '#bfb8ac', '#b7b0a4', grout='#8f887d', scale=1.6, rough=0.5))
    import random
    rnd = random.Random(7)
    shelf = mat('shelf', '#9aa2ad', 0.4, 0.7)
    cols = [T['accent'], T['accent2'], T['pop'], '#ffffff', '#f2b134', '#7fae55', '#e0673f']
    for x0, x1 in ((-3.3, -0.4), (0.4, 3.3)):
        for z in (0.25, 0.85, 1.45, 2.05, 2.65):
            box(f'Shelf{x0}{z}', (x1 - x0, 0.45, 0.03), ((x0 + x1) / 2, D - 0.25, z), shelf, bevel=0)
            x = x0 + 0.08
            while x < x1 - 0.15:
                w = rnd.choice((0.12, 0.16, 0.22, 0.28))
                h = rnd.choice((0.18, 0.24, 0.3, 0.36))
                c = rnd.choice(cols)
                if rnd.random() < 0.35:
                    cyl(f'Can{x0}{z}{x:.2f}', w / 2.4, h, (x + w / 2, D - 0.3, z + h / 2 + 0.015), mat(f'can{c}', c, 0.35, 0.3))
                else:
                    box(f'Box{x0}{z}{x:.2f}', (w, 0.3, h), (x + w / 2, D - 0.3, z + h / 2 + 0.015), mat(f'box{c}', c, 0.6))
                x += w + 0.04
        for sx in (x0, x1):
            box(f'Upright{sx}', (0.04, 0.45, H - 0.1), (sx, D - 0.25, (H - 0.1) / 2), shelf, bevel=0)
    # the slop: a big grey bucket with a hand-written label
    cyl('SlopBucket', 0.3, 0.55, (0, 1.8, 0.28), mat('slop', '#9aa0a6', 0.5), r2=0.26)
    box('SlopLabel', (0.3, 0.01, 0.12), (0, 1.5, 0.35), mat('slopLabel', '#ffffff', 0.6), bevel=0)
    box('Fridge2', (0.9, 0.7, 2.0), (-W / 2 + 0.5, 2.2, 1.0), mat('steel', T['metal'], 0.22, 1.0))
    box('Washer', (0.7, 0.65, 0.85), (W / 2 - 0.45, 2.3, 0.43), mat('washer', '#ffffff', 0.3))
    spot('wall', (W / 2 - 0.03, 3.4, 1.9), -90, 0.7)
    cyl('WasherDoor', 0.22, 0.02, (W / 2 - 0.8, 2.3, 0.48), mat('washerdoor', '#7a94b0', 0.1), rot=(0, 90, 0))
    downlights(T, (-1.5, 1.5), (2.2,), H, power=60)
    area('Fill', (4, 2), (0, -2.0, 2.0), 140, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    camera((0, -1.2, 1.5), (86, 0, 0), lens=22, dof=(4.5, 4.0))

def room_havenot(T):
    """The have-not room: concrete, cots that are not beds, one bare bulb, a cold light."""
    W, D, H = 7.5, 5.5, 3.0
    shell(T, W, D, H, wall_mat=mat('concrete', '#9aa0a3', 0.95), floor_mat=mat_tiles('concretefloor', '#8d9294', '#878c8e', grout='#6d7275', scale=0.6, rough=0.8))
    steel = mat('cot', '#6d7a86', 0.4, 0.8)
    canvas = mat('canvas', '#b8b29a', 0.9)
    for i, x in enumerate((-2.4, 0, 2.4)):
        box(f'CotBed{i}', (0.8, 1.9, 0.05), (x, D - 1.15, 0.45), canvas, bevel=0)
        for sx in (-1, 1):
            box(f'CotRail{i}{sx}', (0.04, 1.95, 0.05), (x + sx * 0.42, D - 1.15, 0.45), steel, bevel=0)
            for sy in (-1, 1):
                box(f'CotLeg{i}{sx}{sy}', (0.04, 0.04, 0.45), (x + sx * 0.42, D - 1.15 + sy * 0.92, 0.225), steel, bevel=0)
        box(f'CotBlanket{i}', (0.7, 0.5, 0.04), (x, D - 1.85, 0.5), mat('greyblanket', '#7c8288', 0.95), bevel=0.01)
    # a chain-link panel and a stencil on the back wall
    for i in range(16):
        box(f'Chain{i}', (0.012, 0.01, 2.6), (-2.6 + i * 0.35, D - 0.02, 1.4), mat('chain', '#5f6a74', 0.4, 0.8), bevel=0, rot=(0, 30, 0))
        box(f'ChainB{i}', (0.012, 0.01, 2.6), (-2.6 + i * 0.35, D - 0.02, 1.4), mat('chain', '#5f6a74', 0.4, 0.8), bevel=0, rot=(0, -30, 0))
    box('Stencil', (2.4, 0.01, 0.35), (0, D - 0.04, 2.6), mat('stencil', T['pop'], 0.8), bevel=0)
    cyl('Cord', 0.004, 0.9, (0, 3.0, H - 0.45), mat('cord', '#111111', 0.6), bevel=0)
    sphere('Bulb', 0.07, (0, 3.0, H - 0.95), mat('bulb', '#ffffff', emit='#e8f4ff', strength=40))
    point('BareBulb', (0, 3.0, H - 1.0), 160, '#e8f4ff', 0.03)
    box('Bucket', (0.3, 0.3, 0.35), (3.2, 2.5, 0.175), mat('slop', '#9aa0a6', 0.5))
    area('Fill', (4, 2), (0, -2.0, 2.0), 120, '#d8e6f2', rot=(-80, 0, 0))
    world('#7d8a96', 0.4)
    camera((0, -1.2, 1.5), (86, 0, 0), lens=22, dof=(4.5, 4.0))


# ══════════════════════════════════════════════════════════════════════
# THE DINING ROOM — where the nomination ceremony happens (BB US): the HOH at
# the head of the table, everybody else down both sides, the Nomination Box
# in front of the HOH. The box holds only the SAFE houseguests' keys; the two
# nominees' keys stay upstairs. The HOH pulls a key, spins the box to its
# owner, who hangs it round their neck; the two left without one are up.
#
# ANCHORS: after the build, anchors() projects every seat and every key slot
# through the camera and writes <room>.json beside the render, so the viewer
# sits each houseguest in their own chair and each key in its own slot.
# ══════════════════════════════════════════════════════════════════════
# The nomination ceremony, as it runs now (BB26-28): the house round a ROUND table, the HOH standing
# at its head beside a small box with one key per nominee, and a big NOMINATIONS screen on the wall
# behind with a "?" slot for each. The HOH turns a key; that nominee's face fills a slot.
DIN_TABLE = (0.0, 3.3)
DIN_R = 1.75
DIN_SEAT_DEG = [-14, 10, 34, 58, 122, 146, 170, 194]      # chairs round the far side; the near side stays open
DIN_HOH = (2.05, 5.55, 1.05)
DIN_BOX = (1.25, 4.6, 0.78)

def dining_chair(name, loc, rot_z, fabric, tall=False, wood=None):
    g = _group(name, loc, rot_z)
    fm = mat(f'{name}fab', fabric, 0.7)
    _child(g, box(f'{name}Seat', (0.5, 0.5, 0.08), (0, 0, 0.47), fm, bevel=0.02))
    bh = 0.95 if tall else 0.42
    _child(g, box(f'{name}Back', (0.5, 0.07, bh), (0, 0.24, 0.5 + bh / 2), fm, bevel=0.03))
    lm = wood or mat('chairleg', '#2a2a2e', 0.4, 0.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, box(f'{name}Leg{sx}{sy}', (0.04, 0.04, 0.45), (sx * 0.21, sy * 0.21, 0.225), lm, bevel=0))
    return g

def nomination_screen(T, D, H):
    """The NOMINATIONS screen: a lit, rounded frame on the back wall, a dark screen the viewer fills,
    and the row of lit capsules underneath."""
    frame = mat('nomframe', T['deep'], 0.4)
    glow = mat('nomglow', '#ffffff', emit=T['led2'], strength=14)
    box('NomFrame', (3.5, 0.12, 2.55), (0, D - 0.08, 1.75), frame, bevel=0.06)
    for (sx, sz, x, z) in ((3.36, 0.035, 0, 3.0), (3.36, 0.035, 0, 0.5), (0.035, 2.5, -1.68, 1.75), (0.035, 2.5, 1.68, 1.75)):
        box(f'NomGlow{x}{z}', (sx, 0.02, sz), (x, D - 0.15, z), glow, bevel=0)
    box('NomScreen', (2.9, 0.03, 1.7), (0, D - 0.16, 1.95), mat('nomscreen', '#16224a', 0.3, emit='#1b2a5a', strength=1.0), bevel=0)
    caps = mat('nomcaps', '#ffffff', emit='#4dff8a', strength=10)
    for i in range(12):
        c = cyl(f'NomCap{i}', 0.055, 0.22, (-1.1 + i * 0.2, D - 0.16, 0.86), caps, verts=16, bevel=0)
    box('NomCapsBar', (2.7, 0.06, 0.34), (0, D - 0.12, 0.86), mat('nomcapsbar', '#9aa4b0', 0.3, 0.8), bevel=0.01)

def room_dining(T):
    """The nomination table: a round table, the house round its far side, the screen behind, the key box."""
    W, D, H = 9.0, 7.0, 3.2
    shell(T, W, D, H, floor_mat=mat_planks('planks', T['wood_a'], T['wood_b'], seam=T['wood_b'], scale=0.9, rough=T['floor_rough']))
    box('Graphic', (0.02, D + 2, H), (-W / 2 + 0.01, D / 2 - 0.5, H / 2), mat_graphic('graphic', T['graphic'], scale=0.32), bevel=0)
    two_way_mirrors(T, -W / 2 + 0.03, (2.2, 5.0), z0=0.6, h=1.9, w=1.5)
    two_way_mirrors(T, W / 2 - 0.03, (2.2, 5.0), z0=0.6, h=1.9, w=1.5)
    nomination_screen(T, D, H)
    tx, ty = DIN_TABLE
    top = mat_marble('counter') if T.get('counter') == 'marble' else mat('counter', T.get('counter', '#efe4c9'), 0.3)
    cyl('TableBase', 0.55, 0.7, (tx, ty, 0.35), mat('tablebase', T['deep'], 0.4), verts=64)
    cyl('TableTop', DIN_R, 0.08, (tx, ty, 0.74), top, verts=128)
    cyl('TableInlay', DIN_R - 0.3, 0.006, (tx, ty, 0.783), mat('inlay', T['accent2'], 0.5), verts=128, bevel=0)
    cyl('TableHub', 0.5, 0.008, (tx, ty, 0.786), mat('hub', T['accent'], 0.5), verts=96, bevel=0)
    ring('TableLED', (tx, ty, 0.7), DIN_R - 0.02, 0.018, mat('tableled', '#ffffff', emit=T['led'], strength=14), rot=(0, 0, 0))
    tick = mat('tick', T['deep'], 0.5)
    for i in range(24):
        a = i * math.tau / 24
        t_ = box(f'Tick{i}', (0.025, 0.14 if i % 6 else 0.24, 0.004), (tx + (DIN_R - 0.13) * math.cos(a), ty + (DIN_R - 0.13) * math.sin(a), 0.785), tick, bevel=0)
        t_.rotation_euler = (0, 0, a + math.pi / 2)
    wood = mat_wood('chairwood', T['wood_a'], T['wood_b'])
    for i, deg in enumerate(DIN_SEAT_DEG):
        a = math.radians(deg)
        dining_chair(f'Chair{i}', (tx + 2.2 * math.cos(a), ty + 2.2 * math.sin(a), 0), deg - 90, T['fabric2'], wood=wood)
    # the key box: one key per nominee goes on top of it (the viewer draws the keys and turns them)
    bx, by, bz = DIN_BOX
    box('NomBoxBody', (0.42, 0.22, 0.16), (bx, by, bz + 0.08), mat_wood('boxwood', T['wood_a'], T['wood_b']), bevel=0.01)
    box('NomBoxPlate', (0.44, 0.24, 0.02), (bx, by, bz + 0.17), mat('boxplate', T['cabinet'], 0.4), bevel=0.004)
    plant('PlantL', (-W / 2 + 0.6, D - 0.7, 0), height=1.5, pot=T['deep'])
    plant('PlantR', (W / 2 - 0.6, D - 0.7, 0), height=1.5, pot=T['deep'])
    spot('wall', (-3.0, D - 0.03, 1.85), 0, 0.8)
    spot('wall', (3.0, D - 0.03, 1.85), 0, 0.8)
    area('TableL', (2.5, 2.5), (tx, ty, H - 0.6), 260, T['light'])
    downlights(T, (-3.2, 3.2), (2.0, 6.0), H, power=40)
    area('Fill', (5, 2), (0, -2.0, 2.4), 160, T['fill'], rot=(-75, 0, 0))
    world(T['world'], 0.4)
    camera((0, -0.7, 1.55), (83.5, 0, 0), lens=24, dof=(5.0, 4.0))

def anchors(room, theme='default', w=1920, h=1080):
    """Project the room's seats and key slots through the camera; write <room>.json beside the render."""
    import json
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    bpy.context.view_layer.update()   # the camera's matrix is stale until the scene is evaluated
    cam = sc.camera
    def px(co):
        v = world_to_camera_view(sc, cam, Vector(co))
        return [round(v.x * 100, 2), round(v.y * 100, 2), round(v.z, 3)]   # % from left, % from bottom, depth
    def width_pct(co, metres):
        a = world_to_camera_view(sc, cam, Vector(co) - Vector((metres / 2, 0, 0)))
        b = world_to_camera_view(sc, cam, Vector(co) + Vector((metres / 2, 0, 0)))
        return round(abs(b.x - a.x) * 100, 2)
    out = {'room': room}
    frames = []
    for ob in sc.objects:
        if ob.name.startswith('MemScreen'):
            r, c = int(ob.name[9]), int(ob.name[10])
            corners = [ob.matrix_world @ Vector(v) for v in ((-0.5, 0, -0.5), (0.5, 0, 0.5))]
            sz = ob.data.vertices
            xs = [v.co.x for v in sz]; zs = [v.co.z for v in sz]
            a = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((min(xs), 0, min(zs))))
            b = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((max(xs), 0, max(zs))))
            frames.append({'r': r, 'c': c, 'x': round(min(a.x, b.x) * 100, 2), 'y': round(min(a.y, b.y) * 100, 2),
                           'w': round(abs(b.x - a.x) * 100, 2), 'h': round(abs(b.y - a.y) * 100, 2)})
    if frames:
        out['wall'] = sorted(frames, key=lambda f: (f['r'], f['c']))
    panels = []
    for name in ('MemPanel0', 'MemPanel1'):
        ob = sc.objects.get(name)
        if ob:
            xs = [v.co.x for v in ob.data.vertices]; zs = [v.co.z for v in ob.data.vertices]
            a_ = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((min(xs), 0, min(zs))))
            b_ = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((max(xs), 0, max(zs))))
            panels.append({'x': round(min(a_.x, b_.x) * 100, 2), 'y': round(min(a_.y, b_.y) * 100, 2),
                           'w': round(abs(b_.x - a_.x) * 100, 2), 'h': round(abs(b_.y - a_.y) * 100, 2)})
    if panels:
        out['panels'] = panels
    def rect_of(name):
        ob = sc.objects.get(name)
        if not ob: return None
        xs = [v.co.x for v in ob.data.vertices]; zs = [v.co.z for v in ob.data.vertices]
        a_ = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((min(xs), 0, min(zs))))
        b_ = world_to_camera_view(sc, cam, ob.matrix_world @ Vector((max(xs), 0, max(zs))))
        return {'x': round(min(a_.x, b_.x) * 100, 2), 'y': round(min(a_.y, b_.y) * 100, 2),
                'w': round(abs(b_.x - a_.x) * 100, 2), 'h': round(abs(b_.y - a_.y) * 100, 2)}
    if room == 'living':
        # where everybody is on a live night, at chest height: the nominees' chairs at the back
        # (N-1 left, N1 right), four places on each long sofa (L0..L3, R0..R3, front to back), and
        # where the veto holder stands to speak
        pts = {f'N{sx}': (sx * 0.6, LIVING_NOM_Y, 0.85) for sx in (-1, 1)}
        for i, lx in enumerate((-1.35, -0.45, 0.45, 1.35)):
            pts[f'L{i}'] = (-LIVING_SOFA_X + 0.12, LIVING_SOFA_Y + lx, 0.8)
            pts[f'R{i}'] = (LIVING_SOFA_X - 0.12, LIVING_SOFA_Y + lx, 0.8)
        pts['stand'] = (-1.2, 2.3, 1.15)
        out['seats'] = {k: {'at': px(co), 'w': width_pct(co, 0.62)} for k, co in pts.items()}
    if room == 'dining':
        tx, ty = DIN_TABLE
        seats = {}
        for i, deg in enumerate(DIN_SEAT_DEG):
            a_ = math.radians(deg)
            co = (tx + 2.15 * math.cos(a_), ty + 2.15 * math.sin(a_), 0.76)
            seats[f'S{i}'] = {'at': px(co), 'w': width_pct(co, 0.62)}
        out['seats'] = seats
        out['head'] = {'at': px(DIN_HOH), 'w': width_pct(DIN_HOH, 0.7)}
        bx, by, bz = DIN_BOX
        out['box'] = {'at': px((bx, by, bz + 0.18)), 'w': width_pct((bx, by, bz), 0.44)}
        out['screen'] = rect_of('NomScreen')
    if room == 'studio':
        # the guest's chair (left) and the host's (right), at chest height
        out['seats'] = {k: {'at': px((x, y + 0.05, 1.18)), 'w': width_pct((x, y, 1.18), 0.66)} for k, (x, y, _) in zip(('G', 'H'), STUDIO_CHAIRS)}
    if room == 'finale':
        # where each portrait's bottom edge rests: a seated person at chest height above the seat,
        # a standing one at chest height above the floor (the house's convention: living.json)
        seats = {}
        for i, (x, y, r) in enumerate(FIN_CHAIRS):
            co = (x, y + 0.05, FIN_PLAT[2] + 0.86 + 0.32)
            seats[f'F{i}'] = {'at': px(co), 'w': width_pct(co, 1.05)}
        for i, (x, y, z, r) in enumerate(FIN_JURY):
            co = (x, y + 0.05, z + 0.42 + 0.3)
            seats[f'J{i}'] = {'at': px(co), 'w': width_pct(co, 0.85)}
        seats['box'] = {'at': px((FIN_BOX[0] + 0.62, FIN_BOX[1], 1.15)), 'w': width_pct((FIN_BOX[0], FIN_BOX[1], 1.15), 0.85)}
        seats['H'] = {'at': px((FIN_HOST[0], FIN_HOST[1], 1.15)), 'w': width_pct((FIN_HOST[0], FIN_HOST[1], 1.15), 0.85)}
        # the front of the stage, two people side by side (the finalists walking out)
        for i, x in enumerate((-0.8, 0.8)):
            seats[f'D{i}'] = {'at': px((x, 3.0, 1.15)), 'w': width_pct((x, 3.0, 1.15), 0.85)}
        out['seats'] = seats
        out['slot'] = {'at': px((FIN_BOX[0], FIN_BOX[1], FIN_BOX[2] + 0.43)), 'w': width_pct((FIN_BOX[0], FIN_BOX[1], FIN_BOX[2]), 0.62)}
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{room}.json')
    open(path, 'w').write(json.dumps(out, indent=1))
    return path


# ══════════════════════════════════════════════════════════════════════
# DRESSING: each season's wall feature and floor prop, built facing -y at the
# origin and then turned and placed into the room's spot.
# ══════════════════════════════════════════════════════════════════════
def _place(sp, name):
    return _group(name, sp['loc'], sp['rot'])

def _apple(g, name, r, z):
    _child(g, sphere(f'{name}Apple', r, (0, 0, z), mat('apple', '#c8323c', 0.35), scale=(1.0, 1.0, 0.92)))
    _child(g, cyl(f'{name}Stem', r * 0.06, r * 0.5, (0, 0, z + r * 1.05), mat('stem', '#4a3a28', 0.7)))
    lf = _child(g, sphere(f'{name}Leaf', r * 0.32, (r * 0.3, 0, z + r * 1.1), mat('leafg', '#3f8a3a', 0.5), scale=(1.0, 0.25, 0.5)))
    lf.rotation_euler = (0, math.radians(-30), 0)

def tempt_wall(T, sp):
    k = sp['size']; g = _place(sp, 'TemptWall')
    _child(g, box('TwFrame', (0.9 * k, 0.06, 1.1 * k), (0, 0.03, 0), mat('gold', T['accent'], 0.25, 1.0), bevel=0))
    _child(g, box('TwCanvas', (0.74 * k, 0.07, 0.94 * k), (0, 0.02, 0), mat('canvas', T['deep'], 0.8), bevel=0))
    _apple(g, 'Tw', 0.2 * k, -0.04 * k)
    for sx in (-1, 1):
        _child(g, cyl(f'TwSconce{sx}', 0.04, 0.22, (sx * 0.62 * k, -0.08, 0.15 * k), mat('gold', T['accent'], 0.25, 1.0)))
        _child(g, sphere(f'BulbTw{sx}', 0.045, (sx * 0.62 * k, -0.08, 0.3 * k), mat('flame', '#ffffff', emit='#ffcf8a', strength=20)))

def tempt_floor(T, sp):
    g = _place(sp, 'TemptFloor')
    _child(g, cyl('TfPlinth', 0.3, 0.6, (0, 0, 0.3), mat('plinth', T['deep'], 0.5)))
    _child(g, cyl('TfTrim', 0.32, 0.04, (0, 0, 0.6), mat('gold', T['accent'], 0.25, 1.0)))
    _apple(g, 'Tf', 0.36, 0.98)

def machine_wall(T, sp):
    k = sp['size']; g = _place(sp, 'CoraWall')
    _child(g, cyl('CwDisc', 0.5 * k, 0.04, (0, 0, 0), mat('coradisc', T['deep'], 0.3), rot=(90, 0, 0), verts=96))
    for i, (r, c) in enumerate(((0.44, T['accent']), (0.33, T['accent2']), (0.22, T['accent']))):
        _child(g, cyl(f'CwRing{i}', r * k, 0.045 + i * 0.005, (0, -0.005 * i, 0), mat(f'coraring{i}', '#ffffff', emit=c, strength=10), rot=(90, 0, 0), verts=96, bevel=0))
        _child(g, cyl(f'CwGap{i}', (r - 0.035) * k, 0.05 + i * 0.005, (0, -0.005 * i - 0.002, 0), mat('coradisc', T['deep'], 0.3), rot=(90, 0, 0), verts=96, bevel=0))
    _child(g, cyl('CwLens', 0.12 * k, 0.08, (0, -0.03, 0), mat('coralens', '#ffffff', emit=T['led2'], strength=16), rot=(90, 0, 0), verts=64, bevel=0))
    _child(g, cyl('CwPupil', 0.05 * k, 0.09, (0, -0.04, 0), mat('corapupil', '#0b1418', 0.2), rot=(90, 0, 0), verts=48, bevel=0))

def machine_floor(T, sp):
    g = _place(sp, 'CoraFloor')
    _child(g, box('CfTower', (0.5, 0.4, 1.7), (0, 0, 0.85), mat('tower', '#ffffff', 0.25), bevel=0.02))
    for i in range(6):
        _child(g, box(f'CfLed{i}', (0.36, 0.01, 0.02), (0, -0.205, 0.35 + i * 0.22), mat('towerled', '#ffffff', emit=T['accent'], strength=14), bevel=0))
    _child(g, box('CfScreen', (0.34, 0.01, 0.2), (0, -0.205, 1.52), mat('towerscreen', '#ffffff', emit=T['accent2'], strength=8), bevel=0))

def mystery_wall(T, sp):
    k = sp['size']; g = _place(sp, 'KeyBoard')
    _child(g, box('KbBoard', (1.0 * k, 0.05, 0.75 * k), (0, 0.02, 0), mat_wood('kbwood', T['wood_a'], T['wood_b']), bevel=0))
    _child(g, box('KbPlaque', (0.4 * k, 0.06, 0.08 * k), (0, -0.01, 0.3 * k), mat('gold', T['accent'], 0.25, 1.0), bevel=0))
    for r in range(3):
        for c in range(5):
            x = (-0.4 + c * 0.2) * k; z = (0.12 - r * 0.2) * k
            _child(g, cyl(f'KbHook{r}{c}', 0.012, 0.06, (x, -0.04, z), mat('gold', T['accent'], 0.25, 1.0), rot=(90, 0, 0), bevel=0))
            if (r + c) % 3:
                _child(g, box(f'KbKey{r}{c}', (0.03, 0.01, 0.1 * k), (x, -0.05, z - 0.06 * k), mat('brasskey', T['accent'], 0.3, 1.0), bevel=0))
                _child(g, box(f'KbTag{r}{c}', (0.05, 0.01, 0.035), (x, -0.052, z - 0.13 * k), mat('keytag', T['pop'], 0.7), bevel=0))

def mystery_floor(T, sp):
    g = _place(sp, 'Clock')
    wood = mat_wood('clockwood', T['wood_a'], T['wood_b'])
    _child(g, box('CkBody', (0.55, 0.38, 1.9), (0, 0, 0.95), wood, bevel=0))
    _child(g, box('CkHood', (0.65, 0.44, 0.5), (0, 0, 2.05), wood, bevel=0))
    _child(g, cyl('CkFace', 0.19, 0.02, (0, -0.23, 2.05), mat('clockface', '#f1e6c8', 0.6), rot=(90, 0, 0), verts=48, bevel=0))
    for ang, ln in ((20, 0.13), (110, 0.09)):
        h_ = _child(g, box(f'CkHand{ang}', (0.012, 0.01, ln), (0, -0.245, 2.05), mat('clockhand', '#2a1a10', 0.5), bevel=0))
        h_.rotation_euler = (0, math.radians(ang), 0)
        h_.location = (math.sin(math.radians(ang)) * ln / 2, -0.245, 2.05 + math.cos(math.radians(ang)) * ln / 2)
    _child(g, box('CkWindow', (0.3, 0.01, 0.9), (0, -0.195, 1.05), mat('clockglass', '#1f2a26', 0.2), bevel=0))
    _child(g, cyl('CkPendulum', 0.09, 0.01, (0, -0.2, 0.8), mat('gold', T['accent'], 0.25, 1.0), rot=(90, 0, 0), bevel=0))

def roller_wall(T, sp):
    k = sp['size']; g = _place(sp, 'Roulette')
    _child(g, cyl('RwRim', 0.5 * k, 0.06, (0, 0, 0), mat_wood('rwwood', T['wood_a'], T['wood_b']), rot=(90, 0, 0), verts=96, bevel=0))
    n = 24
    for i in range(n):
        a = i * math.tau / n
        seg = _child(g, box(f'RwSeg{i}', (0.08 * k, 0.02, 0.1 * k), (0.37 * k * math.sin(a), -0.035, 0.37 * k * math.cos(a)),
                            mat('rwred' if i % 2 else 'rwblack', '#b32a36' if i % 2 else '#1a1416', 0.4), bevel=0))
        seg.rotation_euler = (0, a, 0)
    _child(g, cyl('RwHub', 0.26 * k, 0.04, (0, -0.04, 0), mat('felt', '#1f4a35', 0.8), rot=(90, 0, 0), verts=64, bevel=0))
    _child(g, cyl('RwCone', 0.09 * k, 0.12, (0, -0.08, 0), mat('gold', T['accent'], 0.25, 1.0), rot=(90, 0, 0), r2=0.02, verts=32, bevel=0))

def roller_floor(T, sp):
    g = _place(sp, 'Slot')
    _child(g, box('SlBody', (0.62, 0.5, 1.25), (0, 0, 0.625), mat('slotbody', T['accent2'], 0.35), bevel=0))
    _child(g, cyl('SlTop', 0.31, 0.5, (0, 0, 1.25), mat('gold', T['accent'], 0.25, 1.0), rot=(90, 0, 0), verts=48, bevel=0))
    _child(g, box('SlScreen', (0.48, 0.01, 0.26), (0, -0.255, 0.95), mat('slotscreen', '#fff6dc', 0.4), bevel=0))
    for i, c in enumerate(('#c8323c', '#d4ad3c', '#c8323c')):
        _child(g, cyl(f'SlReel{i}', 0.05, 0.01, ((i - 1) * 0.15, -0.262, 0.95), mat(f'reel{i}', c, 0.4), rot=(90, 0, 0), bevel=0))
    _child(g, box('SlTray', (0.5, 0.12, 0.06), (0, -0.28, 0.45), mat('gold', T['accent'], 0.25, 1.0), bevel=0))
    _child(g, cyl('SlLever', 0.018, 0.5, (0.36, 0, 1.05), mat('steel', '#c9c9c9', 0.25, 1.0), bevel=0))
    _child(g, sphere('SlKnob', 0.055, (0.36, 0, 1.32), mat('knob', '#e8463f', 0.3)))

def camp_wall(T, sp):
    """A camp sign: two planks, carved letters, an arrow to the lake."""
    k = sp['size']; g = _place(sp, 'CampSign')
    plank = mat_wood('signwood', T['wood_a'], T['wood_b'])
    _child(g, box('CsPlankA', (1.2 * k, 0.05, 0.3 * k), (0, 0.02, 0.17 * k), plank, bevel=0))
    _child(g, box('CsPlankB', (1.0 * k, 0.05, 0.24 * k), (-0.05 * k, 0.02, -0.17 * k), plank, bevel=0))
    _child(g, box('CsArrow', (0.12 * k, 0.05, 0.12 * k), (0.47 * k, 0.02, -0.17 * k), plank, bevel=0, rot=(0, 45, 0)))
    for sx in (-1, 1):
        _child(g, cyl(f'CsNail{sx}', 0.015, 0.02, (sx * 0.5 * k, -0.01, 0.17 * k), mat('nail', '#3a2a1c', 0.4, 0.6), rot=(90, 0, 0), bevel=0))
    t1 = neon_text('CsText', 'CAMP BB', (0, 0, 0), 0.17 * k, '#f1e6c8', strength=1.0, extrude=0.01)
    t1.parent = g; t1.location = (0, -0.01, 0.13 * k); t1.rotation_euler = (math.radians(90), 0, 0)
    t2 = neon_text('CsText2', 'TO THE LAKE', (0, 0, 0), 0.1 * k, '#f1e6c8', strength=1.0, extrude=0.01)
    t2.parent = g; t2.location = (-0.05 * k, -0.01, -0.2 * k); t2.rotation_euler = (math.radians(90), 0, 0)

def camp_floor(T, sp):
    g = _place(sp, 'Stump')
    _child(g, cyl('StStump', 0.28, 0.5, (0, 0, 0.25), mat('bark', '#6a4424', 0.9), r2=0.25, verts=24))
    _child(g, cyl('StRing', 0.25, 0.01, (0, 0, 0.505), mat('stumptop', '#c99a62', 0.8), verts=24, bevel=0))
    _child(g, box('LnBase', (0.2, 0.2, 0.04), (0, 0, 0.53), mat('lantern', '#3a2a1c', 0.4, 0.6), bevel=0))
    _child(g, cyl('LnGlass', 0.08, 0.22, (0, 0, 0.66), mat('lanternglow', '#ffffff', emit=T['light'], strength=18), verts=16, bevel=0))
    _child(g, box('LnTop', (0.2, 0.2, 0.04), (0, 0, 0.79), mat('lantern', '#3a2a1c', 0.4, 0.6), bevel=0))
    _child(g, cyl('LnHandle', 0.006, 0.12, (0, 0, 0.86), mat('lantern', '#3a2a1c', 0.4, 0.6), bevel=0))
    point('LanternL', (sp['loc'][0], sp['loc'][1], 0.66), 30, T['light'], 0.05)

def school_wall(T, sp):
    k = sp['size']; g = _place(sp, 'Pennants')
    cols = [T['accent2'], T['accent'], T['pop'], T['accent2'], T['accent'], T['pop']]
    for i, c in enumerate(cols):
        x = (-0.75 + i * 0.3) * k
        pn = _child(g, cyl(f'PnFlag{i}', 0.13 * k, 0.01, (x, -0.02, 0.15 * k), mat(f'pennant{i % 3}', c, 0.7), verts=3, rot=(90, 0, 0), bevel=0))
        pn.rotation_euler = (math.radians(90), math.radians(-90), 0)
    _child(g, box('PnString', (1.8 * k, 0.01, 0.01), (0, -0.02, 0.26 * k), mat('cord', '#111111', 0.6), bevel=0))
    _child(g, cyl('PnClock', 0.17 * k, 0.04, (0, -0.02, -0.25 * k), mat('clockface', '#ffffff', 0.5), rot=(90, 0, 0), verts=48))
    _child(g, cyl('PnClockRim', 0.19 * k, 0.03, (0, -0.005, -0.25 * k), mat('clockrim', T['deep'], 0.4), rot=(90, 0, 0), verts=48, bevel=0))

def school_floor(T, sp):
    g = _place(sp, 'Lockers')
    lk = mat('locker', T['accent2'], 0.4, 0.3)
    for i in range(3):
        x = (i - 1) * 0.42
        _child(g, box(f'LkBody{i}', (0.4, 0.45, 1.8), (x, 0, 0.9), lk, bevel=0))
        for v in range(3):
            _child(g, box(f'LkVent{i}{v}', (0.22, 0.01, 0.015), (x, -0.23, 1.6 - v * 0.04), mat('vent', T['deep'], 0.5), bevel=0))
        _child(g, box(f'LkHandle{i}', (0.03, 0.02, 0.12), (x + 0.13, -0.235, 1.0), mat('steel', '#c9c9c9', 0.25, 1.0), bevel=0))

DRESS = {
    'temptation': {'wall': tempt_wall, 'floor': tempt_floor},
    'machine': {'wall': machine_wall, 'floor': machine_floor},
    'mystery': {'wall': mystery_wall, 'floor': mystery_floor},
    'high-rollers': {'wall': roller_wall, 'floor': roller_floor},
    'summer-camp': {'wall': camp_wall, 'floor': camp_floor},
    'summer-school': {'wall': school_wall, 'floor': school_floor},
}


# ══════════════════════════════════════════════════════════════════════
# COMPETITION ARENAS. The real show stages most comps in a handful of
# spaces (the backyard rigged for endurance, rows of stations, podiums and
# buzzers, a game-show stage) and changes the apparatus. Eight arenas, plus
# the Block Buster's own set; js/bb/comp-arenas.js says which comp plays
# where. Each comp's own apparatus is drawn over the arena by its screen.
# ══════════════════════════════════════════════════════════════════════
def _studio(T, W=12.0, D=8.0, H=4.2, floor='#2a3550', wall=None):
    """A competition studio: dark walls, a floor that reads as a stage, a lighting truss overhead."""
    shell(T, W, D, H, wall_mat=mat('studiowall', wall or T['deep'], 0.8),
          floor_mat=mat_tiles('studiofloor', floor, _darker(floor, 0.88), grout=_darker(floor, 0.7), scale=0.8, rough=0.5))
    truss = mat('truss', '#9aa2ad', 0.35, 0.8)
    for y in (2.0, 5.0):
        box(f'Truss{y}', (W - 1, 0.16, 0.16), (0, y, H - 0.4), truss, bevel=0)
        for i in range(6):
            x = -W / 2 + 1.2 + i * (W - 2.4) / 5
            cyl(f'Can{y}{i}', 0.09, 0.22, (x, y, H - 0.6), mat('canbody', '#1e2228', 0.4, 0.6), verts=16)
            sphere(f'CanLens{y}{i}', 0.07, (x, y - 0.0, H - 0.72), mat('canlens', '#ffffff', emit=T['light'], strength=18)).visible_shadow = False

def _night_yard(T, W=14.0, D=10.0, H=4.6):
    shell(T, W, D, H, floor_mat=mat('turfnight', '#4f7a43', 0.9), wall_mat=mat('yardwall', T['wall2'], 0.85), roof=False)
    world('#1d2747', 1.0)

def _day_yard(T, W=14.0, D=10.0, H=4.2):
    shell(T, W, D, H, floor_mat=mat('turf', '#7fae55', 0.9), wall_mat=mat('yardwall', T['wall2'], 0.85), roof=False)
    world(T.get('sky', '#8fc8ef'), 1.0)
    sd = bpy.data.lights.new('Sun', 'SUN'); sd.energy = 4.0
    _link(bpy.data.objects.new('Sun', sd)).rotation_euler = (math.radians(45), 0, math.radians(-30))

def floodlight(name, x, y, H):
    cyl(f'{name}Pole', 0.07, H, (x, y, H / 2), mat('pole', '#3a3f48', 0.4, 0.6), verts=16)
    box(f'{name}Head', (0.9, 0.3, 0.5), (x, y - 0.1, H), mat('floodhead', '#2a2e35', 0.4, 0.5), bevel=0.02)
    for i in range(3):
        box(f'{name}Lamp{i}', (0.22, 0.02, 0.36), (x - 0.28 + i * 0.28, y - 0.26, H), mat('floodlamp', '#ffffff', emit='#fff3d6', strength=30), bevel=0)

def room_arena_endurance(T):
    """The backyard at night, rigged for endurance: the wall with its handholds, six platforms, floodlights."""
    W, D, H = 14.0, 10.0, 4.6
    _night_yard(T, W, D, H)
    rig = mat('rigwall', T['accent2'], 0.6)
    box('Rig', (9.0, 0.4, 3.6), (0, D - 2.2, 1.9), rig, bevel=0.02)
    box('RigTop', (9.4, 0.6, 0.2), (0, D - 2.2, 3.8), mat('rigtop', T['deep'], 0.5), bevel=0.01)
    hold = mat('hold', T['pop'], 0.5)
    hold2 = mat('hold2', T['accent'], 0.5)
    for i in range(6):
        x = -3.75 + i * 1.5
        box(f'Lane{i}', (0.06, 0.42, 3.6), (x + 0.75, D - 2.22, 1.9), mat('laneline', '#ffffff', 0.6), bevel=0) if i < 5 else None
        for k in range(5):
            sphere(f'Hold{i}{k}', 0.07, (x + (0.25 if k % 2 else -0.25), D - 2.42, 0.9 + k * 0.55), hold if k % 2 else hold2, scale=(1, 0.6, 1))
        box(f'Plat{i}', (0.9, 0.9, 0.25), (x, D - 3.0, 0.125), mat('plat', T['cabinet'], 0.5), bevel=0.02)
        neon_text(f'LaneNo{i}', str(i + 1), (x, D - 2.43, 3.4), 0.32, '#ffffff', strength=8)
    neon_eye((0, D - 2.45, 4.25), 0.8, rot=(90, 0, 0))
    floodlight('FloodL', -6.2, 3.5, 4.2)
    floodlight('FloodR', 6.2, 3.5, 4.2)
    area('RigKey', (8, 1), (0, 2.5, 4.3), 900, '#fff3d6', rot=(-55, 0, 0))
    for x in (-5.5, 5.5):
        plant(f'Planter{x}', (x, D - 1.0, 0), height=1.6, pot=T['deep'])
    spot('wall', (-W / 2 + 0.05, 6.0, 2.4), 90, 1.2)
    camera((0, -1.4, 1.7), (84, 0, 0), lens=20, dof=(9.0, 5.0))

def room_arena_course(T):
    """The backyard by day as an obstacle course: start pads, ramps, ball tracks, a finish arch."""
    W, D, H = 14.0, 10.0, 4.2
    _day_yard(T, W, D, H)
    cols = [T['pop'], T['accent'], T['accent2'], '#7fd36a', '#b07cff', '#ff9a3d']
    for i in range(6):
        x = -3.75 + i * 1.5
        box(f'Start{i}', (1.0, 0.8, 0.08), (x, 1.6, 0.04), mat(f'start{i}', cols[i], 0.6), bevel=0)
        r = box(f'Ramp{i}', (0.9, 2.0, 0.08), (x, 3.6, 0.45), mat('ramp', T['cabinet'], 0.5), bevel=0.01)
        r.rotation_euler = (math.radians(14), 0, 0)
        box(f'Track{i}', (0.18, 2.6, 0.12), (x, 6.0, 1.0), mat(f'track{i}', cols[i], 0.4), bevel=0.01).rotation_euler = (math.radians(-12), 0, 0)
        sphere(f'Ball{i}', 0.12, (x, 5.0, 1.32), mat(f'ball{i}', cols[(i + 2) % 6], 0.3, coat=0.6))
    for x in (-4.6, 4.6):
        box(f'ArchPost{x}', (0.3, 0.3, 3.2), (x, D - 1.4, 1.6), mat('archpost', T['deep'], 0.5), bevel=0.02)
    box('ArchTop', (9.5, 0.4, 0.6), (0, D - 1.4, 3.3), mat('archtop', T['accent'], 0.5), bevel=0.02)
    for i in range(16):
        box(f'Check{i}', (0.55, 0.42, 0.28), (-4.2 + i * 0.56, D - 1.4, 3.12 + (0.14 if i % 2 else -0.14) * 0.0), mat('checkw' if i % 2 else 'checkb', '#ffffff' if i % 2 else '#1a1a1a', 0.5), bevel=0)
    neon_text('Finish', 'FINISH', (0, D - 1.62, 3.32), 0.34, '#ffffff', strength=4)
    for i, x in enumerate((-6, -5, 5, 6)):
        cyl(f'Cone{i}', 0.18, 0.5, (x, 2.6 + (i % 2) * 1.5, 0.25), mat('cone', '#ff8a2b', 0.5), r2=0.03, verts=24)
    spot('floor', (5.6, 1.6, 0))
    camera((0, -1.6, 1.8), (82, 0, 0), lens=20, dof=(9.0, 5.0))

def room_arena_puzzle(T):
    """Puzzle stations: six tables in two rows, an upright board on each, a countdown on the back wall."""
    W, D, H = 12.0, 8.0, 4.2
    _studio(T, W, D, H)
    board = mat('board', T['cabinet'], 0.5)
    tile_cols = [T['pop'], T['accent'], T['accent2'], '#ffffff']
    for r, y in enumerate((3.0, 5.2)):
        for c in range(3):
            x = -3.4 + c * 3.4
            box(f'Table{r}{c}', (1.6, 0.8, 0.8), (x, y, 0.4), mat('stationtable', T['deep'], 0.4), bevel=0.02)
            box(f'TableTop{r}{c}', (1.7, 0.9, 0.05), (x, y, 0.82), mat('stationtop', T['accent'], 0.4), bevel=0.01)
            box(f'Board{r}{c}', (1.4, 0.06, 1.0), (x, y + 0.3, 1.35), board, bevel=0.01)
            for i in range(4):
                for j in range(3):
                    box(f'Tile{r}{c}{i}{j}', (0.28, 0.02, 0.26), (x - 0.48 + i * 0.32, y + 0.26, 1.08 + j * 0.3),
                        mat(f'tile{(i + j + r + c) % 4}', tile_cols[(i + j + r + c) % 4], 0.5), bevel=0)
            box(f'Pad{r}{c}', (0.9, 0.9, 0.02), (x, y - 0.9, 0.01), mat('pad', T['accent2'], 0.6), bevel=0)
    box('Timer', (3.2, 0.1, 1.1), (0, D - 0.1, 2.9), mat('timerbody', '#111520', 0.4), bevel=0.02)
    neon_text('TimerText', '04:59', (0, D - 0.18, 2.88), 0.62, T['led'], strength=12)
    neon_eye((-4.6, D - 0.08, 2.9), 0.6)
    neon_eye((4.6, D - 0.08, 2.9), 0.6)
    area('Key', (8, 4), (0, 3.5, H - 0.1), 700, T['light'])
    world(T['world'], 0.5)
    camera((0, -2.6, 2.3), (78, 0, 0), lens=20, dof=(7.0, 5.0))

def room_arena_podiums(T):
    """Quiz podiums: a curved row of lit podiums with buzzers, a host lectern, the question screen."""
    W, D, H = 12.0, 8.0, 4.2
    _studio(T, W, D, H)
    n = 6
    for i in range(n):
        a = math.radians(-50 + i * 20)
        x, y = 4.6 * math.sin(a), 6.2 - 4.6 * math.cos(a) + 0.4
        g = _group(f'Pod{i}', (x, y, 0), math.degrees(a))
        _child(g, box(f'PodBody{i}', (0.9, 0.6, 1.05), (0, 0, 0.525), mat('podbody', T['deep'], 0.4), bevel=0.04))
        _child(g, box(f'PodFace{i}', (0.8, 0.02, 0.55), (0, -0.31, 0.55), mat(f'podface{i % 3}', '#ffffff', emit=[T['accent'], T['pop'], T['accent2']][i % 3], strength=4), bevel=0))
        _child(g, box(f'PodTop{i}', (0.98, 0.68, 0.06), (0, 0, 1.08), mat('podtop', T['accent'], 0.4, 0.4), bevel=0.01))
        _child(g, sphere(f'Buzzer{i}', 0.09, (0, 0.05, 1.14), mat('buzzer', '#ff3b3b', 0.3), scale=(1, 1, 0.55)))
    box('Lectern', (0.8, 0.6, 1.15), (4.9, 3.0, 0.575), mat('lectern', T['accent'], 0.4, 0.4), bevel=0.04)
    box('QScreen', (5.0, 0.1, 2.0), (0, D - 0.1, 2.5), mat('qframe', '#111520', 0.4), bevel=0.04)
    box('QPanel', (4.6, 0.04, 1.6), (0, D - 0.16, 2.5), mat('qpanel', '#ffffff', emit=T['accent2'], strength=1.4), bevel=0)
    neon_text('QMark', '?', (0, D - 0.2, 2.45), 1.0, '#ffffff', strength=10)
    area('Key', (8, 4), (0, 3.5, H - 0.1), 700, T['light'])
    world(T['world'], 0.5)
    camera((0, -1.4, 1.7), (84, 0, 0), lens=22, dof=(6.0, 5.0))

def room_arena_stage(T):
    """The game-show stage: a raised round stage under an arch of bulbs, curtains, a big wheel behind."""
    W, D, H = 12.0, 8.0, 4.6
    _studio(T, W, D, H, floor='#3a2440', wall='#2a1a2e')
    cyl('Stage', 3.2, 0.4, (0, 4.6, 0.2), mat('stage', T['accent2'], 0.4), verts=96)
    cyl('StageRim', 3.25, 0.06, (0, 4.6, 0.41), mat('stagerim', '#ffffff', emit=T['led2'], strength=12), verts=96, bevel=0)
    for i in range(3):
        box(f'Step{i}', (2.0, 0.4, 0.13 * (i + 1)), (0, 1.6 - i * 0.0 + 0.4 * i, 0.065 * (i + 1)), mat('step', T['deep'], 0.5), bevel=0)
    curtain = mat('curtain', T['pop'], 0.85)
    curtain2 = mat('curtain2', _darker(T['pop'], 0.8), 0.85)
    for sx in (-1, 1):
        for i in range(8):
            cyl(f'Curtain{sx}{i}', 0.16, H, (sx * (3.6 + i * 0.28), D - 0.4 - (i % 2) * 0.08, H / 2), curtain if i % 2 else curtain2, verts=16)
    # an arch of bulbs
    bulb = mat('bulbs', '#ffffff', emit='#ffe2a0', strength=24)
    for i in range(29):
        a = math.pi * i / 28
        sphere(f'ArchBulb{i}', 0.07, (3.3 * math.cos(a), D - 0.5, 1.0 + 2.9 * math.sin(a)), bulb).visible_shadow = False
    # the big wheel behind the stage
    cyl('Wheel', 1.4, 0.12, (0, D - 0.3, 2.3), mat('wheelrim', T['accent'], 0.3, 0.6), rot=(90, 0, 0), verts=64)
    cols = [T['pop'], '#ffffff', T['accent2'], T['accent']]
    for i in range(12):
        a = i * math.tau / 12
        seg = box(f'Wedge{i}', (0.66, 0.04, 0.5), (1.0 * math.sin(a), D - 0.38, 2.3 + 1.0 * math.cos(a)), mat(f'wedge{i % 4}', cols[i % 4], 0.5), bevel=0)
        seg.rotation_euler = (0, a, 0)
    cyl('WheelFace', 0.75, 0.13, (0, D - 0.33, 2.3), mat('wheelface', T['deep'], 0.5), rot=(90, 0, 0), verts=64, bevel=0)
    cyl('WheelHub', 0.25, 0.2, (0, D - 0.45, 2.3), mat('hub', T['accent'], 0.3, 0.8), rot=(90, 0, 0), verts=32)
    area('Spot', (2, 2), (0, 2.0, H - 0.2), 900, '#fff1d0', rot=(-30, 0, 0))
    world('#2a1a2e', 0.5)
    camera((0, -1.4, 1.6), (84, 0, 0), lens=22, dof=(6.0, 5.0))

def room_arena_lanes(T):
    """Skill lanes in the backyard: five painted lanes running to targets on the back wall."""
    W, D, H = 14.0, 10.0, 4.2
    _day_yard(T, W, D, H)
    cols = [T['pop'], T['accent'], T['accent2'], '#7fd36a', '#b07cff']
    for i in range(5):
        x = -4.4 + i * 2.2
        box(f'Lane{i}', (1.7, 8.0, 0.012), (x, 5.0, 0.006), mat(f'lane{i}', cols[i], 0.7), bevel=0)
        box(f'LaneEdge{i}', (0.06, 8.0, 0.014), (x - 0.88, 5.0, 0.008), mat('laneline', '#ffffff', 0.6), bevel=0)
        for r, c in enumerate(('#ffffff', cols[i], '#ffffff', '#1a1a1a')):
            cyl(f'Target{i}{r}', 0.75 - r * 0.18, 0.04 + r * 0.01, (x, D - 0.05 - r * 0.01, 1.6), mat(f'tgt{r}{i}', c, 0.5), rot=(90, 0, 0), verts=48, bevel=0)
        box(f'Launcher{i}', (0.7, 0.5, 0.7), (x, 1.5, 0.35), mat('launcher', T['deep'], 0.5), bevel=0.03)
        cyl(f'LaunchBall{i}', 0.15, 0.3, (x, 1.5, 0.85), mat(f'ball{i}', cols[(i + 2) % 5], 0.3), verts=24)
    camera((0, -1.4, 1.7), (84, 0, 0), lens=20, dof=(9.0, 5.0))

def room_arena_pool(T):
    """The pool comp: platforms over the water, buckets on poles, a ladder, the slide."""
    W, D, H = 14.0, 10.0, 4.2
    _day_yard(T, W, D, H)
    box('PoolDeck', (11.0, 6.6, 0.12), (0, 5.2, 0.06), mat('deck', '#e7dcc4', 0.7), bevel=0)
    box('Pool', (9.6, 5.2, 0.13), (0, 5.2, 0.07), mat('pool', '#45b6d6', 0.1), bevel=0)
    for i in range(9):
        box(f'Ripple{i}', (1.0 + 0.3 * (i % 3), 0.015, 0.005), (-4.0 + i * 1.0, 3.4 + 0.5 * (i % 5), 0.14), mat('ripple', '#d6f4fb', 0.2), bevel=0)
    for i in range(5):
        x = -3.6 + i * 1.8
        box(f'Plat{i}', (0.9, 0.9, 0.12), (x, 5.6, 0.9), mat('plat', T['cabinet'], 0.5), bevel=0.02)
        cyl(f'PlatLeg{i}', 0.06, 0.85, (x, 5.6, 0.45), mat('pole', '#3a3f48', 0.4, 0.6), verts=12)
        cyl(f'Pole{i}', 0.04, 2.4, (x, 7.4, 1.2), mat('pole', '#3a3f48', 0.4, 0.6), verts=12)
        cyl(f'Bucket{i}', 0.22, 0.32, (x, 7.4, 2.5), mat(f'bucket{i % 3}', [T['pop'], T['accent'], T['accent2']][i % 3], 0.5), r2=0.17, verts=24)
    box('Slide', (0.8, 3.2, 0.1), (5.6, 4.2, 1.2), mat('slide', T['accent'], 0.4, coat=0.5), bevel=0.02).rotation_euler = (math.radians(-22), 0, 0)
    box('SlideTower', (1.0, 1.0, 2.4), (5.6, 6.0, 1.2), mat('tower', T['deep'], 0.5), bevel=0.02)
    neon_eye((0, D - 0.06, 2.7), 1.6)
    camera((0, -1.4, 1.9), (82, 0, 0), lens=20, dof=(9.0, 5.0))

def room_arena_luck(T):
    """The luck booth: a striped tent wall, a prize wheel, a bulb-lit counter of dice and cups."""
    W, D, H = 12.0, 8.0, 4.2
    _studio(T, W, D, H, floor='#3a2a26')
    box('Tent', (W, 0.02, H), (0, D - 0.01, H / 2), mat_wallpaper('tentstripes', 'stripes', T['pop'], '#f6ead0'), bevel=0)
    cyl('PrizeWheel', 1.5, 0.14, (0, D - 0.25, 2.4), mat('wheelrim', T['accent'], 0.3, 0.6), rot=(90, 0, 0), verts=64)
    cols = [T['accent2'], '#ffffff', T['pop'], T['accent']]
    for i in range(16):
        a = i * math.tau / 16
        seg = box(f'Wedge{i}', (0.56, 0.04, 0.5), (1.1 * math.sin(a), D - 0.34, 2.4 + 1.1 * math.cos(a)), mat(f'wedge{i % 4}', cols[i % 4], 0.5), bevel=0)
        seg.rotation_euler = (0, a, 0)
    cyl('WheelFace', 0.82, 0.15, (0, D - 0.3, 2.4), mat('wheelface', T['deep'], 0.5), rot=(90, 0, 0), verts=64, bevel=0)
    cyl('WheelHub', 0.26, 0.2, (0, D - 0.42, 2.4), mat('hub', T['accent'], 0.3, 0.8), rot=(90, 0, 0), verts=32)
    box('Pointer', (0.14, 0.1, 0.36), (0, D - 0.4, 4.0), mat('pointer', '#ffffff', 0.4), bevel=0)
    box('Counter', (6.0, 0.9, 1.0), (0, 3.4, 0.5), mat('counter', T['deep'], 0.4), bevel=0.03)
    box('CounterTop', (6.2, 1.0, 0.06), (0, 3.4, 1.02), mat('countertop', T['accent'], 0.4), bevel=0.01)
    bulb = mat('bulbs', '#ffffff', emit='#ffe2a0', strength=22)
    for i in range(20):
        sphere(f'CounterBulb{i}', 0.05, (-2.85 + i * 0.3, 2.94, 0.85), bulb).visible_shadow = False
    for i in range(5):
        b = box(f'Die{i}', (0.22, 0.22, 0.22), (-2.0 + i * 1.0, 3.4, 1.16), mat('die', '#ffffff', 0.4), bevel=0.03)
        b.rotation_euler = (0, 0, math.radians(15 * i))
        cyl(f'Cup{i}', 0.13, 0.3, (-1.5 + i * 1.0, 3.5, 1.2), mat(f'cup{i % 3}', [T['pop'], T['accent2'], T['accent']][i % 3], 0.4), r2=0.1, verts=24)
    area('Key', (8, 4), (0, 3.0, H - 0.1), 700, T['light'])
    world(T['world'], 0.5)
    camera((0, -1.2, 1.7), (84, 0, 0), lens=22, dof=(6.0, 5.0))

def room_arena_blockbuster(T):
    """The Block Buster arena: three lit lanes for the three nominees, a tiered back wall, the sign."""
    W, D, H = 12.0, 8.0, 4.6
    _studio(T, W, D, H, floor='#141a2c', wall='#0f1424')
    grid = mat('ledgrid', '#ffffff', emit=T['led'], strength=6)
    for i in range(13):
        box(f'GridX{i}', (0.03, 7.0, 0.006), (-6.0 + i * 1.0, 4.0, 0.006), grid, bevel=0)
    for j in range(8):
        box(f'GridY{j}', (12.0, 0.03, 0.006), (0, 0.6 + j * 1.0, 0.006), grid, bevel=0)
    cols = [T['pop'], T['accent'], T['accent2']]
    for i in range(3):
        x = -3.2 + i * 3.2
        box(f'BBLane{i}', (1.8, 4.6, 0.05), (x, 4.6, 0.03), mat(f'bblane{i}', cols[i], 0.5), bevel=0)
        box(f'BBStation{i}', (1.4, 0.8, 1.0), (x, 6.6, 0.5), mat('station', '#1e2436', 0.4), bevel=0.04)
        box(f'BBStationGlow{i}', (1.3, 0.02, 0.12), (x, 6.19, 0.85), mat(f'bbglow{i}', '#ffffff', emit=cols[i], strength=14), bevel=0)
        box(f'BBPedestal{i}', (0.9, 0.9, 0.18), (x, 2.6, 0.09), mat('pedestal', '#ffffff', 0.4), bevel=0.02)
    for k in range(3):
        box(f'Tier{k}', (11.0 - k * 1.6, 0.6, 0.5), (0, D - 0.3 - k * 0.0, 0.25 + k * 0.5), mat(f'tier{k}', _darker(T['deep'], 1.0 - k * 0.1), 0.5), bevel=0.02)
    neon_text('BBSign', 'BLOCK BUSTER', (0, D - 0.12, 3.15), 0.62, T['accent'], strength=14)
    neon_eye((0, D - 0.12, 2.25), 0.7)
    area('Key', (8, 4), (0, 4.0, H - 0.1), 800, T['light'])
    world('#0f1424', 0.5)
    camera((0, -1.4, 2.0), (80, 0, 0), lens=22, dof=(6.0, 5.0))

ARENA_ROOMS = {'arena-endurance': room_arena_endurance, 'arena-course': room_arena_course, 'arena-puzzle': room_arena_puzzle,
               'arena-podiums': room_arena_podiums, 'arena-stage': room_arena_stage, 'arena-lanes': room_arena_lanes,
               'arena-pool': room_arena_pool, 'arena-luck': room_arena_luck, 'arena-blockbuster': room_arena_blockbuster}


# ══════════════════════════════════════════════════════════════════════
# THE STUDIO: where the host interviews the evictee, and the finale stage
# ══════════════════════════════════════════════════════════════════════
# The user, 2026-10-06, with five photographs of the real set: two tall grey upholstered chairs
# turned toward each other, glowing blue panels and doors between silver pillars, a glossy floor
# with small lights set into it, and a video wall with the logo. 'studio' is the interview
# (two chairs, close); 'studio-wide' is the finale stage (the big wall in the middle, steps).
STUDIO_CHAIRS = ((-0.95, 2.55, 40), (0.95, 2.55, -40))   # x, y, turned toward the middle (deg)

def studio_chair(name, loc, rot_z, fabric):
    """A tall upholstered bar chair: a deep cushioned seat, a square back, arms, thin dark legs and a footrest."""
    g = _group(name, loc, rot_z)
    leg = mat('studioleg', '#34363c', 0.4, 0.5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, box(f'{name}Leg{sx}{sy}', (0.05, 0.05, 0.78), (sx * 0.27, sy * 0.25, 0.39), leg, bevel=0))
    _child(g, box(f'{name}Foot', (0.6, 0.04, 0.04), (0, -0.25, 0.28), leg, bevel=0))
    _child(g, box(f'{name}Seat', (0.66, 0.62, 0.16), (0, 0, 0.86), fabric, bevel=0.04))
    _child(g, box(f'{name}Back', (0.66, 0.12, 0.62), (0, 0.27, 1.22), fabric, bevel=0.04))
    for sx in (-1, 1):
        _child(g, box(f'{name}Arm{sx}', (0.1, 0.56, 0.26), (sx * 0.31, 0.02, 1.05), fabric, bevel=0.03))
    return g

def _studio_back(T, W, D, H, blue, video_x, video_w, video_h, doors_x=None):
    """The back wall: silver pillars, tall glowing blue panels between them, the video wall, the doors."""
    pillar = mat('studiopillar', '#9aa3b1', 0.35, 0.4)
    glow = mat('studioblue', '#ffffff', emit=blue, strength=9)
    frame = mat('studioframe', '#6f7888', 0.4, 0.5)
    box('StudioBack', (W, 0.04, H), (0, D, H / 2), mat('studiobackwall', '#4a5568', 0.7), bevel=0)
    n = int(W // 1.3)
    for i in range(n + 1):
        x = -W / 2 + i * W / n
        box(f'Pillar{i}', (0.32, 0.3, H), (x, D - 0.15, H / 2), pillar, bevel=0)
        box(f'PillarStrip{i}', (0.05, 0.02, H - 0.4), (x, D - 0.31, H / 2), glow, bevel=0)
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        if abs(x - video_x) < video_w / 2 + 0.4 or (doors_x is not None and abs(x - doors_x) < 0.9):
            continue
        box(f'BluePanel{i}', (W / n - 0.5, 0.03, H - 1.0), (x, D - 0.05, H / 2 + 0.15), glow, bevel=0)
    # the video wall: deep blue with a lighter ripple, the eye in the middle
    vz = 0.9 + video_h / 2
    box('VideoFrame', (video_w + 0.2, 0.12, video_h + 0.2), (video_x, D - 0.25, vz), frame, bevel=0)
    box('VideoWall', (video_w, 0.04, video_h), (video_x, D - 0.32, vz),
        mat_graphic('videowall', ['#0d4fa3', '#1f86e0', '#0d4fa3', '#39b6ff'], scale=0.6, angle=20), bevel=0)
    neon_eye((video_x, D - 0.36, vz), video_h * 0.22, rot=(90, 0, 0), color='#ffffff', glow='#8fe6ff')
    if doors_x is not None:
        # the front-door style double doors, frosted, lit from behind
        for sx in (-1, 1):
            box(f'Door{sx}', (0.7, 0.04, 2.5), (doors_x + sx * 0.38, D - 0.06, 1.25), glow, bevel=0)
            box(f'DoorFrame{sx}', (0.08, 0.1, 2.6), (doors_x + sx * 0.78, D - 0.1, 1.3), frame, bevel=0)
        box('DoorHead', (1.64, 0.1, 0.1), (doors_x, D - 0.1, 2.6), frame, bevel=0)

def _studio_floor(T, W, D):
    """A glossy pale floor with a run of small round lights set into it."""
    box('StudioFloorGloss', (W, D, 0.02), (0, D / 2, 0.005), mat('studiogloss', '#c6cfdc', 0.12, 0.25, coat=1.0), bevel=0)
    dot = mat('floordot', '#ffffff', emit='#cfeeff', strength=14)
    for y in (1.2, 2.6, 4.0):
        for i in range(9):
            x = -W / 2 + 0.9 + i * (W - 1.8) / 8
            cyl(f'FloorDot{y}{i}', 0.05, 0.012, (x, y, 0.016), dot, verts=16, bevel=0)
    box('StageEdge', (W - 1.0, 0.04, 0.02), (0, D - 1.0, 0.02), mat('stageedge', '#ffffff', emit='#4fc8ff', strength=12), bevel=0)

def room_studio(T):
    """The interview set: two tall chairs turned to each other, the blue-lit wall, the video wall behind."""
    W, D, H = 8.0, 5.0, 4.0
    T = dict(T, ceiling='#2b3346')
    shell(T, W, D, H, wall_mat=mat('studiowalls', '#566176', 0.7), floor_mat=mat('studiofloorbase', '#aeb8c8', 0.3))
    _studio_floor(T, W, D)
    _studio_back(T, W, D, H, '#2aa8ff', video_x=-2.3, video_w=2.4, video_h=1.5, doors_x=1.9)
    fabric = mat('studiofabric', '#9a9fa8', 0.85)
    for i, (x, y, r) in enumerate(STUDIO_CHAIRS):
        studio_chair(f'StudioChair{i}', (x, y, 0), r, fabric)
    for sx in (-1, 1):
        plant(f'StudioPlant{sx}', (sx * 3.3, 3.6, 0), height=1.1, pot='#6f7888', leaf='#3d7d4a')
    area('StudioKey', (3, 2), (0, -0.4, 3.4), 520, '#ffffff', rot=(-55, 0, 0))
    world('#24324a', 0.5)
    camera((0, -2.2, 1.45), (86, 0, 0), lens=26)

def room_studio_wide(T):
    """The finale stage: the big video wall in the middle, steps up to the stage, the blue-lit wings."""
    W, D, H = 14.0, 8.0, 5.0
    T = dict(T, ceiling='#2b3346')
    shell(T, W, D, H, wall_mat=mat('studiowalls', '#566176', 0.7), floor_mat=mat('studiofloorbase', '#aeb8c8', 0.3))
    _studio_floor(T, W, D)
    _studio_back(T, W, D, H, '#2aa8ff', video_x=0, video_w=5.6, video_h=2.6)
    step = mat('studiostep', '#d9dfe8', 0.25, 0.2)
    for i in range(3):
        box(f'StageStep{i}', (7.0 - i * 0.6, 0.45, 0.14 * (i + 1)), (0, D - 2.4 + i * 0.45, 0.07 * (i + 1)), step, bevel=0)
        box(f'StepLight{i}', (7.0 - i * 0.6, 0.02, 0.02), (0, D - 2.62 + i * 0.45, 0.14 * (i + 1) + 0.01), mat('steplight', '#ffffff', emit='#7fd6ff', strength=14), bevel=0)
    area('StudioKey', (5, 3), (0, -0.4, 4.4), 1400, '#ffffff', rot=(-50, 0, 0))
    world('#24324a', 0.5)
    camera((0, -3.2, 1.7), (85, 0, 0), lens=22)

# The finale stage (the user, 2026-10-06: "we need an actual stage"): the finalists' two chairs on a
# raised round platform, the jury on risers either side, the key box on a pedestal in front, the
# host's mark. Every place is an anchor, measured where the person's portrait rests.
FIN_PLAT = (0.0, 6.0, 0.42)                                   # centre x, y, top of the platform
FIN_CHAIRS = ((-1.05, 6.0, 25), (1.05, 6.0, -25))
FIN_JURY = []                                                  # (x, y, seat height, turn)
for sx in (-1, 1):
    for x in (4.55, 3.55):                                  # front row, on the floor
        FIN_JURY.append((sx * x, 3.5, 0.5, sx * -12))
    for x in (5.2, 4.1, 3.0):                                  # back row, on the riser, between the front seats
        FIN_JURY.append((sx * x, 4.75, 1.3, sx * -12))
FIN_BOX = (-2.0, 2.3, 1.02)                                     # the top of the pedestal
FIN_HOST = (1.75, 1.9)

def jury_chair(name, loc, rot_z, fabric):
    g = _group(name, loc, rot_z)
    leg = mat('studioleg', '#34363c', 0.4, 0.5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, box(f'{name}Leg{sx}{sy}', (0.05, 0.05, 0.36), (sx * 0.24, sy * 0.22, 0.18), leg, bevel=0))
    _child(g, box(f'{name}Seat', (0.6, 0.56, 0.16), (0, 0, 0.42), fabric, bevel=0))
    _child(g, box(f'{name}Back', (0.6, 0.1, 0.55), (0, 0.24, 0.75), fabric, bevel=0))
    return g

def room_finale(T):
    W, D, H = 18.0, 10.0, 6.0
    T = dict(T, ceiling='#2b3346')
    shell(T, W, D, H, wall_mat=mat('studiowalls', '#566176', 0.7), floor_mat=mat('studiofloorbase', '#aeb8c8', 0.3))
    box('StudioFloorGloss', (W, D, 0.02), (0, D / 2, 0.005), mat('studiogloss', '#b9c3d2', 0.12, 0.25, coat=1.0), bevel=0)
    _studio_back(T, W, D, H, '#2aa8ff', video_x=0, video_w=6.4, video_h=2.9)
    # the platform: a raised disc with a lit rim, and two steps down to the floor
    px, py, pz = FIN_PLAT
    cyl('Platform', 2.5, pz, (px, py, pz / 2), mat('platform', '#d9dfe8', 0.25, 0.2), verts=96, bevel=0)
    cyl('PlatformRim', 2.52, 0.05, (px, py, pz - 0.03), mat('platrim', '#ffffff', emit='#4fc8ff', strength=14), verts=96, bevel=0)
    cyl('PlatformRing', 1.9, 0.012, (px, py, pz + 0.006), mat('platring', '#ffffff', emit='#9fe4ff', strength=8), verts=96, bevel=0)
    for i in range(2):
        box(f'PlatStep{i}', (2.6 - i * 0.5, 0.42, 0.14 * (i + 1)), (px, py - 2.75 + i * 0.4, 0.07 * (i + 1)), mat('studiostep', '#d9dfe8', 0.25, 0.2), bevel=0)
        box(f'PlatStepLight{i}', (2.6 - i * 0.5, 0.02, 0.02), (px, py - 2.96 + i * 0.4, 0.14 * (i + 1) + 0.01), mat('steplight', '#ffffff', emit='#7fd6ff', strength=14), bevel=0)
    fabric = mat('studiofabric', '#9a9fa8', 0.85)
    for i, (x, y, r) in enumerate(FIN_CHAIRS):
        studio_chair(f'FinalChair{i}', (x, y, pz), r, fabric)
    # the jury: a riser on each side, two rows of chairs
    jfab = mat('juryfabric', '#3c4a66', 0.85)
    riser = mat('riser', '#4a5568', 0.5)
    for sx in (-1, 1):
        box(f'Riser{sx}', (3.4, 1.2, 0.8), (sx * 4.2, 4.8, 0.4), riser, bevel=0)
        box(f'RiserEdge{sx}', (3.4, 0.03, 0.03), (sx * 4.2, 4.19, 0.8), mat('riseredge', '#ffffff', emit='#4fc8ff', strength=12), bevel=0)
    for i, (x, y, z, r) in enumerate(FIN_JURY):
        jury_chair(f'JuryChair{i}', (x, y, z - 0.5), r, jfab)
    # the key box: a clear box on a pedestal, a gold slot in the lid
    bx, by, bz = FIN_BOX
    cyl('BoxPedestal', 0.2, bz, (bx, by, bz / 2), mat('pedestal', '#c9d1dd', 0.25, 0.4), verts=48, bevel=0)
    cyl('BoxFoot', 0.38, 0.05, (bx, by, 0.025), mat('pedestal', '#c9d1dd', 0.25, 0.4), verts=48, bevel=0)
    box('KeyBox', (0.62, 0.44, 0.42), (bx, by, bz + 0.21), mat('keybox', '#bfe9ff', 0.05, 0.0, emit='#7fd6ff', strength=1.2), bevel=0)
    box('KeySlot', (0.3, 0.06, 0.012), (bx, by, bz + 0.425), mat('keyslot', '#f5c542', 0.3, 0.9), bevel=0)
    neon_eye((bx, by - 0.225, bz + 0.21), 0.09, rot=(90, 0, 0), color='#ffffff', glow='#8fe6ff')
    # the host's mark: a lit circle on the floor
    cyl('HostMark', 0.3, 0.012, (FIN_HOST[0], FIN_HOST[1], 0.012), mat('hostmark', '#ffffff', emit='#9fe4ff', strength=6), verts=48, bevel=0)
    area('StudioKey', (6, 3), (0, -0.5, 5.4), 1800, '#ffffff', rot=(-50, 0, 0))
    world('#24324a', 0.5)
    camera((0, -2.4, 2.2), (79, 0, 0), lens=19)

ROOMS = {'kitchen': room_kitchen, 'living': room_living, 'bedroom': room_bedroom, 'hoh': room_hoh, 'dr': room_dr,
         'yard': room_yard, 'storage': room_storage, 'havenot': room_havenot, 'dining': room_dining}
ROOMS.update(ARENA_ROOMS)
ROOMS.update({'studio': room_studio, 'studio-wide': room_studio_wide, 'finale': room_finale})

# ══════════════════════════════════════════════════════════════════════
# Build and render
# ══════════════════════════════════════════════════════════════════════
def build(room, theme='default', td=None):
    clear(); _MATS.clear()
    T = dict(THEMES['default'])
    if td:
        T.update(TD_LOOKS[td]['palette'])
    T.update(THEME_TD.get(theme, {}))
    SPOTS.clear()
    ROOMS[room](T)
    # the season's own things, in the room's measured spots
    for sp in SPOTS:
        fn = DRESS.get(theme, {}).get(sp['kind'])
        if fn: fn(T, sp)

def render(room, theme='default', samples=160, w=1920, h=1080, preview=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices: d.use = d.type == 'OPTIX'
    sc.cycles.samples = 48 if preview else samples
    sc.cycles.use_denoising = True
    try: sc.cycles.denoiser = 'OPTIX'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = (w // 2, h // 2) if preview else (w, h)
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.exposure = 0.15
    for look in ('AgX - Medium High Contrast', 'Medium High Contrast'):
        try: sc.view_settings.look = look; break
        except Exception: pass
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 86
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{room}{"-preview" if preview else ""}.webp')
    sc.render.filepath = path
    sc.render.use_freestyle = False
    bpy.ops.render.render(write_still=True)
    return path

# ══════════════════════════════════════════════════════════════════════
# THE TOON HOUSE — Big Brother as if it were in the Total Drama world.
# The same models, re-shaded: two or three flat bands of light per colour,
# a hard highlight on anything glossy, ink outlines (Freestyle), flat glow
# on the lights. Rendered in Eevee; written beside the real render as
# <room>-toon.webp.
# ══════════════════════════════════════════════════════════════════════
INK = '#1b1424'

def _toon(m):
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    out = nt.nodes.get('Material Output')
    if not p or not out:
        return
    L = nt.links
    base_link = p.inputs['Base Color'].links[0].from_socket if p.inputs['Base Color'].is_linked else None
    base_val = tuple(p.inputs['Base Color'].default_value)
    rough = p.inputs['Roughness'].default_value
    metal = p.inputs['Metallic'].default_value
    glass = p.inputs['Transmission Weight'].default_value > 0.5
    emit = p.inputs['Emission Strength'].default_value
    emit_col = tuple(p.inputs['Emission Color'].default_value)
    if emit > 0.5:
        e = nt.nodes.new('ShaderNodeEmission')
        e.inputs['Color'].default_value = emit_col
        e.inputs['Strength'].default_value = 2.2
        L.new(e.outputs[0], out.inputs['Surface'])
        return
    # shade bands: a diffuse read, snapped to three steps
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    band = nt.nodes.new('ShaderNodeValToRGB'); band.color_ramp.interpolation = 'CONSTANT'
    el = band.color_ramp.elements
    el[0].position, el[0].color = 0.0, (0.62, 0.6, 0.72, 1)      # shadow leans cool, like a painted cel
    el[1].position, el[1].color = 0.1, (0.86, 0.84, 0.9, 1)
    e3 = el.new(0.42); e3.color = (1.0, 1.0, 1.0, 1)
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0
    if glass:
        mul.inputs['A'].default_value = (0.72, 0.86, 0.95, 1)
    elif base_link is not None:
        L.new(base_link, mul.inputs['A'])
    else:
        c = base_val
        if metal > 0.5:   # a metal is drawn as its colour, a little lifted
            c = tuple(min(1.0, x * 1.25 + 0.05) for x in c[:3]) + (1,)
        mul.inputs['A'].default_value = c
    L.new(dif.outputs[0], s2r.inputs[0])
    L.new(s2r.outputs['Color'], band.inputs['Fac'])
    L.new(band.outputs['Color'], mul.inputs['B'])
    col = mul.outputs['Result']
    # a hard white highlight on anything glossy or metal
    if (rough < 0.35 or metal > 0.5) and m.name.split('.')[0] not in ('floor', 'splash', 'mirror', 'counter', 'glasstop'):
        gl = nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.25
        s2 = nt.nodes.new('ShaderNodeShaderToRGB')
        hi = nt.nodes.new('ShaderNodeValToRGB'); hi.color_ramp.interpolation = 'CONSTANT'
        hi.color_ramp.elements[0].color = (0, 0, 0, 1)
        hi.color_ramp.elements[1].position = 0.55; hi.color_ramp.elements[1].color = (1, 1, 1, 1)
        add = nt.nodes.new('ShaderNodeMix'); add.data_type = 'RGBA'; add.blend_type = 'SCREEN'
        add.inputs['Factor'].default_value = 0.55
        L.new(gl.outputs[0], s2.inputs[0]); L.new(s2.outputs['Color'], hi.inputs['Fac'])
        L.new(col, add.inputs['A']); L.new(hi.outputs['Color'], add.inputs['B'])
        col = add.outputs['Result']
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = 1.0
    L.new(col, em.inputs['Color'])
    L.new(em.outputs[0], out.inputs['Surface'])

def toonify(thickness=2.4):
    for m in bpy.data.materials:
        if m.use_nodes and m.users:
            _toon(m)
    noink = bpy.data.collections.get('NoInk') or bpy.data.collections.new('NoInk')
    if noink.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(noink)
    for ob in list(bpy.context.scene.collection.objects):
        if ob.name.startswith(NOINK) or (ob.parent and ob.parent.name.startswith('NeonEye')):
            noink.objects.link(ob)
    # curves (the neon) and every object get drawn with ink
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = thickness
    vl = bpy.context.view_layer
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(128)
    if not fs.linesets:
        fs.linesets.new('Ink')
    ls = fs.linesets[0]
    ls.select_by_visibility = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True; ls.select_external_contour = True
    ls.select_by_collection = True; ls.collection = noink; ls.collection_negation = 'EXCLUSIVE'
    ls.linestyle.color = hexc(INK)[:3]
    ls.linestyle.thickness = thickness

def render_toon(room, theme='default', w=1920, h=1080, preview=False):
    sc = bpy.context.scene
    toonify(1.3 if preview else 2.4)
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 32 if preview else 96
    sc.render.resolution_x, sc.render.resolution_y = (w // 2, h // 2) if preview else (w, h)
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 88
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{room}-toon{"-preview" if preview else ""}.webp')
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path

# ══════════════════════════════════════════════════════════════════════
# render_td: the Total Drama looks. build(room, theme, td='a') first.
# ══════════════════════════════════════════════════════════════════════
def _shade(hexcol, k):
    r, g, b, _ = hexc(hexcol)
    return (r * k, g * k, b * k, 1)

TD_FLAT = {'mirror': '#3d4a66', 'mirror_frame': '#2c3348', 'acrylic': '#2e3a55', 'dark': '#2e3a55', 'gap': '#3b3a44',
           'toekick': '#3b3a44', 'glasstop': '#3b3a44', 'coffeeblack': '#3d3a40', 'stoolleg': '#3d3a44', 'cord': '#3d3a44', 'cantrim': '#8a8478'}

TD_UNLIT = {'ceiling'}

def _lift(hexcol):
    r, g, b, _ = hexc(hexcol)
    if 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.02:
        return '#3b3a46'
    return hexcol

def _td_material(m, look):
    nt = m.node_tree
    key = m.name.split('.')[0]
    if key in TD_FLAT:
        m['tdcolor'] = TD_FLAT[key]; m['tdflat'] = 1
    elif m.get('tdcolor'):
        m['tdcolor'] = _lift(m['tdcolor'])
    p = nt.nodes.get('Principled BSDF'); out = nt.nodes.get('Material Output')
    if not p or not out:
        return
    L = nt.links
    flat = m.get('tdcolor')
    if key in TD_UNLIT and flat:   # ceilings are painted flat: a light's cone edge on them reads as a mistake
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = hexc(flat); e.inputs['Strength'].default_value = 0.92
        L.new(e.outputs[0], out.inputs['Surface'])
        return
    if m.get('tdemit') or p.inputs['Emission Strength'].default_value > 0.5:
        e = nt.nodes.new('ShaderNodeEmission')
        e.inputs['Color'].default_value = hexc(m.get('tdemit') or '#fff0c8')
        e.inputs['Strength'].default_value = 1.0
        L.new(e.outputs[0], out.inputs['Surface'])
        return
    glass = p.inputs['Transmission Weight'].default_value > 0.5
    base_link = p.inputs['Base Color'].links[0].from_socket if p.inputs['Base Color'].is_linked and not m.get('tdflat') else None
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    band = nt.nodes.new('ShaderNodeValToRGB'); band.color_ramp.interpolation = 'CONSTANT'
    el = band.color_ramp.elements
    stops = look['bands']
    el[0].position, el[0].color = stops[0][0], stops[0][1] + (1,)
    el[1].position, el[1].color = stops[1][0], stops[1][1] + (1,)
    for pos, c in stops[2:]:
        e = el.new(pos); e.color = c + (1,)
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0
    if glass:
        mul.inputs['A'].default_value = hexc('#cfe6f2')
    elif base_link is not None:
        L.new(base_link, mul.inputs['A'])
    elif flat:
        mul.inputs['A'].default_value = hexc(flat)
    else:
        mul.inputs['A'].default_value = tuple(p.inputs['Base Color'].default_value)
    L.new(dif.outputs[0], s2r.inputs[0]); L.new(s2r.outputs['Color'], band.inputs['Fac']); L.new(band.outputs['Color'], mul.inputs['B'])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    L.new(mul.outputs['Result'], em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])
    # the line around this thing is this thing's colour, darker
    m.line_color = _shade(flat, 0.42) if flat else (0.08, 0.06, 0.08, 1)

def render_td(room, theme='default', look='b', w=1920, h=1080, preview=False, only=None):
    L = TD_LOOKS[look]
    sc = bpy.context.scene
    # crisp shapes: no bevels (every chamfer would draw a second line), no depth of field
    for ob in sc.objects:
        for md in list(ob.modifiers):
            if md.type == 'BEVEL': ob.modifiers.remove(md)
        if ob.type == 'CAMERA': ob.data.dof.use_dof = False
    for m in bpy.data.materials:
        if m.use_nodes and m.users: _td_material(m, L)
    noink = bpy.data.collections.get('NoInk') or bpy.data.collections.new('NoInk')
    if noink.name not in sc.collection.children: sc.collection.children.link(noink)
    for ob in list(sc.collection.objects):
        if ob.name.startswith(NOINK) or (ob.parent and ob.parent.name.startswith('NeonEye')):
            noink.objects.link(ob)
    thick = L['thick'] * (0.55 if preview else 1.0)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = thick
    vl = bpy.context.view_layer; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    if not fs.linesets: fs.linesets.new('Ink')
    ls = fs.linesets[0]
    ls.select_by_visibility = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True; ls.select_external_contour = True
    ls.select_by_collection = True; ls.collection = noink; ls.collection_negation = 'EXCLUSIVE'
    st = ls.linestyle
    for md in list(st.color_modifiers): st.color_modifiers.remove(md)
    st.thickness = thick
    if L['ink'] == 'material':
        st.color = (0.1, 0.08, 0.1)
        cm = st.color_modifiers.new('fromMaterial', 'MATERIAL'); cm.material_attribute = 'LINE'; cm.blend = 'MIX'; cm.influence = 1.0
    else:
        st.color = hexc(L['ink'])[:3]
    # the room is closed, so the key is inside it: high, front-left, hard-edged
    key = bpy.data.lights.new('TDKey', 'SPOT'); key.energy = 2600; key.spot_size = math.radians(130); key.spot_blend = 0.2; key.shadow_soft_size = 0.02
    key.color = (1, 0.97, 0.9)
    # placed from the room's own walls: high, near the left wall, a little in front of the camera's subject
    ob_ = bpy.data.objects
    lx = ob_['LeftWall'].location.x + 0.5
    rx = ob_['RightWall'].location.x
    by = ob_['BackWall'].location.y
    top = ob_['Ceiling'].location.z - 0.2 if 'Ceiling' in ob_ else 4.0
    so = _link(bpy.data.objects.new('TDKey', key)); so.location = (lx, 0.2, top)
    tgt = Vector((rx * 0.25, by * 0.7, 0.0)) - so.location
    so.rotation_euler = tgt.to_track_quat('-Z', 'Y').to_euler()
    for ob in sc.objects:
        if ob.type == 'LIGHT' and ob.name != 'TDKey':
            ob.data.energy = 0.0
    # a room with a roof gets a soft ambient; the open yard keeps its sky bright
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55 if 'Ceiling' in bpy.data.objects else 1.0
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 32 if preview else 96
    sc.render.resolution_x, sc.render.resolution_y = (w // 2, h // 2) if preview else (w, h)
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 90
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{room}-td-{look}{"-" + only[0].lower() if only else ""}{"-preview" if preview else ""}.webp')
    if only:
        # a layer that sits in FRONT of the houseguests: only these objects, everything else invisible to camera
        for ob in sc.objects:
            if ob.type in ('MESH', 'CURVE', 'FONT') and not ob.name.startswith(tuple(only)) and not (ob.parent and ob.parent.name.startswith(tuple(only))):
                ob.visible_camera = False
                if ob.name not in noink.objects:
                    noink.objects.link(ob)        # and no ink for it: freestyle draws what the camera cannot see
        sc.render.film_transparent = True
        sc.render.image_settings.color_mode = 'RGBA'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.render.film_transparent = False
    sc.render.image_settings.color_mode = 'RGB'
    return path

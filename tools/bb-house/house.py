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
    m = bpy.data.materials.new(name)
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
    m = bpy.data.materials.new(name)
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

def mat_tiles(name, a, b, grout='#8f887d', scale=1.2, rough=0.35):
    m = bpy.data.materials.new(name)
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
    m = bpy.data.materials.new(name)
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

def shell(T, W=9.0, D=7.0, H=3.2, floor_mat=None, wall_mat=None):
    wall = wall_mat or mat('wall', T['wall'], 0.8)
    fl = floor_mat or mat_tiles('floor', T['floor_a'], T['floor_b'], grout='#5e584f', scale=0.75, rough=T['floor_rough'])
    box('Floor', (W + 6, D + 6, 0.1), (0, D / 2 - 1, -0.05), fl, bevel=0)
    box('BackWall', (W, 0.2, H), (0, D + 0.1, H / 2), wall, bevel=0)
    box('LeftWall', (0.2, D + 6, H), (-W / 2 - 0.1, D / 2 - 1, H / 2), wall, bevel=0)
    box('RightWall', (0.2, D + 6, H), (W / 2 + 0.1, D / 2 - 1, H / 2), wall, bevel=0)
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
    for i, y in enumerate(ys):
        box(f'MirrorFrame{i}', (0.03, w + 0.08, h + 0.08), (x - 0.01 * sgn, y, z0 + h / 2), frame, bevel=0.004)
        box(f'Mirror{i}', (0.02, w, h), (x - 0.025 * sgn, y, z0 + h / 2), glass, bevel=0)

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

    downlights(T, (-3.0, -1.0, 1.0, 3.0), (1.6, 5.4), H, power=45)
    area('CeilSoft', (6, 3), (0, 3.6, H - 0.05), 90, T['light'])
    area('Fill', (5, 2), (0, -2.0, 2.0), 150, T['fill'], rot=(-80, 0, 0))
    world(T['world'], 0.4)
    area('SlatWash', (8.5, 0.25), (0, D - 0.45, H - 0.08), 260, T['light'], rot=(28, 0, 0))
    camera((0, -1.4, 1.42), (87, 0, 0), lens=22, dof=(5.3, 4.0))

ROOMS = {'kitchen': room_kitchen}

# ══════════════════════════════════════════════════════════════════════
# Build and render
# ══════════════════════════════════════════════════════════════════════
def build(room, theme='default'):
    clear(); _MATS.clear()
    ROOMS[room](THEMES[theme])

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

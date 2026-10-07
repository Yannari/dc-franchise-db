# ══════════════════════════════════════════════════════════════════════
# tools/td-camp/camp.py — every Total Drama venue's spots, built and rendered in Blender
# ══════════════════════════════════════════════════════════════════════
#
# The stepped viewer (spec docs/superpowers/specs/2026-10-06-td-stepped-viewer-design.md §6)
# stages each camp scene at the spot the engine says it happened (js/camp-access.js
# ACCESS_PROFILES). Every spot of every venue is a render here, drawn the way the Big
# Brother house is (tools/bb-house/house.py, "TD B · Flat"): nearly flat colour, one
# hard key shadow, lines in each thing's own darker colour, nothing falls to black.
# Outdoors the key is the sun; at night it is the moon, and fires and lamps glow.
#
# Run headless (relative outdirs resolve to C:\ in headless Blender: pass absolute):
#   "/c/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b -P tools/td-camp/camp.py -- <venue|all> [spot|all] [day|night|all] [preview]
# Output: assets/sets/td/<venue>/<spot>-<day|night>.webp, 1920x1080.
#
# The camera is a TV camera: eye level, looking into the place, with open ground in
# the foreground where the viewer stands the campers.
import bpy, bmesh, math, os, sys, random
from mathutils import Vector

REPO = r'C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db'
exec(open(os.path.join(REPO, 'tools', 'bb-house', 'house.py'), encoding='utf-8').read(), globals())
OUT_TD = os.path.join(REPO, 'assets', 'sets', 'td')

# ══════════════════════════════════════════════════════════════════════
# PALETTES. A venue's colours by time of day. Skies are flat two-tone, the way
# the show paints them; nothing is pure black even at night.
# ══════════════════════════════════════════════════════════════════════
SKY = {
    'day':   {'top': '#5fb3e6', 'low': '#bfe6f5', 'fill': '#dfeefa', 'sun': (1.0, 0.96, 0.86), 'sun_e': 4.2, 'amb': 0.62},
    'night': {'top': '#1d2a52', 'low': '#3c4a7c', 'fill': '#4a5786', 'sun': (0.62, 0.7, 1.0), 'sun_e': 1.4, 'amb': 0.42},
    # sundown: the carnival's Elimination Trial (the file is still named -night; the spot only airs then)
    'dusk':  {'top': '#3a3a78', 'low': '#f29a5a', 'fill': '#c88a8a', 'sun': (1.0, 0.62, 0.4), 'sun_e': 2.2, 'amb': 0.5},
}
GREEN = {'grass': '#79b04a', 'grass2': '#6aa040', 'pine': '#2f7a4a', 'pine2': '#276a40', 'pine_far': '#3f7f6c',
         'pine_far2': '#567f8c', 'trunk': '#7a5232', 'leaf': '#4f9a3e', 'bush': '#3f8a3c'}
NIGHT_TINT = 0.55   # how much darker the painted colours are at night (the moon is weak)

def C(hexcol, tod, k=None):
    """A colour for this time of day: night darkens and cools it a little, never to black."""
    if tod == 'day':
        return hexcol
    if tod == 'dusk':
        r, g, b = (int(hexcol.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
        r, g, b = r * 0.8, g * 0.68, b * 0.72
        return '#%02x%02x%02x' % tuple(max(24, min(255, int(v))) for v in (r, g, b))
    r, g, b = (int(hexcol.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    k = NIGHT_TINT if k is None else k
    r, g, b = r * k * 0.92, g * k * 0.95, b * k * 1.12
    return '#%02x%02x%02x' % tuple(max(24, min(255, int(v))) for v in (r, g, b))

# ══════════════════════════════════════════════════════════════════════
# THE KIT. Outdoor things built from simple shapes, readable at a glance.
# ══════════════════════════════════════════════════════════════════════
_n = [0]
def uid(base):
    _n[0] += 1
    return f'{base}.{_n[0]:03d}'

def icorock(name, size, loc, color, seed=1, rot_z=0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    rnd = random.Random(seed)
    for v in bm.verts:
        v.co *= 0.8 + rnd.random() * 0.35
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me))
    ob.location = loc; ob.scale = size; ob.rotation_euler = (0, 0, math.radians(rot_z))
    me.materials.append(mat(name.split('.')[0] + 'Mat', color, rough=0.9))
    return ob

def ground(color, size=(120, 120), loc=(0, 0, 0), name='Ground'):
    return box(name, (size[0], size[1], 0.2), (loc[0], loc[1], loc[2] - 0.1), mat(name, color, rough=0.95), bevel=0)

def water(color, size=(200, 160), loc=(0, 40, -0.12), name='Water'):
    return box(name, (size[0], size[1], 0.05), loc, mat(name, color, rough=0.3), bevel=0)

def pine(loc, h=6.0, tod='day', far=False, seed=0):
    rnd = random.Random(seed)
    g1 = C(GREEN['pine_far' if far else 'pine'], tod); g2 = C(GREEN['pine_far2' if far else 'pine2'], tod)
    x, y, z = loc
    cyl(uid('Trunk'), 0.14 * h / 6, h * 0.3, (x, y, z + h * 0.15), mat('Trunk' + tod, C(GREEN['trunk'], tod)), verts=10, bevel=0)
    tiers = 3
    for i in range(tiers):
        r = (1.25 - i * 0.32) * h / 6 * (0.95 + rnd.random() * 0.12)
        hh = h * 0.36
        zc = z + h * 0.26 + i * h * 0.22 + hh / 2
        cyl(uid('PineTier'), r, hh, (x, y, zc), mat(('PineA' if i % 2 == 0 else 'PineB') + tod + ('far' if far else ''), g1 if i % 2 == 0 else g2),
            verts=9, r2=0.02, bevel=0)

def palm(loc, h=6.0, tod='day', lean=12, seed=0):
    rnd = random.Random(seed)
    x, y, z = loc
    segs = 6
    px, pz = x, z
    lean_r = math.radians(lean)
    for i in range(segs):
        seg_h = h / segs
        a = lean_r * (i / segs)
        cx = px + math.sin(a) * seg_h / 2; cz = pz + math.cos(a) * seg_h / 2
        cyl(uid('PalmTrunk'), 0.17 - i * 0.015, seg_h * 1.04, (cx, y, cz), mat('PalmTrunk' + tod, C('#a77a4a', tod)), verts=10, rot=(0, math.degrees(a), 0), bevel=0)
        px += math.sin(a) * seg_h; pz += math.cos(a) * seg_h
    for k in range(7):
        ang = k / 7 * 2 * math.pi + rnd.random() * 0.3
        fx, fy = math.cos(ang), math.sin(ang)
        fr = box(uid('Frond'), (1.9, 0.42, 0.06), (px + fx * 0.85, y + fy * 0.85, pz - 0.18), mat('Frond' + tod, C('#3f9a4a', tod)), bevel=0,
                 rot=(0, 18, math.degrees(ang)))
    sphere(uid('Coconut'), 0.16, (px + 0.1, y, pz - 0.25), mat('Coconut' + tod, C('#6b4a2a', tod)))

def bush(loc, r=0.7, tod='day', seed=0):
    rnd = random.Random(seed)
    for i in range(3):
        sphere(uid('Bush'), r * (0.7 + rnd.random() * 0.4), (loc[0] + (i - 1) * r * 0.7, loc[1] + rnd.random() * 0.3, loc[2] + r * 0.45),
               mat('Bush' + tod, C(GREEN['bush'], tod)), scale=(1, 1, 0.75))

def treeline(y, x0=-40, x1=40, h=7.0, tod='day', far=True, seed=1, z=0.0, gap=2.6):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        pine((x, y + rnd.random() * 2.5, z), h * (0.75 + rnd.random() * 0.5), tod, far=far, seed=int(x * 7) + seed)
        x += gap * (0.7 + rnd.random() * 0.6)

def hills(y, color, tod, n=5, h=10, seed=3, x0=-70, x1=70):
    rnd = random.Random(seed)
    for i in range(n):
        x = x0 + (x1 - x0) * (i + rnd.random() * 0.5) / n
        sphere(uid('Hill'), 1.0, (x, y, -h * 0.25), mat('Hill' + str(i % 2) + tod, C(color if i % 2 == 0 else _mix(color, '#ffffff', 0.08), tod)),
               scale=(14 + rnd.random() * 8, 6, h * (0.6 + rnd.random() * 0.5)))

def _mix(a, b, t):
    pa = [int(a.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]; pb = [int(b.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(int(pa[i] + (pb[i] - pa[i]) * t) for i in range(3))

def log_seat(loc, length=2.2, rot_z=0, tod='day'):
    cyl(uid('Log'), 0.24, length, (loc[0], loc[1], loc[2] + 0.24), mat('Log' + tod, C('#8a5a34', tod)), verts=12, rot=(0, 90, rot_z), bevel=0)

def stump(loc, r=0.32, h=0.5, tod='day'):
    cyl(uid('Stump'), r, h, (loc[0], loc[1], loc[2] + h / 2), mat('Stump' + tod, C('#8f5e36', tod)), verts=12, bevel=0)
    cyl(uid('StumpTop'), r * 0.96, 0.02, (loc[0], loc[1], loc[2] + h + 0.01), mat('StumpTop' + tod, C('#d9b07a', tod)), verts=12, bevel=0)

def patch(name, r, loc, color, tod, seed=0, sx=1.0, sy=1.0):
    """A worn patch of ground: round with a ragged edge, a hair above the grass."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    rnd = random.Random(seed); n = 28
    vs = [bm.verts.new((math.cos(i / n * 2 * math.pi) * r * sx * (0.88 + rnd.random() * 0.18),
                        math.sin(i / n * 2 * math.pi) * r * sy * (0.88 + rnd.random() * 0.18), 0)) for i in range(n)]
    bm.faces.new(vs); bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); ob.location = (loc[0], loc[1], loc[2] + 0.015)
    me.materials.append(mat(name.split('.')[0] + tod, C(color, tod)))
    return ob

def plank_deck(name, size, loc, tod, color='#b98552', seam='#7a5232'):
    m = mat_planks(name + tod, C(color, tod), C(_mix(color, '#000000', 0.08), tod), seam=C(seam, tod), scale=0.9)
    return box(name, size, loc, m, bevel=0)

def cabin(loc, w=5.0, d=4.0, h=2.6, wall='#a8743f', roof='#6a4a3a', door='#7a3e2a', rot_z=0, tod='day', sign=None, sign_col='#e2ab3a', name='Cabin'):
    x, y, z = loc
    g = _group(uid(name), (x, y, z), rot_z)
    walls = mat_planks(name + 'Wall' + tod, C(wall, tod), C(_mix(wall, '#000000', 0.1), tod), seam=C(_mix(wall, '#000000', 0.35), tod), scale=0.55)
    body = box(uid(name + 'Body'), (w, d, h), (0, 0, h / 2), walls, bevel=0); _child(g, body)
    rm = mat(name + 'Roof' + tod, C(roof, tod), rough=0.8)
    for s in (-1, 1):
        rf = box(uid(name + 'Roof'), (w + 0.6, d / 2 * 1.25, 0.18), (0, s * d * 0.27, h + 0.62), rm, bevel=0, rot=(s * -28, 0, 0)); _child(g, rf)
    gable = mat(name + 'Gable' + tod, C(_mix(wall, '#ffffff', 0.08), tod))
    for sx in (-1, 1):
        me = bpy.data.meshes.new('Gable'); bm = bmesh.new()
        v = [bm.verts.new(p) for p in ((sx * w / 2, -d / 2, h), (sx * w / 2, d / 2, h), (sx * w / 2, 0, h + 1.15))]
        bm.faces.new(v); bm.to_mesh(me); bm.free()
        go = _link(bpy.data.objects.new(uid('Gable'), me)); me.materials.append(gable); _child(g, go)
    dr = box(uid(name + 'Door'), (0.95, 0.08, 1.9), (0, -d / 2 - 0.03, 0.95), mat(name + 'Door' + tod, C(door, tod)), bevel=0); _child(g, dr)
    win = mat(name + 'Win' + tod, C('#9fd0ea', tod) if tod == 'day' else '#ffd27a', emit=None if tod == 'day' else '#ffd27a', strength=0 if tod == 'day' else 2.0)
    for wx in (-w * 0.3, w * 0.3):
        wo = box(uid(name + 'Window'), (0.85, 0.08, 0.7), (wx, -d / 2 - 0.03, 1.5), win, bevel=0); _child(g, wo)
        fr = box(uid('Trim'), (1.0, 0.06, 0.85), (wx, -d / 2 - 0.01, 1.5), mat('Trim' + tod, C('#efe4c9', tod)), bevel=0); _child(g, fr)
    st = plank_deck(uid(name + 'Porch'), (w * 0.6, 1.2, 0.25), (0, -d / 2 - 0.6, 0.125), tod); _child(g, st)
    if sign:
        sg = box(uid(name + 'Sign'), (w * 0.55, 0.06, 0.45), (0, -d / 2 - 0.06, h + 0.45), mat(name + 'Sign' + tod, C(sign_col, tod)), bevel=0); _child(g, sg)
        tx = text_obj(uid('SignText'), sign, (0, -d / 2 - 0.1, h + 0.45), 0.26, C('#3a2a1c', tod)); _child(g, tx)
    return g

def text_obj(name, text, loc, size, color, rot=(90, 0, 0), extrude=0.01):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = text; cu.size = size; cu.extrude = extrude
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    ob = _link(bpy.data.objects.new(name, cu)); ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    cu.materials.append(mat(name.split('.')[0] + 'Mat' + color, color))
    return ob

def campfire(loc, tod='day', r=0.7, lit=None):
    lit = (tod == 'night') if lit is None else lit
    x, y, z = loc
    for i in range(10):
        a = i / 10 * 2 * math.pi
        icorock(uid('FireStone'), (0.22, 0.2, 0.15), (x + math.cos(a) * r, y + math.sin(a) * r, z + 0.1), C('#8e8a86', tod), seed=i)
    for a in (20, 80, 140):
        cyl(uid('FireLog'), 0.08, 1.0, (x, y, z + 0.18), mat('FireLog' + tod, C('#6b4428', tod)), verts=8, rot=(0, 70, a), bevel=0)
    if lit:
        # tongues of flame: an outer orange ring of cones, a yellow core, a white heart
        rnd = random.Random(int(x * 13 + y * 7))
        for i in range(7):
            a = i / 7 * 2 * math.pi + rnd.random() * 0.4
            hh = 0.9 + rnd.random() * 0.7
            ob = cyl(uid('Flame'), 0.2, hh, (x + math.cos(a) * 0.22, y + math.sin(a) * 0.22, z + 0.25 + hh / 2),
                     mat('FlameO', '#ff6a1f', emit='#ff6a1f', strength=3.0), verts=8, r2=0.0, bevel=0,
                     rot=(math.cos(a) * 9, math.sin(a) * 9, 0))
            ob.visible_shadow = False
        for i in range(4):
            a = i / 4 * 2 * math.pi + 0.5
            hh = 0.8 + rnd.random() * 0.5
            ob = cyl(uid('Flame'), 0.17, hh, (x + math.cos(a) * 0.1, y + math.sin(a) * 0.1, z + 0.3 + hh / 2),
                     mat('FlameY', '#ffc23a', emit='#ffc23a', strength=3.0), verts=8, r2=0.0, bevel=0)
            ob.visible_shadow = False
        ob = cyl(uid('Flame'), 0.12, 0.55, (x, y, z + 0.55), mat('FlameW', '#fff3b0', emit='#fff3b0', strength=3.0), verts=8, r2=0.0, bevel=0)
        ob.visible_shadow = False
        cyl(uid('Ember'), r * 0.85, 0.02, (x, y, z + 0.03), mat('Ember', '#c8521f', emit='#c8521f', strength=1.2), verts=24, bevel=0)
        point(uid('FireLight'), (x, y, z + 1.3), 2600, '#ff9a4a', radius=0.4)

def string_lights(p0, p1, n=14, sag=0.6, tod='night', colors=('#ffd27a', '#ff8a6a', '#8ad0ff', '#b8ff8a')):
    for i in range(n + 1):
        t = i / n
        x = p0[0] + (p1[0] - p0[0]) * t; y = p0[1] + (p1[1] - p0[1]) * t
        zz = p0[2] + (p1[2] - p0[2]) * t - sag * 4 * t * (1 - t)
        col = colors[i % len(colors)]
        sphere(uid('Bulb'), 0.07, (x, y, zz), mat('Bulb' + col, col, emit=col if tod == 'night' else None, strength=4.0 if tod == 'night' else 0))

def post(loc, h=3.0, tod='day', r=0.08, color='#7a5232'):
    cyl(uid('Post'), r, h, (loc[0], loc[1], loc[2] + h / 2), mat('Post' + color + tod, C(color, tod)), verts=10, bevel=0)

def lamp_post(loc, h=3.2, tod='day', glow='#ffd27a'):
    post(loc, h, tod, r=0.06, color='#4a4a52')
    sphere(uid('LampGlobe'), 0.22, (loc[0], loc[1], loc[2] + h + 0.1), mat('LampGlobe' + tod, '#fff1c8' if tod == 'night' else '#e9e4d6', emit='#fff1c8' if tod == 'night' else None, strength=4 if tod == 'night' else 0))
    if tod == 'night':
        point(uid('LampLight'), (loc[0], loc[1], loc[2] + h), 280, glow, radius=0.2)

def boat(loc, rot_z=0, tod='day', hull='#e8e2d4', stripe='#c8463c', cabin_col='#f3efe4', name='Boat'):
    g = _group(uid(name), loc, rot_z)
    me = bpy.data.meshes.new(name + 'Hull'); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 9.0; v.co.y *= 3.2; v.co.z *= 1.4
        if v.co.x > 0: v.co.y *= 0.35          # the bow narrows
        if v.co.z < 0: v.co.y *= 0.7
    bm.to_mesh(me); bm.free()
    h = _link(bpy.data.objects.new(uid(name + 'Hull'), me)); h.location = (0, 0, 0.35); me.materials.append(mat(name + 'Hull' + tod, C(hull, tod)))
    _child(g, h)
    _child(g, box(uid(name + 'Stripe'), (8.2, 3.0, 0.24), (-0.3, 0, 0.75), mat(name + 'Stripe' + tod, C(stripe, tod)), bevel=0))
    _child(g, box(uid(name + 'Cabin'), (3.4, 2.2, 1.7), (-1.8, 0, 1.95), mat(name + 'Cabin' + tod, C(cabin_col, tod)), bevel=0))
    _child(g, box(uid(name + 'CabinWin'), (3.44, 1.8, 0.45), (-1.8, 0, 2.3), mat(name + 'Win' + tod, C('#3f5f98', tod) if tod == 'day' else '#ffd27a',
              emit=None if tod == 'day' else '#ffd27a', strength=0 if tod == 'day' else 2), bevel=0))
    return g

def outhouse(loc, rot_z=0, tod='day'):
    g = _group(uid('Outhouse'), loc, rot_z)
    wood = mat_planks('OuthouseWall' + tod, C('#9a6a3a', tod), C('#8a5c30', tod), seam=C('#5a3a1e', tod), scale=0.8)
    _child(g, box(uid('OuthouseBody'), (1.4, 1.4, 2.3), (0, 0, 1.15), wood, bevel=0))
    _child(g, box(uid('OuthouseRoof'), (1.7, 1.8, 0.14), (0, 0.05, 2.42), mat('OuthouseRoof' + tod, C('#5a4a3a', tod)), bevel=0, rot=(-10, 0, 0)))
    _child(g, box(uid('OuthouseDoor'), (0.9, 0.06, 1.9), (0, -0.72, 0.98), mat('OuthouseDoor' + tod, C('#7a5232', tod)), bevel=0))
    _child(g, text_obj(uid('Moon'), 'C', (0, -0.76, 1.65), 0.3, C('#3a2a1c', tod)))
    return g

# ══════════════════════════════════════════════════════════════════════
# SETTING THE SCENE: sky, light, camera.
# ══════════════════════════════════════════════════════════════════════
def sky(tod):
    s = SKY[tod]
    w = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    lp = nt.nodes.new('ShaderNodeLightPath')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    grad = _ramp(nt, [(0.0, s['low']), (0.45, s['top']), (1.0, s['top'])])
    sky_bg = nt.nodes.new('ShaderNodeBackground'); sky_bg.inputs['Strength'].default_value = 1.0
    fill_bg = nt.nodes.new('ShaderNodeBackground'); fill_bg.inputs['Color'].default_value = hexc(s['fill']); fill_bg.inputs['Strength'].default_value = s['amb']
    mix = nt.nodes.new('ShaderNodeMixShader')
    L = nt.links
    L.new(tc.outputs['Generated'], sep.inputs[0]); L.new(sep.outputs['Z'], grad.inputs['Fac'])
    L.new(grad.outputs['Color'], sky_bg.inputs['Color'])
    L.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
    L.new(fill_bg.outputs[0], mix.inputs[1]); L.new(sky_bg.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs['Surface'])
    if tod == 'dusk':
        sphere('Moon', 9.0, (50, 160, 6), mat('SunsetMat', '#ffb070', emit='#ffb070', strength=3))
    if tod == 'night':
        rnd = random.Random(7)
        for i in range(70):
            a = rnd.uniform(-1.2, 1.2); e = rnd.uniform(0.12, 0.7)
            d = 160
            sphere(uid('Star'), 0.25 + rnd.random() * 0.25, (math.sin(a) * d, math.cos(a) * d, math.sin(e) * d),
                   mat('Star', '#fff6d8', emit='#fff6d8', strength=6))
        sphere('Moon', 5.0, (-60, 140, 70), mat('MoonMat', '#fff4cf', emit='#fff4cf', strength=3))

def sun(tod, azimuth=-35, elevation=48):
    s = SKY[tod]
    ld = bpy.data.lights.new('TDSun', 'SUN'); ld.energy = s['sun_e']; ld.color = s['sun']; ld.angle = math.radians(0.6)
    ob = _link(bpy.data.objects.new('TDSun', ld))
    ob.rotation_euler = (math.radians(90 - elevation), 0, math.radians(azimuth))
    return ob

def tv_camera(loc=(0, -11, 1.7), look=(0, 6, 1.2), lens=28):
    cam = camera(loc, (0, 0, 0), lens=lens)
    d = Vector(look) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return cam

def render_spot(venue, spot, tod, preview=False, w=1920, h=1080):
    sc = bpy.context.scene
    for ob in sc.objects:
        for md in list(ob.modifiers):
            if md.type == 'BEVEL': ob.modifiers.remove(md)
        if ob.type == 'CAMERA': ob.data.dof.use_dof = False
    L = dict(TD_LOOKS['b'])
    for m in bpy.data.materials:
        if m.use_nodes and m.users: _td_material(m, L)
    noink = bpy.data.collections.get('NoInk') or bpy.data.collections.new('NoInk')
    if noink.name not in sc.collection.children: sc.collection.children.link(noink)
    painted = PAINT['on']
    for ob in list(sc.collection.objects):
        if painted:
            if not ob.get('ink'): noink.objects.link(ob)
            continue
        if ob.name.startswith(NOINK + ('Star', 'Moon', 'Flame', 'Hill', 'Ground', 'Water', 'PineTier', 'Frond', 'Bush', 'Ember', 'Fly', 'Bulb', 'Leaf')) \
                or (ob.name.startswith('Pine') and 'far' in (ob.active_material.name if ob.active_material else '')):
            noink.objects.link(ob)
    thick = L['thick'] * (0.55 if preview else 1.0) * (0.7 if painted else 1.0)
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
    st.thickness = thick; st.color = (0.1, 0.08, 0.1)
    cm = st.color_modifiers.new('fromMaterial', 'MATERIAL'); cm.material_attribute = 'LINE'; cm.blend = 'MIX'; cm.influence = 1.0
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 24 if preview else 80
    sc.render.resolution_x, sc.render.resolution_y = (w // 2, h // 2) if preview else (w, h)
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 88
    d = os.path.join(OUT_TD, venue); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{spot}-{tod}{"-preview" if preview else ""}.webp')
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path

# ══════════════════════════════════════════════════════════════════════
# HOSTED CAMP — Camp Wawanakwa (Total Drama Island). A lake camp: log cabins,
# a mess hall, the dock and the Boat of Losers, the campfire pit, pine forest.
# ══════════════════════════════════════════════════════════════════════
LAKE = '#4f9ccf'

def camp_backdrop(tod, lake=True, far_y=34):
    ground(C(GREEN['grass'], tod))
    if lake:
        water(C(LAKE, tod), loc=(0, far_y + 40, -0.12))
    hills(far_y + 75, '#5c8f86', tod, n=6, h=16, seed=2)
    treeline(far_y, -60, 60, 9, tod, far=True, seed=5)

def hc_dock(tod, shame=False):
    """The dock, looking out along it to the lake, the Boat of Losers moored at the far end.
    shame=True is the Dock of Shame at night: the walk to the boat, its lights on."""
    ground(C(GREEN['grass'], tod), size=(120, 20), loc=(0, -14, 0))
    patch('Sand', 9, (0, -2.5, 0), '#e2c98f', tod, seed=5, sx=6, sy=0.6)
    water(C(LAKE, tod), size=(240, 220), loc=(0, 105, -0.15))
    hills(170, '#5c8f86', tod, n=8, h=26, seed=4, x0=-140, x1=140)
    treeline(135, -130, 130, 13, tod, far=True, seed=8, gap=4.5)
    # the dock runs straight out from the shore in front of the camera
    plank_deck('Dock', (3.4, 34, 0.32), (0, 15, 0.42), tod)
    for yy in range(-1, 33, 3):
        for xx in (-1.55, 1.55):
            post((xx, yy, -1.6), 2.6, tod, r=0.13, color='#6b4a2e')
    boat((4.6, 33.0, -0.1), rot_z=90, tod=tod)
    if shame:
        for yy in (6, 14, 22, 30):
            for xx in (-1.6, 1.6):
                lamp_post((xx, yy, 0.58), 1.6, tod)
    for i, (x, y) in enumerate(((-8, -9), (-12, -7), (-16, -10), (8, -8), (12, -10), (16, -7))):
        pine((x, y, 0), 7 + (i % 3) * 0.8, tod, seed=i)
    bush((-5.5, -4.5, 0), 0.7, tod, seed=1); bush((5.8, -4.0, 0), 0.6, tod, seed=2)
    icorock('Rock', (0.7, 0.5, 0.4), (3.6, -1.0, 0.1), C('#9a958c', tod), seed=2)
    icorock('Rock', (0.5, 0.4, 0.3), (-3.4, -0.4, 0.05), C('#9a958c', tod), seed=5)
    sky(tod); sun(tod, azimuth=-40, elevation=40 if tod == 'day' else 28)
    tv_camera((-2.4, -9.0, 2.6), (0.8, 22, 0.2), lens=30)

def hc_shame(tod):
    hc_dock('night', shame=True)

def hc_campfire(tod):
    camp_backdrop(tod, lake=True, far_y=30)
    patch('Dirt', 5.2, (0, 3.6, 0), '#c79a62', tod, seed=3, sy=0.8)
    campfire((0, 4.0, 0.02), tod, r=0.75)
    for i in range(9):
        a = math.radians(15 + i * 18.75)       # the back half of the ring; the front stays open for the campers
        stump((math.cos(a) * 3.4, 4.0 + math.sin(a) * 2.6, 0.02), tod=tod)
    for x in (-4.2, 4.2):
        log_seat((x, 2.2, 0.02), 2.4, rot_z=70 if x < 0 else -70, tod=tod)
    for i, x in enumerate((-12, -16, -9, 11, 15, 18)):
        pine((x, 9 + (i % 3) * 3, 0), 8 + (i % 2), tod, seed=10 + i)
    sky(tod); sun(tod, azimuth=-30, elevation=38 if tod == 'day' else 28)
    tv_camera((0, -5.2, 1.65), (0, 6, 0.8), lens=26)

def interior(W, D, H, wall, floor, ceiling, tod='day', floor_kind='planks', wall_kind='planks'):
    """A room open to the camera: floor, back wall, two side walls, a ceiling."""
    fm = mat_planks('Floor', floor, _mix(floor, '#000000', 0.08), seam=_mix(floor, '#000000', 0.35), scale=0.7) if floor_kind == 'planks' \
        else mat('Floor', floor, rough=0.8)
    box('Floor', (W, D, 0.2), (0, D / 2, -0.1), fm, bevel=0)
    wm = mat_planks('Wall', wall, _mix(wall, '#000000', 0.06), seam=_mix(wall, '#000000', 0.3), scale=0.45) if wall_kind == 'planks' \
        else mat('Wall', wall, rough=0.8)
    box('BackWall', (W, 0.2, H), (0, D, H / 2), wm, bevel=0)
    box('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2), wm, bevel=0)
    box('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2), wm, bevel=0)
    box('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), mat('ceiling', ceiling), bevel=0)


def indoor_light(W, D, H, color='#fff0c8', power=1800, x=-0.3, fill='#e8eefc', amb=0.55):
    key = bpy.data.lights.new('TDKey', 'SPOT'); key.energy = power; key.spot_size = math.radians(130); key.spot_blend = 0.2
    key.shadow_soft_size = 0.02; key.color = hexc(color)[:3]
    so = _link(bpy.data.objects.new('TDKey', key)); so.location = (-W / 2 + 0.6 + x, 0.4, H - 0.2)
    so.rotation_euler = (Vector((W * 0.15, D * 0.75, 0)) - so.location).to_track_quat('-Z', 'Y').to_euler()
    w = bpy.context.scene.world or bpy.data.worlds.new('World'); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    bg = nt.nodes.new('ShaderNodeBackground'); out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0], out.inputs['Surface'])
    bg.inputs['Color'].default_value = hexc(fill); bg.inputs['Strength'].default_value = amb


def table(name, loc, length=3.6, width=0.9, h=0.78, top='#b98552', legs='#7a5232', rot_z=0):
    g = _group(uid(name), loc, rot_z)
    _child(g, box(uid(name + 'Top'), (length, width, 0.08), (0, 0, h), mat(name + 'Top', top), bevel=0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            _child(g, box(uid(name + 'Leg'), (0.08, 0.08, h), (sx * (length / 2 - 0.15), sy * (width / 2 - 0.1), h / 2), mat(name + 'Leg', legs), bevel=0))
    return g


def bench(loc, length=3.4, rot_z=0, color='#9a6a3a'):
    g = _group(uid('Bench'), loc, rot_z)
    _child(g, box(uid('BenchTop'), (length, 0.35, 0.07), (0, 0, 0.46), mat('BenchTop', color), bevel=0))
    for sx in (-1, 1):
        _child(g, box(uid('BenchLeg'), (0.07, 0.3, 0.46), (sx * (length / 2 - 0.2), 0, 0.23), mat('BenchLeg', _mix(color, '#000000', 0.2)), bevel=0))


def hc_mess(tod):
    """The mess hall: long tables and benches, Chef's serving hatch at the back."""
    W, D, H = 12.0, 9.0, 3.6
    interior(W, D, H, '#b48250', '#9a6a3e', '#8a5c34')
    box('Hatch', (4.2, 0.25, 1.3), (0, D - 0.05, 2.0), mat('HatchDark', '#5a4030'), bevel=0)
    box('Counter', (4.6, 0.7, 1.05), (0, D - 0.5, 0.52), mat('Counter', '#7a5232'), bevel=0)
    box('CounterTop', (4.8, 0.8, 0.08), (0, D - 0.5, 1.08), mat('CounterTop', '#c9c4ba'), bevel=0)
    for x in (-1.4, -0.4, 0.6, 1.5):
        cyl(uid('Pot'), 0.22, 0.35, (x, D - 0.5, 1.3), mat('Pot', '#9aa3ad'), verts=16, bevel=0)
    box('Menu', (2.2, 0.06, 1.2), (-3.9, D - 0.12, 2.1), mat('MenuBoard', '#3f4a3e'), bevel=0)
    text_obj('MenuText', 'TODAY:\nSLOP', (-3.9, D - 0.17, 2.15), 0.32, '#f3efe4')
    for x in (-3.6, 3.6):
        table('Table', (x, 3.6, 0), 3.8, 1.0)
        bench((x, 2.75, 0), 3.6); bench((x, 4.45, 0), 3.6)
    table('Table', (0, 6.2, 0), 3.0, 1.0); bench((0, 5.4, 0), 2.8); bench((0, 7.0, 0), 2.8)
    for x in (-5.95, 5.95):
        box(uid('Window'), (0.08, 1.4, 1.0), (x * 0.999, 4.0, 2.1), mat('MessWin', '#9fd0ea'), bevel=0)
    for x in (-2.5, 2.5):
        cyl(uid('Lamp'), 0.3, 0.25, (x, 4.0, H - 0.3), mat('LampShade', '#e2ab3a', emit='#fff1c8', strength=1.5), verts=16, r2=0.12, bevel=0)
    indoor_light(W, D, H)
    tv_camera((0.0, -1.2, 1.7), (0, 9, 1.3), lens=24)


def hc_confessional(tod):
    """The confession cam: inside the outhouse, looking at the back wall from the camera on the door."""
    W, D, H = 2.4, 2.9, 2.6
    interior(W, D, H, '#9a6a3a', '#7a5232', '#6b4a2e')
    box('Seat', (1.0, 0.7, 0.55), (0, D - 0.4, 0.27), mat('SeatBox', '#8a5c30'), bevel=0)
    cyl('ToiletRing', 0.26, 0.04, (0, D - 0.42, 0.57), mat('ToiletRing', '#e9e4d6'), verts=24, bevel=0)
    cyl('Roll', 0.09, 0.14, (0.85, D - 0.1, 1.0), mat('Roll', '#f6f3ea'), verts=16, rot=(0, 90, 0), bevel=0)
    box('OWindow', (0.5, 0.06, 0.35), (-0.55, D - 0.05, 1.95), mat('OWin', '#bfe6f5'), bevel=0)
    box('FlyPaper', (0.06, 0.02, 0.7), (0.7, D - 0.12, 2.1), mat('FlyPaper', '#e2c94f'), bevel=0)
    for i in range(6):
        sphere(uid('Fly'), 0.025, (0.68 + (i % 2) * 0.03, D - 0.14, 1.85 + i * 0.09), mat('Fly', '#2e2a2a'))
    text_obj('Carving', 'XX', (-0.7, D - 0.11, 1.4), 0.16, '#5a3a1e')
    indoor_light(W, D, H, power=420, x=0.0, amb=0.62)
    tv_camera((0.0, 0.05, 1.6), (0, D, 0.95), lens=16)


def hc_cabins(tod):
    """The cabins: two log cabins facing the camera across a path."""
    camp_backdrop(tod, lake=False, far_y=26)
    patch('Path', 3.0, (0, 2, 0), '#c9a26e', tod, seed=6, sx=1.0, sy=4.5)
    cabin((-6.0, 7.0, 0), 6.0, 5.0, 2.8, wall='#a8743f', roof='#4f6a8a', tod=tod)
    cabin((6.0, 7.0, 0), 6.0, 5.0, 2.8, wall='#a8743f', roof='#8a4a3a', tod=tod)
    for i, x in enumerate((-13, -16, 12, 15, 0)):
        pine((x, 14 + (i % 2) * 3, 0), 8 + i % 3, tod, seed=20 + i)
    bush((-3.0, 3.5, 0), 0.6, tod, seed=4); bush((3.2, 3.6, 0), 0.55, tod, seed=5)
    if tod == 'night':
        string_lights((-3, 4.4, 2.6), (3, 4.4, 2.6), n=12, sag=0.5)
    sky(tod); sun(tod, azimuth=-35, elevation=44 if tod == 'day' else 30)
    tv_camera((0, -9.5, 1.7), (0, 8, 1.3), lens=27)


def hc_grounds(tod):
    """The camp grounds: open grass, the cabins to either side, the mess hall beyond, the flagpole."""
    camp_backdrop(tod, lake=True, far_y=30)
    cabin((-9.5, 9.0, 0), 5.5, 4.5, 2.7, wall='#a8743f', roof='#4f6a8a', rot_z=25, tod=tod)
    cabin((10.5, 10.0, 0), 5.5, 4.5, 2.7, wall='#a8743f', roof='#8a4a3a', rot_z=-25, tod=tod)
    cabin((0.5, 19.0, 0), 11.0, 7.0, 3.6, wall='#9c6a3c', roof='#5a4a3a', tod=tod, sign='MESS HALL', name='MessHall')
    post((3.5, 6.5, 0), 7.5, tod, r=0.07, color='#c9c4ba')
    box('Flag', (1.4, 0.04, 0.9), (4.25, 6.5, 7.0), mat('Flag' + tod, C('#d65a6c', tod)), bevel=0)
    patch('Path', 2.4, (0, 4, 0), '#c9a26e', tod, seed=8, sx=1.0, sy=6.0)
    for i, x in enumerate((-16, -19, 17, 20)):
        pine((x, 6 + i * 2, 0), 8 + i % 2, tod, seed=30 + i)
    bush((-4.2, 2.0, 0), 0.55, tod, seed=6); bush((5.0, 1.5, 0), 0.6, tod, seed=7)
    stump((-2.8, 1.5, 0), tod=tod)
    if tod == 'night':
        lamp_post((-3.2, 8.0, 0), 3.2, tod); lamp_post((3.0, 12.0, 0), 3.2, tod)
    sky(tod); sun(tod, azimuth=-30, elevation=44 if tod == 'day' else 30)
    tv_camera((0, -9.0, 1.75), (0, 12, 1.6), lens=26)


def trail_mesh(pts, color, tod, w0=1.8, taper=0.18, name='Trail'):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        wdt = max(0.5, w0 - i * taper)
        left.append(bm.verts.new((x - wdt, y, 0.02))); right.append(bm.verts.new((x + wdt, y, 0.02)))
    for i in range(len(pts) - 1):
        bm.faces.new((left[i], right[i], right[i + 1], left[i + 1]))
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); me.materials.append(mat(name + tod, C(color, tod)))
    return ob


def hc_trail(tod):
    """The forest trail: a dirt path winding away between pines."""
    ground(C('#5f9a3e', tod))
    hills(70, '#5c8f86', tod, n=5, h=14, seed=9)
    rnd = random.Random(11)
    trail_mesh([(0, -6), (0.4, 2), (-0.8, 9), (0.6, 16), (-0.2, 24), (0.8, 32)], '#b98e5c', tod)
    for y in range(-2, 40, 3):
        for side in (-1, 1):
            x = side * (3.2 + rnd.random() * 4) + (0.3 if y % 2 else -0.3)
            pine((x, y + rnd.random() * 2, 0), 7 + rnd.random() * 4, tod, seed=y * 3 + side)
    for i in range(6):
        bush((rnd.choice((-1, 1)) * (2.3 + rnd.random() * 1.2), 2 + i * 4.5, 0), 0.5, tod, seed=40 + i)
        icorock(uid('Rock'), (0.35, 0.3, 0.25), (rnd.choice((-1, 1)) * (2.0 + rnd.random()), 1 + i * 5, 0.05), C('#9a958c', tod), seed=i)
    sky(tod); sun(tod, azimuth=-25, elevation=55 if tod == 'day' else 35)
    tv_camera((0.2, -8.5, 1.7), (0, 20, 1.2), lens=26)


def host_stand(loc, plate_items='marshmallow', tod='night'):
    """The host's stand with the plate of what keeps you in the game."""
    x, y, z = loc
    box('HostStand', (1.0, 0.6, 1.1), (x, y, z + 0.55), mat('HostStand', C('#7a5232', tod)), bevel=0)
    cyl('Plate', 0.38, 0.04, (x, y, z + 1.14), mat('Plate', C('#e9e4d6', tod)), verts=24, bevel=0)
    for i in range(7):
        a = i / 7 * 2 * math.pi
        if plate_items == 'marshmallow':
            cyl(uid('Marshmallow'), 0.07, 0.11, (x + math.cos(a) * 0.2, y + math.sin(a) * 0.2, z + 1.21), mat('Marshmallow', '#fbf7ee'), verts=12, bevel=0)


def hc_ceremony(tod):
    """The campfire ceremony at night: stumps round the fire, the host's stand with the marshmallows."""
    hc_campfire('night')
    host_stand((2.3, 7.2, 0))
    point(uid('StandLight'), (2.3, 6.4, 2.2), 260, '#ffd9a0', radius=0.2)
    for x in (-2.0, 3.6):
        cyl(uid('Torch'), 0.06, 2.0, (x, 7.6, 1.0), mat('TorchPole', '#6b4428'), verts=8, bevel=0)
        ob = cyl(uid('Flame'), 0.16, 0.5, (x, 7.6, 2.25), mat('FlameO', '#ff6a1f', emit='#ff6a1f', strength=3.0), verts=8, r2=0.0, bevel=0)
        ob.visible_shadow = False
        point(uid('TorchLight'), (x, 7.4, 2.3), 380, '#ffae5a', radius=0.2)

SCENES = {
    'hosted-camp': {'communal-grounds': hc_grounds, 'cabins': hc_cabins, 'mess-hall': hc_mess, 'dock': hc_dock,
                    'campfire': hc_campfire, 'forest-trail': hc_trail, 'confessional': hc_confessional,
                    'ceremony': hc_ceremony, 'exit': hc_shame},
}
# Spots seen by day and by night. Indoor spots render once; the ceremony and the exit are always at night.
OUTDOOR = {'hosted-camp': {'communal-grounds', 'cabins', 'dock', 'campfire', 'forest-trail'}}
NIGHT_ONLY = {'ceremony', 'exit'}

# The painted look (the show's backgrounds): materials, cut-outs, sky. See paint_kit.py.
exec(open(os.path.join(REPO, 'tools', 'td-camp', 'paint_kit.py'), encoding='utf-8').read(), globals())

# Every other venue lives in its own file (venues/<venue>.py) and adds itself to SCENES / OUTDOOR.
import glob as _glob
for _vf in sorted(_glob.glob(os.path.join(REPO, 'tools', 'td-camp', 'venues', '*.py'))):
    exec(open(_vf, encoding='utf-8').read(), globals())

def run(venue, spot='all', tods='all', preview=False):
    out = []
    venues = SCENES if venue == 'all' else {venue: SCENES[venue]}
    for v, spots in venues.items():
        for s, fn in spots.items():
            if spot != 'all' and s != spot: continue
            both = ('day', 'night') if s in OUTDOOR.get(v, set()) else (('night',) if s in NIGHT_ONLY else ('day',))
            for tod in both if tods == 'all' else (tods,):
                clear(); _MATS.clear(); _n[0] = 0; PAINT['on'] = False
                for c in list(bpy.data.collections): bpy.data.collections.remove(c)
                fn(tod)
                out.append(render_spot(v, s, tod, preview=preview))
                print('RENDERED', out[-1])
    return out

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    run(argv[0] if argv else 'hosted-camp', argv[1] if len(argv) > 1 else 'all', argv[2] if len(argv) > 2 else 'all', 'preview' in argv)

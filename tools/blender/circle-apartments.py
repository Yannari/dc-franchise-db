"""The Circle's twelve apartments, rendered in Blender (5.1, EEVEE).

Run inside Blender through the MCP bridge:
    exec(open(r'<repo>/tools/blender/circle-apartments.py').read())
    for key in ROOMS: render(key, open_door=False); render(key, open_door=True)

Every apartment is its own place (2026-10-02; user: the first set was "just a
recolor of the same deco"), drawn in the cartoon look of the franchise avatars
and the BB house (tools/bb-house/house.py "TD B flat"): one flat colour per
thing, darkened only where a shadow falls, an outline in the thing's own darker
colour, no bevels, no gradients.

What stays the same in all twelve, because the viewer lays its UI over it
(js/vp-ci/visit-stage.js reads these as percentages of the frame, ROOM_GEO):
the camera, the door on the left (with its number plate) and the TV.

Traps (same as circle-hallway.py): only ever touch the scene named SCENE, never
another scene in the open file; build boxes from their size, never with
transform_apply; Standard view transform (AgX whitens the flat fills).
"""
import bpy, math, os, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

SCENE = 'CircleApt'
OUT = r'C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db\.worktrees\the-circle\assets\sets\circle\apt'
RW, D, RH = 7.2, 4.6, 2.8                  # room width, back wall y, height
DOOR = dict(x=-2.45, w=1.0, h=2.15)
TV = dict(x=0.55, z=1.62, w=2.5)
TV['h'] = TV['w'] * 9 / 16
SOFA_Y = 3.25
# 'real': stylized 3D in Cycles (rounded edges, textured surfaces, soft light). The
# user's call (2026-10-02): the flat look "looks like an unprofessional svg", the
# untextured first try "argile" (clay). 'toon' is kept for reference.
LOOK = 'real'

def hexc(h, a=1.0):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)

def darker(hexcol, k=0.45):
    r, g, b, _ = hexc(hexcol)
    return (r * k, g * k, b * k, 1)

# ── materials: flat toon ──────────────────────────────────────────────
_M = {}
def _real_tail(m, nt, color_socket=None, color=None):
    """A real surface: the colour, a fine grain in the bump, a satin sheen. Wood gets grain."""
    L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    name = m.name
    rough = 0.25 if m.get('gloss') else 0.55
    p.inputs['Roughness'].default_value = rough
    if m.get('metal'): p.inputs['Metallic'].default_value = 0.85; p.inputs['Roughness'].default_value = 0.3
    col = color_socket
    if col is None:
        rgb = nt.nodes.new('ShaderNodeRGB'); rgb.outputs[0].default_value = color; col = rgb.outputs[0]
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    if 'planks' in name or m.get('wood'):
        # grain: stretched noise along x darkens the colour in streaks
        mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.2, 14.0, 14.0)
        L.new(geo.outputs['Position'], mp.inputs['Vector'])
        wv = nt.nodes.new('ShaderNodeTexNoise'); wv.inputs['Scale'].default_value = 3.0; wv.inputs['Detail'].default_value = 6.0
        L.new(mp.outputs['Vector'], wv.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
        fr = nt.nodes.new('ShaderNodeMapRange'); fr.inputs['To Min'].default_value = 0.0; fr.inputs['To Max'].default_value = 0.35
        L.new(wv.outputs['Fac'], fr.inputs['Value']); L.new(fr.outputs['Result'], mx.inputs['Factor'])
        L.new(col, mx.inputs['A']); mx.inputs['B'].default_value = (0.55, 0.42, 0.32, 1)
        col = mx.outputs['Result']; p.inputs['Roughness'].default_value = 0.42
    L.new(col, p.inputs['Base Color'])
    # a fine surface grain so nothing reads as plastic or clay
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 140.0; nz.inputs['Detail'].default_value = 4.0
    L.new(geo.outputs['Position'], nz.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.06 if not m.get('gloss') else 0.01
    bp.inputs['Distance'].default_value = 0.002
    L.new(nz.outputs['Fac'], bp.inputs['Height']); L.new(bp.outputs['Normal'], p.inputs['Normal'])
    if m.get('sheen'): p.inputs['Sheen Weight'].default_value = 0.6
    L.new(p.outputs[0], out.inputs['Surface'])

def _toon_tail(m, nt, color_socket=None, color=None):
    if LOOK == 'real': return _real_tail(m, nt, color_socket, color)
    L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    band = nt.nodes.new('ShaderNodeValToRGB'); band.color_ramp.interpolation = 'CONSTANT'
    el = band.color_ramp.elements
    el[0].position, el[0].color = 0.0, (0.68, 0.66, 0.82, 1)    # the shadow leans cool, like a painted cel
    el[1].position, el[1].color = 0.4, (1, 1, 1, 1)
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
    if color_socket is not None: L.new(color_socket, mul.inputs['A'])
    else: mul.inputs['A'].default_value = color
    L.new(dif.outputs[0], s2r.inputs[0]); L.new(s2r.outputs['Color'], band.inputs['Fac']); L.new(band.outputs['Color'], mul.inputs['B'])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    L.new(mul.outputs['Result'], em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])

def M(color, ink=None, kind=None):
    """A colour. kind: 'gloss', 'metal', 'wood', 'sheen' (fabric). Toon: the outline is the colour, darker."""
    key = f'ap_{color}_{kind}'
    if key in _M: return _M[key]
    m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    if kind: m[kind] = 1
    _toon_tail(m, nt, color=hexc(color))
    m.line_color = darker(ink or color); _M[key] = m; return m

def GLOW(color, strength=1.0):
    """Lit things (a lamp shade, a screen, a neon): no shading, no ink."""
    key = f'apGlow_{color}_{strength}'
    if key in _M: return _M[key]
    m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = hexc(color); e.inputs['Strength'].default_value = strength * (5.0 if LOOK == 'real' else 1.0)
    nt.links.new(e.outputs[0], out.inputs['Surface']); m['noink'] = 1; _M[key] = m; return m

def PATTERN(kind, a, b, scale=4.0, c=None):
    """A wall or floor in two flat colours: stripes, checks, dots, planks, bricks, diamonds."""
    key = f'apPat_{kind}_{a}_{b}_{scale}_{c}'
    if key in _M: return _M[key]
    m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links
    tc = nt.nodes.new('ShaderNodeNewGeometry'); mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    L.new(tc.outputs['Position'], mp.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    el = ramp.color_ramp.elements; el[0].color = hexc(a); el[1].position = 0.5; el[1].color = hexc(b)
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(mp.outputs['Vector'], sep.inputs[0])
    def frac(sock):
        f = nt.nodes.new('ShaderNodeMath'); f.operation = 'FRACT'; L.new(sock, f.inputs[0]); return f.outputs[0]
    if kind in ('vstripe', 'hstripe'):
        L.new(frac(sep.outputs['X' if kind == 'vstripe' else 'Z']), ramp.inputs['Fac'])
        el[1].position = 0.6
    elif kind in ('check', 'checkfloor'):
        ck = nt.nodes.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value = 1.0
        ck.inputs['Color1'].default_value = hexc(a); ck.inputs['Color2'].default_value = hexc(b)
        L.new(mp.outputs['Vector'], ck.inputs['Vector']); _toon_tail(m, nt, color_socket=ck.outputs['Color'])
        m.line_color = darker(a); _M[key] = m; return m
    elif kind == 'dots':
        vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.feature = 'F1'
        vor.inputs['Randomness'].default_value = 0.0
        L.new(mp.outputs['Vector'], vor.inputs['Vector'])
        el[0].color = hexc(b); el[1].position = 0.22; el[1].color = hexc(a)
        L.new(vor.outputs['Distance'], ramp.inputs['Fac'])
    elif kind == 'diamond':
        ax = nt.nodes.new('ShaderNodeMath'); ax.operation = 'ADD'
        sx = nt.nodes.new('ShaderNodeMath'); sx.operation = 'SUBTRACT'
        yz = nt.nodes.new('ShaderNodeMath'); yz.operation = 'ADD'; L.new(sep.outputs['Y'], yz.inputs[0]); L.new(sep.outputs['Z'], yz.inputs[1])
        L.new(sep.outputs['X'], ax.inputs[0]); L.new(yz.outputs[0], ax.inputs[1])
        L.new(sep.outputs['X'], sx.inputs[0]); L.new(yz.outputs[0], sx.inputs[1])
        fa = frac(ax.outputs[0]); fs = frac(sx.outputs[0])
        mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MINIMUM'
        da = nt.nodes.new('ShaderNodeMath'); da.operation = 'PINGPONG'; da.inputs[1].default_value = 0.5
        db = nt.nodes.new('ShaderNodeMath'); db.operation = 'PINGPONG'; db.inputs[1].default_value = 0.5
        L.new(fa, da.inputs[0]); L.new(fs, db.inputs[0]); L.new(da.outputs[0], mx.inputs[0]); L.new(db.outputs[0], mx.inputs[1])
        el[1].position = 0.06; el[0].color = hexc(b); el[1].color = hexc(a)
        L.new(mx.outputs[0], ramp.inputs['Fac'])
    elif kind in ('brick', 'planks', 'tatami'):
        br = nt.nodes.new('ShaderNodeTexBrick')
        br.inputs['Color1'].default_value = hexc(a); br.inputs['Color2'].default_value = hexc(c or a)
        br.inputs['Mortar'].default_value = hexc(b); br.inputs['Scale'].default_value = 1.0
        br.inputs['Mortar Size'].default_value = 0.018 if kind == 'brick' else 0.008
        br.inputs['Brick Width'].default_value = {'brick': 0.5, 'planks': 2.2, 'tatami': 1.8}[kind]
        br.inputs['Row Height'].default_value = {'brick': 0.25, 'planks': 0.2, 'tatami': 0.9}[kind]
        br.offset = 0.5; br.inputs['Bias'].default_value = -1.0 if not c else 0.0
        vec = mp.outputs['Vector']
        if kind == 'brick':      # the wall faces -y: bricks run along x, rows up z
            sw = nt.nodes.new('ShaderNodeCombineXYZ'); L.new(sep.outputs['X'], sw.inputs[0]); L.new(sep.outputs['Z'], sw.inputs[1]); vec = sw.outputs[0]
        L.new(vec, br.inputs['Vector']); _toon_tail(m, nt, color_socket=br.outputs['Color'])
        m.line_color = darker(a); _M[key] = m; return m
    _toon_tail(m, nt, color_socket=ramp.outputs['Color'])
    m.line_color = darker(a); _M[key] = m; return m

# ── geometry ──────────────────────────────────────────────────────────
def sc(): return bpy.data.scenes[SCENE]
def _put(o, mat):
    if mat is not None: o.data.materials.clear(); o.data.materials.append(mat)
    return o
def box(loc, size, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.scale = size
    if LOOK == 'real' and min(size) > 0.006:
        bv = o.modifiers.new('round', 'BEVEL'); bv.width = min(0.035, min(size) * 0.22); bv.segments = 4
        bv.use_clamp_overlap = True
        o.data.shade_smooth() if hasattr(o.data, 'shade_smooth') else None
        try: bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
        except Exception: pass
    return _put(o, mat)
def cyl(loc, r, h, mat, rot=(0, 0, 0), verts=32, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object
    if LOOK == 'real' and verts > 8:
        if h > 0.02 and r > 0.02:
            bv = o.modifiers.new('round', 'BEVEL'); bv.width = min(0.02, h * 0.2, r * 0.2); bv.segments = 3; bv.use_clamp_overlap = True
        try: bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
        except Exception: pass
    return _put(o, mat)
def ball(loc, r, mat, scale=(1, 1, 1), segs=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=segs // 2)
    o = bpy.context.active_object; o.scale = scale; bpy.ops.object.shade_smooth(); return _put(o, mat)
def ring(loc, r, t, mat, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=t, location=loc, rotation=rot, major_segments=40, minor_segments=10)
    o = bpy.context.active_object; bpy.ops.object.shade_smooth(); return _put(o, mat)
def disc(loc, r, mat, rot=(math.pi / 2, 0, 0), verts=40):
    return cyl(loc, r, 0.012, mat, rot=rot, verts=verts)
def on_wall(x, z, w, h, mat, depth=0.03, y=None):
    return box((x, (y if y is not None else D) - depth / 2 - 0.001, z), (w, depth, h), mat)
def frame(x, z, w, h, inner_mat, frame_col='#f7f3ea'):
    on_wall(x, z, w + 0.08, h + 0.08, M(frame_col), depth=0.03)
    return on_wall(x, z, w, h, inner_mat, depth=0.05)

# ── the shared shell: walls, the door, the TV ─────────────────────────
def shell(T, open_door):
    wall = T['wall'] if not isinstance(T['wall'], str) else M(T['wall'])
    floor = T['floor'] if not isinstance(T['floor'], str) else M(T['floor'])
    box((0, D / 2 - 1, -0.05), (RW, D + 2, 0.1), floor)
    box((0, D / 2 - 1, RH + 0.05), (RW, D + 2, 0.1), M(T.get('ceil', '#f3eee6')))
    back = box((0, D + 0.05, RH / 2), (RW, 0.1, RH), wall)
    side = T.get('side', wall); side = side if not isinstance(side, str) else M(side)
    box((-RW / 2 - 0.05, D / 2 - 1, RH / 2), (0.1, D + 2, RH), side)
    box((RW / 2 + 0.05, D / 2 - 1, RH / 2), (0.1, D + 2, RH), side)
    skirt = box((0, D - 0.03, 0.06), (RW, 0.04, 0.12), M(T.get('trim', '#f7f3ea')))
    hosts = [back, skirt]
    if T.get('dado'):
        hosts.append(box((0, D - 0.012, 0.45), (RW, 0.022, 0.9), M(T['dado'])))
        hosts.append(box((0, D - 0.022, 0.91), (RW, 0.04, 0.04), M(T.get('trim', '#f7f3ea'))))
    dx, dw, dh = DOOR['x'], DOOR['w'], DOOR['h']
    trim = M(T.get('trim', '#f7f3ea'))
    box((dx - dw / 2 - 0.05, D - 0.04, dh / 2 + 0.05), (0.1, 0.08, dh + 0.1), trim)
    box((dx + dw / 2 + 0.05, D - 0.04, dh / 2 + 0.05), (0.1, 0.08, dh + 0.1), trim)
    box((dx, D - 0.04, dh + 0.05), (dw + 0.2, 0.08, 0.1), trim)
    door = M(T.get('door', '#2b3270')); panel = M(T.get('doorpanel', '#38418a'))
    gold = M('#ffc23a', kind='metal')
    if not open_door:
        box((dx, D - 0.06, dh / 2), (dw, 0.05, dh), door)
        box((dx, D - 0.09, 1.5), (dw - 0.28, 0.012, 0.66), panel); box((dx, D - 0.09, 0.55), (dw - 0.28, 0.012, 0.62), panel)
        ball((dx + dw / 2 - 0.12, D - 0.12, 1.02), 0.045, gold)
        box((dx, D - 0.1, 1.98), (0.3, 0.014, 0.18), gold)
    else:
        cut = box((dx, D + 0.05, dh / 2), (dw, 0.5, dh), None); cut.hide_render = True; cut.hide_viewport = True
        for h in hosts:
            md = h.modifiers.new('hole', 'BOOLEAN'); md.object = cut; md.operation = 'DIFFERENCE'
        box((dx - dw / 2 + 0.03, D - dw / 2 - 0.02, dh / 2), (0.05, dw, dh), door).name = 'apDoorLeaf'
        box((dx - dw / 2 + 0.06, D - dw / 2 - 0.02, 1.5), (0.012, dw - 0.28, 0.66), panel).name = 'apDoorPanel'
        # the Circle's own hallway beyond: lilac walls, the neon line
        box((dx, D + 1.4, RH / 2), (dw + 1.4, 0.05, RH), M('#e4defa'))
        box((dx, D + 0.7, 0.0), (dw + 1.4, 1.4, 0.02), M('#c9cbe6'))
        box((dx + dw / 2 + 0.4, D + 0.8, RH / 2), (0.05, 1.2, RH), M('#d6cff2'))
        box((dx, D + 1.36, 1.25), (dw + 1.4, 0.03, 0.08), GLOW('#ff5cc8', 2.0))
    # the TV: the Circle's screen. Dark, so the viewer's chat sits on it
    tx, tz, tw, th = TV['x'], TV['z'], TV['w'], TV['h']
    box((tx, D - 0.05, tz), (tw + 0.1, 0.05, th + 0.1), M('#1f1d2b', '#000000', 'gloss'))
    box((tx, D - 0.08, tz), (tw, 0.01, th), GLOW('#151827', 0.2 if LOOK == 'real' else 1.0))
    st = T.get('stand', ('#6b4a2e', 'low'))
    if st[1] == 'low':
        box((tx, D - 0.24, 0.24), (2.6, 0.42, 0.42), M(st[0]))
        for i in (-1, 1): box((tx + i * 0.43, D - 0.452, 0.24), (0.006, 0.01, 0.36), M(st[0]))
    elif st[1] == 'legs':
        box((tx, D - 0.24, 0.36), (2.4, 0.4, 0.22), M(st[0]))
        for lx in (-1.1, 1.1): box((tx + lx, D - 0.24, 0.13), (0.05, 0.3, 0.26), M(st[2] if len(st) > 2 else st[0]))
    elif st[1] == 'float':
        box((tx, D - 0.16, 0.5), (2.2, 0.3, 0.14), M(st[0]))

def lights():
    S = sc()
    key = bpy.data.lights.new('apKey', 'SPOT'); key.energy = 2200; key.spot_size = math.radians(140); key.spot_blend = 0.25
    key.shadow_soft_size = 0.02; key.color = (1, 0.97, 0.92)
    k = bpy.data.objects.new('apKey', key); S.collection.objects.link(k)
    k.location = (-2.2, 0.4, RH - 0.15)
    k.rotation_euler = (Vector((0.9, D * 0.75, 0)) - k.location).to_track_quat('-Z', 'Y').to_euler()
    if not S.world:
        S.world = bpy.data.worlds.new('apWorld')
    S.world.use_nodes = True
    bg = S.world.node_tree.nodes.get('Background') or S.world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (1, 1, 1, 1); bg.inputs['Strength'].default_value = 0.6
    if LOOK == 'real':
        # soft: a big warm panel in the ceiling, the key's shadow softened, a cool fill from the camera side
        key.shadow_soft_size = 0.25; key.energy = 700
        a = bpy.data.lights.new('apCeil', 'AREA'); a.shape = 'RECTANGLE'; a.size = 4.5; a.size_y = 2.6; a.energy = 230; a.color = (1, 0.93, 0.84)
        ao = bpy.data.objects.new('apCeil', a); S.collection.objects.link(ao); ao.location = (0.2, 2.6, RH - 0.02)
        f = bpy.data.lights.new('apFill', 'AREA'); f.size = 3.0; f.energy = 90; f.color = (0.86, 0.9, 1)
        fo = bpy.data.objects.new('apFill', f); S.collection.objects.link(fo); fo.location = (0.6, -0.9, 1.7)
        fo.rotation_euler = (math.radians(90), 0, 0)
        bg.inputs['Strength'].default_value = 0.25

def camera():
    S = sc(); cam = bpy.data.cameras.new('apCam'); cam.lens = 25; cam.shift_y = -0.105
    co = bpy.data.objects.new('apCam', cam); S.collection.objects.link(co)
    co.location = (0, -0.7, 1.45); co.rotation_euler = (math.radians(90), 0, 0); S.camera = co
    return co

# ── props ─────────────────────────────────────────────────────────────
def pot_plant(x, y, kind='monstera', pot='#f2ede4', s=1.0):
    cyl((x, y, 0.22 * s), 0.2 * s, 0.44 * s, M(pot), r2=0.16 * s)
    g1, g2 = M('#3f9a4a', '#1d5a2a'), M('#5cbf5e', '#1d5a2a')
    if kind == 'monstera':
        for i, (ox, oz, rz) in enumerate(((-0.18, 0.72, 0.6), (0.2, 0.78, -0.5), (0.0, 0.98, 0.1), (-0.25, 0.98, 0.9), (0.24, 1.05, -0.9), (0.05, 1.2, 0.3))):
            ball((x + ox * s, y - 0.05, oz * s + 0.1), 0.2 * s, g1 if i % 2 else g2, scale=(1.0, 0.25, 0.7)).rotation_euler = (0.2, rz, 0)
    elif kind == 'snake':
        for i in range(7):
            a = i / 7 * math.tau; h = (0.7 + 0.3 * ((i * 3) % 4) / 3) * s
            b = cyl((x + math.cos(a) * 0.07 * s, y + math.sin(a) * 0.07 * s, 0.42 * s + h / 2), 0.07 * s, h, g1 if i % 2 else g2, verts=4, r2=0.0)
            b.scale = (1, 0.3, 1); b.rotation_euler = (math.sin(a) * 0.18, -math.cos(a) * 0.18, a)
    elif kind == 'cactus':
        cyl((x, y, 0.44 * s + 0.4 * s), 0.1 * s, 0.8 * s, g1)
        ball((x, y, 0.44 * s + 0.8 * s), 0.1 * s, g1)
        cyl((x + 0.15 * s, y, 0.85 * s), 0.06 * s, 0.3 * s, g2); ball((x + 0.15 * s, y, 1.0 * s), 0.06 * s, g2)
    elif kind == 'palm':
        cyl((x, y, 0.44 * s + 0.45 * s), 0.035 * s, 0.9 * s, M('#9a6a3a'))
        for i in range(7):
            a = i / 7 * math.tau
            f = ball((x + math.cos(a) * 0.3 * s, y + math.sin(a) * 0.15, 1.3 * s), 0.38 * s, g1 if i % 2 else g2, scale=(1, 0.18, 0.06))
            f.rotation_euler = (0, -0.4 * math.cos(a), a)
    elif kind == 'bonsai':
        cyl((x, y, 0.5 * s), 0.025 * s, 0.25 * s, M('#6b4a2e'), rot=(0, 0.3, 0))
        for ox, oz in ((-0.12, 0.66), (0.1, 0.7), (0.0, 0.78)):
            ball((x + ox * s, y, oz * s), 0.13 * s, g1, scale=(1.3, 1, 0.55))

def sofa(style, color, accent, pillows=None, y=SOFA_Y, x=0.4, w=2.4):
    c, a = M(color, kind='sheen'), M(accent, kind='sheen')
    if style == 'boxy':
        box((x, y, 0.27), (w, 0.82, 0.34), c); box((x, y + 0.34, 0.7), (w, 0.2, 0.62), c)
        for s in (-1, 1): box((x + s * (w / 2 + 0.1), y + 0.02, 0.47), (0.22, 0.86, 0.54), c)
        for cx in (-w / 4, w / 4): box((x + cx, y - 0.04, 0.5), (w / 2 - 0.06, 0.62, 0.12), c)
    elif style == 'round':       # rolled arms, a curved back
        box((x, y, 0.26), (w, 0.82, 0.3), c); box((x, y + 0.36, 0.68), (w, 0.18, 0.6), c)
        for s in (-1, 1): cyl((x + s * (w / 2 + 0.05), y + 0.02, 0.5), 0.15, 0.88, c, rot=(math.pi / 2, 0, 0))
        for cx in (-w / 3, 0, w / 3): box((x + cx, y - 0.04, 0.47), (w / 3 - 0.05, 0.62, 0.12), c)
    elif style == 'chesterfield':
        box((x, y, 0.27), (w, 0.82, 0.34), c); box((x, y + 0.36, 0.66), (w + 0.3, 0.2, 0.5), c)
        for s in (-1, 1): box((x + s * (w / 2 + 0.08), y, 0.48), (0.2, 0.86, 0.48), c); cyl((x + s * (w / 2 + 0.08), y, 0.74), 0.12, 0.86, c, rot=(math.pi / 2, 0, 0))
        for i in range(7): ball((x - w / 2 + 0.2 + i * (w - 0.4) / 6, y + 0.25, 0.78), 0.018, a)
    elif style == 'booth':       # a diner booth: tall back, white piping
        box((x, y, 0.25), (w, 0.8, 0.3), c); box((x, y + 0.34, 0.8), (w, 0.2, 0.9), c)
        for i in range(5): box((x - w / 2 + 0.24 + i * (w - 0.48) / 4, y + 0.23, 0.8), (0.035, 0.01, 0.82), a)
        box((x, y - 0.38, 0.4), (w, 0.04, 0.04), a)
    elif style == 'futon':       # low and long, on a wooden base
        box((x, y, 0.1), (w + 0.2, 0.9, 0.2), M('#b88a5a')); box((x, y, 0.28), (w, 0.82, 0.18), c)
        box((x, y + 0.36, 0.55), (w, 0.16, 0.45), c)
    elif style == 'modular':     # round pods
        for cx in (-w / 3, 0, w / 3):
            cyl((x + cx, y, 0.22), 0.42, 0.42, c); cyl((x + cx, y + 0.32, 0.6), 0.36, 0.4, c, rot=(math.pi / 2, 0, 0)).scale = (1, 0.5, 1)
    if pillows:
        for px, col in zip((-w / 2 + 0.3, w / 2 - 0.3), pillows):
            box((x + px, y + 0.18, 0.7), (0.38, 0.12, 0.36), M(col), rot=(0.15, 0, 0))

def rug(shape, color, x=0.4, y=2.9, w=3.0, d=1.5, border=None):
    if shape == 'round':
        o = cyl((x, y, 0.006), 1.0, 0.012, M(color), verts=48); o.scale = (w / 2, d / 2, 1)
        if border: o2 = cyl((x, y, 0.004), 1.0, 0.008, M(border), verts=48); o2.scale = (w / 2 + 0.08, d / 2 + 0.06, 1)
    else:
        box((x, y, 0.006), (w, d, 0.012), color if not isinstance(color, str) else M(color))
        if border: box((x, y, 0.004), (w + 0.14, d + 0.14, 0.008), M(border))

def table(x=0.4, y=2.6, w=1.3, d=0.6, top='#6b4a2e', legs=None, h=0.42, round_=False):
    if round_: cyl((x, y, h), w / 2, 0.06, M(top))
    else: box((x, y, h), (w, d, 0.06), M(top))
    lc = M(legs or top)
    for lx in (-w / 2 + 0.08, w / 2 - 0.08):
        for ly in ((-d / 2 + 0.08, d / 2 - 0.08) if not round_ else (0,)):
            box((x + lx, y + ly, h / 2), (0.05, 0.05, h), lc)

def floor_lamp(x, y, shade='#fff1cf', pole='#2a2733', kind='drum'):
    cyl((x, y, 0.02), 0.16, 0.04, M(pole)); cyl((x, y, 0.75), 0.022, 1.5, M(pole))
    if kind == 'drum': cyl((x, y, 1.6), 0.3, 0.36, GLOW(shade), r2=0.22)
    elif kind == 'globe': ball((x, y, 1.62), 0.2, GLOW(shade))
    elif kind == 'arc':
        ring((x - 0.5, y, 1.5), 0.55, 0.02, M(pole)); ball((x - 1.05, y, 1.48), 0.2, GLOW(shade), scale=(1, 1, 0.6))

def pendant(x, y, z, shade, kind='bulb', cord='#2a2733'):
    cyl((x, y, (RH + z) / 2), 0.008, RH - z, M(cord))
    if kind == 'bulb': ball((x, y, z), 0.07, GLOW(shade, 1.6), scale=(1, 1, 1.3))
    elif kind == 'lantern': ball((x, y, z), 0.28, GLOW(shade), scale=(1, 1, 0.9))
    elif kind == 'dome': cyl((x, y, z), 0.3, 0.22, M(shade), r2=0.06)

def books(x0, x1, z, y, cols, h=0.28, seed=1):
    r = random.Random(seed); x = x0
    while x < x1 - 0.05:
        w = r.uniform(0.04, 0.08); hh = h * r.uniform(0.7, 1.0)
        box((x + w / 2, y, z + hh / 2), (w * 0.95, 0.2, hh), M(r.choice(cols))); x += w

# ══════════════════════════════════════════════════════════════════════
# The twelve apartments. Each: what the walls are, what's on them, and
# what is in the room (the waiting shot), and the couch (the visit shot).
# ══════════════════════════════════════════════════════════════════════
def r_beach(o):
    pot_plant(-3.2, D - 0.45, 'palm', '#f4d9a6')
    # a surfboard leaned against the wall right of the TV
    b = ball((2.55, D - 0.25, 1.15), 1.0, M('#4ac0d8'), scale=(0.24, 0.05, 1.05)); b.rotation_euler = (0.12, -0.12, 0)
    s = ball((2.55, D - 0.29, 1.15), 1.0, M('#ffd45a'), scale=(0.07, 0.05, 1.02)); s.rotation_euler = (0.12, -0.12, 0)
    # a sunset print and a lifebuoy
    frame(-1.3, 1.75, 0.62, 0.82, M('#ff8f6b'))
    on_wall(-1.3, 1.62, 0.62, 0.28, M('#ff5d7a'), depth=0.06); disc((-1.3, D - 0.07, 1.86), 0.14, M('#ffd34a'))
    ring((3.15, D - 0.06, 1.9), 0.2, 0.06, M('#ff4b4b'))
    if not o['open']:
        rug('rect', PATTERN('vstripe', '#ffffff', '#3fb6d8', 2.4), w=2.8, d=1.4)
        table(top='#e8c690', legs='#c69a5e')
        # a cooler and a straw hat on the table
        box((-1.25, 2.4, 0.2), (0.55, 0.36, 0.38), M('#3fa8e0')); box((-1.25, 2.4, 0.41), (0.57, 0.38, 0.06), M('#ffffff'))
        cyl((0.2, 2.6, 0.47), 0.2, 0.03, M('#f2cf7a')); cyl((0.2, 2.6, 0.52), 0.1, 0.08, M('#f2cf7a'))
    else: sofa('boxy', '#f6f1e6', '#3fb6d8', pillows=('#3fb6d8', '#ffb347'))

def r_arcade(o):
    # neon on the top edge (no ink), a pixel heart, an arcade cabinet
    box((0, D - 0.03, RH - 0.12), (RW, 0.02, 0.04), GLOW('#ff3ea5', 2.5))
    for i, row in enumerate(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']):
        for j, ch in enumerate(row):
            if ch == 'X': on_wall(-1.62 + j * 0.085, 2.15 - i * 0.085, 0.08, 0.08, M('#ff3e6c'), depth=0.03)
    cab = M('#2a2f8a'); x = 2.75
    box((x, D - 0.45, 0.6), (0.75, 0.7, 1.2), cab); box((x, D - 0.5, 1.6), (0.75, 0.6, 0.8), cab)
    box((x, D - 0.81, 1.62), (0.56, 0.02, 0.44), GLOW('#3ee8ff', 1.3)); box((x, D - 0.58, 2.06), (0.75, 0.6, 0.14), GLOW('#ffde3e', 1.4))
    box((x, D - 0.86, 1.17), (0.72, 0.3, 0.08), M('#1b1e5a'))
    for dx_, col in ((-0.15, '#ff3e6c'), (0.0, '#3eff8a'), (0.15, '#ffde3e')): ball((x + dx_, D - 0.95, 1.23), 0.035, M(col))
    pot_plant(-3.2, D - 0.45, 'cactus', '#3e3a7a')
    if not o['open']:
        rug('rect', PATTERN('check', '#2a2060', '#3a2c88', 3.0), w=3.0, d=1.6)
        ball((-0.7, 2.6, 0.2), 0.34, M('#ff3ea5'), scale=(1.1, 1.0, 0.65))             # two beanbags
        ball((1.5, 2.6, 0.2), 0.34, M('#3ee8ff'), scale=(1.1, 1.0, 0.65))
        box((0.5, 2.5, 0.05), (0.42, 0.24, 0.06), M('#1b1b22'))                        # a controller
    else: sofa('boxy', '#25223a', '#ff3ea5', pillows=('#ff3ea5', '#3ee8ff'))

def r_glam(o):
    # a vanity with a bulb mirror between door and TV, a gold floor lamp
    box((-1.3, D - 0.25, 0.4), (0.9, 0.42, 0.8), M('#ffffff'))
    on_wall(-1.3, 1.45, 0.62, 0.78, M('#bfe2ef', '#5a8aa0'), depth=0.04)
    for i in range(8):
        a = i / 8 * math.tau; ball((-1.3 + math.cos(a) * 0.38, D - 0.06, 1.45 + math.sin(a) * 0.45), 0.04, GLOW('#fff6d8', 1.5))
    for x_, col in ((-1.5, '#ff7aa8'), (-1.38, '#ffd45a'), (-1.1, '#b07aff')): cyl((x_, D - 0.25, 0.86), 0.035, 0.12, M(col))
    floor_lamp(3.05, D - 0.6, '#fff1d6', '#d4a23a', 'drum')
    pot_plant(-3.2, D - 0.45, 'monstera', '#ffffff')
    frame(2.65, 2.05, 0.5, 0.5, M('#ff8ab8'), '#d4a23a')
    if not o['open']:
        rug('round', '#ffffff', w=2.8, d=1.5, border='#f4c6d8')
        # a chaise in pink velvet
        box((0.9, 2.45, 0.24), (1.4, 0.6, 0.3), M('#f27aa6')); cyl((0.24, 2.45, 0.48), 0.2, 0.62, M('#f27aa6'), rot=(math.pi / 2, 0, 0))
        table(-0.6, 2.6, 0.7, 0.7, '#ffffff', '#d4a23a', 0.44, round_=True)
    else: sofa('round', '#f27aa6', '#ffffff', pillows=('#ffffff', '#ffd45a'))

def r_boho(o):
    # a macramé hanging, string lights, plants everywhere, a hanging egg chair
    cyl((-1.3, D - 0.06, 2.2), 0.02, 0.8, M('#a8743a'), rot=(0, math.pi / 2, 0))
    for i in range(9):
        h = 0.5 + 0.3 * (1 - abs(i - 4) / 4)
        box((-1.62 + i * 0.08, D - 0.06, 2.18 - h / 2), (0.03, 0.02, h), M('#f2e6cf'))
    for i in range(22):
        t = i / 21; x = -3.4 + t * 6.8; z = 2.5 - 0.15 * math.sin(t * math.pi * 3) ** 2
        ball((x, D - 0.08, z), 0.03, GLOW('#ffe39a', 1.6))
    pot_plant(-3.2, D - 0.45, 'monstera', '#c96a3a')
    pot_plant(1.95, D - 0.35, 'snake', '#e9d6b4', 0.8)
    # the hanging egg chair: a wicker shell with its front cut open, a cushion inside
    ex, ey, ez = 2.85, 3.7, 1.2
    cyl((ex, ey, (RH + ez + 0.62) / 2), 0.012, RH - ez - 0.62, M('#6b4a2e'))
    shell_ = ball((ex, ey, ez), 0.55, M('#b98048', kind='wood'), scale=(1, 0.95, 1.2))
    cut = ball((ex, ey - 0.42, ez - 0.08), 0.5, None, scale=(0.85, 1, 1.0)); cut.hide_render = True; cut.hide_viewport = True
    md = shell_.modifiers.new('open', 'BOOLEAN'); md.object = cut; md.operation = 'DIFFERENCE'
    sol = shell_.modifiers.new('wall', 'SOLIDIFY'); sol.thickness = 0.04
    ball((ex, ey + 0.02, ez - 0.28), 0.38, M('#f2e6cf', kind='sheen'), scale=(1, 0.9, 0.35))
    box((ex, ey + 0.2, ez + 0.02), (0.42, 0.12, 0.36), M('#3f9a4a', kind='sheen'), rot=(-0.25, 0, 0))
    if not o['open']:
        rug('rect', PATTERN('diamond', '#e8b04a', '#b8452e', 2.4), w=3.0, d=1.5, border='#f2e6cf')
        table(top='#a8743a')
        cyl((-0.8, 2.3, 0.12), 0.32, 0.24, M('#d97a4a'))                               # floor pouf
    else: sofa('boxy', '#e2a93a', '#b8452e', pillows=('#b8452e', '#3f9a4a'))

def r_sports(o):
    # pennants, a framed jersey, a hoop on the wall, a ball rack
    for i, col in enumerate(('#e23a3a', '#2a5ad8', '#ffc23a')):
        p = cyl((-1.65 + i * 0.32, D - 0.05, 2.3), 0.18, 0.02, M(col), rot=(math.pi / 2, 0, 0), verts=3)
        p.scale = (1, 1.9, 1); p.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
    frame(2.7, 1.8, 0.7, 0.8, M('#1d3a8a'))
    on_wall(2.7, 1.84, 0.4, 0.5, M('#e23a3a'), depth=0.06); on_wall(2.7, 1.86, 0.14, 0.2, M('#ffffff'), depth=0.07)
    box((3.5, 3.4, 2.15), (0.02, 0.9, 0.6), M('#ffffff'))                               # hoop on the right wall
    box((3.48, 3.4, 2.05), (0.02, 0.32, 0.24), M('#ffffff', '#e23a3a'))
    ring((3.3, 3.4, 1.88), 0.2, 0.015, M('#ff6a2a'), rot=(0, 0, 0))
    pot_plant(-3.2, D - 0.45, 'snake', '#2a5ad8')
    if not o['open']:
        box((0.4, 2.9, 0.006), (3.0, 1.5, 0.012), M('#cf8f4e'))
        ring((0.4, 2.9, 0.014), 0.45, 0.012, M('#ffffff'), rot=(0, 0, 0))
        ball((-0.9, 2.3, 0.14), 0.14, M('#ff7a2a'))
        box((1.7, 2.4, 0.06), (0.6, 0.18, 0.12), M('#3a3a44'))                          # dumbbells
        for s in (-1, 1): cyl((1.7 + s * 0.25, 2.4, 0.12), 0.1, 0.08, M('#3a3a44'), rot=(0, math.pi / 2, 0))
    else: sofa('boxy', '#c8322e', '#ffffff', pillows=('#2a5ad8', '#ffc23a'))

def r_music(o):
    # foam panels, vinyl on the wall, a guitar on a stand, two speakers
    for i in range(3):
        for j in range(2): on_wall(-1.62 + i * 0.3, 1.6 + j * 0.42, 0.28, 0.4, M('#3a3550'), depth=0.06)
    for i, lab in enumerate(('#ff5d5d', '#ffd45a', '#5dd8ff')):
        disc((2.25 + i * 0.42, D - 0.03, 2.1 - (i % 2) * 0.25), 0.18, M('#16151c', '#000000'))
        disc((2.25 + i * 0.42, D - 0.045, 2.1 - (i % 2) * 0.25), 0.06, M(lab))
    for x_ in (TV['x'] - TV['w'] / 2 - 0.35, TV['x'] + TV['w'] / 2 + 0.35):
        box((x_, D - 0.3, 0.55), (0.42, 0.4, 1.1), M('#24222c'))
        disc((x_, D - 0.505, 0.75), 0.13, M('#4a4a58'), verts=32); disc((x_, D - 0.505, 0.35), 0.08, M('#4a4a58'), verts=32)
    gx, gy = 3.0, 3.8                                                                  # the guitar
    ball((gx, gy, 0.55), 0.24, M('#e8762a'), scale=(1, 0.3, 1.1)); ball((gx, gy, 0.85), 0.18, M('#e8762a'), scale=(1, 0.3, 1))
    box((gx, gy - 0.02, 1.3), (0.06, 0.04, 0.8), M('#4a2c1a')); box((gx, gy - 0.02, 1.75), (0.1, 0.05, 0.16), M('#2a1a10'))
    disc((gx, gy - 0.08, 0.75), 0.06, M('#2a1a10'), rot=(math.pi / 2, 0, 0))
    pot_plant(-3.2, D - 0.45, 'snake', '#24222c')
    if not o['open']:
        rug('rect', '#3a5a4a', w=3.0, d=1.5, border='#24222c')
        box((0.4, 2.5, 0.68), (1.4, 0.38, 0.08), M('#1b1b22'))                           # a keyboard on a stand
        box((0.4, 2.42, 0.73), (1.3, 0.16, 0.02), M('#ffffff'))
        for s in (-1, 1): box((0.4 + s * 0.55, 2.5, 0.33), (0.04, 0.3, 0.66), M('#3a3a44'), rot=(0, s * 0.3, 0))
    else: sofa('chesterfield', '#7a4a2a', '#3a2010', pillows=('#3a5a4a', '#e8762a'))

def r_library(o):
    # a wall of books right of the TV, a little fireplace left of it
    sh = M('#6b3f22'); x0, x1 = 2.0, 3.55
    box(((x0 + x1) / 2, D - 0.02, RH / 2), (x1 - x0, 0.04, RH), M('#4e2c16'))
    for xx in (x0, x1): box((xx, D - 0.2, RH / 2), (0.06, 0.4, RH), sh)
    for k in range(5):
        z = 0.15 + k * 0.52
        box(((x0 + x1) / 2, D - 0.22, z), (x1 - x0 - 0.08, 0.36, 0.04), M('#4e2c16'))
        books(x0 + 0.06, x1 - 0.06, z + 0.02, D - 0.24, ('#c8322e', '#2a5ad8', '#ffc23a', '#3f9a4a', '#f2e6cf', '#7a3a8a'), seed=k + 2)
    box((-1.3, D - 0.15, 0.55), (0.95, 0.3, 1.1), M('#e8dccb')); box((-1.3, D - 0.25, 0.4), (0.55, 0.12, 0.55), M('#2a1a14'))
    for i, col in enumerate(('#ff8a2a', '#ffd45a')):
        cyl((-1.3 + (i - 0.5) * 0.12, D - 0.3, 0.32), 0.09 - i * 0.03, 0.26 - i * 0.06, GLOW(col, 1.6), r2=0.0)
    box((-1.3, D - 0.12, 1.12), (1.1, 0.36, 0.06), M('#6b3f22'))
    frame(-1.3, 1.6, 0.45, 0.55, M('#3a5a8a'), '#c99a3a')
    pot_plant(-3.2, D - 0.45, 'monstera', '#c8322e')
    if not o['open']:
        rug('rect', PATTERN('check', '#2a5a3a', '#1f4a2e', 3.0), w=3.0, d=1.5, border='#c8322e')
        # a leather ottoman with a stack of books, a reading lamp, a globe
        box((0.4, 2.6, 0.2), (1.1, 0.6, 0.4), M('#7a3a22')); box((0.4, 2.6, 0.41), (1.14, 0.64, 0.03), M('#5a2a16'))
        books(0.05, 0.45, 0.42, 2.6, ('#c8322e', '#ffc23a', '#2a5ad8'), h=0.06, seed=9)
        cyl((-1.0, 2.5, 0.25), 0.04, 0.5, M('#c99a3a')); ball((-1.0, 2.5, 0.68), 0.2, M('#3a8ac8')); ring((-1.0, 2.5, 0.68), 0.23, 0.015, M('#c99a3a'), rot=(0, 0.4, 0))
    else: sofa('chesterfield', '#2f5a3e', '#1a3022', pillows=('#c8322e', '#ffc23a'))

def r_artist(o):
    # paint splatters on a white wall, canvases, an easel
    r = random.Random(4)
    for i in range(26):
        x = r.uniform(-3.4, 3.4); z = r.uniform(0.3, 2.6)
        if TV['x'] - TV['w'] / 2 - 0.1 < x < TV['x'] + TV['w'] / 2 + 0.1 and TV['z'] - TV['h'] / 2 - 0.1 < z < TV['z'] + TV['h'] / 2 + 0.1: continue
        if DOOR['x'] - 0.6 < x < DOOR['x'] + 0.6 and z < 2.3: continue
        disc((x, D - 0.005, z), r.uniform(0.03, 0.09), M(r.choice(('#ff4b6e', '#2ab0ff', '#ffd23f', '#3fd88f', '#b35cff'))))
    frame(-1.3, 1.75, 0.6, 0.6, PATTERN('diamond', '#ffd23f', '#2ab0ff', 3.0), '#222222')
    ex, ey = 2.8, 3.7                                                                   # the easel
    for s in (-1, 1): box((ex + s * 0.25, ey, 0.85), (0.04, 0.04, 1.75), M('#b07a4a'), rot=(0, s * -0.12, 0))
    box((ex, ey + 0.25, 0.85), (0.04, 0.04, 1.75), M('#b07a4a'), rot=(-0.25, 0, 0))
    box((ex, ey - 0.04, 1.3), (0.8, 0.04, 0.62), M('#ffffff'))
    on_wall(ex, 1.32, 0.5, 0.3, M('#ff4b6e'), y=ey - 0.06, depth=0.01); disc((ex + 0.15, ey - 0.07, 1.42), 0.08, M('#ffd23f'))
    box((ex - 0.05, ey + 0.02, 0.88), (0.85, 0.12, 0.04), M('#b07a4a'))
    for i, col in enumerate(('#3fd88f', '#2ab0ff')): box((2.0 + i * 0.12, D - 0.3, 0.35), (0.04, 0.55, 0.7), M(col), rot=(0, 0.12, 0))
    pot_plant(-3.2, D - 0.45, 'cactus', '#ff4b6e')
    if not o['open']:
        rug('rect', '#ece4d6', w=3.2, d=1.6)
        for i in range(8): disc((r.uniform(-0.9, 1.7), r.uniform(2.3, 3.4), 0.015), r.uniform(0.05, 0.12), M(r.choice(('#ff4b6e', '#2ab0ff', '#ffd23f'))), rot=(0, 0, 0))
        for i, col in enumerate(('#ff4b6e', '#2ab0ff', '#ffd23f')):
            cyl((-0.6 + i * 0.3, 2.4, 0.13), 0.12, 0.26, M('#d8d8e0')); cyl((-0.6 + i * 0.3, 2.4, 0.265), 0.11, 0.01, M(col))
        box((1.3, 2.5, 0.2), (0.6, 0.6, 0.4), M('#ffd23f'))                             # a stool block
    else: sofa('boxy', '#ffd23f', '#ff4b6e', pillows=('#2ab0ff', '#ff4b6e'))

def r_space(o):
    # stars (lit, no ink), a planet print, a telescope, a moon lamp
    r = random.Random(7)
    for i in range(60):
        x = r.uniform(-3.5, 3.5); z = r.uniform(0.5, 2.7)
        if TV['x'] - TV['w'] / 2 - 0.08 < x < TV['x'] + TV['w'] / 2 + 0.08 and TV['z'] - TV['h'] / 2 - 0.08 < z < TV['z'] + TV['h'] / 2 + 0.08: continue
        if DOOR['x'] - 0.6 < x < DOOR['x'] + 0.6 and z < 2.3: continue
        disc((x, D - 0.004, z), r.uniform(0.01, 0.025), GLOW('#fff6c8', 1.4), verts=8)
    disc((-1.3, D - 0.03, 1.85), 0.26, M('#ff8a4a')); ring((-1.3, D - 0.05, 1.85), 0.38, 0.025, M('#ffd27a'), rot=(math.pi / 2, 0.35, 0))
    disc((2.6, D - 0.03, 2.2), 0.12, M('#5ad8ff'))
    tx_, ty_ = 2.95, 3.6                                                                 # the telescope
    for a in (0, 2.1, 4.2): box((tx_ + math.cos(a) * 0.18, ty_ + math.sin(a) * 0.18, 0.45), (0.03, 0.03, 0.95), M('#c8c8d8'), rot=(math.sin(a) * 0.3, -math.cos(a) * 0.3, 0))
    cyl((tx_ - 0.15, ty_, 1.05), 0.09, 0.95, M('#ffffff'), rot=(0, math.radians(-60), 0))
    ball((-3.15, D - 0.45, 0.78), 0.3, GLOW('#f2ecd6', 1.2)); cyl((-3.15, D - 0.45, 0.22), 0.16, 0.44, M('#3a3a5a'))
    if not o['open']:
        rug('round', '#3a2a7a', w=2.8, d=1.4, border='#ffd27a')
        table(top='#e8e8f2', legs='#8a8aa0', round_=True, w=0.9)
        # a rocket on the table
        cyl((0.4, 2.6, 0.62), 0.07, 0.34, M('#ffffff')); cyl((0.4, 2.6, 0.86), 0.07, 0.16, M('#ff4b4b'), r2=0.0)
    else: sofa('modular', '#6a4ad8', '#ffd27a')

def r_diner(o):
    # chrome stripe, a neon sign, a jukebox, checker floor
    box((0, D - 0.02, 1.0), (RW, 0.02, 0.06), M('#d8dde6', '#6a7080'))
    t = bpy.data.curves.new('apSign', 'FONT'); t.body = 'OPEN'; t.size = 0.28; t.extrude = 0.01; t.align_x = 'CENTER'
    so = bpy.data.objects.new('apSign', t); sc().collection.objects.link(so)
    so.location = (-1.3, D - 0.05, 1.9); so.rotation_euler = (math.pi / 2, 0, 0); so.data.materials.append(GLOW('#ff1f5a', 0.7))
    box((-1.3, D - 0.02, 2.0), (1.05, 0.02, 0.5), M('#1b1b22'))
    jx = 2.8                                                                             # the jukebox
    box((jx, D - 0.35, 0.65), (0.8, 0.55, 1.3), M('#c8322e'))
    cyl((jx, D - 0.35, 1.3), 0.4, 0.55, M('#c8322e'), rot=(math.pi / 2, 0, 0))
    cyl((jx, D - 0.63, 1.28), 0.3, 0.02, GLOW('#ffd45a', 1.3), rot=(math.pi / 2, 0, 0))
    box((jx, D - 0.63, 0.7), (0.56, 0.02, 0.5), GLOW('#5ad8ff', 1.1))
    for s in (-1, 1): box((jx + s * 0.36, D - 0.63, 0.8), (0.06, 0.02, 1.0), GLOW('#ff8ac8', 1.4))
    frame(2.0, 2.15, 0.36, 0.44, M('#5ad8c8'))
    pot_plant(-3.2, D - 0.45, 'cactus', '#5ad8c8')
    if not o['open']:
        for x_ in (-0.4, 1.3):                                                           # two red stools
            cyl((x_, 2.5, 0.35), 0.03, 0.7, M('#c8ccd6')); cyl((x_, 2.5, 0.72), 0.22, 0.1, M('#c8322e')); cyl((x_, 2.5, 0.02), 0.16, 0.04, M('#c8ccd6'))
        table(0.45, 2.5, 0.7, 0.7, '#5ad8c8', '#c8ccd6', 0.72, round_=True)
        cyl((0.38, 2.5, 0.82), 0.05, 0.16, M('#ffffff')); cyl((0.38, 2.5, 0.94), 0.07, 0.06, M('#ff8ac8'))
    else: sofa('booth', '#c8322e', '#ffffff')

def r_loft(o):
    # bare brick, a metal shelf, Edison bulbs on long cords
    sx = 2.75
    for s in (-1, 1): box((sx + s * 0.6, D - 0.25, 1.1), (0.04, 0.04, 2.2), M('#2a2a30'))
    for k in range(4):
        z = 0.2 + k * 0.62; box((sx, D - 0.25, z), (1.25, 0.4, 0.03), M('#2a2a30'))
    pot_plant(sx - 0.3, D - 0.25, 'snake', '#d8d0c4', 0.45); box((sx + 0.3, D - 0.25, 0.97), (0.3, 0.3, 0.3), M('#c99a5a'))
    books(sx - 0.5, sx + 0.1, 1.46, D - 0.25, ('#c8322e', '#e8dcc8', '#2a2a30'), seed=3)
    pot_plant(sx, D - 0.25, 'cactus', '#2a2a30', 0.4)
    for x_, z in ((-1.6, 2.0), (-1.2, 1.8), (-0.85, 2.15)): pendant(x_, D - 0.6, z, '#ffc06a')
    pot_plant(-3.2, D - 0.45, 'monstera', '#5a5a62')
    if not o['open']:
        rug('rect', '#8a8a92', w=3.0, d=1.5, border='#4a4a52')
        # a pallet-and-crate coffee table on wheels
        box((0.4, 2.6, 0.22), (1.3, 0.7, 0.18), M('#b88a5a'))
        for lx in (-0.55, 0.55):
            for ly in (-0.28, 0.28): cyl((0.4 + lx, 2.6 + ly, 0.07), 0.07, 0.04, M('#2a2a30'), rot=(0, math.pi / 2, 0))
        box((-0.9, 2.4, 0.22), (0.5, 0.5, 0.44), M('#b88a5a'))
    else: sofa('chesterfield', '#9a5a2a', '#5a3010', pillows=('#e8dcc8', '#4a4a52'))

def r_zen(o):
    # a shoji screen, a paper lantern, a bonsai, floor cushions
    sx = 2.75; box((sx, D - 0.05, 1.2), (1.2, 0.04, 2.0), GLOW('#fbf6e8', 0.95))
    wood = M('#6b4a2e')
    for i in range(5): box((sx - 0.6 + i * 0.3, D - 0.08, 1.2), (0.03, 0.02, 2.0), wood)
    for k in range(6): box((sx, D - 0.08, 0.2 + k * 0.4), (1.2, 0.02, 0.03), wood)
    pendant(-1.3, D - 0.6, 2.0, '#fff1d6', 'lantern')
    box((-1.3, D - 0.3, 0.2), (0.7, 0.4, 0.4), wood); pot_plant(-1.3, D - 0.3, 'bonsai', '#3a3a44', 0.75)
    pot_plant(-3.2, D - 0.45, 'snake', '#e8dcc8')
    if not o['open']:
        rug('rect', PATTERN('tatami', '#d8cc8a', '#6b5a3a', 1.0, '#cfc27e'), w=3.2, d=1.7)
        box((0.4, 2.6, 0.18), (1.2, 0.7, 0.05), wood)
        for lx in (-0.5, 0.5): box((0.4 + lx, 2.6, 0.08), (0.08, 0.6, 0.16), wood)
        for x_, col in ((-0.6, '#3a6a8a'), (1.4, '#c8322e')): box((x_, 2.6, 0.06), (0.6, 0.6, 0.12), M(col))
        cyl((0.3, 2.55, 0.25), 0.05, 0.08, M('#e8dcc8')); cyl((0.55, 2.62, 0.24), 0.04, 0.06, M('#e8dcc8'))
    else: sofa('futon', '#8a9a8a', '#3a4a3a', pillows=('#3a6a8a', '#c8322e'))

ROOMS = {
    'beach':   dict(stand=('#e8c690', 'legs', '#c69a5e'), wall=PATTERN('hstripe', '#96d6df', '#7cc8d4', 4.0), floor=PATTERN('planks', '#e8c690', '#c69a5e', 1.4, '#dcb67c'), side='#7cc8d4', trim='#ffffff', door='#2a7a9a', doorpanel='#3a92b2', build=r_beach),
    'arcade':  dict(stand=('#1b1838', 'float'), wall='#2a2050', floor='#1b1838', side='#231a44', trim='#3a2c88', dado='#1f1840', door='#3a2c88', doorpanel='#4a3aa8', build=r_arcade),
    'glam':    dict(stand=('#ffffff', 'legs', '#d4a23a'), wall=PATTERN('vstripe', '#f2a0b8', '#ea8aa6', 6.0), floor=PATTERN('planks', '#e6cdb4', '#c9a888', 1.6, '#dcc0a4'), side='#ea8aa6', trim='#ffffff', door='#ffffff', doorpanel='#f4e6ea', build=r_glam),
    'boho':    dict(stand=('#a8743a', 'low'), wall='#e9a77d', floor=PATTERN('planks', '#c99a64', '#a8743a', 1.4, '#bb8c58'), side='#df9a6e', trim='#f2e6cf', door='#3f7a6a', doorpanel='#4a8a7a', build=r_boho),
    'sports':  dict(stand=('#2a2a30', 'low'), wall='#1d3a8a', floor=PATTERN('planks', '#d9a565', '#a8743a', 1.6, '#cf9a5a'), side='#1a3378', trim='#ffffff', dado='#e8e8ee', door='#e23a3a', doorpanel='#c82e2e', build=r_sports),
    'music':   dict(stand=('#24222c', 'low'), wall='#2f5a4a', floor='#3a2a22', side='#284e40', trim='#24222c', door='#24222c', doorpanel='#34323e', build=r_music),
    'library': dict(stand=('#6b3f22', 'low'), wall=PATTERN('vstripe', '#8a2a2a', '#7a2424', 8.0), floor=PATTERN('planks', '#7a4a2a', '#5a3018', 1.4, '#6e4024'), side='#7a2424', trim='#e8dccb', dado='#5a3a22', door='#3a2418', doorpanel='#4a2e1e', build=r_library),
    'artist':  dict(stand=('#ffffff', 'float'), wall='#fbfaf6', floor='#c8c2b8', side='#f2f0ea', trim='#e8e4dc', door='#2ab0ff', doorpanel='#4ac0ff', build=r_artist),
    'space':   dict(stand=('#e8e8f2', 'float'), wall='#1a1844', floor='#2a2058', side='#16143a', trim='#3a3a7a', door='#3a3a7a', doorpanel='#4a4a9a', build=r_space),
    'diner':   dict(stand=('#c8ccd6', 'legs', '#8a8e98'), wall=PATTERN('hstripe', '#bff0e2', '#bff0e2', 1.0), floor=PATTERN('check', '#1b1b22', '#f4f4f0', 2.4), side='#aee6d6', trim='#ffffff', dado='#ffffff', door='#c8322e', doorpanel='#b02a26', build=r_diner),
    'loft':    dict(stand=('#b88a5a', 'legs', '#2a2a30'), wall=PATTERN('brick', '#b4553a', '#e0d4c4', 3.2, '#a04a32'), floor='#9a9a9e', side='#9a4a32', trim='#3a3a40', door='#2a2a30', doorpanel='#3a3a42', ceil='#d8d4cc', build=r_loft),
    'zen':     dict(stand=('#6b4a2e', 'low'), wall='#dfe6d4', floor='#cdbf96', side='#d4dcc8', trim='#6b4a2e', door='#6b4a2e', doorpanel='#7a5838', build=r_zen),
}

def clear():
    S = sc()
    for o in list(S.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)

def build(key, open_door=False):
    S = sc(); bpy.context.window.scene = S
    clear()
    T = ROOMS[key]
    shell(T, open_door)
    T['build']({'open': open_door})
    if open_door:
        for o in list(S.collection.objects):
            if o.type == 'MESH' and not o.name.startswith('apDoor') and o.location.x < -2.75 and o.location.y > D - 1.1 and o.dimensions.x < 1.2:
                bpy.data.objects.remove(o, do_unlink=True)
    lights(); co = camera()
    return co

def ink(S):
    S.render.use_freestyle = True
    S.render.line_thickness_mode = 'ABSOLUTE'; S.render.line_thickness = 2.2
    vl = S.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    if not fs.linesets: fs.linesets.new('Ink')
    ls = fs.linesets[0]
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True; ls.select_external_contour = True
    noink = bpy.data.collections.get('apNoInk') or bpy.data.collections.new('apNoInk')
    if noink.name not in [c.name for c in S.collection.children]: S.collection.children.link(noink)
    for o in list(S.collection.objects):
        if o.type in ('MESH', 'FONT') and o.active_material and o.active_material.get('noink'):
            noink.objects.link(o)
    ls.select_by_collection = True; ls.collection = noink; ls.collection_negation = 'EXCLUSIVE'
    st = ls.linestyle; st.thickness = 2.2 * S.render.resolution_x / 1600
    for md in list(st.color_modifiers): st.color_modifiers.remove(md)
    st.color = (0.1, 0.08, 0.1)
    cm = st.color_modifiers.new('fromMaterial', 'MATERIAL'); cm.material_attribute = 'LINE'; cm.blend = 'MIX'; cm.influence = 1.0

def render(key, open_door=False, path=None, w=1600, h=900):
    co = build(key, open_door)
    S = sc()
    S.render.resolution_x, S.render.resolution_y, S.render.resolution_percentage = w, h, 100
    if LOOK == 'real':
        S.render.use_freestyle = False
        S.render.engine = 'CYCLES'; S.cycles.device = 'GPU'
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'OPTIX'; prefs.get_devices()
        for dv in prefs.devices: dv.use = dv.type == 'OPTIX'
        S.cycles.samples = 96 if w >= 1200 else 48; S.cycles.use_denoising = True
        try: S.cycles.denoiser = 'OPTIX'
        except Exception: pass
        S.view_settings.view_transform = 'AgX'; S.view_settings.look = 'AgX - Punchy'; S.view_settings.exposure = -0.1
    else:
        ink(S)
        S.render.engine = 'BLENDER_EEVEE'; S.eevee.taa_render_samples = 64
        S.view_settings.view_transform = 'Standard'; S.view_settings.look = 'None'; S.view_settings.exposure = 0.0
    S.use_nodes = False
    try: S.compositing_node_group = None
    except Exception: pass
    S.render.image_settings.file_format = 'WEBP'; S.render.image_settings.quality = 86
    os.makedirs(OUT, exist_ok=True)
    S.render.filepath = path or os.path.join(OUT, f'{key}{"-open" if open_door else ""}.webp')
    bpy.ops.render.render(write_still=True)
    return geo(co)

def geo(co):
    """The door, its plate and the TV screen as [left, top, width, height] in percent of the frame."""
    S = sc(); bpy.context.view_layer.update()
    def rect(cx, cz, w_, h_, y):
        pts = [world_to_camera_view(S, co, Vector((cx + sx * w_ / 2, y, cz + sz * h_ / 2))) for sx in (-1, 1) for sz in (-1, 1)]
        xs = [p.x for p in pts]; ys = [1 - p.y for p in pts]
        return [round(min(xs) * 100, 2), round(min(ys) * 100, 2), round((max(xs) - min(xs)) * 100, 2), round((max(ys) - min(ys)) * 100, 2)]
    return {'door': rect(DOOR['x'], DOOR['h'] / 2, DOOR['w'], DOOR['h'], D - 0.06), 'plate': rect(DOOR['x'], 1.98, 0.3, 0.18, D - 0.1),
            'tv': rect(TV['x'], TV['z'], TV['w'], TV['h'], D - 0.08)}

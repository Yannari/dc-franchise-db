"""The Circle's shared sets, rendered in Blender (5.1, Cycles): the Hangout
(where the Influencers decide), the finale lounge (where everyone meets in
person) and the finale studio (the final board).

Same look and helpers as the apartments (circle-apartments.py, LOOK='real'):
    exec(open(r'<repo>/tools/blender/circle-sets.py').read())
    for key in SETS: render_set(key)

Each set leaves its middle to the viewer's UI (js/vp-ci/moments.js): the
Hangout's LED wall holds the AT RISK board, the studio's LED wall holds the
final board, the lounge's sofa sits under the row of faces.
"""
import bpy, bmesh, math, os
REPO = r'C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db\.worktrees\the-circle'
exec(open(os.path.join(REPO, 'tools', 'blender', 'circle-apartments.py'), encoding='utf-8').read(), globals())
SET_OUT = os.path.join(REPO, 'assets', 'sets', 'circle')

def room(W, Dp, H, wall, floor, ceil='#2a2238', side=None):
    box((0, Dp / 2 - 1, -0.05), (W, Dp + 2, 0.1), floor)
    box((0, Dp / 2 - 1, H + 0.05), (W, Dp + 2, 0.1), M(ceil))
    box((0, Dp + 0.05, H / 2), (W, 0.1, H), wall)
    sw = side or wall
    for s in (-1, 1): box((s * (W / 2 + 0.05), Dp / 2 - 1, H / 2), (0.1, Dp + 2, H), sw)

def armchair(x, y, rz, color, legs='#c99a3a'):
    """A velvet armchair at (x, y), turned rz about its own centre."""
    c = M(color, kind='sheen'); cs, sn = math.cos(rz), math.sin(rz)
    def at(dx, dy, z, size, mat):
        b = box((x + dx * cs - dy * sn, y + dx * sn + dy * cs, z), size, mat); b.rotation_euler = (0, 0, rz); return b
    at(0, 0, 0.32, (0.85, 0.8, 0.26), c); at(0, 0.34, 0.75, (0.85, 0.16, 0.66), c)
    for s in (-1, 1): at(s * 0.4, 0.02, 0.52, (0.14, 0.78, 0.36), c)
    at(0, -0.04, 0.5, (0.6, 0.62, 0.12), c)
    for lx in (-0.33, 0.33):
        for ly in (-0.3, 0.3): at(lx, ly, 0.1, (0.04, 0.04, 0.2), M(legs, kind='metal'))

def bent(loc, size, mat, angle, cuts=32, bevel=0.03):
    """A box bent into an arc about its own centre: its ends come toward the camera."""
    me = bpy.data.meshes.new('bent'); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.5], cuts=cuts, use_grid_fill=True)
    for v in bm.verts: v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('bent', me); sc().collection.objects.link(o); o.location = loc
    if bevel:
        bv = o.modifiers.new('round', 'BEVEL'); bv.width = bevel; bv.segments = 3; bv.use_clamp_overlap = True
    sd = o.modifiers.new('bend', 'SIMPLE_DEFORM'); sd.deform_method = 'BEND'; sd.deform_axis = 'Z'; sd.angle = angle
    for pl in me.polygons: pl.use_smooth = True
    o.data.materials.append(mat); return o

def LED(name, cols, grid=True):
    """A lit LED wall: a colour sweep across it, the pixel grid in fine dark lines."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = 1.6
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, hexc(cols[0]); el[1].position, el[1].color = 1.0, hexc(cols[-1])
    for i, c in enumerate(cols[1:-1], 1): x = el.new(i / (len(cols) - 1)); x.color = hexc(c)
    L.new(sep.outputs['X'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    if grid:
        br = nt.nodes.new('ShaderNodeTexBrick'); br.offset = 0.0; br.inputs['Scale'].default_value = 60.0
        br.inputs['Brick Width'].default_value = 0.5; br.inputs['Row Height'].default_value = 0.5; br.inputs['Mortar Size'].default_value = 0.04
        br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (1, 1, 1, 1); br.inputs['Mortar'].default_value = (0.35, 0.35, 0.4, 1)
        L.new(tc.outputs['Generated'], br.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
        L.new(col, mx.inputs['A']); L.new(br.outputs['Color'], mx.inputs['B']); col = mx.outputs['Result']
    L.new(col, e.inputs['Color']); L.new(e.outputs[0], out.inputs['Surface']); m['noink'] = 1
    return m

def balloon(x, y, z, col, r=0.2):
    ball((x, y, z), r, M(col, kind='gloss'), scale=(1, 1, 1.15)); cyl((x, y, z - r * 1.2 - 0.004), 0.025, 0.04, M(col))

# ── the Hangout: the Influencers' room ─────────────────────────────────
def s_hangout():
    Dp, W, H = 5.2, 9.0, 3.2
    room(W, Dp, H, M('#3a2350'), PATTERN('planks', '#4a3226', '#2a1a12', 1.6, '#433024'), '#24182f', M('#2f1c42'))
    # wood slats either side of the LED wall
    for s in (-1, 1):
        for i in range(14): box((s * (2.35 + i * 0.12), Dp - 0.06, H / 2), (0.07, 0.08, H), M('#8a5a32', kind='wood'))
    # the LED wall: the board goes on it
    box((0, Dp - 0.06, 1.62), (3.9, 0.08, 2.5), M('#121020', '#000000', 'gloss'))
    box((0, Dp - 0.105, 1.62), (3.75, 0.01, 2.35), GLOW('#140f2a', 0.25))
    box((0, Dp - 0.04, 1.62), (4.05, 0.02, 2.62), GLOW('#8b5cff', 0.35))         # its glow on the wall
    # neon rings: the Circle's mark, one each side
    for s, col in ((-1, '#ff4fb4'), (1, '#3fd8ff')):
        ring((s * 3.4, Dp - 0.12, 2.35), 0.32, 0.025, GLOW(col, 2.0))
    # two velvet armchairs, turned to each other; a low table with candles
    armchair(-2.5, 3.1, -0.45, '#2f8a7a'); armchair(2.5, 3.1, 0.45, '#c8325a')
    rug('round', '#1c1430', x=0, y=3.0, w=4.4, d=2.0, border='#c99a3a')
    cyl((0, 2.9, 0.36), 0.55, 0.05, M('#1b1b22', kind='gloss')); cyl((0, 2.9, 0.18), 0.09, 0.34, M('#c99a3a', kind='metal'))
    for dx, h in ((-0.2, 0.18), (0.05, 0.26), (0.25, 0.14)):
        cyl((dx, 2.85, 0.39 + h / 2), 0.04, h, M('#f4ece0')); ball((dx, 2.85, 0.4 + h + 0.03), 0.022, GLOW('#ffb04a', 3.0))
    # a bar cart, plants, floor lamps
    bx = 3.6
    for z in (0.3, 0.75): box((bx, 3.9, z), (0.8, 0.45, 0.03), M('#c99a3a', kind='metal'))
    for s in (-1, 1): box((bx + s * 0.38, 3.9, 0.45), (0.03, 0.42, 0.9), M('#c99a3a', kind='metal'))
    for i, col in enumerate(('#3a8a5a', '#8a2a3a', '#f4d48a')): cyl((bx - 0.25 + i * 0.22, 3.9, 0.92), 0.05, 0.3, M(col, kind='gloss'))
    pot_plant(-3.9, Dp - 0.6, 'monstera', '#1b1b22', 1.25)
    floor_lamp(-3.2, 4.1, '#ffd9a0', '#c99a3a', 'globe')
    for s in (-1, 1): pendant(s * 1.4, 2.6, 2.6, '#ffc06a')

# ── the finale lounge: everyone, in person ─────────────────────────────
def s_lounge():
    Dp, W, H = 5.2, 9.0, 3.2
    room(W, Dp, H, PATTERN('vstripe', '#ecc8dc', '#e4b8d0', 3.0), PATTERN('check', '#f4efe9', '#dccfd6', 1.2), '#f6f0f4', M('#e4b8d0'))
    # an arched alcove with the Circle's ring in neon
    box((0, Dp - 0.04, 1.6), (2.6, 0.06, 2.9), M('#e2c8da'))
    cyl((0, Dp - 0.04, 3.05), 1.3, 0.06, M('#e2c8da'), rot=(math.pi / 2, 0, 0))
    ring((0, Dp - 0.1, 2.15), 0.62, 0.035, GLOW('#ff4fb4', 2.2))
    ring((0, Dp - 0.1, 2.15), 0.5, 0.02, GLOW('#8b5cff', 2.0))
    # the long sofa they all sit on
    c = M('#f7f1e8', kind='sheen'); y = 3.7
    box((0, y, 0.25), (6.2, 0.95, 0.32), c); box((0, y + 0.4, 0.68), (6.2, 0.2, 0.62), c)
    for s in (-1, 1): box((s * 3.15, y + 0.02, 0.45), (0.25, 0.98, 0.55), c)
    for i in range(5): box((-2.48 + i * 1.24, y - 0.05, 0.46), (1.2, 0.72, 0.12), c)
    for i, col in enumerate(('#ff8ab8', '#ffd23f', '#8b5cff', '#3fd8ff', '#ff8ab8', '#ffd23f')):
        box((-2.7 + i * 1.08, y + 0.22, 0.7), (0.36, 0.12, 0.34), M(col, kind='sheen'), rot=(0.15, 0, 0))
    # balloons in clusters at each end, champagne on a table
    for cx, cols in ((-3.7, ('#ffd23f', '#ff8ab8', '#ffffff', '#ffd23f', '#8b5cff')), (3.7, ('#ff8ab8', '#ffd23f', '#ffffff', '#3fd8ff', '#ff8ab8'))):
        for i, col in enumerate(cols):
            balloon(cx + (i % 3 - 1) * 0.28, Dp - 0.5 + (i % 2) * 0.2, 1.7 + (i // 3) * 0.45 + (i % 2) * 0.12, col)
        for i in range(3): cyl((cx + (i - 1) * 0.1, Dp - 0.45, 0.8), 0.004, 1.6, M('#ffffff'))
    cyl((0, 2.6, 0.4), 0.6, 0.05, M('#ffffff', kind='gloss')); cyl((0, 2.6, 0.2), 0.08, 0.38, M('#c99a3a', kind='metal'))
    cyl((0, 2.6, 0.55), 0.13, 0.24, M('#d8dde6', kind='metal'), r2=0.15)
    for dx in (-0.04, 0.05): cyl((dx, 2.6, 0.72), 0.03, 0.3, M('#1f4a2a', kind='gloss'))
    for dx in (-0.35, 0.35):
        cyl((dx, 2.5, 0.52), 0.025, 0.16, M('#ffe7a0', kind='gloss')); cyl((dx, 2.5, 0.44), 0.006, 0.08, M('#e8eef4', kind='gloss'))
    rug('round', '#f2c8d8', x=0, y=2.7, w=4.6, d=1.8, border='#c99a3a')
    for i in range(30):
        t = i / 29; ball((-4.3 + t * 8.6, Dp - 0.08, 2.95 - 0.12 * math.sin(t * math.pi * 4) ** 2), 0.03, GLOW('#fff1c8', 2.0))
    pot_plant(-4.0, 3.2, 'monstera', '#ffffff', 1.2); pot_plant(4.0, 3.2, 'palm', '#ffffff', 1.0)

# ── the finale studio: the final board ────────────────────────────────
def s_studio():
    Dp, W, H = 6.0, 12.0, 4.4
    room(W, Dp, H, M('#0e0b1e'), M('#0b0a14', '#000000', 'gloss'), '#08070f', M('#100c22'))
    # the curved LED wall: the board sits in its middle
    bent((0, Dp - 0.6, 2.05), (9.0, 0.1, 3.0), LED('apLedStudio', ['#3a1060', '#ff3ea5', '#1a0f4a', '#120a36', '#1a0f4a', '#2ee8ff', '#2a1a70']), math.radians(-40), bevel=0)
    bent((0, Dp - 0.55, 2.05), (9.2, 0.08, 3.15), M('#1b1b22', kind='metal'), math.radians(-40), bevel=0)
    # light towers either side, their heads lit
    for s_ in (-1, 1):
        x = s_ * 3.75
        box((x, 2.4, H / 2), (0.22, 0.22, H), M('#2a2a34', kind='metal'))
        for k in range(4):
            cyl((x - s_ * 0.2, 2.25, 0.9 + k * 0.85), 0.13, 0.22, M('#14141a', kind='metal'), rot=(0, math.pi / 2, 0))
            disc((x - s_ * 0.32, 2.25, 0.9 + k * 0.85), 0.1, GLOW('#ffffff' if k % 2 else '#ff8ad8', 3.0), rot=(0, math.pi / 2, 0))
    # the stage: a raised disc with a lit edge
    cyl((0, 2.6, 0.1), 3.8, 0.2, M('#16122a', '#000000', 'gloss'), verts=96)
    cyl((0, 2.0, 0.05), 4.4, 0.1, M('#100d1e', '#000000', 'gloss'), verts=96)
    ring((0, 2.0, 0.1), 4.4, 0.02, GLOW('#ff4fb4', 2.0), rot=(0, 0, 0))
    ring((0, 2.6, 0.2), 3.8, 0.025, GLOW('#8b5cff', 2.5), rot=(0, 0, 0))
    # the finalists' couch: one long curve of white leather
    c = M('#f4f0ea', kind='sheen')
    bent((0, 3.0, 0.38), (5.6, 0.85, 0.32), c, math.radians(-35))
    bent((0, 3.4, 0.78), (5.6, 0.18, 0.6), c, math.radians(-35))
    # the light rig: a truss with spots, beams into a hazy air
    box((0, 2.6, H - 0.3), (10.5, 0.25, 0.25), M('#3a3a46', kind='metal'))
    for i in range(9):
        x = -4.4 + i * 1.1
        cyl((x, 2.6, H - 0.55), 0.12, 0.3, M('#1b1b22', kind='metal'))
        cyl((x, 2.6, H - 0.72), 0.1, 0.02, GLOW('#ffffff' if i % 2 else '#c8a8ff', 3.0))
    S = sc(); S.world.use_nodes = True
    vol = bpy.data.materials.get('apHaze') or bpy.data.materials.new('apHaze'); vol.use_nodes = True; nt = vol.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); v = nt.nodes.new('ShaderNodeVolumePrincipled'); v.inputs['Density'].default_value = 0.03
    nt.links.new(v.outputs[0], o.inputs['Volume'])
    hz = box((0, 2.5, H / 2), (W - 0.2, Dp + 2.8, H - 0.1), vol); hz.name = 'apHazeBox'
    for i, (x, col) in enumerate(((-3.5, (0.8, 0.6, 1)), (0, (1, 1, 1)), (3.5, (0.6, 0.85, 1)))):
        sp = bpy.data.lights.new(f'apBeam{i}', 'SPOT'); sp.energy = 2200; sp.spot_size = math.radians(24); sp.spot_blend = 0.4; sp.color = col
        so = bpy.data.objects.new(f'apBeam{i}', sp); S.collection.objects.link(so); so.location = (x, 2.6, H - 0.7)
        so.rotation_euler = (Vector((x * 0.4, 3.2, 0)) - so.location).to_track_quat('-Z', 'Y').to_euler()

SETS = {'hangout': s_hangout, 'lounge': s_lounge, 'studio': s_studio}

def render_set(key, path=None, w=1600, h=900, look=None):
    S = sc(); bpy.context.window.scene = S
    clear()
    SETS[key]()
    lights(); co = camera()
    # these rooms are bigger than an apartment: the camera stands further back
    co.location, co.data.lens, co.data.shift_y = {'hangout': ((0, -2.2, 1.55), 24, -0.08), 'lounge': ((0, -2.0, 1.5), 24, -0.08),
                                                 'studio': ((0, -3.2, 1.75), 24, -0.06)}[key]
    if key == 'studio':
        for n in ('apCeil', 'apFill'):
            o = S.objects.get(n)
            if o: o.data.energy *= 0.25
        S.objects['apKey'].data.energy = 250
    if key == 'hangout':
        S.objects['apCeil'].data.energy = 90; S.objects['apFill'].data.energy = 60; S.objects['apKey'].data.energy = 260
    S.render.resolution_x, S.render.resolution_y, S.render.resolution_percentage = w, h, 100
    S.render.use_freestyle = False
    S.render.engine = 'CYCLES'; S.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'; prefs.get_devices()
    for dv in prefs.devices: dv.use = dv.type == 'OPTIX'
    S.cycles.samples = 128 if w >= 1200 else 48; S.cycles.use_denoising = True
    try: S.cycles.denoiser = 'OPTIX'
    except Exception: pass
    S.view_settings.view_transform = 'AgX'; S.view_settings.look = 'AgX - Punchy'; S.view_settings.exposure = -0.1
    S.render.image_settings.file_format = 'WEBP'; S.render.image_settings.quality = 86
    S.render.filepath = path or os.path.join(SET_OUT, f'{key}.webp')
    bpy.ops.render.render(write_still=True)
    return S.render.filepath

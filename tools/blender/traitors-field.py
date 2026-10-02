"""The Traitors' mission field, rendered in Blender (2026-10-02).

Run inside Blender AFTER tools/blender/traitors-conclave.py has run once in
the same file (iron, wax). It builds a scene of its own ("TR_Field") and
leaves every other scene alone, applies the illustrated look
(tools/blender/traitors-toon.py) and renders the plate
js/vp-tr/mission-field-stage.js draws behind the teams:

    assets/sets/traitors/field.webp

The stage stands the teams on the grass at .2 and .8 of the width, in rows at
.53 and .65 of the height, with their banners above; the prize chest sits
between them. The horizon is at about .31. A Highland afternoon: cloud,
three ranges of hills going blue with distance, the castle small on its
rise, the loch, a dry-stone wall and heather across the field, pines either
side, and the chest iron-bound on a draped trestle.
"""
import bpy, bmesh, math, os, random

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True
rnd = random.Random(41)

sc = bpy.data.scenes.get("TR_Field") or bpy.data.scenes.new("TR_Field")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def coll(name="trd_set"):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in [x.name for x in sc.collection.children]: sc.collection.children.link(c)
    return c

def put(name, bm, mat=None, smooth=False):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    me.materials.clear()
    if mat: me.materials.append(bpy.data.materials[mat])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me
    c = coll()
    if ob.name not in c.objects: c.objects.link(ob)
    return ob

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def principled(name, color, rough=0.6, emit=None, strength=0.0, metal=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

def mixed(name, c1, c2, scale, kind='noise', rough=0.8, stripes=0.0):
    """two colours broken up by a texture; optional mowing stripes along x"""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale; tx.inputs['Detail'].default_value = 3
    L.new(tc.outputs['Object'], tx.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (*c1, 1); rp.color_ramp.elements[1].color = (*c2, 1)
    L.new(tx.outputs['Fac'], rp.inputs['Fac'])
    col = rp.outputs['Color']
    if stripes:
        wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = stripes; wv.inputs['Distortion'].default_value = 0
        L.new(tc.outputs['Object'], wv.inputs['Vector'])
        st = N.new('ShaderNodeMath'); st.operation = 'GREATER_THAN'; st.inputs[1].default_value = 0.5
        L.new(wv.outputs['Fac'], st.inputs[0])
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
        L.new(st.outputs[0], mx.inputs['Factor']); L.new(col, mx.inputs[6]); mx.inputs[7].default_value = (0.93, 0.95, 0.9, 1)
        col = mx.outputs[2]
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = rough
    L.new(col, b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

# ── materials ─────────────────────────────────────────────────────────────
mixed("trd_grass", (0.09, 0.17, 0.05), (0.3, 0.38, 0.12), 0.06, stripes=0.09)
mixed("trd_heather", (0.28, 0.12, 0.26), (0.32, 0.22, 0.12), 0.25)
mixed("trd_drystone", (0.22, 0.21, 0.19), (0.38, 0.37, 0.34), 2.5)
mixed("trd_hill_near", (0.13, 0.2, 0.08), (0.2, 0.24, 0.1), 0.02)
mixed("trd_hill_mid", (0.16, 0.21, 0.24), (0.27, 0.32, 0.33), 0.01)
principled("trd_hill_far", (0.42, 0.5, 0.6), 1.0)
principled("trd_loch", (0.35, 0.45, 0.55), 0.08)
mixed("trd_pine", (0.025, 0.06, 0.035), (0.07, 0.13, 0.06), 1.5)
principled("trd_trunk", (0.12, 0.07, 0.04), 0.9)
principled("trd_wood", (0.3, 0.16, 0.07), 0.6)
principled("trd_cloth", (0.45, 0.04, 0.07), 0.8)
principled("trd_gold", (0.85, 0.6, 0.18), 0.35, metal=1.0)
principled("trd_iron", (0.08, 0.075, 0.07), 0.5, metal=0.8)
principled("trd_stone", (0.42, 0.24, 0.18), 0.85)
principled("trd_slate", (0.16, 0.18, 0.22), 0.6)
principled("trd_cloud", (1, 1, 1), 1.0, emit=(1.0, 0.96, 0.88), strength=1.6)

# ── helpers ───────────────────────────────────────────────────────────────
def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, r2=None, seg=24):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

def ridge(name, y, width, h, m, seed, n=160, base=-2.0, rough=0.5):
    """a range of hills: a strip whose top edge wanders"""
    r = random.Random(seed); bm = bmesh.new()
    tops, bots = [], []
    phase = r.uniform(0, 6.28)
    for i in range(n + 1):
        x = -width/2 + width*i/n
        t = i / n * 6.28
        z = h*(0.55 + 0.28*math.sin(t*1.3 + phase) + 0.14*math.sin(t*3.1 + phase*2) + 0.05*math.sin(t*7.7 + phase))
        tops.append(bm.verts.new((x, y, z))); bots.append(bm.verts.new((x, y, base)))
    for i in range(n): bm.faces.new((bots[i], bots[i+1], tops[i+1], tops[i]))
    return put(name, bm, m)

# ORGANIC SILHOUETTES: the trees are subdivided and pushed about by a noise
# texture, so their edges are ragged the way branches are. Smooth primitive
# cones and balls read as a low-poly game, painted or not.
def _ragged(ob, strength, scale, subdiv=2):
    sub = ob.modifiers.new("sub", 'SUBSURF'); sub.levels = subdiv; sub.render_levels = subdiv
    tex = bpy.data.textures.get("trd_ragged_" + str(scale)) or bpy.data.textures.new("trd_ragged_" + str(scale), 'CLOUDS')
    tex.noise_scale = scale; tex.noise_depth = 2
    dp = ob.modifiers.new("disp", 'DISPLACE'); dp.texture = tex; dp.strength = strength; dp.mid_level = 0.5
    dp.texture_coords = 'GLOBAL'
    return ob

def pine(name, x, y, h):
    """a Scots-pine-ish conifer: drooping skirts of branches, ragged at the edges"""
    bm = bmesh.new()
    tiers = 8
    for t in range(tiers):
        z0 = h*0.18 + h*0.72*t/tiers; r = h*0.2*(1 - t/(tiers + 0.6))*rnd.uniform(0.82, 1.12)
        res = bmesh.ops.create_cone(bm, cap_ends=False, segments=14, radius1=r, radius2=r*0.08, depth=h*0.2)
        for v in res['verts']:
            # the skirt droops: its rim hangs lower than its centre
            v.co.z += z0 + h*0.1 - (0.25*h*0.2 if math.hypot(v.co.x, v.co.y) > r*0.6 else 0)
            v.co.x += x + rnd.uniform(-0.05, 0.05)*h; v.co.y += y + rnd.uniform(-0.05, 0.05)*h
    _ragged(put(name, bm, "trd_pine"), h*0.06, max(0.4, h*0.06))
    cyl(name + "_trunk", x, y, h*0.028, 0, h*0.35, "trd_trunk", seg=7)

# ── the field ─────────────────────────────────────────────────────────────
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=60)
for v in bm.verts: v.co.y += 20
put("trd_grass", bm, "trd_grass")
# heather beyond the wall, rising gently to the hills
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=40, y_segments=20, size=1)
for v in bm.verts:
    v.co.x *= 600; v.co.y = 60 + (v.co.y + 0.5)*90; v.co.z = (v.co.y - 60)*0.004 + 0.3*math.sin(v.co.x*0.03)
put("trd_moor", bm, "trd_heather")
# the dry-stone wall across the field, with a gap: three courses of uneven stones
for k, (x0, x1) in enumerate(((-80, -3.5), (3.5, 80))):
    bm = bmesh.new()
    for course, (zc, hc) in enumerate(((0.0, 0.42), (0.42, 0.36), (0.78, 0.3))):
        x = x0 + rnd.uniform(0, 0.3)*course
        while x < x1:
            w = rnd.uniform(0.35, 0.8)
            res = bmesh.ops.create_cube(bm, size=1)
            for v in res['verts']:
                v.co.x = x + w/2 + v.co.x*(w - 0.04); v.co.y = 32 + v.co.y*(0.6 - course*0.08) + rnd.uniform(-0.03, 0.03)
                v.co.z = zc + (v.co.z + 0.5)*hc*rnd.uniform(0.85, 1.1)
            x += w
    # cope stones on edge along the top
    x = x0
    while x < x1:
        res = bmesh.ops.create_cube(bm, size=1)
        for v in res['verts']:
            v.co.x = x + 0.12 + v.co.x*0.2; v.co.y = 32 + v.co.y*0.4; v.co.z = 1.08 + (v.co.z + 0.5)*0.28*rnd.uniform(0.8, 1.2)
        x += 0.26
    put(f"trd_wall{k}", bm, "trd_drystone")
# the loch, holding the sky
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
for v in bm.verts: v.co.x *= 1400; v.co.y = 150 + (v.co.y + 0.5)*230; v.co.z = 0.4
put("trd_loch", bm, "trd_loch")
# three ranges of hills, going blue with distance
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=120, y_segments=30, size=1)
for v in bm.verts:
    v.co.x *= 1400; v.co.y = 380 + (v.co.y + 0.5)*140
    u = v.co.x/1200*6.28
    v.co.z = max(0.0, (v.co.y - 380)/140)**0.8 * 44*(0.6 + 0.25*math.sin(u*1.7 + 1) + 0.15*math.sin(u*4.3))
_ragged(put("trd_hills_near", bm, "trd_hill_near", smooth=True), 4.0, 25.0, subdiv=1)
ridge("trd_hills_mid", 620, 1800, 52, "trd_hill_mid", 5)
ridge("trd_hills_far", 1100, 3000, 85, "trd_hill_far", 9, rough=0.2)   # low enough to leave sky above it
# pines either side of the field
k = 0
for side in (-1, 1):
    for i in range(16):
        x = side*rnd.uniform(16, 40); y = rnd.uniform(14, 60); h = rnd.uniform(9, 16)
        pine(f"trd_pine{k}", x, y, h); k += 1

def broadleaf(name, x, y, h):
    """an oak or a beech: a billowing crown of clumps, each clump lumpy"""
    bm = bmesh.new()
    for j in range(9):
        res = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=h*rnd.uniform(0.13, 0.21))
        a = rnd.uniform(0, 6.28); d = rnd.uniform(0, h*0.2)
        for v in res['verts']:
            v.co.x += x + d*math.cos(a); v.co.y += y + d*math.sin(a); v.co.z += h*rnd.uniform(0.55, 0.85)
    _ragged(put(name, bm, "trd_leaf", smooth=True), h*0.09, max(0.5, h*0.05), subdiv=1)
    cyl(name + "_trunk", x, y, h*0.035, 0, h*0.6, "trd_trunk", seg=7)
mixed("trd_leaf", (0.07, 0.13, 0.04), (0.2, 0.28, 0.09), 1.2)
for i in range(8):
    side = -1 if i % 2 else 1
    broadleaf(f"trd_oak{i}", side*rnd.uniform(14, 34), rnd.uniform(18, 70), rnd.uniform(8, 12))
# a forest along the foot of the near hills
for i in range(70):
    x = rnd.uniform(-520, 520); y = rnd.uniform(385, 420); h = rnd.uniform(16, 26)
    pine(f"trd_fpine{i}", x, y, h)

# the castle, small and proper on its rise, to the right
CX, CY = 130, 420
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1)
for v in bm.verts: v.co.x = v.co.x*60 + CX; v.co.y = v.co.y*40 + CY; v.co.z = v.co.z*14 - 2
put("trd_rise", bm, "trd_hill_near", smooth=True)
box("trd_c_block", CX - 9, CX + 9, CY - 4, CY + 4, 10, 21, "trd_stone")
box("trd_c_tower", CX - 3, CX + 3, CY - 5, CY + 2, 10, 28, "trd_stone")
for sx in (-1, 1):
    cyl(f"trd_c_rt{sx}", CX + sx*10, CY - 4, 3.2, 10, 25, "trd_stone")
    cyl(f"trd_c_cone{sx}", CX + sx*10, CY - 4, 3.6, 25, 33, "trd_slate", r2=0.05)

# clouds: soft flat banks across the sky
for i in range(6):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1)
    x = rnd.uniform(-650, 650); z = rnd.uniform(190, 330); y = 950
    sx, sz = rnd.uniform(60, 140), rnd.uniform(10, 20)
    for v in bm.verts: v.co.x = v.co.x*sx + x; v.co.y = v.co.y*20 + y; v.co.z = v.co.z*sz + z
    put(f"trd_cloud{i}", bm, "trd_cloud", smooth=True)

# ── the chest, iron-bound, on a draped trestle between the teams ─────────
TX, TY = 0.0, 17.0
box("trd_trestle_top", TX - 1.0, TX + 1.0, TY - 0.45, TY + 0.45, 0.8, 0.86, "trd_wood")
for sx in (-1, 1):
    box(f"trd_trestle_leg{sx}", TX + sx*0.8 - 0.05, TX + sx*0.8 + 0.05, TY - 0.35, TY + 0.35, 0, 0.8, "trd_wood")
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)      # the cloth, hanging over the front
for v in bm.verts: v.co.x *= 2.1; v.co.y = v.co.y*0.95 + TY; v.co.z = v.co.z*0.5 + 0.62
put("trd_cloth", bm, "trd_cloth")
box("trd_chest", TX - 0.55, TX + 0.55, TY - 0.32, TY + 0.32, 0.87, 1.37, "trd_wood")
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.33, radius2=0.33, depth=1.1)
for v in bm.verts:
    x, z = v.co.x, v.co.z; v.co.x = z + TX; v.co.z = x*0.6 + 1.37; v.co.y = v.co.y + TY
put("trd_chest_lid", bm, "trd_wood", smooth=True)
for k, dx in enumerate((-0.38, 0.38)):
    box(f"trd_band{k}", TX + dx - 0.04, TX + dx + 0.04, TY - 0.34, TY + 0.34, 0.86, 1.55, "trd_iron")
for i in range(14):                                      # a spill of coins on the cloth
    cyl(f"trd_coin{i}", TX + rnd.uniform(-0.9, 0.9), TY - 0.35 + rnd.uniform(-0.05, 0.05), 0.05, 0.86, 0.875, "trd_gold", seg=12)

m, nt, out = mat("trd_air")
vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = 0.0002   # a trace of distance; more greys the valley out
vol.inputs['Color'].default_value = (0.75, 0.82, 0.92, 1)
nt.links.new(vol.outputs[0], out.inputs['Volume'])
box("trd_air", -1500, 1500, 40, 1300, -5, 70, "trd_air")   # a low layer: rays to the sky must not cross it

# ── light and sky: a Highland afternoon ───────────────────────────────────
def light(name, typ, loc, energy, color, size=0.1, rot=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ == 'SUN': ld.angle = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if rot: ob.rotation_euler = rot
    c = coll()
    if ob.name not in c.objects: c.objects.link(ob)
light("trd_sun", 'SUN', (0, 0, 50), 7.5, (1.0, 0.8, 0.55), 0.03, rot=(math.radians(64), 0, math.radians(-125)))   # low, golden, from the left
wd = bpy.data.worlds.get("trd_world") or bpy.data.worlds.new("trd_world")
wd.use_nodes = True; nt = wd.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground')
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
rp = nt.nodes.new('ShaderNodeValToRGB'); els = rp.color_ramp.elements
els[0].position = 0.0; els[0].color = (0.98, 0.78, 0.52, 1)     # warm haze at the horizon
els[1].position = 0.35; els[1].color = (0.16, 0.27, 0.48, 1)    # Highland blue overhead
e = els.new(0.1); e.color = (0.62, 0.7, 0.8, 1)
nt.links.new(sep.outputs['Z'], rp.inputs['Fac']); nt.links.new(rp.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 0.7
nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
sc.world = wd
sc.view_settings.exposure = 0.4

# ── camera: eye level, the horizon at about .31 ───────────────────────────
cd = bpy.data.cameras.get("trd_cam") or bpy.data.cameras.new("trd_cam"); cd.lens = 35; cd.sensor_width = 36
cd.clip_end = 5000
cam = bpy.data.objects.get("trd_cam") or bpy.data.objects.new("trd_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0, -2.0, 1.7); cam.rotation_euler = (math.radians(90 - 6.0), 0, 0)
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 82
sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'


# ── the painted look (tools/blender/traitors-paint.py), before any render ──
def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "field.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)

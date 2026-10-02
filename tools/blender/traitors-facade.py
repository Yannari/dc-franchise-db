"""The Traitors' castle front, from the forecourt (the arrival), rendered in
Blender (2026-10-02).

Run inside Blender AFTER tools/blender/traitors-conclave.py has run once in
the same file (it reuses that script's iron and flame materials). It builds
a scene of its own ("TR_Facade") and leaves every other scene alone, then
renders the plate js/vp-tr/arrival-stage.js draws behind the cars and the
cast:

    assets/sets/traitors/facade.webp

The stage puts the cast on the gravel at .70-.745 of the height, in a row
across the middle, and stops each car with its wheels at .79: the foot of
the walls must land at about .71, with the great door behind the middle of
that row. The camera below does that; check before shipping.

A Scottish Baronial house at dusk: red sandstone, a battlemented central
tower over the great door, round towers under tall slate cones, wings with
crow-stepped gables, corbelled bartizans on the outer corners, lit mullioned
windows, pines either side and the hills behind.
"""
import bpy, bmesh, math, os, random

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True                                   # set False to build without rendering
rnd = random.Random(23)

sc = bpy.data.scenes.get("TR_Facade") or bpy.data.scenes.new("TR_Facade")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def coll(name="trf_set"):
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

def uv_box(bm):
    """world-scale box mapping: each face takes the two axes it does not face along"""
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        for l in f.loops:
            co = l.vert.co
            if abs(n.z) > 0.7: l[uv].uv = (co.x, co.y)
            elif abs(n.x) > abs(n.y): l[uv].uv = (co.y, co.z)
            else: l[uv].uv = (co.x, co.z)

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

# ── materials ─────────────────────────────────────────────────────────────
def ashlar(name, c1, c2, mortar, bw, rh, rough=0.85, bump=0.5):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    br = N.new('ShaderNodeTexBrick'); br.offset = 0.5; br.inputs['Scale'].default_value = 1.0
    br.inputs['Brick Width'].default_value = bw; br.inputs['Row Height'].default_value = rh
    br.inputs['Mortar Size'].default_value = 0.012
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1); br.inputs['Mortar'].default_value = (*mortar, 1)
    L.new(tc.outputs['UV'], br.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.2; nz.inputs['Detail'].default_value = 6
    L.new(tc.outputs['UV'], nz.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB')
    rp.color_ramp.elements[0].position = 0.3; rp.color_ramp.elements[0].color = (0.6, 0.6, 0.6, 1)
    rp.color_ramp.elements[1].position = 0.75; rp.color_ramp.elements[1].color = (1.1, 1.08, 1.05, 1)
    L.new(nz.outputs['Fac'], rp.inputs['Fac'])
    mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 0.7
    L.new(br.outputs['Color'], mx.inputs[6]); L.new(rp.outputs['Color'], mx.inputs[7])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = rough
    L.new(mx.outputs[2], b.inputs['Base Color'])
    inv = N.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    L.new(br.outputs['Fac'], inv.inputs[1])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.04
    L.new(inv.outputs[0], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    L.new(b.outputs['BSDF'], out.inputs['Surface'])

ashlar("trf_sandstone", (0.36, 0.17, 0.12), (0.27, 0.12, 0.09), (0.14, 0.09, 0.07), 0.8, 0.36)
ashlar("trf_slate", (0.07, 0.08, 0.1), (0.05, 0.055, 0.07), (0.02, 0.02, 0.025), 0.32, 0.18, rough=0.55, bump=0.8)

def principled(name, color, rough=0.5, emit=None, strength=0.0, metal=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
principled("trf_pine", (0.01, 0.02, 0.015), 0.9)
principled("trf_hill", (0.02, 0.022, 0.035), 1.0)
principled("trf_dark_win", (0.01, 0.012, 0.018), 0.2)
principled("trf_doorglow", (1, 0.6, 0.25), 0.5, emit=(1.0, 0.5, 0.18), strength=2.2)
principled("trf_trim", (0.30, 0.14, 0.1), 0.8)

# lit mullioned window: warm glass in a dark stone frame of mullion and transom
m, nt, out = mat("trf_window"); N, L = nt.nodes, nt.links
tc = N.new('ShaderNodeTexCoord')
br = N.new('ShaderNodeTexBrick'); br.offset = 0.0; br.inputs['Scale'].default_value = 1.0
br.inputs['Brick Width'].default_value = 0.5; br.inputs['Row Height'].default_value = 0.5; br.inputs['Mortar Size'].default_value = 0.035
br.inputs['Color1'].default_value = (1.0, 0.68, 0.32, 1); br.inputs['Color2'].default_value = (0.95, 0.55, 0.22, 1); br.inputs['Mortar'].default_value = (0, 0, 0, 1)
L.new(tc.outputs['UV'], br.inputs['Vector'])
em = N.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 0.9   # AgX bleaches strong emission to white
L.new(br.outputs['Color'], em.inputs['Color']); L.new(em.outputs['Emission'], out.inputs['Surface'])
br.inputs['Color1'].default_value = (1.0, 0.5, 0.17, 1); br.inputs['Color2'].default_value = (0.9, 0.38, 0.1, 1)
dim = m.copy(); dim.name = "trf_window_dim"
for n in dim.node_tree.nodes:
    if n.type == 'EMISSION': n.inputs['Strength'].default_value = 0.35

# gravel: fine stones, warm grey, catching the window light
m, nt, out = mat("trf_gravel"); N, L = nt.nodes, nt.links
tc = N.new('ShaderNodeTexCoord')
vo = N.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 40
L.new(tc.outputs['Object'], vo.inputs['Vector'])
nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.4; L.new(tc.outputs['Object'], nz.inputs['Vector'])
rp = N.new('ShaderNodeValToRGB')
rp.color_ramp.elements[0].color = (0.035, 0.032, 0.03, 1); rp.color_ramp.elements[1].color = (0.12, 0.105, 0.095, 1)
L.new(vo.outputs['Distance'], rp.inputs['Fac'])
mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 0.5
L.new(rp.outputs['Color'], mx.inputs[6]); L.new(nz.outputs['Color'], mx.inputs[7])
b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.9
L.new(mx.outputs[2], b.inputs['Base Color'])
bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.6; L.new(vo.outputs['Distance'], bp.inputs['Height'])
L.new(bp.outputs['Normal'], b.inputs['Normal']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

# ── building blocks ───────────────────────────────────────────────────────
def box(name, x0, x1, y0, y1, z0, z1, m="trf_sandstone"):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    bm.normal_update(); uv_box(bm)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m="trf_sandstone", r2=None, seg=40):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            co = l.vert.co; l[uv].uv = (math.atan2(co.y - y, co.x - x)*r, co.z)
    return put(name, bm, m, smooth=True)

def crenels(name, x0, x1, y, z, depth=0.6, w=0.7, h=0.8):
    """a row of merlons along x at the front edge y"""
    bm = bmesh.new()
    n = max(2, int((x1 - x0)/(w*2)))
    step = (x1 - x0)/n
    for i in range(n):
        cx = x0 + step*(i + 0.5)
        r = bmesh.ops.create_cube(bm, size=1)
        for v in r['verts']:
            v.co.x = cx + v.co.x*w; v.co.y = y + v.co.y*depth; v.co.z = z + (v.co.z + 0.5)*h
    bm.normal_update(); uv_box(bm)
    return put(name, bm, "trf_sandstone")

def ring_crenels(name, x, y, r, z, n=14, h=0.7):
    bm = bmesh.new()
    for i in range(n):
        a = 2*math.pi*i/n
        res = bmesh.ops.create_cube(bm, size=1)
        for v in res['verts']:
            lx, ly = v.co.x*0.55, v.co.y*0.45
            v.co.x = x + (r + ly)*math.cos(a) - lx*math.sin(a)
            v.co.y = y + (r + ly)*math.sin(a) + lx*math.cos(a)
            v.co.z = z + (v.co.z + 0.5)*h
    bm.normal_update(); uv_box(bm)
    return put(name, bm, "trf_sandstone")

def crowstep(name, x0, x1, y, z0, peak, depth=0.6, steps=6):
    """a gable end in the front plane: a stepped triangle of stone"""
    bm = bmesh.new(); w = x1 - x0; cx = (x0 + x1)/2
    for i in range(steps):
        half = w/2*(1 - i/steps); zz0 = z0 + (peak - z0)*i/steps; zz1 = z0 + (peak - z0)*(i + 1)/steps
        res = bmesh.ops.create_cube(bm, size=1)
        for v in res['verts']:
            v.co.x = cx + v.co.x*2*half; v.co.y = y + v.co.y*depth; v.co.z = zz0 + (v.co.z + 0.5)*(zz1 - zz0)
    bm.normal_update(); uv_box(bm)
    return put(name, bm, "trf_sandstone")

def roof_ridge_y(name, x0, x1, y0, y1, z0, peak):
    """a pitched slate roof whose ridge runs front to back"""
    bm = bmesh.new(); cx = (x0 + x1)/2
    a = [bm.verts.new(p) for p in ((x0, y0, z0), (x1, y0, z0), (cx, y0, peak))]
    b = [bm.verts.new(p) for p in ((x0, y1, z0), (x1, y1, z0), (cx, y1, peak))]
    bm.faces.new((a[0], a[2], b[2], b[0])); bm.faces.new((a[2], a[1], b[1], b[2]))
    bm.normal_update()
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            co = l.vert.co; l[uv].uv = (co.y, math.hypot(co.x - cx, co.z - peak))
    return put(name, bm, "trf_slate")

def window(name, x, z, w=1.0, h=1.7, y=-0.03, lit=True):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((x - w/2, y, z), (x + w/2, y, z), (x + w/2, y, z + h), (x - w/2, y, z + h))]
    bm.faces.new(vs)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uv].uv = c
    put(name, bm, ("trf_window" if rnd.random() < 0.65 else "trf_window_dim") if lit else "trf_dark_win")
    # a stone surround, standing a little proud of the wall
    box(name + "_sill", x - w/2 - 0.12, x + w/2 + 0.12, y - 0.14, y + 0.02, z - 0.14, z, "trf_trim")
    box(name + "_head", x - w/2 - 0.12, x + w/2 + 0.12, y - 0.14, y + 0.02, z + h, z + h + 0.16, "trf_trim")

def window_on_cyl(name, cx, cy, r, z, w=0.9, h=1.6):
    """a window on the front face of a round tower"""
    window(name, cx, z, w, h, y=cy - r - 0.02)

# ── the house ─────────────────────────────────────────────────────────────
# the central block, behind the tower
box("trf_block", -7, 7, 0, 10, 0, 11)
crenels("trf_block_cren", -7, 7, 0.2, 11)
for i, x in enumerate((-5.2, -3.9, 3.9, 5.2)):
    for j, z in enumerate((2.4, 6.0)):
        window(f"trf_bw{i}{j}", x, z, 0.9, 1.7, lit=rnd.random() < 0.8)
# the central tower, projecting, battlemented, over the door
box("trf_tower", -3, 3, -1.2, 5, 0, 17)
crenels("trf_tower_cren", -3.1, 3.1, -1.0, 17, h=0.9)
box("trf_tower_corbel", -3.25, 3.25, -1.45, 5, 16.4, 17.0, "trf_trim")
for k, z in enumerate((6.2, 9.6, 13.0)):
    window(f"trf_tw{k}", 0, z, 1.25, 2.0, y=-1.23)
# the great door: an arch of warm light in the tower's foot, a hood of stone round it
bm = bmesh.new(); w, h, sp = 2.3, 3.9, 2.75
pts = [(-w/2, 0), (-w/2, sp)] + [(w/2*math.cos(math.pi - math.pi*i/12), sp + w/2*math.sin(math.pi - math.pi*i/12)) for i in range(1, 12)] + [(w/2, sp), (w/2, 0)]
bm.faces.new([bm.verts.new((x, -1.23, z)) for x, z in pts])
put("trf_door", bm, "trf_doorglow")
bm = bmesh.new()
o = [(-w/2 - 0.45, 0), (-w/2 - 0.45, sp)] + [((w/2 + 0.45)*math.cos(math.pi - math.pi*i/12), sp + (w/2 + 0.45)*math.sin(math.pi - math.pi*i/12)) for i in range(1, 12)] + [(w/2 + 0.45, sp), (w/2 + 0.45, 0)]
vo = [bm.verts.new((x, -1.32, z)) for x, z in o]; vi = [bm.verts.new((x, -1.32, z)) for x, z in pts]
for k in range(len(o) - 1): bm.faces.new((vo[k], vo[k + 1], vi[k + 1], vi[k]))
bm.normal_update(); uv_box(bm); put("trf_door_hood", bm, "trf_trim")
for k in range(3):                       # three broad steps down to the gravel
    box(f"trf_step{k}", -3.2 + 0.25*k, 3.2 - 0.25*k, -2.6 + 0.45*k, -1.2, 0, 0.17*(k + 1), "trf_trim")

# the round towers either side, under tall slate cones
for side, sx in (("L", -1), ("R", 1)):
    x = sx*7.6
    cyl(f"trf_rt{side}", x, 0.6, 2.7, 0, 13.2)
    ring_crenels(f"trf_rt{side}_cren", x, 0.6, 2.7, 13.2, 0)  if False else None
    box(f"trf_rt{side}_band", x - 0.01, x + 0.01, 0.59, 0.61, 0, 0.01, "trf_trim")
    cyl(f"trf_rt{side}_eave", x, 0.6, 3.05, 13.2, 13.6, "trf_trim")
    cyl(f"trf_rt{side}_cone", x, 0.6, 3.15, 13.6, 20.5, "trf_slate", r2=0.02, seg=48)
    cyl(f"trf_rt{side}_spike", x, 0.6, 0.06, 20.4, 21.8, "trc_iron")
    for k, z in enumerate((3.0, 6.8, 10.3)):
        window_on_cyl(f"trf_rw{side}{k}", x, 0.6, 2.7, z)

# the wings, set back, gable end on, crow-stepped
for side, sx in (("L", -1), ("R", 1)):
    x0, x1 = (sx*10.0, sx*18.5) if sx > 0 else (sx*18.5, sx*10.0)
    box(f"trf_wing{side}", x0, x1, 1.0, 11.0, 0, 9.5)
    crowstep(f"trf_wing{side}_gable", x0, x1, 1.0, 9.5, 14.5)
    roof_ridge_y(f"trf_wing{side}_roof", x0 + 0.3, x1 - 0.3, 1.6, 11.0, 9.5, 14.2)
    cx = (x0 + x1)/2
    for i, dx in enumerate((-2.6, 0, 2.6)):
        for j, z in enumerate((1.8, 5.2)):
            window(f"trf_ww{side}{i}{j}", cx + dx, z, 1.0, 1.8, y=0.97, lit=rnd.random() < 0.75)
    window(f"trf_wg{side}", cx, 10.4, 0.9, 1.6, y=0.97)
    # the bartizan on the outer corner: a corbelled turret with its own cone
    bx = sx*18.6; by = 0.95
    cyl(f"trf_bz{side}_corbel", bx, by, 1.0, 7.2, 8.0, "trf_trim", r2=1.0)
    cyl(f"trf_bz{side}_corbel2", bx, by, 0.2, 6.2, 7.2, "trf_trim", r2=1.0)
    cyl(f"trf_bz{side}", bx, by, 1.0, 8.0, 11.0)
    cyl(f"trf_bz{side}_cone", bx, by, 1.15, 11.0, 14.6, "trf_slate", r2=0.02, seg=32)

# chimneys
for k, (x, y, z) in enumerate(((-5.5, 6, 11), (5.5, 6, 11), (-14.2, 8, 13), (14.2, 8, 13))):
    box(f"trf_chim{k}", x - 0.7, x + 0.7, y - 0.5, y + 0.5, z, z + 3.0)

# lanterns either side of the door
def light(name, typ, loc, energy, color, size=0.1, rot=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ in ('POINT', 'SPOT'): ld.shadow_soft_size = size
    if typ in ('AREA',): ld.size = size
    if typ == 'SUN': ld.angle = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if rot: ob.rotation_euler = rot
    c = coll()
    if ob.name not in c.objects: c.objects.link(ob)
for side, sx in (("L", -1), ("R", 1)):
    box(f"trf_lamp{side}_arm", sx*2.0 - 0.05, sx*2.0 + 0.05, -1.7, -1.23, 4.2, 4.3, "trc_iron")
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=0.32)
    for v in bm.verts: v.co.x += sx*2.0; v.co.y += -1.75; v.co.z += 4.0
    put(f"trf_lamp{side}", bm, "trf_doorglow")
    light(f"trf_lampl{side}", 'POINT', (sx*2.0, -1.95, 4.0), 260, (1.0, 0.6, 0.28), 0.12)
light("trf_doorl", 'AREA', (0, -1.6, 2.2), 600, (1.0, 0.6, 0.28), 2.0, rot=(math.radians(90), 0, 0))

# ── the grounds ───────────────────────────────────────────────────────────
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=120)
put("trf_gravel", bm, "trf_gravel")

def pine(name, x, y, h):
    bm = bmesh.new()
    tiers = 5
    for t in range(tiers):
        z0 = h*0.18 + (h*0.82)*t/tiers*0.85
        r = h*0.26*(1 - t/tiers)
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r, radius2=0.0, depth=h*0.32)
        for v in res['verts']: v.co.z += z0 + h*0.16; v.co.x += x; v.co.y += y
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=h*0.025, radius2=h*0.02, depth=h*0.3)
    for v in res['verts']: v.co.z += h*0.15; v.co.x += x; v.co.y += y
    put(name, bm, "trf_pine")
k = 0
for side in (-1, 1):
    for i in range(14):
        x = side*rnd.uniform(21, 38); y = rnd.uniform(-4, 22); h = rnd.uniform(11, 19)
        pine(f"trf_pine{k}", x, y, h); k += 1
# the hills behind, and a far ridge
for i, (x, y, sx, sz) in enumerate(((-60, 160, 90, 26), (20, 190, 120, 34), (90, 150, 80, 22), (-120, 220, 110, 30))):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
    for v in bm.verts: v.co.x = v.co.x*sx + x; v.co.y = v.co.y*40 + y; v.co.z = v.co.z*sz - 4
    put(f"trf_hill{i}", bm, "trf_hill", smooth=True)

# ── the sky: last light behind the hills ──────────────────────────────────
wd = bpy.data.worlds.get("trf_world") or bpy.data.worlds.new("trf_world")
wd.use_nodes = True; nt = wd.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground')
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
rp = nt.nodes.new('ShaderNodeValToRGB')
els = rp.color_ramp.elements
# the world's "Generated" Z is the view direction's height, -1..1: 0 is the
# horizon. (Spread over 0.5-0.75 the whole visible sky fell on the horizon
# colour and the house, the mist and the gravel all went orange.)
els[0].position = 0.0; els[0].color = (0.7, 0.26, 0.09, 1)         # the last light, at the horizon
els[1].position = 0.42; els[1].color = (0.008, 0.01, 0.03, 1)      # night overhead
e = els.new(0.05); e.color = (0.32, 0.09, 0.12, 1)
e = els.new(0.12); e.color = (0.08, 0.045, 0.12, 1)
e = els.new(0.24); e.color = (0.022, 0.025, 0.07, 1)
nt.links.new(sep.outputs['Z'], rp.inputs['Fac'])
nt.links.new(rp.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0
nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
sc.world = wd
light("trf_moon", 'SUN', (0, 0, 50), 0.35, (0.55, 0.62, 0.9), 0.02, rot=(math.radians(60), 0, math.radians(200)))


# moonlight from the front
light("trf_moonfill", 'SUN', (0, 0, 50), 0.35, (0.5, 0.58, 0.85), 0.05, rot=(math.radians(68), 0, math.radians(-25)))
# (no "afterglow" sun: from behind the house it raked the near gravel and lit it tan)
# gate piers in the near forecourt, a lantern on each
for side, sx in (("L", -1), ("R", 1)):
    px, py = sx*15.5, -14.0
    box(f"trf_pier{side}", px - 0.75, px + 0.75, py - 0.75, py + 0.75, 0, 3.4)
    box(f"trf_pier{side}_cap", px - 0.95, px + 0.95, py - 0.95, py + 0.95, 3.4, 3.75, "trf_trim")
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=0.42)
    for v in bm.verts: v.co.x += px; v.co.y += py; v.co.z += 4.05
    put(f"trf_pier{side}_lamp", bm, "trf_doorglow")
    light(f"trf_pier{side}_l", 'POINT', (px, py - 0.3, 4.1), 380, (1.0, 0.6, 0.28), 0.15)
# low mist over the gravel
mm = bpy.data.materials.get("trf_mist") or bpy.data.materials.new("trf_mist")
mm.use_nodes = True; mnt = mm.node_tree; mnt.nodes.clear()
mo = mnt.nodes.new('ShaderNodeOutputMaterial'); mv = mnt.nodes.new('ShaderNodeVolumePrincipled')
mv.inputs['Density'].default_value = 0.012; mv.inputs['Anisotropy'].default_value = 0.4; mv.inputs['Color'].default_value = (0.8, 0.8, 0.9, 1)
mnt.links.new(mv.outputs[0], mo.inputs['Volume'])
box("trf_mist", -70, 70, -60, 30, -0.5, 2.2, "trf_mist")   # past the camera; and below the ground, not ON it (a coplanar volume face streaked the gravel)

# ── camera ────────────────────────────────────────────────────────────────
cd = bpy.data.cameras.get("trf_cam") or bpy.data.cameras.new("trf_cam"); cd.lens = 28; cd.sensor_width = 36
cam = bpy.data.objects.get("trf_cam") or bpy.data.objects.new("trf_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0, -42.0, 1.7); cam.rotation_euler = (math.radians(90 + 6.0), 0, 0)   # wall foot at .71 of the height
sc.camera = cam

sc.render.engine = 'CYCLES'; sc.cycles.samples = 128; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = 0.0
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 82
sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'

if os.path.isdir(OUT) and RENDER:
    sc.render.filepath = os.path.join(OUT, "facade.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)

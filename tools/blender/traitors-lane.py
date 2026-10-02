"""The Traitors' road to the mission (the castle day's walks), rendered in
Blender (2026-10-02).

Run inside Blender AFTER tools/blender/traitors-conclave.py has run once in
the same file (iron). It builds a scene of its own ("TR_Lane"), paints it
(tools/blender/traitors-paint.py) and renders it three times, once per light
the castle day asks for (js/vp-tr/castle-stage.js `drawSet`, kind 'lane'):

    assets/sets/traitors/lane-day.webp
    assets/sets/traitors/lane-evening.webp
    assets/sets/traitors/lane-night.webp

The stage stands the cast in the FOREGROUND of this frame, feet near the
bottom (.95) and about .62 of the height tall: the set is what is behind
them. An eye-level shot down a Highland single-track road: grass and
heather verges, a dry-stone wall each side, pines, the hills closing the
glen, and the castle gates far down the road.
"""
import bpy, bmesh, math, os, random

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True
rnd = random.Random(57)

sc = bpy.data.scenes.get("TR_Lane") or bpy.data.scenes.new("TR_Lane")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def coll(name="trl_set"):
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

def principled(name, color, rough=0.7, emit=None, strength=0.0, metal=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

def mixed(name, c1, c2, scale, rough=0.85):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale; tx.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], tx.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (*c1, 1); rp.color_ramp.elements[1].color = (*c2, 1)
    L.new(tx.outputs['Fac'], rp.inputs['Fac'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = rough
    L.new(rp.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

mixed("trl_tarmac", (0.07, 0.07, 0.068), (0.16, 0.155, 0.15), 1.4, 0.92)
mixed("trl_verge", (0.1, 0.18, 0.05), (0.26, 0.32, 0.1), 0.6)
mixed("trl_heather", (0.24, 0.1, 0.2), (0.3, 0.22, 0.1), 0.5)
mixed("trl_drystone", (0.2, 0.19, 0.17), (0.36, 0.35, 0.32), 2.5)
mixed("trl_pine", (0.025, 0.06, 0.035), (0.07, 0.13, 0.06), 1.5)
mixed("trl_hill_near", (0.12, 0.16, 0.07), (0.24, 0.24, 0.12), 0.02)
mixed("trl_hill_far", (0.2, 0.25, 0.3), (0.3, 0.34, 0.38), 0.01)
principled("trl_trunk", (0.12, 0.07, 0.04), 0.9)
principled("trl_stone", (0.38, 0.22, 0.17), 0.85)
principled("trl_slate", (0.15, 0.17, 0.2), 0.6)
principled("trl_iron", (0.05, 0.05, 0.05), 0.5, metal=0.8)
principled("trl_lamp", (1, 0.6, 0.25), 0.5, emit=(1.0, 0.55, 0.2), strength=4.0)

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, r2=None, seg=20):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

def _ragged(ob, strength, scale, subdiv=2):
    sub = ob.modifiers.new("sub", 'SUBSURF'); sub.levels = subdiv; sub.render_levels = subdiv
    tex = bpy.data.textures.get("trl_ragged_" + str(scale)) or bpy.data.textures.new("trl_ragged_" + str(scale), 'CLOUDS')
    tex.noise_scale = scale; tex.noise_depth = 2
    dp = ob.modifiers.new("disp", 'DISPLACE'); dp.texture = tex; dp.strength = strength; dp.mid_level = 0.5
    dp.texture_coords = 'GLOBAL'
    return ob

def pine(name, x, y, h):
    bm = bmesh.new()
    for t in range(8):
        z0 = h*0.18 + h*0.72*t/8; r = h*0.2*(1 - t/8.6)*rnd.uniform(0.82, 1.12)
        res = bmesh.ops.create_cone(bm, cap_ends=False, segments=14, radius1=r, radius2=r*0.08, depth=h*0.2)
        for v in res['verts']:
            v.co.z += z0 + h*0.1 - (0.05*h if math.hypot(v.co.x, v.co.y) > r*0.6 else 0)
            v.co.x += x; v.co.y += y
    _ragged(put(name, bm, "trl_pine"), h*0.06, max(0.4, h*0.06))
    cyl(name + "_trunk", x, y, h*0.028, 0, h*0.35, "trl_trunk", seg=7)

def wall(name, side, y0, y1, xoff):
    """a dry-stone wall running along the road at x = side*xoff"""
    bm = bmesh.new()
    for course, (zc, hc) in enumerate(((0.0, 0.4), (0.4, 0.34), (0.74, 0.28))):
        y = y0 + rnd.uniform(0, 0.3)*course
        while y < y1:
            w = rnd.uniform(0.35, 0.8)
            res = bmesh.ops.create_cube(bm, size=1)
            for v in res['verts']:
                v.co.y = y + w/2 + v.co.y*(w - 0.04); v.co.x = side*xoff + v.co.x*(0.55 - course*0.08)
                v.co.z = zc + (v.co.z + 0.5)*hc*rnd.uniform(0.85, 1.1)
            y += w
    put(name, bm, "trl_drystone")

# ── the road, the verges, the walls ───────────────────────────────────────
ROAD = 1.6                                     # half the width of a single track
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
# create_grid(size=1) spans -1..1, not -0.5..0.5
for v in bm.verts: v.co.x *= ROAD; v.co.y = -5 + (v.co.y + 1)/2*400; v.co.z = 0.04
put("trl_road", bm, "trl_tarmac")
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=240, y_segments=80, size=1)
for v in bm.verts:
    v.co.x *= 400; v.co.y = -5 + (v.co.y + 1)/2*600
    d = abs(v.co.x) - ROAD - 0.4          # a clean band for the road, the verge rising beyond it
    v.co.z = -0.02 if d < 0 else min(18, (d/40)**1.6*18) + 0.06*math.sin(v.co.y*0.2)
put("trl_verge", bm, "trl_verge")
for side in (-1, 1):
    wall(f"trl_wall{side}", side, -3, 140, ROAD + 2.2)
# heather banks beyond the walls
for side in (-1, 1):
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=30, y_segments=40, size=1)
    for v in bm.verts:
        v.co.x = side*(ROAD + 3 + (v.co.x + 1)/2*60); v.co.y = -5 + (v.co.y + 1)/2*220
        v.co.z = max(0.0, (abs(v.co.x) - ROAD - 3)/60)**1.5*9 + 0.05
    _ragged(put(f"trl_bank{side}", bm, "trl_heather"), 0.6, 4.0, subdiv=1)

# pines down both sides, thinning out up the glen
k = 0
for side in (-1, 1):
    for i in range(18):
        y = rnd.uniform(6, 120); x = side*(ROAD + rnd.uniform(5, 22) + y*0.05); h = rnd.uniform(9, 16)
        pine(f"trl_pine{k}", x, y, h); k += 1

# the hills closing the glen
for i, (y, w, h, m) in enumerate(((260, 900, 70, "trl_hill_near"), (520, 1500, 140, "trl_hill_far"))):
    bm = bmesh.new(); n = 140; tops, bots = [], []
    for j in range(n + 1):
        x = -w/2 + w*j/n; t = j/n*6.28
        z = h*(0.55 + 0.28*math.sin(t*1.4 + i) + 0.14*math.sin(t*3.3 + i*2))
        tops.append(bm.verts.new((x, y, z))); bots.append(bm.verts.new((x, y, -2)))
    for j in range(n): bm.faces.new((bots[j], bots[j+1], tops[j+1], tops[j]))
    put(f"trl_hills{i}", bm, m)

# the castle gates, far down the road: two piers, iron gates ajar, lamps
GY = 120
for sx in (-1, 1):
    box(f"trl_pier{sx}", sx*(ROAD + 0.5) - 0.6, sx*(ROAD + 0.5) + 0.6, GY - 0.6, GY + 0.6, 0, 3.6, "trl_stone")
    box(f"trl_pier{sx}_cap", sx*(ROAD + 0.5) - 0.75, sx*(ROAD + 0.5) + 0.75, GY - 0.75, GY + 0.75, 3.6, 3.95, "trl_stone")
    box(f"trl_pier{sx}_lamp", sx*(ROAD + 0.5) - 0.2, sx*(ROAD + 0.5) + 0.2, GY - 0.2, GY + 0.2, 3.95, 4.4, "trl_lamp")
    # a gate leaf, swung half open
    bm = bmesh.new()
    for b in range(9):
        res = bmesh.ops.create_cube(bm, size=1)
        for v in res['verts']:
            v.co.x = v.co.x*0.05 + sx*(ROAD - 0.2) - sx*(b/8)*1.4*0.6
            v.co.y = v.co.y*0.05 + GY + (b/8)*1.4*0.8
            v.co.z = (v.co.z + 0.5)*2.4
    put(f"trl_gate{sx}", bm, "trl_iron")
# the castle beyond the gates
box("trl_c_block", -9, 9, 380, 388, 12, 24, "trl_stone")
box("trl_c_tower", -3, 3, 378, 384, 12, 31, "trl_stone")
for sx in (-1, 1):
    cyl(f"trl_c_rt{sx}", sx*10, 380, 3.2, 12, 27, "trl_stone")
    cyl(f"trl_c_cone{sx}", sx*10, 380, 3.6, 27, 35, "trl_slate", r2=0.05)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1)
for v in bm.verts: v.co.x = v.co.x*70; v.co.y = v.co.y*30 + 386; v.co.z = v.co.z*14 - 2
put("trl_rise", bm, "trl_hill_near", smooth=True)

# ── camera: eye level, looking down the road ──────────────────────────────
cd = bpy.data.cameras.get("trl_cam") or bpy.data.cameras.new("trl_cam"); cd.lens = 30; cd.sensor_width = 36; cd.clip_end = 5000
cam = bpy.data.objects.get("trl_cam") or bpy.data.objects.new("trl_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0.4, -4.0, 1.6); cam.rotation_euler = (math.radians(89), 0, 0)
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 82
sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'

# ── the three lights ──────────────────────────────────────────────────────
def light(name, typ, energy, color, angle, rot):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color; ld.angle = angle
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.rotation_euler = rot
    c = coll()
    if ob.name not in c.objects: c.objects.link(ob)
    return ob

def sky(stops, strength):
    wd = bpy.data.worlds.get("trl_world") or bpy.data.worlds.new("trl_world")
    wd.use_nodes = True; nt = wd.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
    rp = nt.nodes.new('ShaderNodeValToRGB'); els = rp.color_ramp.elements
    (p0, c0), (p1, c1) = stops[0], stops[-1]
    els[0].position = p0; els[0].color = (*c0, 1); els[1].position = p1; els[1].color = (*c1, 1)
    for p, c in stops[1:-1]: e = els.new(p); e.color = (*c, 1)
    nt.links.new(sep.outputs['Z'], rp.inputs['Fac']); nt.links.new(rp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    sc.world = wd

LIGHTS = {
    # (sun energy, colour, (elevation-ish x rot, z rot)), sky stops, sky strength, lamp strength, exposure
    'day':     (5.5, (1.0, 0.95, 0.85), (50, -150), [(0.0, (0.85, 0.82, 0.75)), (0.12, (0.6, 0.7, 0.82)), (0.4, (0.2, 0.34, 0.6))], 0.8, 0.0, 0.2),
    'evening': (6.0, (1.0, 0.62, 0.3), (78, -130), [(0.0, (1.0, 0.6, 0.3)), (0.06, (0.75, 0.38, 0.35)), (0.2, (0.3, 0.2, 0.38)), (0.45, (0.08, 0.08, 0.2))], 0.9, 3.0, 0.8),
    'night':   (0.5, (0.55, 0.62, 0.95), (55, 160), [(0.0, (0.06, 0.07, 0.14)), (0.15, (0.02, 0.025, 0.06)), (0.45, (0.005, 0.007, 0.02))], 1.4, 6.0, 1.2),
}

def set_light(key):
    e, col, (rx, rz), stops, sky_s, lamp, expo = LIGHTS[key]
    light("trl_sun", 'SUN', e, col, 0.03, (math.radians(rx), 0, math.radians(rz)))
    sky(stops, sky_s)
    for n in bpy.data.materials["trl_lamp"].node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED': n.inputs['Emission Strength'].default_value = lamp
    sc.view_settings.exposure = expo

# ── the painted look (tools/blender/traitors-paint.py), before any render ──
def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

set_light('day')
if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 96; sc.cycles.use_denoising = True
    apply_paint()
    for key in ('day', 'evening', 'night'):
        set_light(key)
        sc.render.filepath = os.path.join(OUT, f"lane-{key}.webp")
        bpy.ops.render.render(write_still=True, scene=sc.name)

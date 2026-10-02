"""The Traitors' Round Table room, rendered in Blender (2026-10-02).

Run inside Blender (Scripting tab, or the MCP bridge) AFTER
tools/blender/traitors-conclave.py has run once in the same file: it reuses
that script's stone, iron, wax, flame and banner materials. It builds a
scene of its own ("TR_RoundTable") and leaves every other scene alone, then
renders the plate js/vp-tr/table-stage.js draws behind the seats:

    assets/sets/traitors/roundtable.webp

The seats are an ellipse laid over the plate (table-stage.js `seatAt`:
centre .5W/.425H, radii .41W/.235H), and the table must sit inside it:
centre .5W/.43H, half-width .3W, half-height .16H. The camera below is
placed so the table lands there; check it with the overlay before shipping.
"""
import bpy, bmesh, math, os

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RH = 8.5           # the rotunda's radius: close enough that the lattice shows under the high camera
TR = 3.0           # the table's radius
TH = 0.85          # the table's height
RENDER = True      # set False to build the scene without rendering

sc = bpy.data.scenes.get("TR_RoundTable") or bpy.data.scenes.new("TR_RoundTable")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def coll(name="trr_set"):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in [x.name for x in sc.collection.children]: sc.collection.children.link(c)
    return c

def put(name, bm, mat=None, smooth=False, col="trr_set"):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    me.materials.clear()
    if mat: me.materials.append(bpy.data.materials[mat])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me
    c = coll(col)
    if ob.name not in c.objects: c.objects.link(ob)
    return ob

def uvset(bm, fn):
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops: l[uv].uv = fn(l.vert.co, f)

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def principled(name, color, rough=0.5, metal=0.0, coat=0.0, emit=None, strength=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal; b.inputs['Coat Weight'].default_value = coat
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

# ── materials of this room ────────────────────────────────────────────────
principled("trr_lacquer", (0.012, 0.01, 0.01), 0.18, coat=1.0)            # the black rim
principled("trr_gold", (0.75, 0.5, 0.17), 0.28, metal=1.0)
principled("trr_moon", (0.7, 0.62, 0.45), 0.4, emit=(1.0, 0.85, 0.55), strength=0.15)
principled("trr_halo", (1, 1, 1), 0.5, emit=(1.0, 0.93, 0.82), strength=0.9)  # the ring of light round the field
principled("trr_star_lt", (0.55, 0.36, 0.17), 0.35, coat=0.6)             # light wood of the star
principled("trr_star_dk", (0.16, 0.08, 0.035), 0.35, coat=0.6)            # dark wood of the star

# the field: a warm wood with a fine grain, under lacquer
m, nt, out = mat("trr_field"); N, L = nt.nodes, nt.links
tc = N.new('ShaderNodeTexCoord'); wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'RINGS'
wv.inputs['Scale'].default_value = 3.0; wv.inputs['Distortion'].default_value = 6; wv.inputs['Detail'].default_value = 4
L.new(tc.outputs['Object'], wv.inputs['Vector'])
rp = N.new('ShaderNodeValToRGB')
rp.color_ramp.elements[0].color = (0.10, 0.05, 0.02, 1); rp.color_ramp.elements[1].color = (0.26, 0.14, 0.06, 1)
L.new(wv.outputs['Fac'], rp.inputs['Fac'])
b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.3; b.inputs['Coat Weight'].default_value = 0.8
L.new(rp.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

# the amber lattice: diamond quarries of warm glass, lit from behind
m, nt, out = mat("trr_lattice"); N, L = nt.nodes, nt.links
tc = N.new('ShaderNodeTexCoord')
mp = N.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, math.radians(45)); mp.inputs['Scale'].default_value = (14, 14, 1)
L.new(tc.outputs['UV'], mp.inputs['Vector'])
br = N.new('ShaderNodeTexBrick'); br.offset = 0.0; br.inputs['Scale'].default_value = 1.0
br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.09
br.inputs['Color1'].default_value = (1.0, 0.55, 0.16, 1); br.inputs['Color2'].default_value = (0.85, 0.4, 0.1, 1); br.inputs['Mortar'].default_value = (0, 0, 0, 1)
L.new(mp.outputs['Vector'], br.inputs['Vector'])
sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['UV'], sep.inputs['Vector'])
gr = N.new('ShaderNodeValToRGB')
gr.color_ramp.elements[0].color = (0.35, 0.35, 0.35, 1); gr.color_ramp.elements[1].position = 0.6; gr.color_ramp.elements[1].color = (1, 1, 1, 1)
L.new(sep.outputs['Y'], gr.inputs['Fac'])
mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
L.new(br.outputs['Color'], mx.inputs[6]); L.new(gr.outputs['Color'], mx.inputs[7])
em = N.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.3
L.new(mx.outputs[2], em.inputs['Color']); L.new(em.outputs['Emission'], out.inputs['Surface'])

# a polished stone floor: the conclave's flagstones, bigger, with more sheen
fl = bpy.data.materials["trc_floor"].copy(); fl.name = "trr_floor"
for n in fl.node_tree.nodes:
    if n.type == 'TEX_BRICK': n.inputs['Brick Width'].default_value = 1.6; n.inputs['Row Height'].default_value = 1.6; n.offset = 0.0
    if n.type == "BSDF_PRINCIPLED": n.inputs["Roughness"].default_value = 0.42

# ── the room: a rotunda, latticed windows round the far half ─────────────
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=128, radius=RH + 0.3)
uvset(bm, lambda co, f: (co.x, co.y)); put("trr_floor", bm, "trr_floor")
seg = 160; WH = 12.0
bm = bmesh.new()
rings = [[bm.verts.new((RH*math.cos(2*math.pi*i/seg), RH*math.sin(2*math.pi*i/seg), WH*k)) for i in range(seg)] for k in range(2)]
for i in range(seg):
    # NOT the near side: the camera stands outside the rotunda's radius, and a
    # full ring would put a wall between it and the table
    if not (-30 <= math.degrees(2*math.pi*i/seg) <= 210): continue
    j = (i + 1) % seg; bm.faces.new((rings[0][j], rings[0][i], rings[1][i], rings[1][j]))
uv = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops: l[uv].uv = (math.atan2(l.vert.co.y, l.vert.co.x)*RH, l.vert.co.z)
    us = [l[uv].uv.x for l in f.loops]
    if max(us) - min(us) > RH*math.pi:
        for l in f.loops:
            if l[uv].uv.x < 0: l[uv].uv.x += 2*math.pi*RH
put("trr_wall", bm, "trc_wall")

def on_wall(ob, a, r=RH):
    ob.location = (r*math.cos(a), r*math.sin(a), ob.location.z); ob.rotation_euler = (0, 0, a + math.pi/2)

def lattice_window(name, a, w=2.0, h=5.4, z0=0.25):
    """a tall round-headed opening: amber lattice, a stone surround, a sill"""
    n = 16; bm = bmesh.new(); pts = [(-w/2, 0)]
    pts += [(-w/2, h - w/2)]
    for i in range(1, n):
        t = math.pi - math.pi*i/n
        pts.append((w/2*math.cos(t), h - w/2 + w/2*math.sin(t)))
    pts += [(w/2, h - w/2), (w/2, 0)]
    vs = [bm.verts.new((x, 0.05, z + z0)) for x, z in pts]
    bm.faces.new(vs); bmesh.ops.triangulate(bm, faces=bm.faces)
    uvset(bm, lambda co, f: ((co.x + w/2)/w, (co.z - z0)/h))
    on_wall(put(name + "_glass", bm, "trr_lattice"), a)
    # surround: outer outline to inner outline, extruded into the room
    def outline(ww):
        p = [(-ww/2, 0), (-ww/2, h - w/2)]
        for i in range(1, n):
            t = math.pi - math.pi*i/n
            p.append((ww/2*math.cos(t), h - w/2 + ww/2*math.sin(t)))
        return p + [(ww/2, h - w/2), (ww/2, 0)]
    o, ii = outline(w + 0.7), outline(w)
    bm = bmesh.new(); d = 0.45
    ring = lambda pts, y: [bm.verts.new((x, y, z + z0)) for (x, z) in pts]
    of, ifr, ob_, ib = ring(o, d), ring(ii, d), ring(o, 0.0), ring(ii, 0.0)
    for k in range(len(o) - 1):
        bm.faces.new((of[k], of[k+1], ifr[k+1], ifr[k])); bm.faces.new((ob_[k+1], of[k+1], of[k], ob_[k]))
        bm.faces.new((ib[k], ifr[k], ifr[k+1], ib[k+1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uvset(bm, lambda co, f: (co.x + co.y, co.z + co.y))
    on_wall(put(name + "_surr", bm, "trc_dressed"), a)

for k, deg in enumerate(range(10, 171, 20)):          # the whole far half and the sides
    lattice_window(f"trr_win{k}", math.radians(deg))

# tall iron candelabras on the floor between the seats and the lattice
def cyl(name, r, h, loc, matn, seg=16, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for v in bm.verts: v.co.z += h/2
    uvset(bm, lambda co, f: (co.x + 0.3*co.z, co.y + 0.3*co.z))
    ob = put(name, bm, matn, smooth=True); ob.location = loc; return ob
def flame(name, loc):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.022)
    for v in bm.verts:
        v.co.z *= 2.4
        if v.co.z > 0: v.co.x *= (1 - v.co.z/0.06); v.co.y *= (1 - v.co.z/0.06)
    ob = put(name, bm, "trc_flame", smooth=True); ob.location = (loc[0], loc[1], loc[2] + 0.035)
CANDELABRA = []
for k, deg in enumerate(range(15, 166, 30)):
    a = math.radians(deg); cx, cy = 6.6*math.cos(a), 6.6*math.sin(a)
    cyl(f"trr_cb{k}_foot", 0.25, 0.12, (cx, cy, 0.0), "trc_iron", 3, r2=0.07)
    cyl(f"trr_cb{k}_pole", 0.035, 1.9, (cx, cy, 0.12), "trc_iron", 12)
    cyl(f"trr_cb{k}_dish", 0.36, 0.04, (cx, cy, 2.0), "trc_iron", 24, r2=0.3)
    for j in range(5):
        b = 2*math.pi*j/5
        x, y = cx + 0.28*math.cos(b), cy + 0.28*math.sin(b)
        cyl(f"trr_cb{k}_c{j}", 0.03, 0.18 + 0.05*(j % 2), (x, y, 2.04), "trc_wax", 12)
        flame(f"trr_cb{k}_f{j}", (x, y, 2.04 + 0.18 + 0.05*(j % 2)))
    CANDELABRA.append((cx, cy))

# ── the table ─────────────────────────────────────────────────────────────
def disc(name, r_out, r_in, z, matn, seg=128, thick=0.0):
    bm = bmesh.new()
    if r_in <= 0:
        bmesh.ops.create_circle(bm, cap_ends=True, segments=seg, radius=r_out)
        for v in bm.verts: v.co.z = z
    else:
        o = [bm.verts.new((r_out*math.cos(2*math.pi*i/seg), r_out*math.sin(2*math.pi*i/seg), z)) for i in range(seg)]
        ii = [bm.verts.new((r_in*math.cos(2*math.pi*i/seg), r_in*math.sin(2*math.pi*i/seg), z)) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg; bm.faces.new((o[i], o[j], ii[j], ii[i]))
    uvset(bm, lambda co, f: (co.x, co.y))
    return put(name, bm, matn)

bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=128, radius1=TR, radius2=TR, depth=0.16)
for v in bm.verts: v.co.z += TH - 0.08
uvset(bm, lambda co, f: (co.x, co.y)); put("trr_t_slab", bm, "trr_lacquer", smooth=True)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=TR*0.62, radius2=TR*0.5, depth=TH - 0.16)
for v in bm.verts: v.co.z += (TH - 0.16)/2
uvset(bm, lambda co, f: (co.x, co.y)); put("trr_t_base", bm, "trr_lacquer", smooth=True)
disc("trr_t_field", TR*0.82, 0, TH + 0.002, "trr_field")
disc("trr_t_halo", TR*0.835, TR*0.82, TH + 0.003, "trr_halo")
disc("trr_t_edge", TR + 0.01, TR - 0.045, TH + 0.003, "trr_gold")
disc("trr_t_edge2", TR*0.86, TR*0.85, TH + 0.003, "trr_gold")

# the eight-point star, each point split into a light and a dark half
bm_l, bm_d = bmesh.new(), bmesh.new()
for k in range(8):
    a = math.pi/2 + k*math.pi/4
    long = (k % 2 == 0)
    tip = TR*0.78 if long else TR*0.5
    side = TR*0.16
    c0 = (0.0, 0.0, TH + 0.005)
    t = (tip*math.cos(a), tip*math.sin(a), TH + 0.005)
    sl = (side*math.cos(a + math.pi/8), side*math.sin(a + math.pi/8), TH + 0.005)
    sr = (side*math.cos(a - math.pi/8), side*math.sin(a - math.pi/8), TH + 0.005)
    bm_l.faces.new([bm_l.verts.new(c0), bm_l.verts.new(sl), bm_l.verts.new(t)])
    bm_d.faces.new([bm_d.verts.new(c0), bm_d.verts.new(t), bm_d.verts.new(sr)])
for b_, nm, mt in ((bm_l, "trr_t_star_l", "trr_star_lt"), (bm_d, "trr_t_star_d", "trr_star_dk")):
    uvset(b_, lambda co, f: (co.x, co.y)); put(nm, b_, mt)

# gold stars and moon discs round the rim
def star5(bm, cx, cy, r, z):
    pts = []
    for i in range(10):
        a = math.pi/2 + i*math.pi/5; rr = r if i % 2 == 0 else r*0.42
        pts.append(bm.verts.new((cx + rr*math.cos(a), cy + rr*math.sin(a), z)))
    c = bm.verts.new((cx, cy, z))
    for i in range(10): bm.faces.new((c, pts[i], pts[(i + 1) % 10]))
bm = bmesh.new()
for i in range(32):
    a = 2*math.pi*(i + 0.5)/32
    if i % 4 == 0: continue
    star5(bm, TR*0.93*math.cos(a), TR*0.93*math.sin(a), 0.06, TH + 0.004)
uvset(bm, lambda co, f: (co.x, co.y)); put("trr_t_stars", bm, "trr_gold")
bm = bmesh.new()
for i in range(8):
    a = 2*math.pi*(i*4 + 0.5)/32; cx, cy = TR*0.93*math.cos(a), TR*0.93*math.sin(a)
    vs = [bm.verts.new((cx + 0.065*math.cos(2*math.pi*j/24), cy + 0.065*math.sin(2*math.pi*j/24), TH + 0.004)) for j in range(24)]
    bm.faces.new(vs)
uvset(bm, lambda co, f: (co.x, co.y)); put("trr_t_moons", bm, "trr_moon")

# ── light ─────────────────────────────────────────────────────────────────
def light(name, typ, loc, energy, color, size=0.1, rot=None, spot=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ in ('POINT', 'SPOT'): ld.shadow_soft_size = size
    if typ == 'AREA': ld.size = size
    if spot: ld.spot_size, ld.spot_blend = spot
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if rot: ob.rotation_euler = rot
    c = coll()
    if ob.name not in c.objects: c.objects.link(ob)
light("trr_key", 'AREA', (0, 0, 7.5), 1300, (1.0, 0.84, 0.64), 4.5)            # over the table
for k, deg in enumerate(range(10, 171, 40)):                                    # the lattice's spill
    a = math.radians(deg)
    light(f"trr_spill{k}", 'AREA', ((RH - 0.6)*math.cos(a), (RH - 0.6)*math.sin(a), 2.2), 150, (1.0, 0.55, 0.2), 2.4,
          rot=(math.radians(90), 0, a + math.pi/2))
for k, (cx, cy) in enumerate(CANDELABRA):
    # small, like a flame: a wide radius reflected in the lacquer as a white disc
    light(f"trr_cbl{k}", 'POINT', (cx, cy, 2.35), 110, (1.0, 0.55, 0.22), 0.04)
m, nt, out = mat("trr_haze")
vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = 0.006; vol.inputs['Anisotropy'].default_value = 0.5
nt.links.new(vol.outputs[0], out.inputs['Volume'])
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co.x *= 2*RH; v.co.y *= 2*RH; v.co.z = v.co.z*WH + WH/2
put("trr_haze", bm, "trr_haze")

wd = bpy.data.worlds.get("trc_world"); sc.world = wd

# ── camera: high and slanted, the table landing inside the seat ellipse ───
cd = bpy.data.cameras.get("trr_cam") or bpy.data.cameras.new("trr_cam"); cd.lens = 50; cd.sensor_width = 36
cam = bpy.data.objects.get("trr_cam") or bpy.data.objects.new("trr_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
ELEV, DIST, PITCH = 17.5, 13.9, 19.1      # degrees above the table plane, metres to the centre, degrees down
cam.location = (0, -DIST*math.cos(math.radians(ELEV)), TH + DIST*math.sin(math.radians(ELEV)))
cam.rotation_euler = (math.radians(90 - PITCH), 0, 0)
sc.camera = cam

sc.render.engine = 'CYCLES'; sc.cycles.samples = 128; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = -0.75
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 82
sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'


# ── the painted look (tools/blender/traitors-paint.py), before any render ──
def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "roundtable.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)

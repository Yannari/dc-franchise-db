"""The Traitors' reunion studio, rendered in Blender (2026-10-03).

The user: "the reunion deserve its own episode with actual reunion visual
check the real traitor reunion and build a visual in blender". The US
reunion is a studio dressed as the castle around a fireplace, the cast on
tiered seating facing the host, under moody red and blue studio light. This
is that, painted like every other set (tools/blender/traitors-paint.py):

- a great hall: wood panelling to the dado, ashlar above, a stone
  fireplace with a fire burning in it and a tartan banner over the mantel,
  tall arched windows either side with the night behind them;
- heraldic banners, candelabra, an iron chandelier, a tartan rug on a dark
  wood floor;
- two curved tiers of deep red velvet banquettes for the cast, the back tier
  on a step, and the host's wingback chair at the front;
- studio light: a warm key, blue and violet washes from the sides, haze.

Writes assets/sets/traitors/reunion.webp. `measure()` prints where every
seat's sitter puts their head (front tier, back tier) and the host's chair,
for js/vp-tr/reunion-stage.js.

Run inside Blender; builds its own scene ("TR_Reunion").
"""
import bpy, bmesh, math, os, json
from mathutils import Vector

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True

sc = bpy.data.scenes.get("TR_Reunion") or bpy.data.scenes.new("TR_Reunion")
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def put(name, bm, mat=None, smooth=False):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    me.materials.clear()
    if mat: me.materials.append(bpy.data.materials[mat])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me; ob.modifiers.clear()
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
    return ob

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def principled(name, color, rough=0.7, metal=0.0, emit=None, strength=0.0, sheen=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen and 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = sheen
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

def ashlar(name, c1, c2, scale, axes):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); com = N.new('ShaderNodeCombineXYZ')
    L.new(tc.outputs['Object'], sep.inputs['Vector'])
    L.new(sep.outputs[axes[0]], com.inputs['X']); L.new(sep.outputs[axes[1]], com.inputs['Y'])
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale, scale, scale)
    L.new(com.outputs['Vector'], mp.inputs['Vector'])
    br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.014
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (c1[0]*.45, c1[1]*.45, c1[2]*.45, 1)
    L.new(mp.outputs['Vector'], br.inputs['Vector'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.85
    L.new(br.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

def tartan(name, c_base, c_line, c_dark):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    def stripes(axis, freq):
        w = N.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = axis
        w.inputs['Scale'].default_value = freq; w.inputs['Distortion'].default_value = 0
        L.new(tc.outputs['Object'], w.inputs['Vector'])
        r = N.new('ShaderNodeMath'); r.operation = 'GREATER_THAN'; r.inputs[1].default_value = 0.74
        L.new(w.outputs['Fac'], r.inputs[0]); return r
    a, b2 = stripes('X', 1.6), stripes('Y', 1.6)
    add = N.new('ShaderNodeMath'); add.operation = 'ADD'; L.new(a.outputs[0], add.inputs[0]); L.new(b2.outputs[0], add.inputs[1])
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.5; L.new(add.outputs[0], mul.inputs[0])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.interpolation = 'CONSTANT'; E = rp.color_ramp.elements
    E[0].position = 0; E[0].color = (*c_base, 1); E[1].position = .5; E[1].color = (*c_line, 1)
    e = E.new(.95); e.color = (*c_dark, 1)
    L.new(mul.outputs[0], rp.inputs['Fac'])
    bs = N.new('ShaderNodeBsdfPrincipled'); bs.inputs['Roughness'].default_value = 0.95
    L.new(rp.outputs['Color'], bs.inputs['Base Color']); L.new(bs.outputs['BSDF'], out.inputs['Surface'])

ashlar("tru_stone", (0.2, 0.17, 0.14), (0.28, 0.24, 0.2), 1.4, ('X', 'Z'))
ashlar("tru_stone_s", (0.18, 0.155, 0.13), (0.26, 0.22, 0.18), 1.4, ('Y', 'Z'))
ashlar("tru_floor", (0.07, 0.04, 0.02), (0.11, 0.065, 0.035), 0.7, ('X', 'Y'))
principled("tru_oak", (0.09, 0.045, 0.02), 0.45)
principled("tru_velvet", (0.26, 0.02, 0.04), 0.7, sheen=0.8)
principled("tru_velvet_g", (0.03, 0.12, 0.07), 0.7, sheen=0.8)
principled("tru_gilt", (0.75, 0.52, 0.2), 0.3, metal=1.0)
principled("tru_iron", (0.035, 0.035, 0.035), 0.45, metal=0.85)
principled("tru_banner", (0.32, 0.03, 0.05), 0.85)
principled("tru_candle", (0.93, 0.9, 0.82), 0.6)
principled("tru_flame", (1, 0.7, 0.3), 0.5, emit=(1.0, 0.55, 0.18), strength=30.0)
principled("tru_fire", (1, 0.5, 0.1), 0.5, emit=(1.0, 0.42, 0.08), strength=5.0)
principled("tru_night", (0.02, 0.03, 0.08), 1.0, emit=(0.1, 0.16, 0.42), strength=0.6)
tartan("tru_rug", (0.11, 0.015, 0.025), (0.04, 0.07, 0.05), (0.02, 0.03, 0.025))
tartan("tru_tartan_banner", (0.05, 0.12, 0.08), (0.28, 0.03, 0.05), (0.02, 0.04, 0.03))

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, seg=16, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

def light(name, typ, loc, energy, color, size=0.3, target=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ == 'AREA': ld.size = size
    elif typ == 'SPOT': ld.spot_size = math.radians(40); ld.spot_blend = 0.6
    else: ld.shadow_soft_size = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if target: ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)

# ── THE HALL ──────────────────────────────────────────────────────────
W2, BACK, HT = 9.0, 7.0, 7.0
box("tru_floor", -W2, W2, -12, BACK, -0.1, 0, "tru_floor")
box("tru_back", -W2, W2, BACK, BACK + 0.4, 0, HT, "tru_stone")
for sx in (-1, 1):
    box(f"tru_side{sx}", min(sx*W2, sx*(W2 + .4)), max(sx*W2, sx*(W2 + .4)), -12, BACK, 0, HT, "tru_stone_s")
    box(f"tru_sdado{sx}", min(sx*W2, sx*(W2 - .06)), max(sx*W2, sx*(W2 - .06)), -12, BACK, 0, 1.3, "tru_oak")
box("tru_dado", -W2, W2, BACK - 0.06, BACK, 0, 1.3, "tru_oak")
box("tru_rail", -W2, W2, BACK - 0.1, BACK, 1.3, 1.38, "tru_oak")
for i in range(11):
    x = -W2 + 0.6 + i*1.6
    box(f"tru_panel{i}", x, x + 1.2, BACK - 0.09, BACK - 0.06, 0.18, 1.12, "tru_oak")
for k in range(6):
    y = -8 + k*3
    box(f"tru_beam{k}", -W2, W2, y - .2, y + .2, HT - .35, HT, "tru_oak")
box("tru_ceil", -W2, W2, -12, BACK + .4, HT, HT + .1, "tru_stone")
# THE FIREPLACE, centre back: hearth, jambs, mantel, the fire, the banner over it
box("tru_hearth", -1.9, 1.9, BACK - 1.0, BACK, 0, 0.12, "tru_stone")
for sx in (-1, 1):
    box(f"tru_jamb{sx}", sx*1.55 - .3, sx*1.55 + .3, BACK - .6, BACK, 0, 2.0, "tru_stone")
box("tru_mantel", -2.1, 2.1, BACK - .75, BACK, 2.0, 2.35, "tru_stone")
box("tru_breast", -1.6, 1.6, BACK - .25, BACK, 2.35, HT, "tru_stone")
box("tru_firebox", -1.25, 1.25, BACK - .05, BACK + .02, 0.12, 1.95, "tru_iron")
for k, (dx, h) in enumerate(((0, .9), (-.35, .6), (.35, .65), (.15, .45))):
    cyl(f"tru_fl{k}", dx, BACK - .45, .22, .15, .15 + h, "tru_fire", r2=0.0, seg=10)
light("tru_firel", 'POINT', (0, BACK - 1.0, .8), 1500, (1.0, .45, .15), .5)
box("tru_tartan", -1.1, 1.1, BACK - .3, BACK - .26, 2.7, 5.2, "tru_tartan_banner")
cyl("tru_rod", 0, BACK - .3, .03, 5.2, 5.24, "tru_gilt")
# THE WINDOWS: tall arched, night behind
for sx in (-1, 1):
    x = sx*4.6
    box(f"tru_win{sx}", x - .9, x + .9, BACK - .02, BACK + .01, 1.8, 5.6, "tru_night")
    box(f"tru_wmul{sx}", x - .04, x + .04, BACK - .06, BACK - .02, 1.8, 5.6, "tru_oak")
    for z in (2.9, 4.2):
        box(f"tru_wbar{sx}{z}", x - .9, x + .9, BACK - .06, BACK - .02, z, z + .05, "tru_oak")
    # heraldic banners between
    bx = sx*2.6
    box(f"tru_ban{sx}", bx - .45, bx + .45, BACK - .12, BACK - .08, 2.4, 5.8, "tru_banner")
    box(f"tru_banrod{sx}", bx - .55, bx + .55, BACK - .14, BACK - .1, 5.8, 5.86, "tru_gilt")
    # a gilt roundel on the banner, facing the room
    bm = bmesh.new(); ring = [bm.verts.new((bx + .22*math.cos(2*math.pi*q/24), BACK - .15, 4.4 + .22*math.sin(2*math.pi*q/24))) for q in range(24)]
    bm.faces.new(ring); put(f"tru_crest{sx}", bm, "tru_gilt")
# a tartan rug, and the iron chandelier
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
for v in bm.verts: v.co.x *= 6.5; v.co.y = v.co.y*3.8 + 1.2; v.co.z = 0.01
put("tru_rug", bm, "tru_rug")
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=1.4, radius2=1.4, depth=.06)
for v in bm.verts: v.co.z += 5.4; v.co.y += 1.5
put("tru_chand", bm, "tru_iron")
for k in range(12):
    a = 2*math.pi*k/12; x, y = 1.4*math.cos(a), 1.5 + 1.4*math.sin(a)
    cyl(f"tru_cc{k}", x, y, .03, 5.43, 5.65, "tru_candle", seg=8)
    cyl(f"tru_cf{k}", x, y, .02, 5.66, 5.74, "tru_flame", seg=6, r2=0.0)
light("tru_chandl", 'POINT', (0, 1.5, 5.2), 500, (1.0, .7, .4), 1.2)
# candelabra either side of the fire
for sx in (-1, 1):
    x = sx*2.6
    cyl(f"tru_cst{sx}", x, BACK - 1.6, .04, 0, 1.5, "tru_iron", seg=8)
    for dx in (-.18, 0, .18):
        cyl(f"tru_cs{sx}{dx}", x + dx, BACK - 1.6, .025, 1.5, 1.75, "tru_candle", seg=8)
        cyl(f"tru_csf{sx}{dx}", x + dx, BACK - 1.6, .018, 1.76, 1.84, "tru_flame", seg=6, r2=0.0)
    light(f"tru_csl{sx}", 'POINT', (x, BACK - 1.8, 1.9), 120, (1.0, .6, .3), .2)

# ── THE SEATING: two curved tiers of velvet banquettes ─────────────────
# The arc's centre is out in front, so the tiers curve round behind it and
# everybody faces the camera and the host; the back tier stands on a step.
CX, CY = 0.0, -1.6
TIERS = ((4.5, 0.0, 12), (5.9, 0.42, 12))       # radius, platform height, seats
A0, A1 = math.radians(22), math.radians(158)
def arc_band(name, r0, r1, z, m, seg=60):
    """a curved slab between two radii at height z, with its edge face"""
    bm = bmesh.new(); inner, outer, inb, outb = [], [], [], []
    for i2 in range(seg + 1):
        a = A0 + (A1 - A0)*i2/seg
        for lst, rr, zz in ((inner, r0, z), (outer, r1, z), (inb, r0, 0), (outb, r1, 0)):
            lst.append(bm.verts.new((CX + rr*math.cos(a), CY + rr*math.sin(a), zz)))
    for i2 in range(seg):
        bm.faces.new((inner[i2], inner[i2+1], outer[i2+1], outer[i2]))
        bm.faces.new((inb[i2], inb[i2+1], inner[i2+1], inner[i2]))
    put(name, bm, m)
arc_band("tru_step", TIERS[1][0] - .7, TIERS[1][0] + .9, TIERS[1][1], "tru_oak")
SEATS = []
for t, (R, base, n) in enumerate(TIERS):
    bm = bmesh.new(); seg = 60; rows = []
    # front of the seat, the seat, up the back, over the top
    prof = [(R - .35, base), (R - .35, base + .45), (R + .25, base + .45), (R + .3, base + 1.15), (R + .45, base + 1.15), (R + .45, base)]
    for i2 in range(seg + 1):
        a = A0 + (A1 - A0)*i2/seg
        rows.append([bm.verts.new((CX + rr*math.cos(a), CY + rr*math.sin(a), zz)) for (rr, zz) in prof])
    for i2 in range(seg):
        for j2 in range(len(prof) - 1):
            bm.faces.new((rows[i2][j2], rows[i2+1][j2], rows[i2+1][j2+1], rows[i2][j2+1]))
    put(f"tru_bench{t}", bm, "tru_velvet" if t == 0 else "tru_velvet_g", smooth=True)
    for k in range(n):
        a = A0 + (A1 - A0)*(k + .5)/n
        SEATS.append((t, CX + R*math.cos(a), CY + R*math.sin(a), base + .45))
# THE HOST'S CHAIR: a wingback, front left, turned to the tiers
HX, HY = -3.4, -2.6
box("tru_hseat", HX - .5, HX + .5, HY - .45, HY + .45, .42, .62, "tru_velvet")
box("tru_hback", HX - .55, HX + .55, HY - .55, HY - .4, .42, 1.75, "tru_velvet")
for sx in (-1, 1):
    box(f"tru_hwing{sx}", HX + sx*.5 - .08, HX + sx*.5 + .08, HY - .55, HY + .1, .42, 1.55, "tru_velvet")
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f"tru_hleg{sx}{sy}", HX + sx*.42, HY + sy*.38, .04, 0, .42, "tru_oak", seg=8)

# ── STUDIO LIGHT ─────────────────────────────────────────────────────────
light("tru_key", 'AREA', (0, -7, 6), 1100, (1.0, .84, .7), 6, target=(0, 2.5, 1))
light("tru_blueL", 'SPOT', (-8, -2, 6.4), 2600, (.3, .42, 1.0), target=(-3, 6, 3))
light("tru_violetR", 'SPOT', (8, -2, 6.4), 2600, (.6, .25, 1.0), target=(3, 6, 3))
light("tru_rim", 'AREA', (0, BACK - 1, 6.6), 600, (1.0, .45, .3), 4, target=(0, 2, 1))
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co.x *= 2*W2 - .2; v.co.y = (v.co.y + .5)*(BACK + 9) - 9.2; v.co.z = (v.co.z + .5)*(HT - .3) + .05
air = put("tru_air", bm, None)
m, nt, out = mat("tru_air"); vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.003; vol.inputs['Color'].default_value = (1, .95, .9, 1)
nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
air.data.materials.clear(); air.data.materials.append(bpy.data.materials["tru_air"])

# ── CAMERA ──────────────────────────────────────────────────────────────
cd = bpy.data.cameras.get("tru_cam") or bpy.data.cameras.new("tru_cam"); cd.lens = 26; cd.sensor_width = 36; cd.clip_end = 200
cam = bpy.data.objects.get("tru_cam") or bpy.data.objects.new("tru_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0.3, -9.0, 3.0)
cam.rotation_euler = (Vector((0, 3.0, 2.1)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.engine = 'CYCLES'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84
wd = bpy.data.worlds.get("tru_world") or bpy.data.worlds.new("tru_world")
wd.use_nodes = True; bg = wd.node_tree.nodes.get('Background')
if bg: bg.inputs['Color'].default_value = (.01, .01, .02, 1); bg.inputs['Strength'].default_value = 1
sc.world = wd
sc.view_settings.exposure = -0.3

def measure():
    from bpy_extras.object_utils import world_to_camera_view as w2c
    sc.view_layers[0].update()
    img = lambda p: [round(w2c(sc, cam, Vector(p)).x, 4), round(1 - w2c(sc, cam, Vector(p)).y, 4)]
    seats = [{"tier": t, "head": img((x, y, z + .85)), "seat": img((x, y, z))} for (t, x, y, z) in SEATS]
    return {"seats": seats, "host": {"head": img((HX, HY, 1.45)), "seat": img((HX, HY, .62))}}

def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "reunion.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    print(json.dumps(measure()))

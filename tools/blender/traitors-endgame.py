"""The Traitors' endgame: the fire in front of the castle, rendered (2026-10-03).

The Endgame screen (js/vp-tr/endgame.js) had no "watch it played" stage. The
user: "the endgame doesnt have a viewer", then "i want something wow and
grandiose with a beautful scene like the real show". The scene the repo's own
mockup (mockup/mockup-tr-fire-of-truth.html) settled on: ONE FIREPIT, AT
NIGHT, OUTDOORS, and every beat of the endgame happens at it.

This builds it on top of the castle front (tools/blender/traitors-facade.py,
run first with RENDER = False, whose collection is linked in, not copied): the
lit castle and its grounds behind, and in the forecourt a ring-stone firepit,
eight iron torches in a great circle round it, and the strongbox on a stone
plinth beside the fire. The fire in the plate is low embers and a modest
flame; the stage draws the living fire over it, because its colour and height
are the state of the game.

Writes assets/sets/traitors/endgame.webp, painted (traitors-paint.py).
`measure()` prints the pit, the strongbox, and nine standing places in an arc
behind the fire, for js/vp-tr/endgame-stage.js.

Run inside Blender; builds its own scene ("TR_Endgame").
"""
import bpy, bmesh, math, os, json, random
from mathutils import Vector

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True
rnd = random.Random(23)
HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))

# ── the castle and its grounds, from the castle-front script ─────────
# (which borrows the conclave's iron: in a fresh file, build that first)
if "trc_iron" not in bpy.data.materials:
    csrc = open(os.path.join(HERE, "tools", "blender", "traitors-conclave.py"), encoding="utf-8").read()
    csrc = csrc.replace("RENDER = True", "RENDER = False")
    exec(compile(csrc, "traitors-conclave.py", "exec"), {"__name__": "__main__", "OUT": OUT})
src = open(os.path.join(HERE, "tools", "blender", "traitors-facade.py"), encoding="utf-8").read()
src = src.replace("RENDER = True", "RENDER = False")
exec(compile(src, "traitors-facade.py", "exec"), {"__name__": "__main__", "OUT": OUT})
facade = bpy.data.scenes["TR_Facade"]

sc = bpy.data.scenes.get("TR_Endgame") or bpy.data.scenes.new("TR_Endgame")
for c in list(sc.collection.children): sc.collection.children.unlink(c)
for o in list(sc.collection.objects): sc.collection.objects.unlink(o)
for c in facade.collection.children: sc.collection.children.link(c)
for o in facade.collection.objects:
    if o.type != 'CAMERA': sc.collection.objects.link(o)
sc.world = facade.world

SET = bpy.data.collections.get("tre_set") or bpy.data.collections.new("tre_set")
for o in list(SET.objects): bpy.data.objects.remove(o, do_unlink=True)
if SET.name not in [c.name for c in sc.collection.children]: sc.collection.children.link(SET)

def put(name, bm, mat=None, smooth=False):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    me.materials.clear()
    if mat: me.materials.append(bpy.data.materials[mat])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me; ob.modifiers.clear()
    if ob.name not in SET.objects: SET.objects.link(ob)
    return ob

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def principled(name, color, rough=0.7, metal=0.0, emit=None, strength=0.0):
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

mixed("tre_stone", (0.16, 0.14, 0.12), (0.3, 0.27, 0.23), 3.0)
mixed("tre_flag", (0.1, 0.095, 0.09), (0.17, 0.16, 0.15), 1.2)
mixed("tre_log", (0.06, 0.035, 0.02), (0.12, 0.07, 0.04), 8.0)
mixed("tre_oak", (0.08, 0.04, 0.018), (0.15, 0.08, 0.035), 6.0, 0.5)
principled("tre_ember", (0.2, 0.05, 0.02), 0.9, emit=(1.0, 0.28, 0.05), strength=3.0)
principled("tre_flame", (1, 0.5, 0.15), 0.5, emit=(1.0, 0.42, 0.08), strength=3.5)
principled("tre_core", (1, 0.9, 0.6), 0.5, emit=(1.0, 0.82, 0.45), strength=30.0)
principled("tre_iron", (0.035, 0.035, 0.035), 0.4, metal=0.85)
principled("tre_brass", (0.75, 0.52, 0.2), 0.3, metal=1.0)

def light(name, typ, loc, energy, color, size=0.2):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color; ld.shadow_soft_size = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if ob.name not in SET.objects: SET.objects.link(ob)
    return ob

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, seg=16, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

# ── THE FORECOURT: a great flagged circle in front of the door ─────────
PX, PY = 0.0, -24.0
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=64, radius=8.5)
for v in bm.verts: v.co.x += PX; v.co.y += PY; v.co.z = 0.012
put("tre_court", bm, "tre_flag")
# THE PIT: a ring of rough stones, a bed of embers, logs, a modest flame
for k in range(16):
    a = 2*math.pi*k/16
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
    sx, sy, sz = rnd.uniform(.32, .42), rnd.uniform(.26, .34), rnd.uniform(.24, .32)
    for v in bm.verts:
        v.co.x = v.co.x*sx + PX + 1.35*math.cos(a); v.co.y = v.co.y*sy + PY + 1.35*math.sin(a); v.co.z = v.co.z*sz + 0.18
    put(f"tre_ring{k}", bm, "tre_stone", smooth=True)
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=40, radius=1.15)
for v in bm.verts: v.co.x += PX; v.co.y += PY; v.co.z = 0.08
put("tre_embers", bm, "tre_ember")
for k in range(6):
    a = math.pi*k/6
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.09, radius2=0.08, depth=1.7)
    for v in bm.verts:
        x, y, z = v.co.x, v.co.y, v.co.z
        # lie the log across the pit, leaning into a cone
        v.co.x = PX + z*math.cos(a) + x*0.2; v.co.y = PY + z*math.sin(a) + y; v.co.z = 0.35 + 0.18*abs(z) * -0.3 + 0.25
    put(f"tre_log{k}", bm, "tre_log", smooth=True)
# (the pit's FLAME is the stage's to draw: its colour and height are the state
# of the game. The plate keeps only a low lick of it over the embers.)
for k, (dx, dy, h, r, m) in enumerate(((0, 0, 0.45, 0.35, "tre_flame"), (0.25, 0.12, 0.3, 0.22, "tre_flame"),
                                       (-0.22, -0.1, 0.35, 0.24, "tre_flame"))):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=r, radius2=0.0, depth=h)
    for v in bm.verts: v.co.z += h/2 + 0.3; v.co.x += PX + dx; v.co.y += PY + dy
    put(f"tre_fl{k}", bm, m, smooth=True)
light("tre_firel", 'POINT', (PX, PY, 1.2), 1400, (1.0, 0.48, 0.16), 0.6)
light("tre_firel2", 'POINT', (PX, PY - 1.0, 0.6), 350, (1.0, 0.42, 0.12), 0.4)
# THE TORCHES: eight iron stands in a great circle, each a flame
for k in range(8):
    a = math.pi*(0.08 + 0.84*k/7)                         # the back of the circle and its sides
    x, y = PX + 6.2*math.cos(a), PY + 6.2*math.sin(a)
    cyl(f"tre_tp{k}", x, y, 0.05, 0, 2.3, "tre_iron", seg=8)
    cyl(f"tre_tb{k}", x, y, 0.2, 2.3, 2.55, "tre_iron", seg=12, r2=0.26)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.14, radius2=0.0, depth=0.4)
    for v in bm.verts: v.co.z += 2.75; v.co.x += x; v.co.y += y
    put(f"tre_tf{k}", bm, "tre_flame", smooth=True)
    light(f"tre_tl{k}", 'POINT', (x, y, 2.9), 320, (1.0, 0.55, 0.22), 0.2)
for k, sx in enumerate((-1, 1)):                         # and two at the front corners, nearer us
    x, y = PX + sx*7.4, PY - 4.2
    cyl(f"tre_fp{k}", x, y, 0.05, 0, 2.3, "tre_iron", seg=8)
    cyl(f"tre_fb{k}", x, y, 0.2, 2.3, 2.55, "tre_iron", seg=12, r2=0.26)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.2, radius2=0.0, depth=0.6)
    for v in bm.verts: v.co.z += 2.85; v.co.x += x; v.co.y += y
    put(f"tre_ff{k}", bm, "tre_flame", smooth=True)
    light(f"tre_fl_{k}", 'POINT', (x, y, 2.9), 320, (1.0, 0.55, 0.22), 0.2)
# THE STRONGBOX: an iron-bound oak chest on a stone plinth beside the fire
BX, BY = PX + 2.6, PY - 1.5
box("tre_plinth", BX - 0.55, BX + 0.55, BY - 0.4, BY + 0.4, 0, 0.7, "tre_stone")
box("tre_chest", BX - 0.42, BX + 0.42, BY - 0.27, BY + 0.27, 0.7, 1.12, "tre_oak")
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.27, radius2=0.27, depth=0.84)
for v in bm.verts:
    x, y, z = v.co.x, v.co.y, v.co.z
    v.co.x = BX + z; v.co.y = BY + x; v.co.z = 1.12 + max(0.0, y)*0.6
put("tre_lid", bm, "tre_oak", smooth=True)
for dx in (-0.3, 0.3):
    box(f"tre_band{dx}", BX + dx - 0.04, BX + dx + 0.04, BY - 0.29, BY + 0.29, 0.69, 1.3, "tre_iron")
box("tre_lock", BX - 0.07, BX + 0.07, BY - 0.31, BY - 0.27, 0.95, 1.1, "tre_brass")

# ── CAMERA: stood back from the fire, the castle lit up behind it ──────
cd = bpy.data.cameras.get("tre_cam") or bpy.data.cameras.new("tre_cam"); cd.lens = 30; cd.sensor_width = 36; cd.clip_end = 1000
cam = bpy.data.objects.get("tre_cam") or bpy.data.objects.new("tre_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0.4, PY - 12.5, 2.1)
cam.rotation_euler = (Vector((0, PY + 6.0, 3.7)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.engine = 'CYCLES'
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84
sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = -0.2

R_STAND = 2.6
def measure():
    from bpy_extras.object_utils import world_to_camera_view as w2c
    sc.view_layers[0].update()
    img = lambda p: [round(w2c(sc, cam, Vector(p)).x, 4), round(1 - w2c(sc, cam, Vector(p)).y, 4)]
    stand = []
    for k in range(9):                                   # an arc round the BACK of the fire
        a = math.pi*(0.05 + 0.9*k/8)
        x, y = PX + R_STAND*math.cos(a), PY + R_STAND*math.sin(a)
        stand.append({"foot": img((x, y, 0)), "head": img((x, y, 1.75))})
    return {"pit": {"base": img((PX, PY, 0.3)), "top": img((PX, PY, 1.8)), "left": img((PX - 1.3, PY, 0.3)), "right": img((PX + 1.3, PY, 0.3))},
            "box": {"base": img((BX, BY, 0.7)), "top": img((BX, BY, 1.3))}, "stand": stand}

def apply_paint():
    g = {}
    exec(open(os.path.join(HERE, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "endgame.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    print(json.dumps(measure()))

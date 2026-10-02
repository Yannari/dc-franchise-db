"""The Traitors' bedroom corridor at night, rendered in Blender (2026-10-02).

The Offer (js/vp-tr/recruitment.js) happens here: a note slid under a
bedroom door, or a Traitor waiting in the passage. Before this it had no
stage at all (the user: "the offer doesnt have a viewer screens"). A long
stone passage, oak panelling to the dado, a row of heavy bedroom doors on
both sides, candle sconces throwing warm pools, a tartan runner, and a tall
window at the far end with the moon behind it.

Writes assets/sets/traitors/corridor.webp (1920x1080), painted
(tools/blender/traitors-paint.py). `measure()` prints where the near doors
and the floor land in the frame, for js/vp-tr/offer-stage.js.

Run inside Blender; builds its own scene ("TR_Corridor").
"""
import bpy, bmesh, math, os, json
from mathutils import Vector

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True

sc = bpy.data.scenes.get("TR_Corridor") or bpy.data.scenes.new("TR_Corridor")
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

def principled(name, color, rough=0.7, metal=0.0, emit=None, strength=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

def stone(name, c1, c2, scale=1.4, side=False):
    """ashlar: brick texture with its own Scale at 1 (see the roundtable notes).
    The brick pattern lies in X-Y; a SIDE wall stands in Y-Z, so its coordinates
    are turned (y, z, x) first or the courses come out as vertical stripes."""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    if side:
        sep = N.new('ShaderNodeSeparateXYZ'); com = N.new('ShaderNodeCombineXYZ')
        L.new(tc.outputs['Object'], sep.inputs['Vector'])
        L.new(sep.outputs['Y'], com.inputs['X']); L.new(sep.outputs['Z'], com.inputs['Y']); L.new(sep.outputs['X'], com.inputs['Z'])
        L.new(com.outputs['Vector'], mp.inputs['Vector'])
    else:
        L.new(tc.outputs['Object'], mp.inputs['Vector'])
    br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.015
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (c1[0]*.45, c1[1]*.45, c1[2]*.45, 1)
    L.new(mp.outputs['Vector'], br.inputs['Vector'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.85
    L.new(br.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

def mixed(name, c1, c2, scale, rough=0.8):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale; tx.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], tx.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (*c1, 1); rp.color_ramp.elements[1].color = (*c2, 1)
    L.new(tx.outputs['Fac'], rp.inputs['Fac'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = rough
    L.new(rp.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

stone("tco_stone", (0.2, 0.17, 0.14), (0.27, 0.23, 0.19))
stone("tco_stone_side", (0.17, 0.145, 0.12), (0.25, 0.21, 0.17), 1.6, side=True)
mixed("tco_oak", (0.06, 0.03, 0.013), (0.12, 0.065, 0.028), 3.0, 0.5)
mixed("tco_door", (0.09, 0.045, 0.02), (0.15, 0.08, 0.035), 6.0, 0.55)
stone("tco_floor", (0.07, 0.065, 0.06), (0.11, 0.1, 0.09), 0.9)   # flagstones
mixed("tco_runner", (0.12, 0.012, 0.02), (0.2, 0.03, 0.04), 5.0, 0.95)
principled("tco_iron", (0.04, 0.04, 0.04), 0.45, metal=0.8)
principled("tco_brass", (0.75, 0.52, 0.2), 0.3, metal=1.0)
principled("tco_flame", (1, 0.7, 0.3), 0.5, emit=(1.0, 0.6, 0.22), strength=40.0)
principled("tco_candle", (0.93, 0.9, 0.82), 0.6)
principled("tco_moon", (1, 1, 1), 1.0, emit=(0.55, 0.65, 0.95), strength=2.5)
principled("tco_paint", (0.55, 0.53, 0.5), 0.5)

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, seg=12):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

# ── THE PASSAGE: 3.2m wide, 4.2m high, 26m long, running away from us ──
HW, H, L0, L1 = 1.6, 4.2, -2.0, 24.0
box("tco_floor", -HW, HW, L0, L1, -0.1, 0.0, "tco_floor")
box("tco_runner", -0.65, 0.65, L0, L1 - 1, 0.0, 0.01, "tco_runner")
box("tco_ceil", -HW, HW, L0, L1, H, H + 0.1, "tco_stone")
for i in range(14):
    y = L0 + 1 + i*1.9
    box(f"tco_beam{i}", -HW, HW, y - 0.12, y + 0.12, H - 0.28, H, "tco_oak")
for sx in (-1, 1):
    box(f"tco_wall{sx}", min(sx*HW, sx*(HW + 0.3)), max(sx*HW, sx*(HW + 0.3)), L0, L1, 0, H, "tco_stone_side")
    box(f"tco_dado{sx}", min(sx*HW, sx*(HW - 0.05)), max(sx*HW, sx*(HW - 0.05)), L0, L1, 0, 1.1, "tco_oak")
    box(f"tco_rail{sx}", min(sx*HW, sx*(HW - 0.08)), max(sx*HW, sx*(HW - 0.08)), L0, L1, 1.1, 1.16, "tco_oak")
# the bedroom doors: a row each side, the near right one is where the offer happens
DOORS = []
for sx in (-1, 1):
    for k in range(5):
        y = 1.2 + k*4.6 + (1.6 if sx < 0 else 0)
        x = sx*(HW - 0.02)
        dx = (lambda a, b: (min(a, b), max(a, b)))
        a0, a1 = dx(sx*(HW - 0.07), sx*(HW - 0.02))
        box(f"tco_frame{sx}{k}", a0 - (0.02 if sx > 0 else 0), a1, y - 0.68, y + 0.68, 0, 2.55, "tco_oak")
        box(f"tco_door{sx}{k}", *dx(sx*(HW - 0.1), sx*(HW - 0.05)), y - 0.55, y + 0.55, 0.0, 2.4, "tco_door")
        for z in (0.5, 1.9):
            box(f"tco_strap{sx}{k}{z}", *dx(sx*(HW - 0.12), sx*(HW - 0.1)), y - 0.55, y + 0.3, z, z + 0.07, "tco_iron")
        cyl(f"tco_ring{sx}{k}", sx*(HW - 0.13), y + 0.38, 0.04, 1.0, 1.06, "tco_brass")
        DOORS.append((sx, k, y))
        # a sconce between doors
        sy = y + 2.3
        if sy < L1 - 1:
            box(f"tco_sconce{sx}{k}", *dx(sx*(HW - 0.14), sx*(HW - 0.02)), sy - 0.06, sy + 0.06, 2.05, 2.12, "tco_iron")
            cyl(f"tco_cnd{sx}{k}", sx*(HW - 0.12), sy, 0.025, 2.12, 2.32, "tco_candle")
            bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=1)
            for v in bm.verts: v.co.x = v.co.x*0.018 + sx*(HW - 0.12); v.co.y = v.co.y*0.018 + sy; v.co.z = v.co.z*0.04 + 2.37
            put(f"tco_flm{sx}{k}", bm, "tco_flame", smooth=True)
            ld = bpy.data.lights.get(f"tco_l{sx}{k}") or bpy.data.lights.new(f"tco_l{sx}{k}", 'POINT')
            ld.energy = 55; ld.color = (1.0, 0.62, 0.3); ld.shadow_soft_size = 0.08
            ob = bpy.data.objects.get(f"tco_l{sx}{k}") or bpy.data.objects.new(f"tco_l{sx}{k}", ld)
            ob.location = (sx*(HW - 0.3), sy, 2.4)
            if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
# the far end: a tall window, the moon behind it
box("tco_end", -HW, HW, L1, L1 + 0.3, 0, H, "tco_stone")
box("tco_glass", -0.6, 0.6, L1 - 0.02, L1, 1.0, 3.6, "tco_moon")
for x in (-0.62, -0.02, 0.56):
    box(f"tco_mull{x}", x, x + 0.06, L1 - 0.06, L1 - 0.02, 1.0, 3.6, "tco_paint")
for z in (1.0, 1.85, 2.7, 3.55):
    box(f"tco_bar{z}", -0.62, 0.62, L1 - 0.06, L1 - 0.02, z, z + 0.05, "tco_paint")
ld = bpy.data.lights.get("tco_moonl") or bpy.data.lights.new("tco_moonl", 'AREA')
ld.energy = 350; ld.color = (0.55, 0.65, 1.0); ld.size = 1.2
ob = bpy.data.objects.get("tco_moonl") or bpy.data.objects.new("tco_moonl", ld)
ob.location = (0, L1 - 0.4, 2.3); ob.rotation_euler = (math.radians(90), 0, math.radians(180))
if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
# a little haze down the passage, so the light hangs in it
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co.x *= 2*HW - 0.1; v.co.y = (v.co.y + 0.5)*(L1 - 2) + 1.5; v.co.z = (v.co.z + 0.5)*(H - 0.2) + 0.05
air = put("tco_air", bm, None)
m, nt, out = mat("tco_air"); vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.012; vol.inputs['Color'].default_value = (1.0, 0.92, 0.85, 1)
nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
air.data.materials.clear(); air.data.materials.append(bpy.data.materials["tco_air"])

# ── CAMERA: a step into the passage, eye level, looking down it ───────
cd = bpy.data.cameras.get("tco_cam") or bpy.data.cameras.new("tco_cam"); cd.lens = 24; cd.sensor_width = 36; cd.clip_end = 200
cam = bpy.data.objects.get("tco_cam") or bpy.data.objects.new("tco_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (-0.35, -1.4, 1.6)
cam.rotation_euler = (Vector((0.1, 12, 1.45)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84
wd = bpy.data.worlds.get("tco_world") or bpy.data.worlds.new("tco_world")
wd.use_nodes = True; bg = wd.node_tree.nodes.get('Background')
if bg: bg.inputs['Color'].default_value = (0.01, 0.012, 0.02, 1); bg.inputs['Strength'].default_value = 1.0
sc.world = wd
sc.view_settings.exposure = -0.2

def measure():
    from bpy_extras.object_utils import world_to_camera_view as w2c
    sc.view_layers[0].update()
    img = lambda p: (round(w2c(sc, cam, Vector(p)).x, 4), round(1 - w2c(sc, cam, Vector(p)).y, 4))
    near_r = [d for d in DOORS if d[0] > 0 and d[1] == 1][0]          # the second door: the first is at the lens
    near_l = [d for d in DOORS if d[0] < 0 and d[1] == 0][0]
    return {
        # where somebody stands at the near right door (feet, head), and the door itself
        "door_r": {"foot": img((HW - 0.55, near_r[2], 0)), "head": img((HW - 0.55, near_r[2], 1.7)),
                   "sill": img((HW - 0.08, near_r[2], 0.02))},
        # a figure down the passage, in the middle of the runner
        "mid": {"foot": img((-0.2, 6.5, 0)), "head": img((-0.2, 6.5, 1.75))},
        "near_l": {"foot": img((-HW + 0.6, near_l[2], 0)), "head": img((-HW + 0.6, near_l[2], 1.7))},
    }

def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "corridor.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    print(json.dumps(measure()))

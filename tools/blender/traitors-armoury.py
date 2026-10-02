"""The Traitors' Armoury: the undercroft, rendered in Blender (2026-10-02).

The Armoury screen (js/vp-tr/armoury.js) had no stage (the user: "the offer
doesnt have a viewer screens too the armoury i guess too"). This is its room,
painted like every other set (tools/blender/traitors-paint.py): a vaulted
ashlar cellar, a back wall of twelve studded oak cabinet doors in two rows,
wrought sconces either side, a rack of polearms and a rack of shields, and
the foot of the stair the entrants come down.

It renders THREE plates from one camera, so the stage can open any single
door by showing that door's rectangle of a different plate:

    armoury.webp          every door shut
    armoury-open.webp     every door gone, each niche empty
    armoury-shield.webp   every door gone, a shield in each niche

`measure()` prints each door's rectangle (fractions of the 1920x1080 render),
the stair foot and where an entrant stands in front of each door, for
js/vp-tr/armoury-stage.js.

Run inside Blender; builds its own scene ("TR_Armoury").
"""
import bpy, bmesh, math, os, json
from mathutils import Vector

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True

sc = bpy.data.scenes.get("TR_Armoury") or bpy.data.scenes.new("TR_Armoury")
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

def stone(name, c1, c2, scale=1.5, axes='xy'):
    """ashlar from the brick texture; `axes` says which two coordinates the courses run in"""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    sep = N.new('ShaderNodeSeparateXYZ'); com = N.new('ShaderNodeCombineXYZ')
    L.new(tc.outputs['Object'], sep.inputs['Vector'])
    a, b2 = axes[0].upper(), axes[1].upper()
    L.new(sep.outputs[a], com.inputs['X']); L.new(sep.outputs[b2], com.inputs['Y'])
    L.new(com.outputs['Vector'], mp.inputs['Vector'])
    br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.015
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (c1[0]*.45, c1[1]*.45, c1[2]*.45, 1)
    L.new(mp.outputs['Vector'], br.inputs['Vector'])
    bs = N.new('ShaderNodeBsdfPrincipled'); bs.inputs['Roughness'].default_value = 0.88
    L.new(br.outputs['Color'], bs.inputs['Base Color']); L.new(bs.outputs['BSDF'], out.inputs['Surface'])

def mixed(name, c1, c2, scale, rough=0.8):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale; tx.inputs['Detail'].default_value = 4
    L.new(tc.outputs['Object'], tx.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (*c1, 1); rp.color_ramp.elements[1].color = (*c2, 1)
    L.new(tx.outputs['Fac'], rp.inputs['Fac'])
    bs = N.new('ShaderNodeBsdfPrincipled'); bs.inputs['Roughness'].default_value = rough
    L.new(rp.outputs['Color'], bs.inputs['Base Color']); L.new(bs.outputs['BSDF'], out.inputs['Surface'])

stone("tam_back", (0.19, 0.16, 0.13), (0.26, 0.22, 0.18), 1.5, 'xz')
stone("tam_side", (0.17, 0.145, 0.12), (0.24, 0.2, 0.16), 1.5, 'yz')
stone("tam_floor", (0.08, 0.075, 0.07), (0.12, 0.11, 0.1), 0.9, 'xy')
mixed("tam_oak", (0.07, 0.035, 0.015), (0.13, 0.07, 0.03), 6.0, 0.5)
mixed("tam_niche", (0.05, 0.045, 0.04), (0.09, 0.08, 0.07), 4.0, 0.9)
principled("tam_iron", (0.035, 0.035, 0.035), 0.4, metal=0.85)
principled("tam_brass", (0.75, 0.52, 0.2), 0.3, metal=1.0)
principled("tam_steel", (0.6, 0.62, 0.65), 0.25, metal=1.0)
principled("tam_shieldface", (0.55, 0.05, 0.07), 0.4)
principled("tam_flame", (1, 0.7, 0.3), 0.5, emit=(1.0, 0.6, 0.22), strength=40.0)
principled("tam_candle", (0.93, 0.9, 0.82), 0.6)
principled("tam_glow", (0.2, 0.12, 0.06), 1.0, emit=(1.0, 0.62, 0.3), strength=0.35)

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, seg=16, axis='z', r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts:
        v.co.z += (z1 - z0)/2 + z0
        if axis == 'y':                                # lie it along y, centred at (x, y)
            v.co.y, v.co.z = v.co.z, v.co.y
        v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=True)

# ── THE UNDERCROFT: 9m wide, 7m deep, a barrel vault ─────────────────
W2, BACK, SPRING = 4.5, 3.0, 2.8
box("tam_floor", -W2, W2, -5, BACK, -0.1, 0, "tam_floor")
box("tam_backwall", -W2, W2, BACK, BACK + 0.4, 0, 6, "tam_back")
for sx in (-1, 1):
    box(f"tam_side{sx}", min(sx*W2, sx*(W2 + 0.4)), max(sx*W2, sx*(W2 + 0.4)), -5, BACK, 0, 6, "tam_side")
# the vault: a half-cylinder from wall to wall, its ribs every 1.6m
bm = bmesh.new(); seg = 32; rows = []
for i in range(seg + 1):
    a = math.pi*i/seg; row = []
    for y in (-5, BACK):
        row.append(bm.verts.new((W2*math.cos(a), y, SPRING + 1.9*math.sin(a))))
    rows.append(row)
for i in range(seg):
    bm.faces.new((rows[i][0], rows[i+1][0], rows[i+1][1], rows[i][1]))
put("tam_vault", bm, "tam_back", smooth=True)
for k in range(5):
    y = -4 + k*1.6
    bm = bmesh.new(); prev = None
    res = bmesh.ops.create_circle(bm, segments=1, radius=1)
    bm.free()
    bm = bmesh.new(); pts = []
    for i in range(seg + 1):
        a = math.pi*i/seg
        for (dr, dz) in ((0, 0), (0.18, 0)):
            pass
    # a rib as a thin swept box along the arc
    vs_in, vs_out = [], []
    for i in range(seg + 1):
        a = math.pi*i/seg
        vs_in.append([bm.verts.new(((W2 - 0.2)*math.cos(a), y + dy, SPRING + (1.9 - 0.2)*math.sin(a))) for dy in (-0.12, 0.12)])
        vs_out.append([bm.verts.new((W2*math.cos(a), y + dy, SPRING + 1.9*math.sin(a))) for dy in (-0.12, 0.12)])
    for i in range(seg):
        bm.faces.new((vs_in[i][0], vs_in[i+1][0], vs_in[i+1][1], vs_in[i][1]))
        bm.faces.new((vs_in[i][0], vs_out[i][0], vs_out[i+1][0], vs_in[i+1][0]))
        bm.faces.new((vs_in[i][1], vs_in[i+1][1], vs_out[i+1][1], vs_out[i][1]))
    put(f"tam_rib{k}", bm, "tam_back")

# ── THE WALL OF DOORS: an oak press of twelve, two rows of six ───────
#
# A CABINET STANDING OUT FROM THE WALL, not holes in it: its compartments
# are real open boxes, so a plate with the doors taken away shows the niche
# behind each one (and, on the shield plate, what is in it).
DW, DH, GAP = 0.78, 1.0, 0.16
X0 = -(6*DW + 5*GAP)/2
X1 = -X0
ROWS = (0.55, 0.55 + DH + 0.22)
FRONT = BACK - 0.55                      # the face of the press
DOOR_RECTS = []                          # (x0, x1, z0, z1) in world, for measure()
box("tam_press_back", X0 - 0.12, X1 + 0.12, BACK - 0.08, BACK, ROWS[0] - 0.2, ROWS[1] + DH + 0.2, "tam_oak")
box("tam_press_top", X0 - 0.18, X1 + 0.18, FRONT - 0.06, BACK, ROWS[1] + DH + 0.12, ROWS[1] + DH + 0.24, "tam_oak")
box("tam_press_base", X0 - 0.18, X1 + 0.18, FRONT - 0.06, BACK, 0, ROWS[0] - 0.08, "tam_oak")
for r, z0 in enumerate(ROWS):
    for c in range(6):
        x0 = X0 + c*(DW + GAP); x1 = x0 + DW
        DOOR_RECTS.append((x0, x1, z0, z0 + DH))
# the frame: uprights between the columns, a rail between and round the rows
for c in range(7):
    x = X0 - GAP/2 + c*(DW + GAP)
    box(f"tam_up{c}", x - GAP/2, x + GAP/2, FRONT, BACK - 0.08, ROWS[0] - 0.08, ROWS[1] + DH + 0.12, "tam_oak")
for k, z in enumerate((ROWS[0] - 0.08, ROWS[0] + DH, ROWS[1] + DH)):
    box(f"tam_rail{k}", X0 - GAP, X1 + GAP, FRONT, BACK - 0.08, z, z + (0.22 if k == 1 else 0.12), "tam_oak")
# inside each compartment: a darker lining
for i2, (x0, x1, z0, z1) in enumerate(DOOR_RECTS):
    box(f"tam_lining{i2}", x0, x1, BACK - 0.1, BACK - 0.08, z0, z1, "tam_niche")
# the shields in the compartments (only on the shield plate)
SHIELDS = []
for i2, (x0, x1, z0, z1) in enumerate(DOOR_RECTS):
    cx, cz = (x0 + x1)/2, (z0 + z1)/2
    bm = bmesh.new(); n = 28; ring = []
    for k in range(n):
        a = 2*math.pi*k/n
        x = 0.27*math.sin(a); z = 0.33*math.cos(a)
        if z < 0: x *= (1 + z/0.33*0.6)                     # a heater shield: flat top, a point below
        ring.append(bm.verts.new((cx + x, BACK - 0.22, cz + 0.03 + z)))
    f = bm.faces.new(ring)
    f.normal_update()
    if f.normal.y > 0: f.normal_flip()                       # face us, not the wall
    bmesh.ops.solidify(bm, geom=[f], thickness=0.04)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    put(f"tam_shield{i2}", bm, "tam_shieldface")
    # a brass rim: the same outline a little larger, just behind it
    rb = bmesh.new(); rr = []
    for k in range(n):
        a = 2*math.pi*k/n
        x = 0.3*math.sin(a); z = 0.36*math.cos(a)
        if z < 0: x *= (1 + z/0.36*0.6)
        rr.append(rb.verts.new((cx + x, BACK - 0.2, cz + 0.03 + z)))
    rf = rb.faces.new(rr); bmesh.ops.solidify(rb, geom=[rf], thickness=0.02)
    bmesh.ops.recalc_face_normals(rb, faces=rb.faces)
    put(f"tam_rim{i2}", rb, "tam_brass")
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1)
    for v in bm.verts: v.co.x = v.co.x*0.07 + cx; v.co.y = v.co.y*0.03 + BACK - 0.27; v.co.z = v.co.z*0.07 + cz + 0.05
    put(f"tam_boss{i2}", bm, "tam_steel", smooth=True)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co.x = v.co.x*(x1 - x0 - 0.1) + cx; v.co.y = v.co.y*0.01 + BACK - 0.11; v.co.z = v.co.z*(z1 - z0 - 0.1) + cz
    put(f"tam_niglow{i2}", bm, "tam_glow")
    # a small warm light inside the compartment, in front of the shield
    ld = bpy.data.lights.get(f"tam_nl{i2}") or bpy.data.lights.new(f"tam_nl{i2}", 'POINT')
    ld.energy = 5; ld.color = (1.0, 0.72, 0.4); ld.shadow_soft_size = 0.15
    ob = bpy.data.objects.get(f"tam_nl{i2}") or bpy.data.objects.new(f"tam_nl{i2}", ld)
    ob.location = (cx, FRONT + 0.08, z1 - 0.12)
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
    SHIELDS += [f"tam_shield{i2}", f"tam_rim{i2}", f"tam_boss{i2}", f"tam_niglow{i2}", f"tam_nl{i2}"]
# the doors: studded oak, two iron straps, a ring pull, a brass plate
DOORS = []
for i2, (x0, x1, z0, z1) in enumerate(DOOR_RECTS):
    names = [f"tam_door{i2}", f"tam_s{i2}a", f"tam_s{i2}b", f"tam_ring{i2}", f"tam_plate{i2}"]
    box(names[0], x0, x1, FRONT - 0.05, FRONT, z0, z1, "tam_oak")
    box(names[1], x0, x1, FRONT - 0.07, FRONT - 0.05, z0 + 0.16, z0 + 0.22, "tam_iron")
    box(names[2], x0, x1, FRONT - 0.07, FRONT - 0.05, z1 - 0.22, z1 - 0.16, "tam_iron")
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1)
    for v in bm.verts: v.co.x = v.co.x*0.04 + x1 - 0.13; v.co.y = v.co.y*0.02 + FRONT - 0.08; v.co.z = v.co.z*0.04 + (z0 + z1)/2
    put(names[3], bm, "tam_brass", smooth=True)
    box(names[4], (x0 + x1)/2 - 0.11, (x0 + x1)/2 + 0.11, FRONT - 0.065, FRONT - 0.05, z1 - 0.15, z1 - 0.05, "tam_brass")
    DOORS += names
# ── THE ROOM AROUND IT ───────────────────────────────────────────────
for sx in (-1, 1):
    # a rack of polearms along each side wall, in view
    for k in range(6):
        x = sx*(W2 - 0.3); y = 0.4 + k*0.3
        cyl(f"tam_pole{sx}{k}", x, y, 0.025, 0.1, 2.7, "tam_oak", seg=8)
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.07, radius2=0.0, depth=0.35)
        for v in bm.verts: v.co.z += 2.87; v.co.x += x; v.co.y += y
        put(f"tam_head{sx}{k}", bm, "tam_steel")
    box(f"tam_rack{sx}", min(sx*(W2 - 0.42), sx*(W2 - 0.12)), max(sx*(W2 - 0.42), sx*(W2 - 0.12)), 0.25, 2.2, 1.5, 1.58, "tam_oak")
    # heater shields hung on the side walls, nearer us
    for k in range(2):
        bm = bmesh.new(); n = 28; ring = []
        cy, cz = -1.2 + k*1.1, 2.0
        for q in range(n):
            a = 2*math.pi*q/n
            u = 0.3*math.sin(a); z = 0.36*math.cos(a)
            if z < 0: u *= (1 + z/0.36*0.6)
            ring.append(bm.verts.new((sx*(W2 - 0.03), cy + u, cz + z)))
        f = bm.faces.new(ring)
        bmesh.ops.solidify(bm, geom=[f], thickness=0.04)
        put(f"tam_wsh{sx}{k}", bm, "tam_shieldface")
    # sconces either side of the press
    sx0 = sx*(X1 + 0.6)
    box(f"tam_sconce{sx}", sx0 - 0.06, sx0 + 0.06, BACK - 0.16, BACK, 2.2, 2.28, "tam_iron")
    cyl(f"tam_cnd{sx}", sx0, BACK - 0.1, 0.03, 2.28, 2.5, "tam_candle")
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=1)
    for v in bm.verts: v.co.x = v.co.x*0.02 + sx0; v.co.y = v.co.y*0.02 + BACK - 0.1; v.co.z = v.co.z*0.05 + 2.56
    put(f"tam_flm{sx}", bm, "tam_flame", smooth=True)
    ld = bpy.data.lights.get(f"tam_l{sx}") or bpy.data.lights.new(f"tam_l{sx}", 'POINT')
    ld.energy = 140; ld.color = (1.0, 0.62, 0.3); ld.shadow_soft_size = 0.1
    ob = bpy.data.objects.get(f"tam_l{sx}") or bpy.data.objects.new(f"tam_l{sx}", ld)
    ob.location = (sx0, BACK - 0.6, 2.6)
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
# the foot of the stair, down on the left, where they come in
for k in range(6):
    box(f"tam_step{k}", -W2, -W2 + 1.2, -4.6 + k*0.32, -4.6 + (k + 1)*0.32, 0, 0.18*(6 - k), "tam_floor")
# a cool fill from the stair, and a little air
ld = bpy.data.lights.get("tam_fill") or bpy.data.lights.new("tam_fill", 'AREA')
ld.energy = 120; ld.color = (0.6, 0.7, 1.0); ld.size = 2.5
ob = bpy.data.objects.get("tam_fill") or bpy.data.objects.new("tam_fill", ld)
ob.location = (-2.5, -4.5, 3.4); ob.rotation_euler = (Vector((0, BACK, 1.2)) - ob.location).to_track_quat('-Z', 'Y').to_euler()
if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co.x *= 2*W2 - 0.1; v.co.y = (v.co.y + 0.5)*(BACK + 4.8) - 4.8; v.co.z = (v.co.z + 0.5)*4.5 + 0.05
air = put("tam_air", bm, None)
m, nt, out = mat("tam_air"); vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.012; vol.inputs['Color'].default_value = (1.0, 0.92, 0.85, 1)
nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
air.data.materials.clear(); air.data.materials.append(bpy.data.materials["tam_air"])

# ── CAMERA: standing at the stair foot's side, looking at the wall ───
cd = bpy.data.cameras.get("tam_cam") or bpy.data.cameras.new("tam_cam"); cd.lens = 26; cd.sensor_width = 36; cd.clip_end = 100
cam = bpy.data.objects.get("tam_cam") or bpy.data.objects.new("tam_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0.0, -4.8, 1.75)
cam.rotation_euler = (Vector((0, BACK, 1.45)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84
wd = bpy.data.worlds.get("tam_world") or bpy.data.worlds.new("tam_world")
wd.use_nodes = True; bg = wd.node_tree.nodes.get('Background')
if bg: bg.inputs['Color'].default_value = (0.01, 0.01, 0.015, 1); bg.inputs['Strength'].default_value = 1.0
sc.world = wd
sc.view_settings.exposure = 0.0

def show(doors, shields):
    for n in DOORS: bpy.data.objects[n].hide_render = not doors
    for n in SHIELDS: bpy.data.objects[n].hide_render = not shields

def measure():
    from bpy_extras.object_utils import world_to_camera_view as w2c
    sc.view_layers[0].update()
    img = lambda p: (round(w2c(sc, cam, Vector(p)).x, 4), round(1 - w2c(sc, cam, Vector(p)).y, 4))
    doors = []
    for (x0, x1, z0, z1) in DOOR_RECTS:
        a, b = img((x0, FRONT - 0.07, z1)), img((x1, FRONT - 0.07, z0))
        doors.append([a[0], a[1], b[0], b[1]])
    # where somebody stands in front of a door: centred on its column, two metres out
    stand = []
    for c in range(6):
        x = X0 + c*(DW + GAP) + DW/2
        stand.append({"foot": img((x, FRONT - 1.2, 0)), "head": img((x, FRONT - 1.2, 1.7))})
    return {"doors": doors, "stand": stand,
            "stair": {"foot": img((-W2 + 0.9, -3.0, 0.4)), "head": img((-W2 + 0.9, -3.0, 2.1))}}

def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

show(True, False)
if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    for name, d, s in (("armoury", True, False), ("armoury-open", False, False), ("armoury-shield", False, True)):
        show(d, s)
        sc.render.filepath = os.path.join(OUT, name + ".webp")
        bpy.ops.render.render(write_still=True, scene=sc.name)
    show(True, False)
    print(json.dumps(measure()))

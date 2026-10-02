"""The Traitors' breakfast room, rendered in Blender (2026-10-02).

The breakfast stage (js/vp-tr/breakfast-stage.js) stood on a drawn set: a
white cloth seen from above over a tartan floor. The user: "redo the
breakfast screen too". This is the room as a painted render, the same look
as the other sets (tools/blender/traitors-paint.py):

- a long table across the frame, white linen to the floor, silver, teapots
  and thistles down its middle;
- a green-walled, oak-panelled room: tall windows with the morning coming
  through them, gilt-framed portraits between, a beamed ceiling;
- low morning sun through the windows, a little haze in the air for the shafts.

Nobody's chair or place is in the plate: how many are laid changes every
episode. They are SPRITES rendered from the same camera with the room held out
(it still shades them), each cropped to its own box:

    breakfast.webp                 the room
    bk-chair-far.webp              a chair behind the table, facing us
    bk-chair-near.webp             a chair in front of the table, its back to us
    bk-place-far.webp / -near      a place setting on the cloth
    bk-turned-far.webp / -near     the same, its cup turned over

The stage needs to know where things land. `measure()` prints, for each row,
the image y of a seated head and of a place on the cloth, how far a metre
along the table moves across the image, and each sprite's crop box (all as
fractions of the 1920x1080 render). Those numbers live in
js/vp-tr/breakfast-stage.js `BK`.

Run inside Blender; builds its own scene ("TR_Breakfast").
"""
import bpy, bmesh, math, os, json, random
from mathutils import Vector

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True
rnd = random.Random(11)

sc = bpy.data.scenes.get("TR_Breakfast") or bpy.data.scenes.new("TR_Breakfast")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in [x.name for x in sc.collection.children]: sc.collection.children.link(c)
    return c

CUR = ["tbk_room"]
def put(name, bm, mat=None, smooth=False):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    me.materials.clear()
    if mat:
        for m in (mat if isinstance(mat, list) else [mat]): me.materials.append(bpy.data.materials[m])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me; ob.modifiers.clear()
    c = coll(CUR[0])
    if ob.name not in c.objects: c.objects.link(ob)
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

def mixed(name, c1, c2, scale, rough=0.8, coord='Object'):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = scale; tx.inputs['Detail'].default_value = 4
    L.new(tc.outputs[coord], tx.inputs['Vector'])
    rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (*c1, 1); rp.color_ramp.elements[1].color = (*c2, 1)
    L.new(tx.outputs['Fac'], rp.inputs['Fac'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = rough
    L.new(rp.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

def planks(name, c1, c2, scale=(0.9, 9.0)):
    """floorboards: long noise-streaked boards"""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale[0], scale[1], 1)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.006; br.offset = 0.5
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (c1[0]*0.4, c1[1]*0.4, c1[2]*0.4, 1)
    L.new(mp.outputs['Vector'], br.inputs['Vector'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.45
    L.new(br.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

def tartan(name):
    """a red hunting tartan: two stripe sets crossed"""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Object'], sep.inputs['Vector'])
    def stripes(axis, freq):
        w = N.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = axis
        w.inputs['Scale'].default_value = freq; w.inputs['Distortion'].default_value = 0
        L.new(tc.outputs['Object'], w.inputs['Vector'])
        r = N.new('ShaderNodeMath'); r.operation = 'GREATER_THAN'; r.inputs[1].default_value = 0.72
        L.new(w.outputs['Fac'], r.inputs[0]); return r
    sx, sy = stripes('X', 2.2), stripes('Y', 2.2)
    add = N.new('ShaderNodeMath'); add.operation = 'ADD'
    L.new(sx.outputs[0], add.inputs[0]); L.new(sy.outputs[0], add.inputs[1])
    rp = N.new('ShaderNodeValToRGB'); E = rp.color_ramp.elements
    E[0].position = 0.0; E[0].color = (0.13, 0.025, 0.025, 1)
    E[1].position = 0.5; E[1].color = (0.08, 0.05, 0.035, 1); rp.color_ramp.interpolation = 'CONSTANT'
    e = E.new(0.95); e.color = (0.05, 0.06, 0.04, 1)
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.5
    L.new(add.outputs[0], mul.inputs[0]); L.new(mul.outputs[0], rp.inputs['Fac'])
    b = N.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = 0.95
    L.new(rp.outputs['Color'], b.inputs['Base Color']); L.new(b.outputs['BSDF'], out.inputs['Surface'])

planks("tbk_floor", (0.12, 0.065, 0.03), (0.17, 0.095, 0.045))
tartan("tbk_tartan")
mixed("tbk_wall", (0.04, 0.09, 0.06), (0.07, 0.13, 0.09), 1.2)
mixed("tbk_oak", (0.07, 0.035, 0.015), (0.13, 0.07, 0.03), 3.0, 0.5)
mixed("tbk_linen", (0.82, 0.8, 0.74), (0.9, 0.88, 0.83), 4.0, 0.85)
principled("tbk_paint", (0.75, 0.73, 0.68), 0.5)
principled("tbk_gilt", (0.75, 0.52, 0.2), 0.3, metal=1.0)
principled("tbk_silver", (0.8, 0.8, 0.82), 0.2, metal=1.0)
principled("tbk_china", (0.92, 0.91, 0.88), 0.25)
principled("tbk_china_rim", (0.14, 0.2, 0.42), 0.3)
principled("tbk_canvas_a", (0.08, 0.06, 0.04), 0.9)
principled("tbk_canvas_b", (0.16, 0.12, 0.08), 0.9)
principled("tbk_candle", (0.93, 0.9, 0.82), 0.6)
principled("tbk_thistle", (0.35, 0.12, 0.42), 0.8)
principled("tbk_stem", (0.12, 0.2, 0.08), 0.8)
principled("tbk_apple", (0.5, 0.06, 0.04), 0.4)
principled("tbk_orange", (0.8, 0.35, 0.05), 0.5)
principled("tbk_sky", (1, 1, 1), 1.0, emit=(0.95, 0.86, 0.68), strength=1.0)
mixed("tbk_chair", (0.09, 0.045, 0.02), (0.15, 0.08, 0.035), 3.0, 0.45)
principled("tbk_seat", (0.25, 0.03, 0.04), 0.8)

def box(name, x0, x1, y0, y1, z0, z1, m):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5)*(x1 - x0); v.co.y = y0 + (v.co.y + 0.5)*(y1 - y0); v.co.z = z0 + (v.co.z + 0.5)*(z1 - z0)
    return put(name, bm, m)

def cyl(name, x, y, r, z0, z1, m, r2=None, seg=24, smooth=True):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co.z += (z1 - z0)/2 + z0; v.co.x += x; v.co.y += y
    return put(name, bm, m, smooth=smooth)

def sphere(name, x, y, z, rx, ry, rz, m, seg=24):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg//2, radius=1)
    for v in bm.verts: v.co.x = v.co.x*rx + x; v.co.y = v.co.y*ry + y; v.co.z = v.co.z*rz + z
    return put(name, bm, m, smooth=True)

# ── THE ROOM ───────────────────────────────────────────────────────────────
RW, BACK, H = 7.5, 4.2, 4.8                       # half-width, back wall, height
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
for v in bm.verts: v.co.x *= RW; v.co.y = v.co.y*12 - 6
put("tbk_floor", bm, "tbk_floor")
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
for v in bm.verts: v.co.x *= 6.0; v.co.y *= 2.3; v.co.z = 0.006
put("tbk_rug", bm, "tbk_tartan")

# the back wall, built round three tall windows so the sun comes in through them
WINS = (-4.6, 0.0, 4.6); WW, WZ0, WZ1 = 1.5, 1.15, 3.75
xs = [-RW] + [v for x in WINS for v in (x - WW/2, x + WW/2)] + [RW]
for i in range(0, len(xs), 2):
    box(f"tbk_back{i}", xs[i], xs[i+1], BACK, BACK + 0.4, 0, H, "tbk_wall")
for k, x in enumerate(WINS):
    box(f"tbk_sill{k}", x - WW/2, x + WW/2, BACK, BACK + 0.4, 0, WZ0, "tbk_wall")
    box(f"tbk_head{k}", x - WW/2, x + WW/2, BACK, BACK + 0.4, WZ1, H, "tbk_wall")
    # the frame and glazing bars, painted
    for (a, b, c, d) in ((x - WW/2, x - WW/2 + 0.08, WZ0, WZ1), (x + WW/2 - 0.08, x + WW/2, WZ0, WZ1),
                         (x - 0.035, x + 0.035, WZ0, WZ1)):
        box(f"tbk_mull{k}_{a:.2f}", a, b, BACK + 0.12, BACK + 0.2, c, d, "tbk_paint")
    for z in (WZ0, WZ0 + 0.9, WZ0 + 1.8, WZ1 - 0.08):
        box(f"tbk_bar{k}_{z:.2f}", x - WW/2, x + WW/2, BACK + 0.12, BACK + 0.2, z, z + 0.07, "tbk_paint")
    # curtains, tied back
    for sx in (-1, 1):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.22, radius2=0.12, depth=3.0)
        for v in bm.verts:
            v.co.z += 1.5 + 1.05; v.co.x = v.co.x*0.8 + x + sx*(WW/2 + 0.12); v.co.y = v.co.y*0.5 + BACK - 0.15
        put(f"tbk_curt{k}{sx}", bm, "tbk_seat", smooth=True)
# what is outside: a bright morning, the glass catching it
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
for v in bm.verts: v.co.x *= 12; v.co.z = v.co.y*4 + 2.6; v.co.y = BACK + 2.5
sky = put("tbk_outside", bm, "tbk_sky")
sky.visible_shadow = False                       # the light comes through it, not from it

# the panelling: a dado rail and raised panels round the room
box("tbk_dado", -RW, RW, BACK - 0.08, BACK, 0, 1.05, "tbk_oak")
box("tbk_rail", -RW, RW, BACK - 0.12, BACK, 1.05, 1.12, "tbk_oak")
for i in range(17):
    x = -RW + 0.45 + i*0.88
    box(f"tbk_panel{i}", x, x + 0.7, BACK - 0.11, BACK - 0.08, 0.16, 0.92, "tbk_oak")
# the side walls, panelled, with a portrait each
for sx in (-1, 1):
    box(f"tbk_side{sx}", sx*RW - (0.4 if sx > 0 else 0), sx*RW + (0.4 if sx < 0 else 0), -6, BACK + 0.4, 0, H, "tbk_wall") \
        if False else box(f"tbk_side{sx}", min(sx*RW, sx*(RW + 0.4)), max(sx*RW, sx*(RW + 0.4)), -6, BACK + 0.4, 0, H, "tbk_wall")
    box(f"tbk_sdado{sx}", min(sx*RW, sx*(RW - 0.08)), max(sx*RW, sx*(RW - 0.08)), -6, BACK, 0, 1.12, "tbk_oak")
# the portraits between the windows, in gilt frames
def portrait(name, cx, cz, w, h, y, canvas):
    box(name + "_f", cx - w/2 - 0.1, cx + w/2 + 0.1, y - 0.06, y, cz - h/2 - 0.1, cz + h/2 + 0.1, "tbk_gilt")
    box(name + "_c", cx - w/2, cx + w/2, y - 0.08, y - 0.04, cz - h/2, cz + h/2, canvas)
for k, x in enumerate((-2.3, 2.3)):
    portrait(f"tbk_port{k}", x, 2.55, 1.0, 1.3, BACK - 0.02, "tbk_canvas_a" if k else "tbk_canvas_b")
for k, x in enumerate((-6.6, 6.6)):
    portrait(f"tbk_portw{k}", x, 2.5, 0.8, 1.0, BACK - 0.02, "tbk_canvas_b")
# the sideboards under the portraits: the breakfast laid out in silver
for k, x in enumerate((-2.3, 2.3)):
    box(f"tbk_sb{k}", x - 1.0, x + 1.0, BACK - 0.6, BACK - 0.1, 0.0, 0.92, "tbk_oak")
    box(f"tbk_sbtop{k}", x - 1.05, x + 1.05, BACK - 0.63, BACK - 0.08, 0.92, 0.96, "tbk_oak")
    for j in range(4):
        box(f"tbk_sbd{k}_{j}", x - 0.95 + j*0.48, x - 0.55 + j*0.48, BACK - 0.62, BACK - 0.6, 0.12, 0.8, "tbk_chair")
    for j, dx in enumerate((-0.65, 0.0, 0.65)):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < 0], context='FACES')
        for v in bm.verts: v.co.x = v.co.x*0.2 + x + dx; v.co.y = v.co.y*0.16 + BACK - 0.35; v.co.z = v.co.z*0.16 + 0.97
        put(f"tbk_dome{k}_{j}", bm, "tbk_silver", smooth=True)
        sphere(f"tbk_knob{k}_{j}", x + dx, BACK - 0.35, 1.15, 0.025, 0.025, 0.025, "tbk_silver", seg=10)
# the beams
for i in range(8):
    y = -5 + i*1.25
    box(f"tbk_beam{i}", -RW, RW, y - 0.12, y + 0.12, H - 0.32, H, "tbk_oak")
box("tbk_ceiling", -RW, RW, -6, BACK + 0.4, H, H + 0.1, "tbk_wall")
# two iron chandeliers over the table, candles unlit in the morning
for k, x in enumerate((-2.6, 2.6)):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=32, radius1=0.62, radius2=0.62, depth=0.05)
    for v in bm.verts: v.co.x += x; v.co.z += 3.35
    put(f"tbk_ring{k}", bm, "tbk_gilt")
    cyl(f"tbk_chain{k}", x, 0, 0.012, 3.35, H - 0.3, "tbk_gilt", seg=6)
    for j in range(8):
        a = j/8*6.283
        cyl(f"tbk_cc{k}_{j}", x + 0.62*math.cos(a), 0.62*math.sin(a), 0.025, 3.37, 3.55, "tbk_candle", seg=8)

# ── THE TABLE ─────────────────────────────────────────────────────────────
TL, TD, TZ = 5.2, 0.75, 0.76                      # half-length, half-depth, height
box("tbk_top", -TL, TL, -TD, TD, TZ - 0.04, TZ, "tbk_linen")
# the cloth falls nearly to the floor, in soft folds
for side in (-1, 1):
    bm = bmesh.new(); n = 220; tops, bots = [], []
    for j in range(n + 1):
        x = -TL + 2*TL*j/n
        w = 0.025*math.sin(x*9.0) + 0.012*math.sin(x*23 + 1)
        tops.append(bm.verts.new((x, side*(TD + 0.01), TZ)))
        bots.append(bm.verts.new((x, side*(TD + 0.03 + w), 0.12)))
    for j in range(n):
        bm.faces.new((bots[j], bots[j+1], tops[j+1], tops[j]))
    put(f"tbk_skirt{side}", bm, "tbk_linen", smooth=True)
for sx in (-1, 1):
    box(f"tbk_end{sx}", min(sx*TL, sx*(TL + 0.02)), max(sx*TL, sx*(TL + 0.02)), -TD, TD, 0.12, TZ, "tbk_linen")
# down the middle: candelabra, teapots, thistles, fruit
def candelabrum(name, x):
    cyl(name + "_b", x, 0, 0.09, TZ, TZ + 0.03, "tbk_silver")
    cyl(name + "_s", x, 0, 0.02, TZ, TZ + 0.42, "tbk_silver", seg=10)
    for j, dx in enumerate((-0.18, -0.09, 0, 0.09, 0.18)):
        h = 0.42 + (0.06 if dx == 0 else 0)
        cyl(name + f"_cup{j}", x + dx, 0, 0.025, TZ + h - 0.02, TZ + h + 0.01, "tbk_silver", seg=10)
        cyl(name + f"_c{j}", x + dx, 0, 0.015, TZ + h, TZ + h + 0.2, "tbk_candle", seg=8)
    box(name + "_arm", x - 0.18, x + 0.18, -0.01, 0.01, TZ + 0.38, TZ + 0.40, "tbk_silver")
def teapot(name, x, y):
    sphere(name + "_body", x, y, TZ + 0.1, 0.11, 0.11, 0.1, "tbk_silver")
    cyl(name + "_lid", x, y, 0.05, TZ + 0.19, TZ + 0.23, "tbk_silver", r2=0.01, seg=12)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.025, radius2=0.012, depth=0.16)
    for v in bm.verts:
        z = v.co.z; v.co.z = z*0.7 + TZ + 0.13; v.co.x = v.co.x + x + 0.14 + z*0.6; v.co.y += y
    put(name + "_spout", bm, "tbk_silver", smooth=True)
def thistles(name, x):
    cyl(name + "_vase", x, 0, 0.06, TZ, TZ + 0.2, "tbk_silver", r2=0.045)
    for j in range(7):
        a = j/7*6.283; r = 0.06 + 0.04*rnd.random(); h = 0.42 + 0.12*rnd.random()
        sphere(name + f"_h{j}", x + r*math.cos(a), r*math.sin(a)*0.6, TZ + h, 0.035, 0.035, 0.045, "tbk_thistle", seg=10)
        cyl(name + f"_st{j}", x + r*math.cos(a)*0.6, r*math.sin(a)*0.35, 0.006, TZ + 0.15, TZ + h - 0.03, "tbk_stem", seg=5)
def fruit(name, x):
    cyl(name + "_bowl", x, 0, 0.16, TZ + 0.06, TZ + 0.14, "tbk_silver", r2=0.2, seg=24)
    cyl(name + "_foot", x, 0, 0.06, TZ, TZ + 0.06, "tbk_silver", r2=0.04)
    for j in range(7):
        a = j/7*6.283; r = 0.09*rnd.random()
        sphere(name + f"_f{j}", x + r*math.cos(a), r*math.sin(a), TZ + 0.18 + 0.03*rnd.random(), 0.05, 0.05, 0.05,
               "tbk_apple" if j % 2 else "tbk_orange", seg=12)
for k, x in enumerate((-3.6, 0.0, 3.6)): candelabrum(f"tbk_cand{k}", x)
for k, x in enumerate((-4.6, -1.8, 1.8, 4.6)): teapot(f"tbk_tea{k}", x, 0.12*(1 if k % 2 else -1))
for k, x in enumerate((-2.7, 2.7)): thistles(f"tbk_this{k}", x)
for k, x in enumerate((-0.9, 0.9)): fruit(f"tbk_fruit{k}", x)

# ── THE SPRITES: a chair each side, a place setting each side ─────────────
SEAT_Y = TD + 0.32                                 # where a chair stands from the table's centre line
PLACE_Y = TD - 0.3                                 # where a place is laid on the cloth
def chair(name, y, facing):
    """a carved high-backed chair; facing = +1 faces +y (towards the far wall)"""
    back_y = y + facing*0.22*-1                     # the back is on the far side from the table
    box(name + "_seat", -0.24, 0.24, y - 0.22, y + 0.22, 0.44, 0.52, "tbk_seat")
    box(name + "_frame", -0.25, 0.25, y - 0.23, y + 0.23, 0.4, 0.45, "tbk_chair")
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(name + f"_leg{sx}{sy}", sx*0.21 - 0.025, sx*0.21 + 0.025, y + sy*0.19 - 0.025, y + sy*0.19 + 0.025, 0, 0.42, "tbk_chair")
        # the posts of the back, up past the shoulders, with finials
        box(name + f"_post{sx}", sx*0.21 - 0.03, sx*0.21 + 0.03, back_y - 0.03, back_y + 0.03, 0.42, 1.38, "tbk_chair")
        sphere(name + f"_fin{sx}", sx*0.21, back_y, 1.42, 0.04, 0.04, 0.05, "tbk_chair", seg=12)
    box(name + "_back", -0.18, 0.18, back_y - 0.02, back_y + 0.02, 0.62, 1.28, "tbk_seat")      # upholstered
    box(name + "_crest", -0.24, 0.24, back_y - 0.035, back_y + 0.035, 1.26, 1.36, "tbk_chair")  # the carved top rail
def place(name, y, turned):
    """a plate, a cup and saucer, a knife and fork"""
    side = 1 if y > 0 else -1
    cyl(name + "_plate", 0, y, 0.13, TZ, TZ + 0.012, ["tbk_china"], r2=0.14, seg=32)
    cyl(name + "_rim", 0, y, 0.14, TZ + 0.012, TZ + 0.015, "tbk_china_rim", r2=0.14, seg=32)
    cx, cy = 0.2, y + side*0.08
    cyl(name + "_saucer", cx, cy, 0.065, TZ, TZ + 0.01, "tbk_china", seg=24)
    if turned:
        cyl(name + "_cup", cx, cy, 0.05, TZ + 0.01, TZ + 0.075, "tbk_china", r2=0.034, seg=24)   # upside down
    else:
        cyl(name + "_cup", cx, cy, 0.034, TZ + 0.01, TZ + 0.075, "tbk_china", r2=0.05, seg=24)
        cyl(name + "_tea", cx, cy, 0.045, TZ + 0.07, TZ + 0.072, "tbk_oak", seg=24)
    for sx, w in ((-1, 0.012), (1, 0.01)):
        box(name + f"_cut{sx}", sx*0.18 - w, sx*0.18 + w, y - 0.1, y + 0.1, TZ, TZ + 0.006, "tbk_silver")
SPRITES = {
    "bk-chair-far":   lambda: chair("tbk_sp_chair_far", SEAT_Y, -1),
    "bk-chair-near":  lambda: chair("tbk_sp_chair_near", -SEAT_Y, 1),
    "bk-place-far":   lambda: place("tbk_sp_place_far", PLACE_Y, False),
    "bk-place-near":  lambda: place("tbk_sp_place_near", -PLACE_Y, False),
    "bk-turned-far":  lambda: place("tbk_sp_turned_far", PLACE_Y, True),
    "bk-turned-near": lambda: place("tbk_sp_turned_near", -PLACE_Y, True),
}
for key, build in SPRITES.items():
    CUR[0] = "tbk_" + key; build()
    c = coll("tbk_" + key); c.hide_render = True
CUR[0] = "tbk_room"

# ── CAMERA AND LIGHT ──────────────────────────────────────────────────────
cd = bpy.data.cameras.get("tbk_cam") or bpy.data.cameras.new("tbk_cam"); cd.lens = 36; cd.sensor_width = 36; cd.clip_end = 200
cam = bpy.data.objects.get("tbk_cam") or bpy.data.objects.new("tbk_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cd.lens = 30
cam.location = (0, -7.6, 4.4)       # high: looking down onto the cloth, so the two rows part
look = Vector((0, 0.8, 1.05)) - cam.location
cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84

def light(name, typ, loc, energy, color, size=0.5, rot=None, target=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ == 'SUN': ld.angle = size
    elif typ == 'AREA': ld.size = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if target: ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    elif rot: ob.rotation_euler = rot
    c = coll("tbk_room")
    if ob.name not in c.objects: c.objects.link(ob)
# the morning sun, low, through the windows towards us
light("tbk_sun", 'SUN', (0, 0, 10), 7.0, (1.0, 0.84, 0.62), 0.02, rot=(math.radians(-64), 0, math.radians(10)))
# the room's own light: soft fill from where we stand, a little bounce off the cloth
light("tbk_fill", 'AREA', (0, -8, 4.6), 1400, (0.8, 0.86, 1.0), 6.0, target=(0, 0.5, 1.0))
light("tbk_bounce", 'AREA', (0, 0, 0.9), 60, (1.0, 0.95, 0.85), 3.0, target=(0, 0, 4))
# a little haze, so the windows throw shafts
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
# only between the table and the windows: a box reaching the camera greys the whole picture
for v in bm.verts: v.co.x *= 2*RW - 0.2; v.co.y = (v.co.y + 0.5)*(BACK - 0.15 - 0.9) + 0.9; v.co.z = (v.co.z + 0.5)*(H - 0.4) + 0.2
air = put("tbk_air", bm, None)
m, nt, out = mat("tbk_air"); vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.035; vol.inputs['Color'].default_value = (1.0, 0.95, 0.88, 1)
nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
air.data.materials.clear(); air.data.materials.append(bpy.data.materials["tbk_air"])

wd = bpy.data.worlds.get("tbk_world") or bpy.data.worlds.new("tbk_world")
wd.use_nodes = True; bg = wd.node_tree.nodes.get('Background')
if bg: bg.inputs['Color'].default_value = (0.75, 0.8, 0.88, 1); bg.inputs['Strength'].default_value = 0.6
sc.world = wd
sc.view_settings.exposure = 0.3

# ── WHERE THINGS LAND ─────────────────────────────────────────────────────
def measure():
    from bpy_extras.object_utils import world_to_camera_view as w2c
    sc.view_layers[0].update()
    def img(p):
        v = w2c(sc, cam, Vector(p)); return (round(v.x, 4), round(1 - v.y, 4))
    out = {}
    for row, y in (("far", SEAT_Y), ("near", -SEAT_Y)):
        a, b = img((-4, y, 1.15)), img((4, y, 1.15))
        out[row] = {"head_y": a[1], "per_m": round((b[0] - a[0])/8, 5), "seat_y": img((0, y, 0.48))[1],
                    "place_y": img((0, PLACE_Y if row == "far" else -PLACE_Y, TZ))[1]}
        py = PLACE_Y if row == "far" else -PLACE_Y
        pa, pb = img((-4, py, TZ)), img((4, py, TZ))
        out[row]["place_per_m"] = round((pb[0] - pa[0])/8, 5)
    out["table_x"] = [img((-TL, -TD, TZ))[0], img((TL, -TD, TZ))[0]]
    return out

def crop_box(objs):
    """the box, as render fractions (x0, y0 from the top, x1, y1), round some objects"""
    from bpy_extras.object_utils import world_to_camera_view as w2c
    xs, ys = [], []
    sc.view_layers[0].update(); dg = sc.view_layers[0].depsgraph
    for o in objs:
        oe = o.evaluated_get(dg)
        for v in oe.data.vertices:
            p = w2c(sc, cam, oe.matrix_world @ v.co); xs.append(p.x); ys.append(1 - p.y)
    pad = 0.006
    return [round(max(0, min(xs) - pad), 4), round(max(0, min(ys) - pad), 4), round(min(1, max(xs) + pad), 4), round(min(1, max(ys) + pad), 4)]

def render_sprites(out_dir, samples=96):
    """each sprite on its own, the room held out (it still shades and shadows)"""
    room = [o for o in coll("tbk_room").objects]
    air.hide_render = True
    for o in room:
        if o.type == 'MESH': o.is_holdout = True
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
    boxes = {}
    for key in SPRITES:
        c = coll("tbk_" + key); c.hide_render = False
        b = crop_box(list(c.objects)); boxes[key] = b
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = b[0], b[2]
        sc.render.border_min_y, sc.render.border_max_y = 1 - b[3], 1 - b[1]
        sc.render.filepath = os.path.join(out_dir, key + ".webp")
        bpy.ops.render.render(write_still=True, scene=sc.name)
        c.hide_render = True
    for o in room:
        if o.type == 'MESH': o.is_holdout = False
    air.hide_render = False
    sc.render.use_border = False; sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'
    return boxes

def apply_paint():
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc)

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "breakfast.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    boxes = render_sprites(OUT)
    print(json.dumps({"measure": measure(), "sprites": boxes}))

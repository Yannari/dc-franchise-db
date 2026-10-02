"""The Traitors' turret (the conclave), rendered in Blender (2026-10-02).

Run inside Blender (Scripting tab, or the MCP bridge). It builds the room in a
scene of its own ("TR_Conclave") and leaves every other scene alone, then
renders the two plates the conclave and selection stages draw
(js/vp-tr/conclave-stage.js PLATE / PLATE_TABLE):

    assets/sets/traitors/conclave-back.webp    the room, the table not drawn
    assets/sets/traitors/conclave-table.webp   the table alone, transparent

The pact stands BETWEEN the two, so the stone table hides them from the
waist down. Seat positions are fractions of the render (`seatAt` there), so
if the camera or the table moves here, move them there.

Set OUT to the repo's assets/sets/traitors folder before running.

Lessons from building it, kept so the next set does not relearn them:
- The Brick Texture node has its OWN Scale input (default 5) on top of the
  mapping: blocks came out a fifth of their size and the castle read as a
  brick terrace until it was set to 1.
- The back plate keeps the table in the scene with camera visibility off, so
  it still casts its shadow and blocks the candle light; the table plate
  holds the rest of the room out per object (is_holdout) and hides the haze,
  because a volume renders even inside a held-out collection and fogs the
  whole transparent frame. A shadow catcher floor picked up the flagstone
  joints and the plinth edge as "shadow" and is not used.
- The frame only sees the back wall up to about 5.5 m: everything that
  matters (window apex, banners, string course) has to sit under that.
"""
import bpy, bmesh, math, os

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
R, HWALL = 6.5, 9.0                             # turret radius, wall height

sc = bpy.data.scenes.get("TR_Conclave") or bpy.data.scenes.new("TR_Conclave")
for c in list(sc.collection.children):
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc.collection.children.unlink(c)
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)


# ── helpers ───────────────────────────────────────────────────────────────
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in [x.name for x in sc.collection.children]: sc.collection.children.link(c)
    return c

def put(name, bm, mat=None, smooth=False, col="trc_set"):
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

def arch_pts(w, hs, n=14):
    """an equilateral pointed arch outline, springers at hs, x in [-w/2, w/2]"""
    pts = [(-w/2, 0.0), (-w/2, hs)]
    for i in range(1, n+1):
        a = math.pi - math.radians(60) * i / n
        pts.append((w/2 + w*math.cos(a), hs + w*math.sin(a)))
    for i in range(n-1, -1, -1):
        a = math.radians(60) * i / n
        pts.append((-w/2 + w*math.cos(a), hs + w*math.sin(a)))
    pts.append((w/2, 0.0))
    return pts

def on_wall(ob, a, r=R):
    """stand an object built in local XZ against the wall at angle a; local +Y faces the centre"""
    ob.location = (r*math.cos(a), r*math.sin(a), ob.location.z); ob.rotation_euler = (0, 0, a + math.pi/2)


# ── materials ─────────────────────────────────────────────────────────────
def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def stone(name, base, base2, mortar, rough, bw, rh, bump, offset=0.5, mortar_size=0.012):
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    br = N.new('ShaderNodeTexBrick'); br.offset = offset
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Brick Width'].default_value = bw; br.inputs['Row Height'].default_value = rh
    br.inputs['Mortar Size'].default_value = mortar_size; br.inputs['Mortar Smooth'].default_value = 0.4
    br.inputs['Color1'].default_value = (*base, 1); br.inputs['Color2'].default_value = (*base2, 1)
    br.inputs['Mortar'].default_value = (*mortar, 1)
    L.new(tc.outputs['UV'], br.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6; nz.inputs['Detail'].default_value = 10
    nz.inputs['Roughness'].default_value = 0.65; L.new(tc.outputs['UV'], nz.inputs['Vector'])
    nz2 = N.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 2.5; nz2.inputs['Detail'].default_value = 4
    L.new(tc.outputs['UV'], nz2.inputs['Vector'])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 0.55
    L.new(br.outputs['Color'], mix.inputs[6])
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35; ramp.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1)
    ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (1.15, 1.12, 1.08, 1)
    L.new(nz2.outputs['Fac'], ramp.inputs['Fac']); L.new(ramp.outputs['Color'], mix.inputs[7])
    bsdf = N.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Roughness'].default_value = rough
    L.new(mix.outputs[2], bsdf.inputs['Base Color'])
    add = N.new('ShaderNodeMath'); add.operation = 'MULTIPLY_ADD'
    L.new(nz.outputs['Fac'], add.inputs[0]); add.inputs[1].default_value = 0.35; L.new(br.outputs['Fac'], add.inputs[2])
    inv = N.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    L.new(add.outputs[0], inv.inputs[1])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.05
    L.new(inv.outputs[0], bp.inputs['Height']); L.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    L.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def simple(name, color, rough=0.5, metal=0.0, sheen=0.0, emit=None, strength=0.0, sss=0.0):
    m, nt, out = mat(name)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal; b.inputs['Sheen Weight'].default_value = sheen
    if sss: b.inputs['Subsurface Weight'].default_value = sss
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

def cloth(name, red, sheen):
    """velvet with a gold border down both long edges (u near 0 or 1)"""
    m, nt, out = mat(name); N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['UV'], sep.inputs['Vector'])
    pp = N.new('ShaderNodeMath'); pp.operation = 'PINGPONG'; pp.inputs[1].default_value = 0.5; L.new(sep.outputs['X'], pp.inputs[0])
    lt = N.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = 0.06; L.new(pp.outputs[0], lt.inputs[0])
    vel = N.new('ShaderNodeBsdfPrincipled'); vel.inputs['Base Color'].default_value = (*red, 1)
    vel.inputs['Roughness'].default_value = 0.8; vel.inputs['Sheen Weight'].default_value = sheen
    gld = N.new('ShaderNodeBsdfPrincipled'); gld.inputs['Base Color'].default_value = (0.65, 0.42, 0.14, 1)
    gld.inputs['Metallic'].default_value = 1; gld.inputs['Roughness'].default_value = 0.4
    mx = N.new('ShaderNodeMixShader'); L.new(lt.outputs[0], mx.inputs[0]); L.new(vel.outputs[0], mx.inputs[1]); L.new(gld.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], out.inputs['Surface'])

stone("trc_wall", (0.19, 0.17, 0.15), (0.11, 0.10, 0.09), (0.05, 0.045, 0.04), 0.88, 0.95, 0.42, 0.7, mortar_size=0.018)
stone("trc_floor", (0.075, 0.068, 0.062), (0.05, 0.046, 0.042), (0.03, 0.028, 0.026), 0.45, 0.95, 0.72, 0.5)
stone("trc_dressed", (0.20, 0.185, 0.165), (0.144, 0.13, 0.112), (0.07, 0.065, 0.06), 0.7, 0.9, 0.45, 0.3)
stone("trc_tdress", (0.085, 0.077, 0.07), (0.06, 0.055, 0.05), (0.07, 0.065, 0.06), 0.5, 2.5, 0.6, 0.3)
simple("trc_iron", (0.03, 0.028, 0.026), 0.45, metal=0.9)
simple("trc_gold", (0.6, 0.38, 0.12), 0.35, metal=1.0)
simple("trc_wax", (0.85, 0.78, 0.62), 0.45, sss=0.5)
simple("trc_flame", (1, 0.5, 0.15), 1.0, emit=(1.0, 0.55, 0.18), strength=30)
simple("trc_parch", (0.62, 0.52, 0.36), 0.8)
simple("trc_sealwax", (0.35, 0.02, 0.03), 0.35)
simple("trc_shadow", (0.012, 0.01, 0.009), 1.0)
cloth("trc_banner", (0.2, 0.01, 0.02), 0.9)
cloth("trc_runner", (0.09, 0.004, 0.008), 0.35)

# moonlit leaded glass: diamond quarries, deep blue brightening toward the top
m, nt, out = mat("trc_glass"); N, L = nt.nodes, nt.links
tc = N.new('ShaderNodeTexCoord')
rot = N.new('ShaderNodeMapping'); rot.inputs['Rotation'].default_value = (0, 0, math.radians(45)); rot.inputs['Scale'].default_value = (9, 9, 1)
L.new(tc.outputs['UV'], rot.inputs['Vector'])
br = N.new('ShaderNodeTexBrick'); br.offset = 0.0
br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0; br.inputs['Mortar Size'].default_value = 0.06
br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (0.75, 0.8, 0.9, 1); br.inputs['Mortar'].default_value = (0, 0, 0, 1)
L.new(rot.outputs['Vector'], br.inputs['Vector'])
sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['UV'], sep.inputs['Vector'])
ramp = N.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (0.05, 0.09, 0.22, 1); ramp.color_ramp.elements[1].color = (0.35, 0.48, 0.85, 1)
L.new(sep.outputs['Y'], ramp.inputs['Fac'])
nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3; L.new(tc.outputs['UV'], nz.inputs['Vector'])
mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
L.new(ramp.outputs['Color'], mx.inputs[6]); L.new(br.outputs['Color'], mx.inputs[7])
mx2 = N.new('ShaderNodeMix'); mx2.data_type = 'RGBA'; mx2.blend_type = 'OVERLAY'; mx2.inputs['Factor'].default_value = 0.35
L.new(mx.outputs[2], mx2.inputs[6]); L.new(nz.outputs['Color'], mx2.inputs[7])
em = N.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.6
L.new(mx2.outputs[2], em.inputs['Color']); L.new(em.outputs['Emission'], out.inputs['Surface'])

# haze through the whole room
m, nt, out = mat("trc_haze")
vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.014; vol.inputs['Anisotropy'].default_value = 0.55
vol.inputs['Color'].default_value = (0.9, 0.85, 0.8, 1)
nt.links.new(vol.outputs[0], out.inputs['Volume'])


# ── the shell ─────────────────────────────────────────────────────────────
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=96, radius=R + 0.2)
uvset(bm, lambda co, f: (co.x, co.y)); put("trc_floor", bm, "trc_floor")

bm = bmesh.new(); seg = 128
rings = [[bm.verts.new((R*math.cos(2*math.pi*i/seg), R*math.sin(2*math.pi*i/seg), HWALL*k)) for i in range(seg)] for k in range(2)]
for i in range(seg):
    j = (i + 1) % seg
    bm.faces.new((rings[0][j], rings[0][i], rings[1][i], rings[1][j]))
uv = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops: l[uv].uv = (math.atan2(l.vert.co.y, l.vert.co.x)*R, l.vert.co.z)
    us = [l[uv].uv.x for l in f.loops]
    if max(us) - min(us) > R*math.pi:
        for l in f.loops:
            if l[uv].uv.x < 0: l[uv].uv.x += 2*math.pi*R
put("trc_wall", bm, "trc_wall")

bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=24, radius=R)
for v in list(bm.verts):
    if v.co.z < -0.001: bm.verts.remove(v)
for v in bm.verts: v.co.z = v.co.z*0.55 + HWALL
uvset(bm, lambda co, f: (math.atan2(co.y, co.x)*R, co.z*1.6)); put("trc_dome", bm, "trc_wall")

def ring_band(name, r_in, z0, z1):
    bm = bmesh.new(); seg = 128; bot, top, bin_, tin = [], [], [], []
    for i in range(seg):
        a = 2*math.pi*i/seg; c, s = math.cos(a), math.sin(a)
        bot.append(bm.verts.new((R*c, R*s, z0))); top.append(bm.verts.new((R*c, R*s, z1)))
        bin_.append(bm.verts.new((r_in*c, r_in*s, z0))); tin.append(bm.verts.new((r_in*c, r_in*s, z1)))
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((bin_[i], bin_[j], tin[j], tin[i])); bm.faces.new((tin[i], tin[j], top[j], top[i]))
        bm.faces.new((bot[i], bot[j], bin_[j], bin_[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uvset(bm, lambda co, f: (math.atan2(co.y, co.x)*R, co.z + (R - math.hypot(co.x, co.y))))
    put(name, bm, "trc_dressed")
ring_band("trc_plinth", R - 0.32, 0.0, 0.42)
ring_band("trc_course", R - 0.25, 6.1, 6.45)


# ── window, niches, columns ───────────────────────────────────────────────
def frame(name, w_out, w_in, hs, depth, z0, n=14):
    o, i = arch_pts(w_out, hs, n), arch_pts(w_in, hs, n)
    bm = bmesh.new()
    ring = lambda pts, y: [bm.verts.new((x, y, z + z0)) for (x, z) in pts]
    of, ifr, ob_, ib = ring(o, depth), ring(i, depth), ring(o, 0.0), ring(i, 0.0)
    for k in range(len(o) - 1):
        bm.faces.new((of[k], of[k+1], ifr[k+1], ifr[k]))
        bm.faces.new((ob_[k+1], of[k+1], of[k], ob_[k]))
        bm.faces.new((ib[k], ifr[k], ifr[k+1], ib[k+1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uvset(bm, lambda co, f: (co.x + co.y, co.z + co.y))
    return put(name, bm, "trc_dressed")

def fill(name, w, hs, matn, z0, y, n=14):
    p = arch_pts(w, hs, n); bm = bmesh.new()
    bm.faces.new([bm.verts.new((x, y, z + z0)) for (x, z) in p])
    bmesh.ops.triangulate(bm, faces=bm.faces)
    uvset(bm, lambda co, f: ((co.x + w/2)/w, (co.z - z0)/(hs + w*0.87)))
    return put(name, bm, matn)

def block(name, sx, sy, sz, y, z, matn="trc_dressed"):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co.x *= sx; v.co.y = v.co.y*sy + y; v.co.z = v.co.z*sz + z
    uvset(bm, lambda co, f: (co.x + co.y, co.z + co.y)); return put(name, bm, matn)

def bar(name, x0, z0, x1, z1, t=0.09, d=0.16, y=0.1):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    ln, ang = math.hypot(x1-x0, z1-z0), math.atan2(z1-z0, x1-x0)
    for v in bm.verts:
        v.co.x *= ln; v.co.z *= t; v.co.y = v.co.y*d + y
        x, z = v.co.x, v.co.z
        v.co.x = x*math.cos(ang) - z*math.sin(ang) + (x0+x1)/2
        v.co.z = x*math.sin(ang) + z*math.cos(ang) + (z0+z1)/2
    uvset(bm, lambda co, f: (co.x + co.y, co.z + co.y)); return put(name, bm, "trc_dressed")

A = math.pi/2   # the back wall
on_wall(fill("trc_win_glass", 1.6, 2.2, "trc_glass", 1.4, 0.06), A)
on_wall(frame("trc_win_f1", 2.15, 1.6, 2.2, 0.42, 1.4), A)
on_wall(frame("trc_win_f2", 2.75, 2.15, 2.2, 0.22, 1.4), A)
on_wall(block("trc_win_sill", 2.9, 0.55, 0.18, 0.27, 1.31), A)
on_wall(bar("trc_trac_mull", 0, 1.4, 0, 3.75), A)
on_wall(bar("trc_trac_tran", -0.8, 2.75, 0.8, 2.75, t=0.07), A)
pts = arch_pts(0.75, 0.0, 10)
for side, cx in (("L", -0.4), ("R", 0.4)):
    for k in range(len(pts) - 3):
        (xa, za), (xb, zb) = pts[k+1], pts[k+2]
        on_wall(bar(f"trc_trac_{side}{k}", xa+cx, za+3.6, xb+cx, zb+3.6, t=0.06, d=0.12), A)
bm = bmesh.new(); ro, ri = [], []
for i in range(32):
    a = 2*math.pi*i/32
    ro.append(bm.verts.new((0.33*math.cos(a), 0.1, 0.33*math.sin(a) + 4.55)))
    ri.append(bm.verts.new((0.26*math.cos(a), 0.1, 0.26*math.sin(a) + 4.55)))
for i in range(32): bm.faces.new((ro[i], ro[(i+1) % 32], ri[(i+1) % 32], ri[i]))
uvset(bm, lambda co, f: (co.x, co.z)); on_wall(put("trc_trac_roundel", bm, "trc_dressed"), A)

for side, deg in (("L", 130), ("R", 50)):
    a = math.radians(deg)
    on_wall(fill(f"trc_niche_{side}_back", 1.1, 1.5, "trc_shadow", 0.9, 0.03), a)
    on_wall(frame(f"trc_niche_{side}_f", 1.55, 1.1, 1.5, 0.32, 0.9), a)
    on_wall(block(f"trc_niche_{side}_sill", 1.7, 0.5, 0.14, 0.22, 0.83), a)

for idx, deg in enumerate((190, 350)):      # the visible pair became banners; these frame the edges
    a = math.radians(deg)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.3, radius2=0.3, depth=5.4)
    for v in bm.verts: v.co.z += 3.05
    uvset(bm, lambda co, f: (math.atan2(co.y, co.x)*0.3, co.z))
    on_wall(put(f"trc_col_{idx}", bm, "trc_dressed", smooth=True), a, R - 0.12)


# ── candles, candelabras, banners ─────────────────────────────────────────
def cyl(name, r, h, loc, matn, seg=20, r2=None, col="trc_set"):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for v in bm.verts: v.co.z += h/2
    uvset(bm, lambda co, f: (co.x + 0.3*co.z, co.y + 0.3*co.z))
    ob = put(name, bm, matn, smooth=True, col=col); ob.location = loc; return ob

def flame(name, loc, col="trc_set"):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.018)
    for v in bm.verts:
        v.co.z *= 2.4
        if v.co.z > 0: v.co.x *= (1 - v.co.z/0.05); v.co.y *= (1 - v.co.z/0.05)
    ob = put(name, bm, "trc_flame", smooth=True, col=col); ob.location = (loc[0], loc[1], loc[2] + 0.03)

def light(name, typ, loc, energy, color, size=0.1, rot=None, spot=None):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, typ)
    ld.type = typ; ld.energy = energy; ld.color = color
    if typ in ('POINT', 'SPOT'): ld.shadow_soft_size = size
    if typ == 'AREA': ld.size = size
    if spot: ld.spot_size, ld.spot_blend = spot
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.data = ld; ob.location = loc
    if rot: ob.rotation_euler = rot
    c = coll("trc_set")
    if ob.name not in c.objects: c.objects.link(ob)

def candle(name, x, y, z, h, r=0.035, col="trc_set"):
    cyl(name, r, h, (x, y, z), "trc_wax", 16, col=col); flame(name + "_fl", (x, y, z + h), col=col)

for side, deg in (("L", 130), ("R", 50)):
    a = math.radians(deg); r = R - 0.28; tx, ty = -math.sin(a), math.cos(a)
    for k, (off, h) in enumerate(((-0.24, 0.26), (0.0, 0.4), (0.21, 0.18))):
        candle(f"trc_nc_{side}{k}", r*math.cos(a) + tx*off, r*math.sin(a) + ty*off, 0.9, h, 0.04)
    light(f"trc_niche_{side}_light", 'POINT', ((R-0.35)*math.cos(a), (R-0.35)*math.sin(a), 1.42), 45, (1.0, 0.55, 0.22), 0.04)

for side, deg in (("L", 112), ("R", 68)):
    a = math.radians(deg); cx, cy = 5.0*math.cos(a), 5.0*math.sin(a)
    cyl(f"trc_cb_{side}_pole", 0.03, 1.95, (cx, cy, 0.12), "trc_iron", 12)
    cyl(f"trc_cb_{side}_foot", 0.22, 0.12, (cx, cy, 0.0), "trc_iron", 3, r2=0.06)
    cyl(f"trc_cb_{side}_knop", 0.07, 0.12, (cx, cy, 1.0), "trc_iron", 12)
    cyl(f"trc_cb_{side}_dish", 0.34, 0.04, (cx, cy, 2.05), "trc_iron", 24, r2=0.3)
    for k in range(5):
        b = 2*math.pi*k/5 + 0.3
        candle(f"trc_cb_{side}_c{k}", cx + 0.27*math.cos(b), cy + 0.27*math.sin(b), 2.09, 0.16 + 0.04*(k % 2), 0.028)
    candle(f"trc_cb_{side}_cc", cx, cy, 2.09, 0.26, 0.034)
    light(f"trc_cb_{side}_pl", 'POINT', (cx, cy, 2.45), 70, (1.0, 0.55, 0.22), 0.25)

for side, deg in (("L", 110), ("R", 70)):
    a = math.radians(deg)
    bm = bmesh.new(); W, top, bot, nu, nv = 1.25, 5.9, 2.0, 16, 30
    grid = []
    for j in range(nv + 1):
        row = []
        for i in range(nu + 1):
            u, v = i/nu, j/nv
            z = bot + 0.45*(1 - abs(u - 0.5)*2) if j == nv else top - (top - bot)*v
            row.append(bm.verts.new(((u - 0.5)*W, 0.06 + 0.035*math.sin(u*math.pi*5)*(0.4 + v), z)))
        grid.append(row)
    uv = bm.loops.layers.uv.verify()
    for j in range(nv):
        for i in range(nu):
            f = bm.faces.new((grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]))
            for l, (uu, vv) in zip(f.loops, ((i, j), (i+1, j), (i+1, j+1), (i, j+1))): l[uv].uv = (uu/nu, 1 - vv/nv)
    ob = put(f"trc_banner_{side}", bm, "trc_banner", smooth=True); on_wall(ob, a)
    rod = cyl(f"trc_banner_{side}_rod", 0.025, 1.55, (0, 0, 0), "trc_iron", 10)
    rod.rotation_euler = (0, math.radians(90), a + math.pi/2)
    rod.location = ((R-0.12)*math.cos(a) + 0.775*math.sin(a), (R-0.12)*math.sin(a) - 0.775*math.cos(a), 5.95)
    bm = bmesh.new(); ro, ri = [], []
    for i in range(32):
        t = 2*math.pi*i/32
        ro.append(bm.verts.new((0.26*math.cos(t), 0.12, 0.26*math.sin(t) + 4.3)))
        ri.append(bm.verts.new((0.2*math.cos(t), 0.12, 0.2*math.sin(t) + 4.3)))
    for i in range(32): bm.faces.new((ro[i], ro[(i+1) % 32], ri[(i+1) % 32], ri[i]))
    uvset(bm, lambda co, f: (co.x, co.z)); on_wall(put(f"trc_banner_{side}_mark", bm, "trc_gold"), a)

bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
for v in bm.verts: v.co.x *= 13.6; v.co.y *= 13.6; v.co.z = v.co.z*8.5 + 4.2
put("trc_haze", bm, "trc_haze")


# ── the table (its own collection, its own plate) ─────────────────────────
TC, TX, TY = "trc_table", 0.0, -0.1           # centre after the 0.84 shrink and push back
S = 0.84
cyl("trc_t_top", 1.75*S, 0.14, (TX, TY, 0.78), "trc_tdress", 96, col=TC)
cyl("trc_t_lip", 1.68*S, 0.07, (TX, TY, 0.71), "trc_tdress", 96, col=TC)
cyl("trc_t_drum", 0.55*S, 0.62, (TX, TY, 0.09), "trc_tdress", 48, col=TC)
cyl("trc_t_foot", 0.95*S, 0.12, (TX, TY, 0.0), "trc_tdress", 48, r2=0.8*S, col=TC)
bm = bmesh.new(); W, nu, nv = 0.62, 4, 40; grid = []
for j in range(nv + 1):
    t = -1.0 + 2.0*j/nv; y = t*1.95*S; z = 0.925
    if abs(y) > 1.75*S: z = 0.925 - (abs(y) - 1.75*S)*2.6; y = math.copysign(1.77*S, y)
    grid.append([bm.verts.new((TX + (i/nu - 0.5)*W, TY + y, z)) for i in range(nu + 1)])
for j in range(nv):
    for i in range(nu): bm.faces.new((grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]))
uv = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops: l[uv].uv = ((l.vert.co.x - TX)/W + 0.5, (l.vert.co.y - TY)/4 + 0.5)
put("trc_t_runner", bm, "trc_runner", smooth=True, col=TC)
DX, DY = TX - 0.35*S, TY + 0.25*S
cyl("trc_t_dish", 0.26, 0.03, (DX, DY, 0.925), "trc_iron", 32, r2=0.22, col=TC)
for k, (dx, dy, h) in enumerate(((-0.08, 0.05, 0.34), (0.08, 0.08, 0.24), (0.0, -0.08, 0.18), (0.12, -0.05, 0.12))):
    candle(f"trc_t_c{k}", DX + dx, DY + dy, 0.955, h, 0.034, col=TC)
light("trc_table_glow", 'POINT', (DX, DY, 1.45), 110, (1.0, 0.5, 0.2), 0.12)
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
for v in bm.verts: v.co.x *= 0.42; v.co.y *= 0.58
uvset(bm, lambda co, f: (co.x, co.y))
p = put("trc_t_letter", bm, "trc_parch", col=TC); p.location = (TX + 0.45*S, TY - 0.55*S, 0.927); p.rotation_euler = (0, 0, math.radians(-14))
cyl("trc_t_ink", 0.05, 0.08, (TX + 0.78*S, TY - 0.2*S, 0.925), "trc_iron", 20, r2=0.04, col=TC)
q = cyl("trc_t_quill", 0.006, 0.42, (TX + 0.78*S, TY - 0.2*S, 0.96), "trc_parch", 6, col=TC)
q.rotation_euler = (math.radians(58), 0, math.radians(-30))
w = cyl("trc_t_wax", 0.014, 0.16, (TX + 0.15*S, TY - 0.85*S, 0.94), "trc_sealwax", 10, col=TC)
w.rotation_euler = (0, math.radians(90), math.radians(20))


# ── moonlight, camera, render settings ────────────────────────────────────
light("trc_moon", 'AREA', (0, 5.9, 3.4), 250, (0.55, 0.65, 1.0), 1.4, rot=(math.radians(-100), 0, 0))
light("trc_moonspot", 'SPOT', (0, 6.2, 4.6), 1500, (0.6, 0.7, 1.0), 0.3, rot=(math.radians(-118), 0, 0), spot=(math.radians(22), 0.4))
wd = bpy.data.worlds.get("trc_world") or bpy.data.worlds.new("trc_world"); wd.use_nodes = True
bg = wd.node_tree.nodes.get("Background"); bg.inputs[0].default_value = (0.004, 0.005, 0.009, 1); bg.inputs[1].default_value = 0.2
sc.world = wd
cd = bpy.data.cameras.get("trc_cam") or bpy.data.cameras.new("trc_cam"); cd.lens = 28; cd.sensor_width = 36
cam = bpy.data.objects.get("trc_cam") or bpy.data.objects.new("trc_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0, -4.9, 1.7); cam.rotation_euler = (math.radians(86), 0, 0); sc.camera = cam

sc.render.engine = 'CYCLES'; sc.cycles.samples = 192; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = -0.4
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 82


# ── the two plates ────────────────────────────────────────────────────────
def render_plates():
    table = list(bpy.data.collections["trc_table"].objects)
    room = [o for o in bpy.data.collections["trc_set"].objects if o.type == 'MESH']
    # BACK: the table still casts its shadow and blocks light; the camera does not see it
    for o in table: o.visible_camera = False
    sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'
    sc.render.filepath = os.path.join(OUT, "conclave-back.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    for o in table: o.visible_camera = True
    # TABLE: the room held out per object, the haze hidden
    for o in room:
        if o.name == "trc_haze": o.hide_render = True
        else: o.is_holdout = True
    sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.filepath = os.path.join(OUT, "conclave-table.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)
    for o in room: o.hide_render = False; o.is_holdout = False
    sc.render.film_transparent = False; sc.render.image_settings.color_mode = 'RGB'

if os.path.isdir(OUT):
    render_plates()

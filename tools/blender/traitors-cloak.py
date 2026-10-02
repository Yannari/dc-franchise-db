"""The Traitors' hooded cloak, rendered in Blender (2026-10-02).

The conclave's figures (js/vp-tr/conclave-stage.js `CLOAK`, also the
selection night's turret) were an SVG trapezoid with a circle on it; the user:
"the cloak are not really well made its kinda giving svg". This is the same
figure as a painted render: a deep crimson velvet cowl over the shoulders,
folds falling from the yoke, gold trim round the hood and down the front, a
clasp at the throat, lit from below by the table's candles and edged from
behind by the window.

Writes assets/sets/traitors/cloak.webp, 600x900 with alpha. The camera is
orthographic and framed so the hood's opening lands exactly where the stage
puts the portrait (`.trc-av`: left 26%, width 48%, top 16%, height 35% of the
figure): the face sits in the hood rather than on top of it.

Run inside Blender; builds its own scene ("TR_Cloak").
"""
import bpy, bmesh, math, os

OUT = r"C:\path\to\repo\assets\sets\traitors"   # set before running
RENDER = True

sc = bpy.data.scenes.get("TR_Cloak") or bpy.data.scenes.new("TR_Cloak")
for o in list(sc.collection.objects): bpy.data.objects.remove(o, do_unlink=True)

def put(name, bm, mats, smooth=True):
    me = bpy.data.meshes.get(name) or bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    me.materials.clear()
    for m in mats: me.materials.append(bpy.data.materials[m])
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, me)
    ob.data = me; ob.modifiers.clear()
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
    return ob

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

# velvet: a deep red that goes nearly black in the folds and catches a pink
# sheen on the edges turned to the light
m, nt, out = mat("trk_velvet"); N, L = nt.nodes, nt.links
b = N.new('ShaderNodeBsdfPrincipled')
tx = N.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = 9; tx.inputs['Detail'].default_value = 3
rp = N.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (0.045, 0.001, 0.005, 1); rp.color_ramp.elements[1].color = (0.12, 0.003, 0.014, 1)
L.new(tx.outputs['Fac'], rp.inputs['Fac']); L.new(rp.outputs['Color'], b.inputs['Base Color'])
b.inputs['Roughness'].default_value = 0.65
for k, v in (('Sheen Weight', 0.5), ('Sheen Roughness', 0.35)):
    if k in b.inputs: b.inputs[k].default_value = v
if 'Sheen Tint' in b.inputs: b.inputs['Sheen Tint'].default_value = (0.8, 0.12, 0.18, 1)
L.new(b.outputs['BSDF'], out.inputs['Surface'])

m, nt, out = mat("trk_gold"); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
b.inputs['Base Color'].default_value = (0.75, 0.52, 0.2, 1); b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.35
nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
m, nt, out = mat("trk_void"); b = nt.nodes.new('ShaderNodeBsdfDiffuse')
b.inputs['Color'].default_value = (0.004, 0.001, 0.002, 1)
nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

# ── the frame: orthographic, 1.0 wide by 1.5 tall, from z = .5 to z = 2.0 ──
# the portrait's box in the figure is x -.24..+.24, z 1.235..1.76
FACE_CX, FACE_CZ, FACE_RX, FACE_RZ = 0.0, 1.5, 0.235, 0.265

# ── the robe and the capelet: lathes, elliptical in section ──────────────
def lathe(name, z0, z1, rfun, folds, depth_of, ydepth=0.62, gold=None, rings=60, seg=128, hem=None, gold_rows=0):
    bm = bmesh.new(); rows = []
    for i in range(rings + 1):
        z = z0 + (z1 - z0)*i/rings; row = []
        for j in range(seg):
            a = 2*math.pi*j/seg
            d = depth_of(z)
            fold = 1 + d*(0.06*math.sin(a*folds + 0.7) + 0.03*math.sin(a*(folds*2 + 3) + 2.1))
            r = rfun(z)*fold
            # a hem that is not level: z0 moves per angle, the top stays put
            zz = z if hem is None else hem(a) + (z - z0)*(z1 - hem(a))/(z1 - z0)
            row.append(bm.verts.new((r*math.sin(a), -r*ydepth*math.cos(a), zz)))
        rows.append(row)
    for i in range(rings):
        for j in range(seg):
            f = bm.faces.new((rows[i][j], rows[i][(j+1) % seg], rows[i+1][(j+1) % seg], rows[i+1][j]))
            if gold_rows and i < gold_rows: f.material_index = 1          # a gold band along the hem
            elif gold: f.material_index = 1 if gold(f.calc_center_median()) else 0
    return put(name, bm, ["trk_velvet", "trk_gold"])

# the robe: an A-line falling from the neck, the folds deepening to the hem
lathe("trk_robe", 0.3, 1.36, lambda z: 0.2 + 0.23*min(1.0, (1.36 - z)/0.5)**0.6 + 0.04*max(0.0, 0.86 - z),
      9, lambda z: max(0.0, 1.25 - z)/0.9,
      gold=lambda c: abs(c.x) < 0.02 and c.y < 0 and c.z < 1.0)
# the capelet over the shoulders: shorter, a little wider, its own hem
def cape_r(z):
    t = max(0.0, min(1.0, (1.4 - z)/0.42))              # 0 at the neck, 1 at the hem
    return 0.22 + 0.23*math.sin(t*math.pi/2)**0.8         # a rounded shoulder, not a cone
cape = lathe("trk_cape", 0.98, 1.4, cape_r, 13, lambda z: max(0.0, 1.3 - z)/0.4*0.9,
             ydepth=0.66, gold_rows=1,
             hem=lambda a: 0.98 - 0.09*(1 + math.cos(a))/2 - 0.015*math.sin(a*13))   # it dips at the front, uneven
so = cape.modifiers.new("thick", 'SOLIDIFY'); so.thickness = 0.02; so.offset = 1

# ── the hood: a deep cowl, its opening a clean ellipse round the portrait ──
OPEN_RX, OPEN_RZ = FACE_RX + 0.03, FACE_RZ + 0.03      # a ring of dark round the face
HX, HY, HZ, HCZ, HCY = 0.33, 0.3, 0.39, 1.52, 0.06
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=128, v_segments=96, radius=1)
for v in bm.verts:
    v.co.x *= HX; v.co.y = v.co.y*HY + HCY; v.co.z = v.co.z*HZ + HCZ
    if v.co.z > 1.85: v.co.y += (v.co.z - 1.85)*0.6                # the crown falls back a little
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < 1.2], context='FACES')
hood = put("trk_hood", bm, ["trk_velvet"])
so = hood.modifiers.new("thick", 'SOLIDIFY'); so.thickness = 0.04; so.offset = 1
# the opening, cut by an elliptical cylinder along the line of sight
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=96, radius1=1, radius2=1, depth=1)
for v in bm.verts: v.co.x, v.co.y, v.co.z = v.co.x*OPEN_RX + FACE_CX, -v.co.z*0.5 - 0.25, v.co.y*OPEN_RZ + FACE_CZ
cutter = put("trk_cutter", bm, [])
cutter.hide_render = True; cutter.display_type = 'WIRE'
bo = hood.modifiers.new("open", 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cutter; bo.solver = 'EXACT'
# gold piping round the edge of the opening, sitting on the hood's surface
cu = bpy.data.curves.get("trk_piping") or bpy.data.curves.new("trk_piping", 'CURVE')
cu.dimensions = '3D'; cu.splines.clear(); cu.bevel_depth = 0.012; cu.bevel_resolution = 4
sp = cu.splines.new('POLY'); n = 96; sp.points.add(n - 1)
for k in range(n):
    t = 2*math.pi*k/n; x = OPEN_RX*math.cos(t) + FACE_CX; z = OPEN_RZ*math.sin(t) + FACE_CZ
    q = 1 - (x/HX)**2 - ((z - HCZ)/HZ)**2
    y = HCY - HY*math.sqrt(max(0.0, q)) - 0.025
    sp.points[k].co = (x, y, z, 1)
sp.use_cyclic_u = True
pip = bpy.data.objects.get("trk_piping") or bpy.data.objects.new("trk_piping", cu)
pip.data = cu
if pip.name not in sc.collection.objects: sc.collection.objects.link(pip)
cu.materials.clear(); cu.materials.append(bpy.data.materials["trk_gold"])
# the dark inside the hood, behind the face
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
for v in bm.verts: v.co.x *= 0.29; v.co.y = v.co.y*0.2 + 0.14; v.co.z = v.co.z*0.36 + 1.5
put("trk_void", bm, ["trk_void"])
# the clasp at the throat, where the capelet closes
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.045, radius2=0.038, depth=0.03)
for v in bm.verts: v.co.y, v.co.z = v.co.z - 0.17, v.co.y + 1.2
put("trk_clasp", bm, ["trk_gold"])

# ── camera and light ───────────────────────────────────────────────────────
cd = bpy.data.cameras.get("trk_cam") or bpy.data.cameras.new("trk_cam")
cd.type = 'ORTHO'; cd.ortho_scale = 1.5
cam = bpy.data.objects.get("trk_cam") or bpy.data.objects.new("trk_cam", cd)
if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
cam.location = (0, -6, 1.25); cam.rotation_euler = (math.radians(90), 0, 0)
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 600, 900, 100
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.quality = 88

def area(name, loc, target, energy, color, size):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, 'AREA')
    ld.energy = energy; ld.color = color; ld.size = size
    ob = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    ob.location = loc
    d = (target[0] - loc[0], target[1] - loc[1], target[2] - loc[2])
    import mathutils
    ob.rotation_euler = mathutils.Vector(d).to_track_quat('-Z', 'Y').to_euler()
    if ob.name not in sc.collection.objects: sc.collection.objects.link(ob)
area("trk_candles", (0.25, -1.4, 0.4), (0, 0, 1.3), 70, (1.0, 0.62, 0.3), 0.6)   # the table's candles, below and in front
area("trk_rim_l", (-1.1, 1.3, 2.1), (0, 0, 1.3), 160, (0.55, 0.65, 1.0), 0.8)       # the window, behind
area("trk_rim_r", (1.1, 1.2, 1.8), (0, 0, 1.3), 90, (1.0, 0.55, 0.35), 0.8)         # a candle behind, the other side
wd = bpy.data.worlds.get("trk_world") or bpy.data.worlds.new("trk_world")
wd.use_nodes = True; bg = wd.node_tree.nodes.get('Background')
if bg: bg.inputs['Color'].default_value = (0.02, 0.012, 0.012, 1); bg.inputs['Strength'].default_value = 1.0
sc.world = wd
sc.view_settings.exposure = -0.9

def apply_paint(brush=24):
    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.normpath(OUT))))
    g = {}
    exec(open(os.path.join(repo, "tools", "blender", "traitors-paint.py"), encoding="utf-8").read(), g)
    g["paint"](sc, brush=brush)
    # AgX turns a deep crimson brown: the cloak keeps its red
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'

if os.path.isdir(OUT) and RENDER:
    sc.cycles.samples = 128; sc.cycles.use_denoising = True
    apply_paint()
    sc.render.filepath = os.path.join(OUT, "cloak.webp")
    bpy.ops.render.render(write_still=True, scene=sc.name)

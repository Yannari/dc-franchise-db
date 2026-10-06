# Drag Race — the main stage (and its lip sync lighting), Untucked and the way out.
# The toon recipe is pm-firepit.py's; the glitter, lips and neon are dr-werkroom.py's.
# blender -b -P dr-sets.py -- <outdir> [mainstage lipsync untucked exit ...]
#
# Each set is drawn behind a wide, short stage panel (vp-dr/finale-stage.js
# .fsx-bg, background-size: cover), so the renders are 2.4:1 and keep what
# matters in the middle band.
import bpy, math, os, random, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'dr-werkroom.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def build():')], 'dr-werkroom', 'exec'))

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'
WHICH = argv[1:] or ['mainstage', 'lipsync', 'untucked', 'exit']


def leaf_mesh(length, width, lobes=0):
    """A flat cartoon leaf, tip up (pm-hut.py's)."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=4, y_subdivisions=14, size=1, location=(0, 0, 0))
    f = bpy.context.object
    for v in f.data.vertices:
        u = v.co.y + 0.5
        w = math.sin(math.pi * min(1.0, u * 1.05)) ** 0.7
        if lobes:
            w *= 0.72 + 0.28 * abs(math.sin(u * math.pi * lobes))
        v.co.x, v.co.y, v.co.z = v.co.x * width * w, 0, u * length
    return f


def shoot(name, cam_at, look_at, lens, res=(2400, 1000), world=(0.3, 0.2, 0.4), world_k=0.3):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (*world, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = world_k
    bpy.ops.object.camera_add(location=cam_at)
    cam = bpy.context.object; sc.camera = cam
    cam.rotation_euler = (Vector(look_at) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 64
    sc.view_settings.view_transform = 'Standard'
    sc.render.use_freestyle = True
    glow = bpy.data.collections.new('noink'); sc.collection.children.link(glow)
    for ob in NOINK:
        for c in list(ob.users_collection): c.objects.unlink(ob)
        glow.objects.link(ob)
        ob.visible_shadow = False
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 2.4
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new('ink')
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    ls.select_by_collection = True; ls.collection = glow; ls.collection_negation = 'EXCLUSIVE'
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = (0.16, 0.06, 0.14); ls.linestyle.thickness = 2.4
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 82
    sc.render.filepath = f'{OUT}/{name}.webp'
    bpy.ops.render.render(write_still=True)


def beam(loc, target, length, radius, m):
    """A spotlight's beam: a see-through cone from the lamp to the floor."""
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=radius, radius2=0.08, depth=length, location=(0, 0, 0))
    c = bpy.context.object
    d = Vector(target) - Vector(loc)
    c.location = Vector(loc) + d.normalized() * length / 2
    c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    assign(c, m); NOINK.append(c)
    return c


def glow_mat(name, color, alpha):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*color, 1); e.inputs['Strength'].default_value = 1.0
    t = nt.nodes.new('ShaderNodeBsdfTransparent')
    mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = alpha
    nt.links.new(t.outputs[0], mx.inputs[1]); nt.links.new(e.outputs[0], mx.inputs[2])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(mx.outputs[0], o.inputs[0])
    try: m.surface_render_method = 'BLENDED'
    except Exception: m.blend_method = 'BLEND'
    return m


def neon_curve(pts, loc, m, w=0.035, cyclic=False):
    cu = bpy.data.curves.new('neon', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = w; cu.bevel_resolution = 3
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1); sp.use_cyclic_u = cyclic
    for p, (u, v) in zip(sp.points, pts): p.co = (u, 0, v, 1)
    ob = bpy.data.objects.new('neon', cu); bpy.context.scene.collection.objects.link(ob)
    ob.location = loc; cu.materials.append(m); NOINK.append(ob)
    return ob


def flat_shape(pts, loc, side, m, bez=False):
    """A flat filled shape on a side wall, facing into the corridor."""
    cu = bpy.data.curves.new('art', 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    if bez:
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
        for bp, (u, v) in zip(sp.bezier_points, pts):
            bp.co = (u, v, 0); bp.handle_left_type = bp.handle_right_type = 'AUTO'
    else:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for p, (u, v) in zip(sp.points, pts): p.co = (u, v - 0.3, 0, 1)
    sp.use_cyclic_u = True
    ob = bpy.data.objects.new('art', cu); bpy.context.scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = (math.radians(90), 0, math.radians(-90 * side))
    cu.materials.append(m)
    return ob


def crown_pts(s):
    """A crown's outline: a band with five points, balls on the tips."""
    pts = [(-1.0, 0.0), (1.0, 0.0), (1.0, 0.25), (1.15, 1.0), (0.6, 0.55), (0.42, 1.25), (0.0, 0.62), (-0.42, 1.25), (-0.6, 0.55), (-1.15, 1.0), (-1.0, 0.25)]
    return [(u * s, v * s) for u, v in pts]


# ══ THE MAIN STAGE ═══════════════════════════════════════════════════
def main_stage(lipsync=False):
    reset()
    random.seed(31)
    NOINK.clear()
    sc = bpy.context.scene
    if lipsync:
        STEPS[0] = [(0.0, 0.14), (0.1, 0.4), (0.4, 0.85), (1.3, 1.25)]
        AMBIENT[0], AMBIENT[1] = 0.14, (1.0, 0.3, 0.6)
    else:
        STEPS[0] = [(0.0, 0.26), (0.12, 0.56), (0.45, 1.0), (1.3, 1.25)]
        AMBIENT[0], AMBIENT[1] = 0.22, (1.0, 0.6, 0.9)

    floor = mat('floor', (0.07, 0.03, 0.1))
    run = mat('runway', (0.05, 0.03, 0.08)); runtop = mat('runtop', (0.13, 0.07, 0.2))
    wall = mat('wall', (0.2, 0.04, 0.2)); wall2 = mat('wall2', (0.11, 0.03, 0.15))
    gold = mat('gold', (1.0, 0.76, 0.18)); gold2 = mat('gold2', (0.95, 0.62, 0.1))
    sequin = mat('sequin', (1.0, 0.82, 0.32))
    frame = mat('frame', (0.12, 0.08, 0.16)); truss = mat('truss', (0.55, 0.55, 0.62))
    desk = mat('desk', (0.1, 0.06, 0.14)); chair = mat('chair', (0.9, 0.16, 0.5))
    strip = emissive('strip', (1.0, 0.3, 0.75), 1.5)
    stripg = emissive('stripg', (1.0, 0.82, 0.4), 1.3)
    bulb = emissive('bulb', (1.0, 0.92, 0.7), 1.2)
    spark = emissive('spark', (1.0, 0.98, 0.85), 1.2)
    neon = emissive('crownneon', (1.0, 0.8, 0.3), 1.6)
    beamm = glow_mat('beam', (1.0, 0.75, 0.9) if lipsync else (1.0, 0.95, 0.85), 0.14 if lipsync else 0.045)

    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0)); assign(bpy.context.object, floor)
    BY = 9.0      # the back wall
    back = cube((30, 0.3, 14), (0, BY + 0.15, 7)); assign(back, wall)
    # the walls step forward either side of the arch, panel by panel, each with a light strip
    for side in (-1, 1):
        for k in range(5):
            x = side * (3.4 + k * 1.6)
            p = cube((1.4, 0.4, 9 - k * 0.6), (x, BY - 0.6 - k * 0.5, (9 - k * 0.6) / 2)); assign(p, wall2 if k % 2 else wall)
            s = cube((0.1, 0.06, 8 - k * 0.6), (x + side * 0.55, BY - 0.85 - k * 0.5, (8 - k * 0.6) / 2 + 0.2)); assign(s, strip if k % 2 == 0 else stripg); NOINK.append(s)
            # neon chevrons stacked up the panel
            for c in range(1):   # one chevron a panel: the wall is a backdrop, not the show
                z = 6.2 - k * 0.5
                neon_curve([(-0.45, -0.3), (0.0, 0.15), (0.45, -0.3)], (x - side * 0.05, BY - 0.82 - k * 0.5, z), strip if (k + c) % 2 else stripg, 0.04)

    # ── the entrance arch at the head of the runway: bulbs round a gold frame, a sequin curtain inside
    aw, ah = 2.6, 5.2
    def arch_pts(w, h, n=40):
        pts = [(-w / 2, 0)]
        for i in range(n + 1):
            a = math.pi - i * math.pi / n
            pts.append((math.cos(a) * w / 2, h - w / 2 + math.sin(a) * w / 2))
        pts.append((w / 2, 0))
        return pts
    # the frame: a thick gold arch
    cu = bpy.data.curves.new('arch', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.16; cu.bevel_resolution = 4
    sp = cu.splines.new('POLY'); P = arch_pts(aw + 0.35, ah + 0.18); sp.points.add(len(P) - 1)
    for p, (u, v) in zip(sp.points, P): p.co = (u, 0, v, 1)
    ao = bpy.data.objects.new('arch', cu); sc.collection.objects.link(ao); ao.location = (0, BY - 0.3, 0); cu.materials.append(gold)
    # the curtain: a filled arch in sequin gold, with vertical folds
    cu2 = bpy.data.curves.new('curt', 'CURVE'); cu2.dimensions = '2D'; cu2.fill_mode = 'BOTH'
    sp2 = cu2.splines.new('POLY'); P2 = arch_pts(aw, ah); sp2.points.add(len(P2) - 1); sp2.use_cyclic_u = True
    for p, (u, v) in zip(sp2.points, P2): p.co = (u, v, 0, 1)
    co = bpy.data.objects.new('curt', cu2); sc.collection.objects.link(co); co.location = (0, BY - 0.2, 0); co.rotation_euler.x = math.radians(90)
    cu2.materials.append(sequin)
    for i in range(9):
        f = cube((0.05, 0.02, ah - 1.6), (-1.1 + i * 0.275, BY - 0.24, (ah - 1.6) / 2)); assign(f, gold2)
    sparkles(0, BY - 0.27, 2.4, 2.2, 3.8, 26, spark)
    # bulbs round the arch
    for (u, v) in arch_pts(aw + 0.85, ah + 0.5, 30)[1:-1:1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=14, ring_count=8, location=(u, BY - 0.45, v)); assign(bpy.context.object, bulb)
    # a neon crown over the arch
    neon_curve(crown_pts(1.0), (0, BY - 0.4, ah + 0.95), neon, 0.06, cyclic=True)
    for u, v in [(-1.15, 1.0), (-0.42, 1.25), (0.42, 1.25), (1.15, 1.0)]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(u, BY - 0.4, ah + 0.95 + v)); assign(bpy.context.object, neon); NOINK.append(bpy.context.object)
    # a couple of steps down from the arch to the runway
    for k in range(3):
        st = cube((aw + 0.6 - k * 0.0, 0.5, 0.22), (0, BY - 0.6 - k * 0.5, 0.88 - k * 0.22)); assign(st, runtop)
        e = cube((aw + 0.6, 0.04, 0.04), (0, BY - 0.86 - k * 0.5, 0.97 - k * 0.22)); assign(e, strip); NOINK.append(e)

    # ── the runway: a long raised catwalk towards us, lit down both edges
    RL = 14
    r = cube((2.6, RL, 0.5), (0, BY - 1.8 - RL / 2, 0.25)); assign(r, run)
    t = cube((2.5, RL, 0.02), (0, BY - 1.8 - RL / 2, 0.51)); assign(t, runtop)
    for sx in (-1.3, 1.3):
        e = cube((0.07, RL, 0.07), (sx, BY - 1.8 - RL / 2, 0.5)); assign(e, strip); NOINK.append(e)
        for k in range(18):   # footlights along the side
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(sx * 1.04, BY - 2.3 - k * 0.75, 0.3)); assign(bpy.context.object, bulb)

    # ── the judges' panel, front right: a long desk with a lit front and five empty chairs
    dx, dy = 5.4, 0.2
    d = cube((5.0, 1.0, 1.0), (dx, dy, 0.5)); bevel(d, 0.05); assign(d, desk)
    df = cube((5.0, 0.04, 0.12), (dx, dy - 0.52, 0.86)); assign(df, gold)
    dfs = cube((4.8, 0.04, 0.08), (dx, dy - 0.53, 0.2)); assign(dfs, strip); NOINK.append(dfs)
    for k in range(5):
        cx = dx - 2.0 + k * 1.0
        c = cube((0.62, 0.15, 1.15), (cx, dy + 0.85, 1.25)); bevel(c, 0.12, 4); assign(c, chair)
        g = cube((0.66, 0.05, 0.05), (cx, dy + 0.76, 1.82)); assign(g, gold)
        # name plaques and glasses on the desk
        pl = cube((0.36, 0.06, 0.1), (cx, dy - 0.3, 1.05)); pl.rotation_euler.x = math.radians(-20); assign(pl, gold)

    # ── a lighting truss across the top, cans hanging off it
    tr = cube((22, 0.25, 0.25), (0, 2.0, 8.6)); assign(tr, truss)
    tr2 = cube((22, 0.25, 0.25), (0, 2.0, 8.2)); assign(tr2, truss)
    cans = []
    for k in range(9):
        x = -8 + k * 2.0
        c = cyl(0.22, 0.5, (x, 2.0, 7.7), 20); c.rotation_euler.x = math.radians(30); assign(c, frame)
        cans.append((x, 2.0, 7.6))

    # ── light
    if lipsync:
        bpy.ops.object.light_add(type='SUN', location=(0, -4, 6))
        key = bpy.context.object; key.data.energy = 0.9; key.data.color = (1.0, 0.4, 0.7)
        key.rotation_euler = (math.radians(50), 0, 0)
        for x, tx in ((-3.2, -0.9), (3.2, 0.9)):     # two spots, one on each queen's mark
            bpy.ops.object.light_add(type='SPOT', location=(x, 1.5, 7.6))
            s = bpy.context.object; s.data.energy = 3200; s.data.spot_size = math.radians(22); s.data.color = (1.0, 0.92, 0.96)
            s.rotation_euler = (Vector((tx, 2.5, 0.5)) - s.location).to_track_quat('-Z', 'Y').to_euler()
            beam((x, 1.5, 7.6), (tx, 2.5, 0.5), 7.4, 1.0, beamm)
        bpy.ops.object.light_add(type='POINT', location=(0, BY - 1.5, 3))
        p = bpy.context.object.data; p.energy = 1500; p.color = (1.0, 0.25, 0.55)
    else:
        bpy.ops.object.light_add(type='SUN', location=(0, -4, 6))
        key = bpy.context.object; key.data.energy = 1.5; key.data.color = (1.0, 0.92, 0.95)
        key.rotation_euler = (math.radians(52), 0, math.radians(-12))
        for (x, y, z) in cans[3:6:2]:
            beam((x, y, z), (x * 0.25, 3.5, 0.5), 7.5, 0.7, beamm)
        bpy.ops.object.light_add(type='POINT', location=(0, BY - 1.5, 3))
        p = bpy.context.object.data; p.energy = 900; p.color = (1.0, 0.75, 0.4)

    shoot('lipsync' if lipsync else 'mainstage', (0, -9.5, 2.6), (0, BY, 2.7), 24,
          world=(0.35, 0.05, 0.25) if lipsync else (0.4, 0.15, 0.4), world_k=0.1 if lipsync else 0.14)


# ══ UNTUCKED ════════════════════════════════════════════════════════
def untucked():
    reset()
    random.seed(41)
    NOINK.clear()
    sc = bpy.context.scene
    STEPS[0] = [(0.0, 0.26), (0.12, 0.58), (0.45, 1.0), (1.3, 1.25)]
    AMBIENT[0], AMBIENT[1] = 0.32, (0.85, 0.7, 1.0)

    wall = mat('wall', (0.32, 0.12, 0.5)); panel = mat('panel', (0.2, 0.07, 0.34))
    gold = mat('gold', (1.0, 0.76, 0.18)); carpet = mat('carpet', (0.12, 0.42, 0.45)); carpet2 = mat('carpet2', (0.08, 0.32, 0.36))
    velvet = mat('velvet', (0.95, 0.2, 0.52)); velvet2 = mat('velvet2', (0.1, 0.6, 0.62))
    table = mat('table', (0.98, 0.96, 0.98)); frame = mat('frame', (0.12, 0.08, 0.16))
    bar = mat('bar', (0.18, 0.08, 0.24)); bottles = [mat('b1', (0.2, 0.75, 0.4)), mat('b2', (0.9, 0.5, 0.1)), mat('b3', (0.4, 0.6, 1.0)), mat('b4', (0.95, 0.2, 0.3))]
    leaf = mat('leaf', (0.12, 0.6, 0.35)); pot = mat('pot', (1.0, 0.76, 0.18))
    drinks = [mat('d1', (1.0, 0.35, 0.6)), mat('d2', (0.3, 0.85, 1.0)), mat('d3', (1.0, 0.82, 0.2))]
    glassm = mat('glass', (0.85, 0.92, 1.0))
    neon_p = emissive('neonp', (1.0, 0.35, 0.78), 1.6); neon_t = emissive('neont', (0.4, 0.95, 1.0), 1.4)
    shelfl = emissive('shelfl', (1.0, 0.85, 0.55), 1.2); bulb = emissive('bulb', (1.0, 0.92, 0.7), 1.2)
    spark = emissive('spark', (1.0, 0.98, 0.85), 1.2)

    bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 0, 0)); assign(bpy.context.object, carpet)
    for i in range(-10, 11):           # a big diamond carpet
        for j in range(-8, 6):
            if (i + j) % 2 == 0:
                t = cube((0.7, 0.7, 0.004), (i * 1.0, j * 1.0, 0.003)); t.rotation_euler.z = math.radians(45); assign(t, carpet2)
    BY = 4.0
    back = cube((24, 0.2, 8), (0, BY + 0.1, 4)); assign(back, wall)
    # art deco panels: gold fans on dark panels along the wall
    for k in range(-4, 5):
        x = k * 2.2
        if abs(x) < 2.0: continue
        p = cube((1.8, 0.06, 3.6), (x, BY - 0.02, 2.6)); assign(p, panel)
        for f in range(5):
            a = math.radians(30 + f * 30)
            l = cube((0.04, 0.02, 1.2), (x + math.cos(a) * 0.6, BY - 0.07, 3.3 + math.sin(a) * 0.6 - 0.6)); l.rotation_euler.y = -(a - math.pi / 2); assign(l, gold)
        b = cube((1.9, 0.08, 0.08), (x, BY - 0.06, 0.82)); assign(b, gold)
    # the sign, centre: a neon cocktail glass and the lounge's name
    bd = cube((3.8, 0.08, 2.6), (0, BY - 0.04, 3.1)); bevel(bd, 0.25, 6); assign(bd, frame)
    neon_text('UNTUCKED', (0, BY - 0.12, 2.35), 0.62, neon_p, extrude=0.02)
    neon_curve([(-0.5, 0.5), (0.5, 0.5), (0.0, -0.05), (-0.5, 0.5)], (0, BY - 0.12, 3.55), neon_t, 0.03)
    neon_curve([(0.0, -0.05), (0.0, -0.45)], (0, BY - 0.12, 3.55), neon_t, 0.03)
    neon_curve([(-0.28, -0.45), (0.28, -0.45)], (0, BY - 0.12, 3.55), neon_t, 0.03)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0.32, BY - 0.12, 3.95)); assign(bpy.context.object, neon_p); NOINK.append(bpy.context.object)
    sparkles(0, BY - 0.1, 3.1, 3.4, 2.2, 10, spark, avoid=(0, 2.35, 1.5, 0.45))

    # ── two velvet couches facing each other at an angle, a low table between
    def couch(x, rot, m):
        parts = []
        s = cube((2.6, 0.95, 0.42), (x, 0, 0.42)); bevel(s, 0.12, 4); parts.append(s)
        bk = cube((2.6, 0.3, 0.95), (x, 0.42, 0.95)); bevel(bk, 0.14, 4); parts.append(bk)
        for e in (-1, 1):
            a = cube((0.3, 0.95, 0.65), (x + e * 1.3, 0, 0.62)); bevel(a, 0.12, 4); parts.append(a)
        for k in range(3):    # buttons on the back: tufted velvet
            for r in range(2):
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(x - 0.8 + k * 0.8, 0.26, 0.9 + r * 0.32)); parts.append(bpy.context.object)
        for ob in parts: assign(ob, m)
        bpy.ops.object.select_all(action='DESELECT')
        for ob in parts: ob.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.context.scene.cursor.location = (x, 0, 0)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        for ob in parts: ob.rotation_euler.z = math.radians(rot); ob.location.y += 1.6
    couch(-3.2, -22, velvet)
    couch(3.2, 22, velvet2)
    ct = cyl(0.8, 0.08, (0, 0.4, 0.48), 48); assign(ct, table); bevel(ct, 0.02)
    cl = cyl(0.12, 0.45, (0, 0.4, 0.22), 16); assign(cl, gold)
    for k, (u, v) in enumerate([(-0.35, 0.2), (0.0, 0.55), (0.35, 0.25), (0.15, -0.1)]):
        g = cyl(0.07, 0.2, (u, 0.4 + v, 0.62), 20); assign(g, glassm)
        li = cyl(0.062, 0.12, (u, 0.4 + v, 0.6), 20); assign(li, drinks[k % 3])
        st = cyl(0.01, 0.3, (u + 0.03, 0.4 + v, 0.76), 6); st.rotation_euler.y = math.radians(12); assign(st, drinks[(k + 1) % 3])

    # ── the bar, right: a counter and lit shelves of bottles
    bx = 7.6
    bc = cube((3.0, 0.9, 1.15), (bx, 1.6, 0.58)); bevel(bc, 0.04); assign(bc, bar)
    bt = cube((3.1, 1.0, 0.07), (bx, 1.6, 1.18)); assign(bt, gold)
    for r in range(3):
        sh = cube((3.0, 0.3, 0.05), (bx, BY - 0.2, 1.6 + r * 0.6)); assign(sh, shelfl); NOINK.append(sh)
        for k in range(9):
            b = cyl(0.07, random.uniform(0.3, 0.42), (bx - 1.3 + k * 0.32, BY - 0.2, 1.8 + r * 0.6), 14); assign(b, bottles[(k + r) % 4])
    # ── the left: a big palm in a gold pot
    pt = cyl(0.35, 0.6, (-7.2, 2.2, 0.3), 32); assign(pt, pot)
    for k in range(10):
        f = leaf_mesh(random.uniform(1.0, 1.6), random.uniform(0.32, 0.46))
        f.location = (-7.2, 2.2, 0.55)
        f.rotation_euler = (math.radians(random.uniform(-35, 35)), math.radians(-70 + k * 15), math.radians(random.uniform(-50, 50)))
        md = f.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.02
        assign(f, leaf)
    # ── a chandelier over the table
    for k in range(12):
        a = k / 12 * math.tau
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=12, ring_count=8, location=(math.cos(a) * 0.7, 0.8 + math.sin(a) * 0.35, 4.3 - (k % 2) * 0.15)); assign(bpy.context.object, bulb)
    ring_ = cyl(0.75, 0.06, (0, 0.8, 4.45), 48); ring_.scale = (1, 0.5, 1); assign(ring_, gold)

    bpy.ops.object.light_add(type='SUN', location=(0, -4, 6))
    key = bpy.context.object; key.data.energy = 2.0; key.data.color = (1.0, 0.85, 0.95)
    key.rotation_euler = (math.radians(55), 0, math.radians(15))
    bpy.ops.object.light_add(type='POINT', location=(0, 0.8, 4.6))
    p = bpy.context.object.data; p.energy = 500; p.color = (1.0, 0.8, 0.5)
    bpy.ops.object.light_add(type='POINT', location=(bx, BY - 1.0, 2.5))
    p = bpy.context.object.data; p.energy = 300; p.color = (1.0, 0.7, 0.4)
    shoot('untucked', (0, -7.8, 2.3), (0, BY, 2.4), 24, world=(0.4, 0.25, 0.55), world_k=0.3)


# ══ THE WAY OUT ═════════════════════════════════════════════════════
def way_out():
    reset()
    random.seed(53)
    NOINK.clear()
    STEPS[0] = [(0.0, 0.16), (0.1, 0.42), (0.4, 0.88), (1.3, 1.25)]
    AMBIENT[0], AMBIENT[1] = 0.16, (0.7, 0.4, 0.9)
    wall = mat('wall', (0.3, 0.1, 0.36)); wall2 = mat('wall2', (0.22, 0.07, 0.28))
    floor = mat('floor', (0.12, 0.06, 0.16)); runner = mat('runner', (0.75, 0.08, 0.32))
    frame = mat('frame', (0.1, 0.06, 0.12)); gold = mat('gold', (1.0, 0.76, 0.18))
    door = mat('door', (0.9, 0.86, 0.95))
    light = emissive('doorlight', (1.0, 0.94, 0.82), 1.6)
    exitm = emissive('exit', (1.0, 0.15, 0.25), 1.4)
    strip = emissive('strip', (1.0, 0.3, 0.75), 1.3)
    lip = emissive('lipred', (0.86, 0.04, 0.16), 1.0)
    lipk = mat('lipk', (0.95, 0.08, 0.35))
    posters = [mat('p1', (1.0, 0.4, 0.7)), mat('p2', (0.4, 0.8, 1.0)), mat('p3', (1.0, 0.82, 0.3)), mat('p4', (0.6, 0.35, 1.0))]
    wigs_ = [mat('w1', (1.0, 0.85, 0.3)), mat('w2', (0.25, 0.1, 0.06)), mat('w3', (0.95, 0.25, 0.55)), mat('w4', (0.96, 0.96, 0.96))]
    skin_ = [mat('s1', (0.98, 0.8, 0.66)), mat('s2', (0.62, 0.4, 0.26)), mat('s3', (0.86, 0.62, 0.45))]
    L = 16
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0)); assign(bpy.context.object, floor)
    rn = cube((1.4, L, 0.01), (0, L / 2 - 2, 0.006)); assign(rn, runner)
    for side in (-1, 1):
        w = cube((0.2, L, 4.2), (side * 1.9, L / 2 - 2, 2.1)); assign(w, wall)
        s = cube((0.04, L, 0.06), (side * 1.78, L / 2 - 2, 3.6)); assign(s, strip); NOINK.append(s)
        for k in range(5):     # framed photos of the season's queens, down the walls
            y = 0.5 + k * 2.6
            fr = cube((0.06, 1.0, 1.3), (side * 1.77, y, 2.1)); assign(fr, gold)
            pc = cube((0.04, 0.82, 1.1), (side * 1.74, y, 2.1)); assign(pc, posters[(k + (side > 0)) % 4])
            # pop-art prints: a gold crown, or a lipstick kiss
            art = (crown_pts(0.32) if (k + (side > 0)) % 2 == 0 else
                   [(-0.36, 0.0), (-0.2, 0.17), (-0.08, 0.2), (0.0, 0.14), (0.08, 0.2), (0.2, 0.17), (0.36, 0.0), (0.2, -0.19), (0.0, -0.24), (-0.2, -0.19)])
            kiss = (k + (side > 0)) % 2 == 1
            flat_shape(art, (side * 1.71, y, 1.95 if not kiss else 2.1), side, gold if not kiss else lipk, bez=kiss)
        ceil = cube((4, L, 0.2), (0, L / 2 - 2, 4.3)); assign(ceil, wall2)
    end = cube((4, 0.2, 4.4), (0, L - 2, 2.2)); assign(end, wall2)
    # the door at the end, open, light pouring through
    df = cube((1.5, 0.12, 2.6), (0, L - 2.1, 1.3)); assign(df, frame)
    dl = cube((1.25, 0.05, 2.4), (0, L - 2.2, 1.2)); assign(dl, light); NOINK.append(dl)
    leaf_ = cube((0.08, 1.2, 2.4), (0.62, L - 2.75, 1.2)); leaf_.rotation_euler.z = math.radians(-25); assign(leaf_, door)
    sign = cube((0.8, 0.08, 0.28), (0, L - 2.15, 2.9)); assign(sign, exitm); NOINK.append(sign)
    bpy.ops.object.light_add(type='SPOT', location=(0, L - 2.6, 1.6))
    s = bpy.context.object; s.data.energy = 900; s.data.spot_size = math.radians(80); s.data.color = (1.0, 0.9, 0.8)
    s.rotation_euler = (Vector((0, 0, 0)) - s.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.light_add(type='SUN', location=(0, -3, 3))
    k_ = bpy.context.object; k_.data.energy = 1.1; k_.data.color = (1.0, 0.6, 0.9); k_.rotation_euler = (math.radians(75), 0, 0)
    for k in range(3):        # ceiling cans down the far end of the corridor
        bpy.ops.object.light_add(type='POINT', location=(0, 5 + k * 3.2, 3.9))
        p = bpy.context.object.data; p.energy = 40; p.color = (1.0, 0.5, 0.8)
    # a lipstick kiss on the wall by the door: the last goodbye
    lipstick_message(-1.2, L - 2.2, 1.7, lip)
    shoot('exit', (0, -3.5, 1.7), (0, L, 1.5), 22, world=(0.15, 0.05, 0.2), world_k=0.2)


for w in WHICH:
    {'mainstage': lambda: main_stage(False), 'lipsync': lambda: main_stage(True), 'untucked': untucked, 'exit': way_out}[w]()

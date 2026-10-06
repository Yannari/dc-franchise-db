# Perfect Match — the beach hut (the confessional), in the avatars' style.
# The toon materials, ink and helpers are pm-firepit.py's.
# blender -b -P pm-hut.py -- <outdir>
#
# The stage sits one islander in the middle, a quarter of the width, the
# bust's base 30% up (vp-pm/style.js `.pmv-sc-hut ~ .pmv-busts`): the
# peacock chair's fan is centred there, so it frames whoever is talking.
import bpy, math, os, random, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'pm-firepit.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def build(mood):')], 'pm-firepit', 'exec'))

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'


def leaf_mesh(length, width, lobes=0):
    """A flat cartoon leaf in the XZ plane, tip up: a tapered blade, or a monstera's lobed one."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=4, y_subdivisions=14, size=1, location=(0, 0, 0))
    f = bpy.context.object
    for v in f.data.vertices:
        u = v.co.y + 0.5                    # 0 at the stem, 1 at the tip
        w = math.sin(math.pi * min(1.0, u * 1.05)) ** 0.7
        if lobes:
            w *= 0.72 + 0.28 * abs(math.sin(u * math.pi * lobes))
        x = v.co.x * width * w
        v.co.x, v.co.y, v.co.z = x, 0, u * length
    return f


def build_hut():
    reset()
    random.seed(11)
    NOINK.clear()
    sc = bpy.context.scene
    STEPS[0] = [(0.0, 0.3), (0.12, 0.62), (0.45, 1.0), (1.3, 1.25)]
    AMBIENT[0], AMBIENT[1] = 0.38, (1.0, 0.82, 0.9)

    coral = mat('coral', (1.0, 0.42, 0.42))
    coral2 = mat('coral2', (1.0, 0.56, 0.4))
    leafa = mat('leafa', (0.08, 0.66, 0.55)); leafb = mat('leafb', (0.1, 0.5, 0.36)); leafc = mat('leafc', (1.0, 0.75, 0.35))
    cane = mat('cane', (0.86, 0.62, 0.32)); cane2 = mat('cane2', (0.7, 0.46, 0.22))
    pink = mat('pinkcushion', (1.0, 0.16, 0.48)); white = mat('cushion', (0.98, 0.95, 0.92))
    floor = mat('floor', (0.94, 0.78, 0.6))
    pot = mat('pot', (0.98, 0.93, 0.86))
    shade = mat('shade', (1.0, 0.86, 0.6))
    neon = emissive('neon', (1.0, 0.2, 0.58), 1.3)
    bulb = emissive('bulb', (1.0, 0.88, 0.6), 1.15)

    # ── the room: a back wall in coral, the floor, a corner either side
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0)); assign(bpy.context.object, floor)
    wall = cube((12, 0.2, 7), (0, 2.1, 3.5)); assign(wall, coral)
    for x in (-4.6, 4.6):
        side = cube((0.2, 6, 7), (x, -0.9, 3.5)); assign(side, coral2)
    # a skirting board, so the wall stands on something
    sk = cube((12, 0.12, 0.18), (0, 1.96, 0.09)); assign(sk, cane2)

    # ── the wallpaper: big tropical leaves, flat on the wall, the hut's print
    for i in range(130):
        x = random.uniform(-4.4, 4.4); z = random.uniform(0.2, 5.6)
        # keep the chair's middle a little clearer, so the islander reads
        if abs(x) < 1.2 and 1.0 < z < 3.6 and random.random() < 0.7:
            continue
        # …and the neon heart's corner
        if abs(x - 2.5) < 0.9 and abs(z - 3.5) < 0.8:
            continue
        kind = random.random()
        f = leaf_mesh(random.uniform(0.38, 0.62), random.uniform(0.22, 0.36), lobes=3 if kind < 0.35 else 0)
        # each leaf at its own depth: two at one depth flicker through each other
        f.location = (x, 1.985 - i * 0.0012, z)
        f.rotation_euler = (0, random.uniform(-2.4, 2.4), 0)
        assign(f, leafa if kind < 0.35 else leafb if kind < 0.75 else leafc)

    # ── the peacock chair: a fan of cane spokes in a rim, a round seat, a flared base
    cx, cy, cz = 0, 1.15, 0.95          # the fan's hub, behind the seat
    R = 1.55
    for k in range(25):
        a = math.radians(-8 + k * (196 / 24))
        tip = Vector((cx + math.cos(a) * R, cy, cz + math.sin(a) * R))
        mid = (Vector((cx, cy, cz)) + tip) / 2
        sp = cyl(0.035, R, mid, 10)
        sp.rotation_euler = (0, -a + math.pi / 2, 0)
        assign(sp, cane if k % 2 else cane2)
    # the woven panel between the spokes, and the rim round it
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=R, fill_type='TRIFAN', location=(cx, cy + 0.06, cz))
    panel = bpy.context.object; panel.rotation_euler.x = math.radians(90); assign(panel, cane2)
    cutp = cube((4, 1, 2), (cx, cy + 0.06, cz - 1.0 - 0.15)); boolean(panel, cutp)
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.08, major_segments=96, minor_segments=10, location=(cx, cy - 0.02, cz))
    rim = bpy.context.object; rim.rotation_euler.x = math.radians(90); assign(rim, cane)
    cutr = cube((4, 1, 2), (cx, cy - 0.02, cz - 1.0 - 0.15)); boolean(rim, cutr)
    # inner rings of the weave
    for r in (0.55, 1.05):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.04, major_segments=72, minor_segments=8, location=(cx, cy - 0.03, cz))
        ir = bpy.context.object; ir.rotation_euler.x = math.radians(90); assign(ir, cane)
        c2 = cube((4, 1, 2), (cx, cy - 0.03, cz - 1.0 - 0.15)); boolean(ir, c2)
    seat = cyl(0.62, 0.22, (cx, 0.75, 0.62), 64); assign(seat, cane); bevel(seat, 0.05)
    cush = cyl(0.56, 0.16, (cx, 0.72, 0.8), 64); assign(cush, pink); bevel(cush, 0.06, 4)
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.62, radius2=0.22, depth=0.52, location=(cx, 0.75, 0.26))
    base = bpy.context.object; assign(base, cane2)
    # two pillows against the fan
    for sx, m in ((-0.45, white), (0.45, pink)):
        p = cube((0.5, 0.16, 0.42), (cx + sx, 0.98, 1.1)); p.rotation_euler = (math.radians(-14), 0, math.radians(-sx * 30)); bevel(p, 0.07, 4); assign(p, m)

    # ── a side table and lamp (left), a potted palm (right)
    t = cyl(0.36, 0.06, (-2.3, 0.9, 0.95), 48); assign(t, white); bevel(t, 0.02)
    leg = cyl(0.05, 0.92, (-2.3, 0.9, 0.48), 12); assign(leg, cane2)
    lb = cyl(0.12, 0.4, (-2.3, 0.9, 1.18), 24); assign(lb, pot)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.34, radius2=0.2, depth=0.36, location=(-2.3, 0.9, 1.55))
    sh = bpy.context.object; assign(sh, shade)
    bpy.ops.object.light_add(type='POINT', location=(-2.3, 0.75, 1.5))
    ll = bpy.context.object.data; ll.color = (1.0, 0.75, 0.45); ll.energy = 60; ll.shadow_soft_size = 0.05
    pt = cyl(0.32, 0.55, (2.4, 0.9, 0.28), 32); assign(pt, pot); bevel(pt, 0.03)
    for k in range(9):
        f = leaf_mesh(random.uniform(0.9, 1.4), random.uniform(0.3, 0.45))
        f.location = (2.4, 0.9, 0.5)
        f.rotation_euler = (math.radians(random.uniform(-35, 35)), math.radians(-60 + k * 15), math.radians(random.uniform(-40, 40)))
        md = f.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.02
        assign(f, leafa if k % 2 else leafb)

    # ── a neon heart up on the wall (right), fairy lights along the top
    heart = bpy.data.curves.new('heart', 'CURVE'); heart.dimensions = '3D'; heart.bevel_depth = 0.035; heart.bevel_resolution = 3
    hs = heart.splines.new('POLY')
    pts = [(16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
           for t in [i / 80 * 2 * math.pi for i in range(81)]]
    hs.points.add(len(pts) - 1)
    for p, (x, y) in zip(hs.points, pts): p.co = (x * 0.04, 0, y * 0.04, 1)
    ho = bpy.data.objects.new('heart', heart); sc.collection.objects.link(ho); ho.location = (2.5, 1.9, 3.6); heart.materials.append(neon)
    NOINK.append(ho)
    bpy.ops.object.light_add(type='POINT', location=(2.5, 1.5, 3.6))
    nl = bpy.context.object.data; nl.color = (1.0, 0.3, 0.65); nl.energy = 25; nl.shadow_soft_size = 0.05
    for i in range(23):
        x = -4.4 + i * 0.4; z = 5.35 - math.sin(i / 22 * math.pi * 3) ** 2 * 0.25
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(x, 1.9, z)); assign(bpy.context.object, bulb)

    # ── light: a warm key from the front left (the hut's camera light), a pink rim from the right
    bpy.ops.object.light_add(type='SUN', location=(0, -3, 4))
    key = bpy.context.object; key.data.energy = 2.4; key.data.color = (1.0, 0.9, 0.78)
    key.rotation_euler = (math.radians(62), 0, math.radians(-28)); key.data.angle = math.radians(0.3)
    bpy.ops.object.light_add(type='AREA', location=(3.6, -0.4, 3.2))
    rim2 = bpy.context.object; rim2.data.energy = 220; rim2.data.color = (1.0, 0.45, 0.75); rim2.data.size = 1.5
    rim2.rotation_euler = (math.radians(70), 0, math.radians(110))

    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (1.0, 0.7, 0.75, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

    # ── camera: straight on, the chair's fan in the middle of the frame
    bpy.ops.object.camera_add(location=(0, -5.6, 1.8))
    cam = bpy.context.object; sc.camera = cam
    d = Vector((0, 2.0, 1.7)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 28

    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 64
    sc.view_settings.view_transform = 'Standard'
    sc.render.use_freestyle = True
    glow = bpy.data.collections.new('noink'); sc.collection.children.link(glow)
    for ob in NOINK:
        for c in list(ob.users_collection): c.objects.unlink(ob)
        glow.objects.link(ob)
        ob.visible_shadow = False
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 2.2
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new('ink')
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    ls.select_by_collection = True; ls.collection = glow; ls.collection_negation = 'EXCLUSIVE'
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = (0.16, 0.06, 0.14); ls.linestyle.thickness = 2.2
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1104
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 82
    sc.render.filepath = f'{OUT}/hut.webp'
    bpy.ops.render.render(write_still=True)


build_hut()

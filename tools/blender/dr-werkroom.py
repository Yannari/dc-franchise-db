# Drag Race — the werk room, in the avatars' style (the toon recipe is pm-firepit.py's).
# blender -b -P dr-werkroom.py -- <outdir>   (2400x1000: the stage panels are wide and short, see dr-sets.py)
#
# Straight on to the wall of mirror stations, one per queen, bulbs round
# every mirror; sewing tables in the middle, racks and dress forms either
# side, the neon sign over the stations. The stage draws the queens in
# front of the counter (vp-dr/room-stage.js), so the mirrors sit in the
# upper half and the floor stays clear.
import bpy, math, os, random, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'pm-firepit.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def build(mood):')], 'pm-firepit', 'exec'))

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'


def neon_text(body, loc, size, m, extrude=0.03):
    bpy.ops.object.text_add(location=loc)
    t = bpy.context.object
    t.data.body = body; t.data.size = size; t.data.extrude = extrude
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.rotation_euler.x = math.radians(90)
    t.data.materials.append(m)
    NOINK.append(t)
    return t


def station(x, y, top, mats):
    """A vanity: counter, a mirror with a bulb frame, a stool, a wig head and bits on the counter."""
    counter, glass, frame, bulb, stool, legm, skin, wig, bits = mats[:9]
    c = cube((1.5, 0.62, 0.1), (x, y - 0.31, top)); assign(c, counter); bevel(c, 0.02)
    front = cube((1.5, 0.05, top - 0.05), (x, y - 0.6, (top - 0.05) / 2)); assign(front, frame)
    fr = cube((1.22, 0.06, 1.3), (x, y - 0.02, top + 0.95)); assign(fr, frame); bevel(fr, 0.02)
    g = cube((1.0, 0.02, 1.08), (x, y - 0.06, top + 0.95)); assign(g, glass)
    # the cartoon glint: two white slashes across the glass
    for dx, w in ((-0.18, 0.09), (0.0, 0.04)):
        sl = cube((w, 0.01, 0.9), (x + dx, y - 0.075, top + 0.95)); sl.rotation_euler.y = math.radians(-32); assign(sl, mats[9])
    for i in range(5):                                   # bulbs across the top
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=14, ring_count=8, location=(x - 0.48 + i * 0.24, y - 0.08, top + 1.6))
        assign(bpy.context.object, bulb)
    for side in (-1, 1):                                 # and down both sides
        for k in range(4):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=14, ring_count=8, location=(x + side * 0.61, y - 0.08, top + 0.45 + k * 0.33))
            assign(bpy.context.object, bulb)
    s = cyl(0.26, 0.12, (x, y - 1.05, 0.72), 40); assign(s, stool); bevel(s, 0.04, 3)
    p = cyl(0.04, 0.66, (x, y - 1.05, 0.33), 10); assign(p, legm)
    b = cyl(0.24, 0.04, (x, y - 1.05, 0.02), 32); assign(b, legm)
    # a wig head on the counter, and a couple of things a queen leaves out
    side = 1 if random.random() < 0.5 else -1
    hx = x + side * 0.5
    st = cyl(0.04, 0.18, (hx, y - 0.25, top + 0.14), 10); assign(st, legm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=24, ring_count=16, location=(hx, y - 0.25, top + 0.34)); assign(bpy.context.object, skin)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, segments=24, ring_count=16, location=(hx, y - 0.21, top + 0.41))
    hair = bpy.context.object; hair.scale = (1, 1, 1.25); assign(hair, wig)
    for k in range(3):
        bx = x - side * (0.2 + k * 0.14)
        jar = cyl(0.045, random.uniform(0.08, 0.2), (bx, y - 0.35, top + 0.1), 16); assign(jar, bits[k % len(bits)])


def rack(x, y, rot, garments, metal):
    """A rolling rail with garments hanging off it, seen side on."""
    root = []
    rail = cyl(0.025, 1.6, (x, y, 1.85), 12); rail.rotation_euler = (0, math.radians(90), 0); root.append(rail)
    for dx in (-0.78, 0.78):
        up = cyl(0.025, 1.85, (x + dx, y, 0.93), 12); root.append(up)
        foot = cyl(0.02, 0.6, (x + dx, y, 0.06), 10); foot.rotation_euler = (math.radians(90), 0, 0); root.append(foot)
    for ob in root: assign(ob, metal)
    for k in range(9):
        gx = x - 0.7 + k * 0.17
        gm = garments[k % len(garments)]
        long = random.random() < 0.45
        h = random.uniform(1.1, 1.45) if long else random.uniform(0.6, 0.85)
        g = cube((0.06, 0.55, h), (gx, y, 1.82 - h / 2)); bevel(g, 0.025, 3); assign(g, gm)
        g.rotation_euler.x = math.radians(random.uniform(-4, 4))
        root.append(g)
    for ob in root:
        ob.rotation_euler.z += 0
    # rotate the whole rack about its own spot
    bpy.ops.object.select_all(action='DESELECT')
    for ob in root: ob.select_set(True)
    bpy.context.view_layer.objects.active = root[0]
    bpy.context.scene.cursor.location = (x, y, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for ob in root: ob.rotation_euler.z = math.radians(rot)
    return root


def dress_form(x, y, body, skirt, pole):
    t = cyl(0.2, 0.62, (x, y, 1.42), 32); t.scale = (1, 0.7, 1); assign(t, body); bevel(t, 0.08, 4)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, segments=24, ring_count=12, location=(x, y, 1.72))
    sh = bpy.context.object; sh.scale = (1.15, 0.72, 0.45); assign(sh, body)
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=0.48, radius2=0.2, depth=0.75, location=(x, y, 0.82))
    assign(bpy.context.object, skirt)
    p = cyl(0.03, 0.45, (x, y, 0.22), 10); assign(p, pole)
    b = cyl(0.2, 0.04, (x, y, 0.02), 24); assign(b, pole)
    k = cyl(0.04, 0.12, (x, y, 1.97), 12); assign(k, pole)


def lipstick_message(x, y, z, m):
    """A goodbye in lipstick: a heart and two scrawled lines across the glass."""
    def stroke(pts, w=0.022):
        cu = bpy.data.curves.new('lip', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = w; cu.bevel_resolution = 2
        sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1); sp.order_u = 3; sp.use_endpoint_u = True
        for p, (u, v) in zip(sp.points, pts): p.co = (x + u, y, z + v, 1)
        ob = bpy.data.objects.new('lip', cu); bpy.context.scene.collection.objects.link(ob); cu.materials.append(m); NOINK.append(ob)
    hp = [(16 * math.sin(t) ** 3 * 0.011, (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * 0.011 + 0.28)
          for t in [i / 40 * 2 * math.pi for i in range(41)]]
    stroke(hp)
    for row, z0 in enumerate((-0.05, -0.26)):
        n = 9
        stroke([(-0.38 + i * 0.095, z0 + (0.05 if i % 2 else -0.03) * (1 if row == 0 else 0.8)) for i in range(n)], 0.018)


def lips(x, y, z, s, fill, line):
    """A big glossy pair of lips: the screen's picture."""
    def shape(pts, m, zoff=0):
        cu = bpy.data.curves.new('lips', 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1); sp.use_cyclic_u = True
        for bp, (u, v) in zip(sp.bezier_points, pts):
            bp.co = (u * s, v * s, 0); bp.handle_left_type = bp.handle_right_type = 'AUTO'
        ob = bpy.data.objects.new('lips', cu); bpy.context.scene.collection.objects.link(ob)
        ob.location = (x, y - zoff, z); ob.rotation_euler.x = math.radians(90); cu.materials.append(m); NOINK.append(ob)
        return ob
    shape([(-1, 0), (-0.55, 0.38), (-0.22, 0.46), (0, 0.32), (0.22, 0.46), (0.55, 0.38), (1, 0), (0.55, -0.42), (0, -0.55), (-0.55, -0.42)], fill)
    shape([(-0.92, 0.0), (-0.45, 0.06), (0, 0.0), (0.45, 0.06), (0.92, 0.0), (0.45, -0.04), (0, -0.07), (-0.45, -0.04)], line, 0.01)
    shape([(-0.42, -0.2), (-0.2, -0.16), (-0.05, -0.22), (-0.22, -0.3)], bpy.data.materials['spark'], 0.01)


def sparkles(x, y, z, w, h, n, m, avoid=None):
    """Four-point glitter stars scattered over a patch of wall."""
    for i in range(n):
        u = random.uniform(-w / 2, w / 2); v = random.uniform(-h / 2, h / 2)
        if avoid and abs(x + u - avoid[0]) < avoid[2] and abs(z + v - avoid[1]) < avoid[3]:
            continue
        r = random.uniform(0.05, 0.12)
        cu = bpy.data.curves.new('sp', 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
        sp = cu.splines.new('POLY'); pts = []
        for k in range(8):
            a = k * math.pi / 4; rr = r if k % 2 == 0 else r * 0.22
            pts.append((math.cos(a) * rr, math.sin(a) * rr))
        sp.points.add(7); sp.use_cyclic_u = True
        for p, (a_, b_) in zip(sp.points, pts): p.co = (a_, b_, 0, 1)
        ob = bpy.data.objects.new('sp', cu); bpy.context.scene.collection.objects.link(ob)
        ob.location = (x + u, y, z + v); ob.rotation_euler.x = math.radians(90); cu.materials.append(m); NOINK.append(ob)


def cubbies(x, y, rot, mats, frame_m):
    """A shelving unit of cubbies, a bolt of fabric end-on in each."""
    parts = []
    body = cube((1.9, 0.5, 2.5), (x, y, 1.25)); parts.append((body, frame_m))
    for r in range(4):
        for c in range(3):
            cx = x - 0.6 + c * 0.6; cz = 0.38 + r * 0.6
            for k in range(2):
                b = cyl(0.12, 0.45, (cx - 0.12 + k * 0.24, y - 0.05, cz), 20); b.rotation_euler.x = math.radians(90)
                parts.append((b, mats[(r * 3 + c + k) % len(mats)]))
    for ob, m in parts: assign(ob, m)
    bpy.ops.object.select_all(action='DESELECT')
    for ob, _ in parts: ob.select_set(True)
    bpy.context.view_layer.objects.active = parts[0][0]
    bpy.context.scene.cursor.location = (x, y, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for ob, _ in parts: ob.rotation_euler.z += math.radians(rot)


def gown_form(x, y, body, gown, trim, pole):
    """A dress form in a floor-length gown with a gold belt."""
    t = cyl(0.2, 0.62, (x, y, 1.62), 32); t.scale = (1, 0.7, 1); assign(t, gown); bevel(t, 0.08, 4)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, segments=24, ring_count=12, location=(x, y, 1.92))
    sh = bpy.context.object; sh.scale = (1.15, 0.72, 0.45); assign(sh, body)
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.62, radius2=0.19, depth=1.32, location=(x, y, 0.66))
    assign(bpy.context.object, gown)
    belt = cyl(0.21, 0.07, (x, y, 1.32), 32); belt.scale = (1, 0.72, 1); assign(belt, trim)
    k = cyl(0.04, 0.12, (x, y, 2.17), 12); assign(k, pole)


def build():
    reset()
    random.seed(23)
    NOINK.clear()
    sc = bpy.context.scene
    STEPS[0] = [(0.0, 0.3), (0.12, 0.6), (0.45, 1.0), (1.3, 1.25)]
    AMBIENT[0], AMBIENT[1] = 0.36, (0.85, 0.8, 1.0)

    wallm = mat('wall', (0.9, 0.2, 0.62)); wall2 = mat('wall2', (0.42, 0.18, 0.62))
    stripe = mat('stripe', (1.0, 0.56, 0.82))
    floor = mat('floor', (0.5, 0.46, 0.6)); tile = mat('tile', (0.62, 0.58, 0.72))
    counter = mat('counter', (0.98, 0.96, 0.98)); frame = mat('frame', (0.16, 0.12, 0.22))
    glass = mat('glass', (0.55, 0.72, 0.9)); glint = mat('glint', (1.0, 1.0, 1.0))
    bulb = emissive('bulb', (1.0, 0.92, 0.7), 1.15)
    stool = mat('stool', (1.0, 0.82, 0.2)); legm = mat('chrome', (0.72, 0.74, 0.82))
    skin = mat('wighead', (0.96, 0.88, 0.82))
    wigs = [mat('wig1', (1.0, 0.85, 0.3)), mat('wig2', (0.2, 0.08, 0.06)), mat('wig3', (1.0, 0.3, 0.6)), mat('wig4', (0.55, 0.85, 1.0)), mat('wig5', (0.95, 0.95, 0.95)), mat('wig6', (0.6, 0.2, 0.9))]
    bits = [mat('pot1', (0.2, 0.85, 0.8)), mat('pot2', (1.0, 0.5, 0.25)), mat('pot3', (0.95, 0.95, 0.4))]
    garments = [mat('g1', (1.0, 0.15, 0.45)), mat('g2', (0.15, 0.75, 0.9)), mat('g3', (1.0, 0.82, 0.1)), mat('g4', (0.55, 0.25, 0.95)),
                mat('g5', (0.1, 0.8, 0.45)), mat('g6', (1.0, 0.5, 0.15)), mat('g7', (0.98, 0.95, 0.98)), mat('g8', (0.1, 0.1, 0.14))]
    wood = mat('table', (0.98, 0.94, 0.88)); tleg = mat('tleg', (0.3, 0.26, 0.38))
    machine = mat('machine', (0.96, 0.96, 0.98)); machine2 = mat('machine2', (1.0, 0.3, 0.55))
    formb = mat('formbody', (0.95, 0.88, 0.74))
    neon_pink = emissive('neonpink', (1.0, 0.35, 0.78), 1.6)
    neon_white = emissive('neonwhite', (1.0, 0.9, 1.0), 1.15)
    gold = mat('gold', (1.0, 0.76, 0.18)); gold2 = mat('gold2', (0.95, 0.66, 0.12))
    spark = emissive('spark', (1.0, 0.98, 0.85), 1.2)
    screen = emissive('screen', (0.55, 0.12, 0.62), 1.0)
    lip_glow = emissive('lipglow', (1.0, 0.12, 0.4), 1.25)
    lip_line = emissive('lipline', (0.35, 0.0, 0.12), 1.0)
    lip_red = emissive('lipred', (0.86, 0.04, 0.16), 1.0)

    W = 11.5            # the back wall
    WY = 3.2
    # ── floor: a big two-tone check, the room's shell
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0)); assign(bpy.context.object, floor)
    for i in range(-9, 10):
        for j in range(-6, 4):
            if (i + j) % 2 == 0:
                t = cube((0.98, 0.98, 0.004), (i * 1.0, j * 1.0 + 0.5, 0.003)); assign(t, tile)
    back = cube((W + 4, 0.2, 7.5), (0, WY + 0.1, 3.75)); assign(back, wallm)
    for x in (-W / 2 - 0.6, W / 2 + 0.6):
        side = cube((0.2, 9, 7.5), (x, -1.2, 3.75)); assign(side, wall2)
    # diagonal-free stripes up the wall, for rhythm behind the mirrors
    for i in range(-7, 8):
        s = cube((0.18, 0.02, 7.4), (i * 0.95, WY - 0.01, 3.7)); assign(s, stripe)
    sk = cube((W + 4, 0.1, 0.22), (0, WY - 0.03, 0.11)); assign(sk, frame)

    # ── the stations: three either side of the big screen
    top = 0.95
    xs = [-5.0, -3.35, -1.7, 1.7, 3.35, 5.0]
    for k, x in enumerate(xs):
        station(x, WY - 0.05, top, (counter, glass, frame, bulb, stool, legm, skin, wigs[k], bits, glint))
    # goodbyes from queens already gone, in lipstick on two of the mirrors
    for x in (xs[0], xs[4]):
        lipstick_message(x, WY - 0.15, top + 0.95, lip_red)

    # ── the screen, centre wall: where the host's messages arrive
    sx0, sz0, sw, sh = 0, 3.9, 3.0, 1.75
    bez = cube((sw + 0.3, 0.14, sh + 0.3), (sx0, WY - 0.08, sz0)); bevel(bez, 0.12, 5); assign(bez, gold)
    scr = cube((sw, 0.04, sh), (sx0, WY - 0.16, sz0)); assign(scr, screen); NOINK.append(scr)
    lips(sx0, WY - 0.2, sz0 + 0.05, 0.85, lip_glow, lip_line)
    # a glittering pillar under it, down to the floor
    pil = cube((1.1, 0.16, 3.0), (sx0, WY - 0.06, 1.5)); bevel(pil, 0.05); assign(pil, gold2)
    sparkles(sx0, WY - 0.16, 1.5, 0.5, 1.45, 18, spark)

    # ── the wig wall: a shelf above each run of stations, a wig on every head
    for side in (-1, 1):
        sh_ = cube((5.2, 0.4, 0.07), (side * 3.35, WY - 0.2, 3.1)); assign(sh_, gold)
        for k in range(7):
            x = side * 3.35 - 2.3 + k * 0.76
            st = cyl(0.03, 0.12, (x, WY - 0.2, 3.2), 10); assign(st, legm)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=24, ring_count=12, location=(x, WY - 0.2, 3.4)); assign(bpy.context.object, skin)
            wm = wigs[(k + (3 if side > 0 else 0)) % len(wigs)]
            style = k % 3
            if style == 0:      # a big round bouffant
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, segments=24, ring_count=12, location=(x, WY - 0.16, 3.5))
                bpy.context.object.scale = (1, 0.9, 1.05)
            elif style == 1:    # long and straight
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, segments=24, ring_count=12, location=(x, WY - 0.15, 3.36))
                bpy.context.object.scale = (1, 0.8, 1.9)
            else:               # a tall beehive
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, segments=24, ring_count=12, location=(x, WY - 0.15, 3.62))
                bpy.context.object.scale = (1, 0.8, 1.7)
            assign(bpy.context.object, wm)
    # a band of gold along the shelves' line, with sparkle on it
    gb = cube((W + 4, 0.04, 0.14), (0, WY - 0.02, 2.85)); assign(gb, gold)

    # ── the sign above it all
    bd = cube((4.4, 0.08, 0.9), (0, WY - 0.06, 5.55)); bevel(bd, 0.16, 6); assign(bd, frame)
    neon_text('WERK ROOM', (0, WY - 0.14, 5.55), 0.62, neon_pink, extrude=0.02)
    cb = cube((W + 4, 0.3, 1.0), (0, WY - 0.1, 6.6)); assign(cb, frame)
    for sx in (-2.8, 2.8):
        star = bpy.data.curves.new('star', 'CURVE'); star.dimensions = '3D'; star.bevel_depth = 0.03
        sp = star.splines.new('POLY'); pts = []
        for i in range(11):
            a = math.pi / 2 + i * math.pi / 5; r = 0.32 if i % 2 == 0 else 0.13
            pts.append((math.cos(a) * r, math.sin(a) * r))
        sp.points.add(len(pts) - 1)
        for p, (u, v) in zip(sp.points, pts): p.co = (u, 0, v, 1)
        so = bpy.data.objects.new('star', star); sc.collection.objects.link(so); so.location = (sx, WY - 0.1, 5.55)
        star.materials.append(neon_white); NOINK.append(so)
    for sx_ in (-1, 1):   # glitter either side of the screen, clear of the sign
        sparkles(sx_ * 2.0, WY - 0.12, 4.2, 1.0, 1.4, 7, spark)

    # ── the middle: two sewing tables, a machine on each, fabric on top
    for tx in (-2.6, 2.6):
        t = cube((2.2, 1.0, 0.08), (tx, -0.4, 0.92)); assign(t, wood); bevel(t, 0.02)
        for lx in (-1.0, 1.0):
            for ly in (-0.42, 0.42):
                l = cube((0.06, 0.06, 0.88), (tx + lx, -0.4 + ly, 0.44)); assign(l, tleg)
        mb = cube((0.55, 0.24, 0.16), (tx - 0.3, -0.35, 1.04)); assign(mb, machine); bevel(mb, 0.03)
        ma = cube((0.12, 0.22, 0.32), (tx - 0.52, -0.35, 1.26)); assign(ma, machine); bevel(ma, 0.03)
        mt = cube((0.5, 0.2, 0.12), (tx - 0.3, -0.35, 1.44)); assign(mt, machine2); bevel(mt, 0.03)
        for k, gm in enumerate(random.sample(garments, 3)):
            bolt = cyl(0.09, 0.7, (tx + 0.45, -0.6 + k * 0.22, 1.05 + (k % 2) * 0.02), 20)
            bolt.rotation_euler = (0, math.radians(90), math.radians(random.uniform(-8, 8))); assign(bolt, gm)

    # ── left: the fabric wall, a cubby of bolts; right: a rack and a gown on a form
    cubbies(-5.6, 0.2, 58, garments, frame)
    rack(5.1, 0.6, -62, garments[3:], legm)
    gown_form(-4.2, -1.6, formb, garments[0], gold, frame)
    gown_form(4.2, -1.6, formb, garments[3], gold, frame)

    # ── track lights along the ceiling line
    for k in range(7):
        x = -4.5 + k * 1.5
        h = cyl(0.09, 0.26, (x, 1.2, 6.2), 16); h.rotation_euler = (math.radians(35), 0, 0); assign(h, frame)

    # ── light: a cool white key from above the camera, pink fill from the sign, warm from the bulbs
    bpy.ops.object.light_add(type='SUN', location=(0, -4, 6))
    key = bpy.context.object; key.data.energy = 2.6; key.data.color = (0.95, 0.95, 1.0)
    key.rotation_euler = (math.radians(55), 0, math.radians(-18)); key.data.angle = math.radians(0.4)
    for x in xs:
        bpy.ops.object.light_add(type='POINT', location=(x, WY - 0.5, top + 1.0))
        p = bpy.context.object.data; p.energy = 35; p.color = (1.0, 0.85, 0.6); p.shadow_soft_size = 0.3

    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.8, 0.7, 1.0, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.3

    bpy.ops.object.camera_add(location=(0, -8.2, 2.3))
    cam = bpy.context.object; sc.camera = cam
    d = Vector((0, WY, 2.9)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 24

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
    sc.render.resolution_x, sc.render.resolution_y = 2400, 1000
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 82
    sc.render.filepath = f'{OUT}/werkroom.webp'
    bpy.ops.render.render(write_still=True)


build()

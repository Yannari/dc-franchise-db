# Perfect Match — the fire pit set, rendered in three lights, in the
# avatars' style: flat cel bands, saturated colour, dark plum ink outlines.
# blender -b -P firepit.py -- <outdir> [night|dusk|day ...]
import bpy, math, sys, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'
MOODS = argv[1:] or ['night', 'dusk', 'day']
AMBIENT = [0.3, (1, 1, 1)]
STEPS = [[(0.0, 0.32), (0.12, 0.62), (0.45, 1.0), (1.3, 1.3)]]
NOINK = []


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color):
    """Cel shading: the light on the surface is stepped into flat bands (its
    hue kept, so the fire still paints things orange); the albedo stays; and
    shadow never goes black — a cartoon shadow is a colour."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    N = nt.nodes.new; L = nt.links.new
    dif = N('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (*color, 1)
    s2r = N('ShaderNodeShaderToRGB'); L(dif.outputs[0], s2r.inputs[0])
    lum = N('ShaderNodeRGBToBW'); L(s2r.outputs['Color'], lum.inputs[0])
    alb = sum(c * w for c, w in zip(color, (0.2126, 0.7152, 0.0722))) + 1e-3
    ratio = N('ShaderNodeMath'); ratio.operation = 'DIVIDE'; L(lum.outputs[0], ratio.inputs[0]); ratio.inputs[1].default_value = alb
    sq = N('ShaderNodeMath'); sq.operation = 'DIVIDE'; L(ratio.outputs[0], sq.inputs[0]); sq.inputs[1].default_value = 1.4
    ramp = N('ShaderNodeValToRGB'); cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
    L(sq.outputs[0], ramp.inputs['Fac'])
    steps = STEPS[0]
    cr.elements[0].position = 0.0; cr.elements[0].color = (steps[0][1],) * 3 + (1,)
    cr.elements[1].position = steps[-1][0] / 1.4; cr.elements[1].color = (steps[-1][1],) * 3 + (1,)
    for pos, v in steps[1:-1]:
        e = cr.elements.new(pos / 1.4); e.color = (v, v, v, 1)
    want = N('ShaderNodeRGBToBW'); L(ramp.outputs['Color'], want.inputs[0])
    safe = N('ShaderNodeMath'); safe.operation = 'MAXIMUM'; L(ratio.outputs[0], safe.inputs[0]); safe.inputs[1].default_value = 0.02
    k = N('ShaderNodeMath'); k.operation = 'DIVIDE'; L(want.outputs[0], k.inputs[0]); L(safe.outputs[0], k.inputs[1])
    kc = N('ShaderNodeMath'); kc.operation = 'MINIMUM'; L(k.outputs[0], kc.inputs[0]); kc.inputs[1].default_value = 12
    mul = N('ShaderNodeVectorMath'); mul.operation = 'SCALE'; L(s2r.outputs['Color'], mul.inputs[0]); L(kc.outputs[0], mul.inputs['Scale'])
    amb = N('ShaderNodeMix'); amb.data_type = 'RGBA'; amb.blend_type = 'LIGHTEN'; amb.inputs['Factor'].default_value = 1.0
    L(mul.outputs['Vector'], amb.inputs['A'])
    amb.inputs['B'].default_value = tuple(c * AMBIENT[0] * t for c, t in zip(color, AMBIENT[1])) + (1,)
    em = N('ShaderNodeEmission'); L(amb.outputs['Result'], em.inputs['Color'])
    o = N('ShaderNodeOutputMaterial'); L(em.outputs[0], o.inputs['Surface'])
    return m


def emissive(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*color, 1); e.inputs['Strength'].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs[0])
    return m


def assign(ob, m):
    ob.data.materials.clear(); ob.data.materials.append(m)
    if m.name.split('.')[0] in ('flame', 'core', 'bulb', 'moon', 'sun'):
        NOINK.append(ob)


def smooth(ob):
    for p in ob.data.polygons: p.use_smooth = True


def boolean(target, cutter, op='DIFFERENCE'):
    md = target.modifiers.new('b', 'BOOLEAN'); md.operation = op; md.object = cutter; md.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def cyl(r, d, loc, verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=loc)
    return bpy.context.object


def cube(size, loc):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object; ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob


def ring(r_out, r_in, h, z):
    """A curved bench: an annulus with the camera's side cut away."""
    ob = cyl(r_out, h, (0, 0, z + h / 2))
    boolean(ob, cyl(r_in, h * 3, (0, 0, z + h / 2)))
    boolean(ob, cube((r_out * 2.4, r_out * 1.1, h * 3), (0, -r_out * 0.62, z + h / 2)))
    return ob


def bevel(ob, w=0.04, seg=3):
    md = ob.modifiers.new('bv', 'BEVEL'); md.width = w; md.segments = seg; md.limit_method = 'ANGLE'


def build(mood):
    reset()
    random.seed(7)
    NOINK.clear()
    sc = bpy.context.scene
    STEPS[0] = {'night': [(0.0, 0.16), (0.1, 0.42), (0.4, 0.85), (1.3, 1.25)], 'dusk': [(0.0, 0.26), (0.12, 0.58), (0.45, 1.0), (1.3, 1.3)], 'day': [(0.0, 0.4), (0.15, 0.7), (0.5, 1.0), (1.3, 1.25)]}[mood]
    AMBIENT[0], AMBIENT[1] = {'night': (0.16, (0.45, 0.5, 1.0)), 'dusk': (0.38, (1.0, 0.72, 0.88)), 'day': (0.42, (0.85, 0.9, 1.0))}[mood]
    # ── materials: the simulator's palette, saturated
    deck = mat('deck', (0.62, 0.36, 0.18))
    stone = mat('stone', (0.8, 0.72, 0.62))
    plaster = mat('plaster', (0.98, 0.9, 0.86))
    cushion = mat('cushion', (0.98, 0.95, 0.92))
    pinkc = mat('pinkcushion', (1.0, 0.12, 0.42))
    leaf = mat('leaf', (0.12, 0.62, 0.3)); leaf2 = mat('leaf2', (0.07, 0.45, 0.24))
    trunk = mat('trunk', (0.55, 0.38, 0.22))
    water = mat('water', (0.1, 0.78, 0.85))
    wire = mat('wire', (0.15, 0.1, 0.12))
    flame = emissive('flame', (1.0, 0.38, 0.06), 1.05)
    core = emissive('core', (1.0, 0.86, 0.3), 1.1)
    neon = emissive('neon', (1.0, 0.2, 0.58), {'night': 1.3, 'dusk': 1.15, 'day': 1.0}[mood])
    bulb = emissive('bulb', (1.0, 0.88, 0.6), {'night': 1.2, 'dusk': 1.1, 'day': 1.0}[mood])
    window = emissive('window', (1.0, 0.74, 0.42), 0.95) if mood != 'day' else mat('glass', (0.55, 0.8, 0.9))

    # ── ground: decking, and the pit's stone floor
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0)); assign(bpy.context.object, deck)
    floor = cyl(3.1, 0.06, (0, 0, 0.03)); assign(floor, stone)
    # ── benches round the pit
    base = ring(3.0, 2.15, 0.42, 0.0); assign(base, stone); bevel(base)
    seat = ring(2.95, 2.2, 0.16, 0.42); assign(seat, cushion); bevel(seat, 0.06, 4)
    back = ring(3.05, 2.8, 0.55, 0.42); assign(back, cushion); bevel(back, 0.07, 4)
    for i, a in enumerate([40, 68, 112, 140]):
        t = math.radians(a)
        p = cube((0.45, 0.16, 0.38), (math.cos(t) * 2.65, math.sin(t) * 2.65, 0.78)); p.name = f'pillow{a}'
        p.rotation_euler.z = t + math.pi / 2; p.rotation_euler.x = math.radians(-12)
        bevel(p, 0.07, 4); assign(p, pinkc if i % 2 == 0 else cushion)
    # ── the fire: a stone bowl, cartoon teardrop flames
    bowl = cyl(0.62, 0.38, (0, 0.2, 0.19)); assign(bowl, stone); bevel(bowl, 0.05)
    boolean(bowl, cyl(0.5, 0.5, (0, 0.2, 0.42)))

    def drop(x, y, h, r, m):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=16, location=(x, y, 0))
        d = bpy.context.object
        for v in d.data.vertices:
            t = (v.co.z + 1) / 2
            w = (math.sin(math.pi * min(1.0, t * 2.2)) ** 0.6) * ((1 - t) ** 0.9) * 1.4
            v.co.x *= r * w; v.co.y *= r * w; v.co.z = t * h
        d.location.z = 0.36; smooth(d); assign(d, m)
    if mood == 'day':
        for k in range(5):
            lg = cyl(0.07, 0.7, (math.cos(k * 1.26) * 0.12, 0.2 + math.sin(k * 1.26) * 0.12, 0.42), 12)
            lg.rotation_euler = (math.radians(90), 0, k * 1.26); assign(lg, trunk)
    tongues = [] if mood == 'day' else [(0, 0.2, 1.25, 0.2, 0), (-0.2, 0.25, 0.9, 0.15, -0.25), (0.22, 0.15, 0.95, 0.15, 0.3),
               (-0.08, 0.38, 0.75, 0.13, -0.1), (0.12, 0.36, 0.8, 0.13, 0.15)]
    for (x, y, h, r, lean) in tongues:
        drop(x, y, h, r, flame); bpy.context.object.rotation_euler.y = lean
    for (x, y, h, r, lean) in tongues[:3] if tongues else []:
        drop(x, y - 0.14, h * 0.55, r * 0.6, core); bpy.context.object.rotation_euler.y = lean
    bpy.ops.object.light_add(type='POINT', location=(0, 0.2, 0.9))
    fl = bpy.context.object.data; fl.color = (1.0, 0.5, 0.2); fl.energy = {'night': 900, 'dusk': 400, 'day': 0}[mood]; fl.shadow_soft_size = 0.03

    # ── the villa behind: pale wall, warm windows, the neon heart
    wall = cube((22, 0.5, 6.5), (0, 9.5, 3.25)); assign(wall, plaster)
    roof = cube((23, 1.2, 0.35), (0, 9.4, 6.6)); assign(roof, pinkc); bevel(roof, 0.05)
    for x in (-7.5, -4.5, 4.5, 7.5):
        w = cube((1.6, 0.1, 2.2), (x, 9.22, 2.4)); assign(w, window)
        for (sx, sz, px, pz) in [(0.08, 2.2, x, 2.4), (1.6, 0.08, x, 2.4), (1.9, 0.12, x, 1.25)]:
            b = cube((sx, 0.14, sz), (px, 9.16, pz)); assign(b, trunk)
    door = cube((3.2, 0.1, 2.8), (0, 9.22, 1.4)); assign(door, window)
    heart = bpy.data.curves.new('heart', 'CURVE'); heart.dimensions = '3D'; heart.bevel_depth = 0.05; heart.bevel_resolution = 3
    sp = heart.splines.new('POLY')
    pts = [(16 * math.sin(t) ** 3, 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
           for t in [i / 80 * 2 * math.pi for i in range(81)]]
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts): p.co = (x * 0.07, 0, y * 0.07, 1)
    ho = bpy.data.objects.new('heart', heart); sc.collection.objects.link(ho); ho.location = (0, 9.15, 4.6); heart.materials.append(neon)
    bpy.ops.object.light_add(type='POINT', location=(0, 8.4, 4.6))
    nl = bpy.context.object.data; nl.color = (1.0, 0.25, 0.6); nl.energy = {'night': 35, 'dusk': 15, 'day': 0}[mood]; nl.shadow_soft_size = 0.05

    # ── the pool between the pit and the villa
    pool = cube((14, 3.2, 0.1), (0, 6.2, 0.02)); assign(pool, water)

    # ── palms: a curved trunk, drooping tapered fronds
    def palm(x, y, h, lean):
        pts = [Vector((x + lean * (i / 11) ** 2, y, h * i / 11)) for i in range(12)]
        cu = bpy.data.curves.new('trunk', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.16; cu.bevel_resolution = 4
        s = cu.splines.new('POLY'); s.points.add(len(pts) - 1)
        for p, v in zip(s.points, pts): p.co = (*v, 1)
        o = bpy.data.objects.new('trunk', cu); sc.collection.objects.link(o); cu.materials.append(trunk)
        top = pts[-1]
        for k in range(11):
            a = k / 11 * 2 * math.pi + random.random() * 0.3
            ln = 2.4 + random.random() * 0.6
            bpy.ops.mesh.primitive_grid_add(x_subdivisions=12, y_subdivisions=3, size=1, location=(0, 0, 0))
            f = bpy.context.object
            for v in f.data.vertices:
                u = v.co.x + 0.5
                v.co.y *= 0.62 * math.sin(math.pi * min(1.0, u * 1.15 + 0.05)) * (1 - 0.6 * u)
                v.co.x = u * ln
                v.co.z = 0.5 * u - 1.5 * u * u + abs(v.co.y) * 0.4
            f.rotation_euler.z = a
            f.location = top
            md = f.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.03
            assign(f, leaf if k % 2 else leaf2)
    palm(-6.0, 7.6, 5.6, 0.7); palm(-8.8, 5.0, 4.6, -0.5); palm(6.2, 7.8, 5.9, -0.8); palm(9.2, 4.6, 4.4, 0.4)

    # ── string lights: a wire, and the bulbs hanging off it
    for (x0, x1, y, h) in [(-7.5, 7.5, 4.2, 4.3), (-6.5, 6.5, 1.6, 3.9)]:
        n = 26
        cu = bpy.data.curves.new('wire', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.012
        spw = cu.splines.new('POLY'); spw.points.add(n)
        for i in range(n + 1):
            t = i / n; x = x0 + (x1 - x0) * t; z = h - math.sin(t * math.pi) * 0.9
            spw.points[i].co = (x, y, z, 1)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=12, ring_count=8, location=(x, y, z - 0.09))
            assign(bpy.context.object, bulb)
        wo = bpy.data.objects.new('wire', cu); sc.collection.objects.link(wo); cu.materials.append(wire)
        for x in (x0, x1):
            pole = cyl(0.06, h, (x, y, h / 2), 12); assign(pole, trunk)
    if mood == 'night':
        for i in range(40):
            bpy.ops.mesh.primitive_ico_sphere_add(radius=random.uniform(0.05, 0.1), subdivisions=1,
                                                  location=(random.uniform(-26, 26), 40, random.uniform(9, 26)))
            assign(bpy.context.object, bulb)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=2.2, location=(-14, 40, 20))
        assign(bpy.context.object, emissive('moon', (1.0, 0.95, 0.85), 2.0))
    if mood == 'dusk':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=4, location=(16, 45, 7))
        assign(bpy.context.object, emissive('sun', (1.0, 0.75, 0.45), 2.5))

    # ── sky: a flat gradient
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    nt = world.node_tree; bg = nt.nodes['Background']
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    cr = ramp.color_ramp
    skies = {
        'night': [(0.5, (0.2, 0.08, 0.3)), (0.6, (0.08, 0.04, 0.2)), (1.0, (0.02, 0.015, 0.07))],
        'dusk':  [(0.5, (1.0, 0.55, 0.38)), (0.6, (0.75, 0.28, 0.45)), (1.0, (0.18, 0.08, 0.32))],
        'day':   [(0.5, (0.85, 0.93, 1.0)), (0.62, (0.45, 0.72, 0.98)), (1.0, (0.18, 0.45, 0.9))],
    }[mood]
    cr.elements[0].position, cr.elements[0].color = skies[0][0], (*skies[0][1], 1)
    cr.elements[1].position, cr.elements[1].color = skies[-1][0], (*skies[-1][1], 1)
    for pos, col in skies[1:-1]:
        e = cr.elements.new(pos); e.color = (*col, 1)
    bg.inputs['Strength'].default_value = 1.0
    # The camera sees the gradient; the set is lit only a little by it (the
    # sky's purple was washing every wall).
    fill = nt.nodes.new('ShaderNodeBackground'); fill.inputs['Color'].default_value = (*skies[1][1], 1)
    fill.inputs['Strength'].default_value = {'night': 0.25, 'dusk': 0.5, 'day': 0.55}[mood]
    lp = nt.nodes.new('ShaderNodeLightPath'); mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0]); nt.links.new(fill.outputs[0], mix.inputs[1]); nt.links.new(bg.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes['World Output'].inputs['Surface'])

    # ── sun / moonlight
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
    sun = bpy.context.object
    if mood == 'day':
        sun.data.energy = 2.1; sun.data.color = (1.0, 0.96, 0.88); sun.rotation_euler = (math.radians(50), 0, math.radians(35))
    elif mood == 'dusk':
        sun.data.energy = 1.6; sun.data.color = (1.0, 0.6, 0.38); sun.rotation_euler = (math.radians(80), 0, math.radians(-150))
    else:
        sun.data.energy = 0.25; sun.data.color = (0.6, 0.65, 1.0); sun.rotation_euler = (math.radians(60), 0, math.radians(20))
    sun.data.angle = math.radians(0.3)

    # ── camera: eye level from the near side of the pit, sharp (cartoon backgrounds are)
    bpy.ops.object.camera_add(location=(0, -6.6, 2.1))
    cam = bpy.context.object; sc.camera = cam
    d = Vector((0, 3.0, 1.75)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 26

    # ── render: EEVEE (Shader to RGB is EEVEE's), the avatars' plum ink
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
    sc.render.filepath = f'{OUT}/firepit-{mood}.webp'
    bpy.ops.render.render(write_still=True)


for m in MOODS:
    build(m)

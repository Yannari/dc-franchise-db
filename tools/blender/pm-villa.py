# Perfect Match — the villa's everyday places, in the fire pit's toon recipe
# (tools/blender/pm-firepit.py): EEVEE, flat cel bands that keep the light's
# hue, shadows that are a colour, dark plum Freestyle ink, no depth of field.
#
#   blender -b -P pm-villa.py -- <outdir> [set ...]
#
# Sets (file = <set>.webp, 1920x1104): daybeds-day, pool-night, kitchen-day,
# kitchen-night, lawn-day, lawn-night, terrace-night, terrace-day, bedroom-day, bedroom-night,
# dressing-day, hideaway-night, casa-night.
#
# Every frame keeps its lower third clear floor: the viewer stands the
# islanders' busts there (js/vp-pm/style.js).
import bpy, math, sys, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'
ALL = ['daybeds-day', 'pool-night', 'kitchen-day', 'kitchen-night', 'lawn-day', 'lawn-night', 'terrace-night', 'terrace-day',
       'bedroom-day', 'bedroom-night', 'dressing-day', 'hideaway-night', 'casa-night', 'casa-day']
SETS = argv[1:] or ALL
AMBIENT = [0.3, (1, 1, 1)]
STEPS = [[(0.0, 0.32), (0.12, 0.62), (0.45, 1.0), (1.3, 1.3)]]
NOINK = []
GLOWS = ('flame', 'core', 'bulb', 'moon', 'sun', 'neon', 'window', 'glow', 'candle', 'screen', 'poolglow', 'lamp')

LIGHTS = {
    'day':   {'steps': [(0.0, 0.4), (0.15, 0.7), (0.5, 1.0), (1.3, 1.25)], 'amb': (0.42, (0.85, 0.9, 1.0))},
    'night': {'steps': [(0.0, 0.16), (0.1, 0.42), (0.4, 0.85), (1.3, 1.25)], 'amb': (0.16, (0.45, 0.5, 1.0))},
    'dark':  {'steps': [(0.0, 0.1), (0.1, 0.3), (0.4, 0.7), (1.3, 1.1)], 'amb': (0.1, (0.4, 0.45, 1.0))},
    'warm':  {'steps': [(0.0, 0.3), (0.12, 0.6), (0.45, 1.0), (1.3, 1.3)], 'amb': (0.36, (1.0, 0.8, 0.85))},
    # Indoors after dark: lamplight, warm and even (a point light bands into a disc).
    'evening': {'steps': [(0.0, 0.26), (0.12, 0.55), (0.45, 0.9), (1.3, 1.2)], 'amb': (0.34, (1.0, 0.74, 0.6))},
}
SKIES = {
    'day':   [(0.5, (0.85, 0.93, 1.0)), (0.62, (0.45, 0.72, 0.98)), (1.0, (0.18, 0.45, 0.9))],
    'night': [(0.5, (0.2, 0.08, 0.3)), (0.6, (0.08, 0.04, 0.2)), (1.0, (0.02, 0.015, 0.07))],
    'dark':  [(0.5, (0.08, 0.05, 0.16)), (1.0, (0.01, 0.01, 0.04))],
    'warm':  [(0.5, (1.0, 0.7, 0.6)), (1.0, (0.55, 0.3, 0.5))],
    'evening': [(0.5, (0.2, 0.08, 0.3)), (0.6, (0.08, 0.04, 0.2)), (1.0, (0.02, 0.015, 0.07))],
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color):
    """Cel shading (pm-firepit.py): the light stepped into flat bands, hue kept."""
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
    if hasattr(ob.data, 'materials'):
        ob.data.materials.clear(); ob.data.materials.append(m)
    if m.name.split('.')[0] in GLOWS:
        NOINK.append(ob)
    return ob


def bevel(ob, w=0.04, seg=3):
    md = ob.modifiers.new('bv', 'BEVEL'); md.width = w; md.segments = seg; md.limit_method = 'ANGLE'
    return ob


def cube(size, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object; ob.scale = size; ob.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob


def cyl(r, d, loc, verts=48, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=loc, rotation=rot)
    return bpy.context.object


def sphere(r, loc, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=loc)
    ob = bpy.context.object
    for p in ob.data.polygons: p.use_smooth = True
    return ob


def curve(points, depth, m, name='c'):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = depth; cu.bevel_resolution = 3
    s = cu.splines.new('POLY'); s.points.add(len(points) - 1)
    for p, v in zip(s.points, points): p.co = (*v, 1)
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(m)
    if m.name.split('.')[0] in GLOWS: NOINK.append(o)
    return o


def heart(loc, size, m):
    pts = [(16 * math.sin(t) ** 3 * size, 0, (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * size)
           for t in [i / 80 * 2 * math.pi for i in range(81)]]
    o = curve([(x + loc[0], loc[1], z + loc[2]) for x, _, z in pts], size * 0.7, m, 'heart')
    return o


def palm(x, y, h, lean, M):
    pts = [Vector((x + lean * (i / 11) ** 2, y, h * i / 11)) for i in range(12)]
    curve(pts, 0.16, M['trunk'], 'trunk')
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
        f.rotation_euler.z = a; f.location = top
        md = f.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.03
        assign(f, M['leaf'] if k % 2 else M['leaf2'])


def string_lights(x0, x1, y, h, M, sag=0.9, n=26):
    pts = []
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t; z = h - math.sin(t * math.pi) * sag
        pts.append((x, y, z))
        assign(sphere(0.07, (x, y, z - 0.09), 12), M['bulb'])
    curve(pts, 0.012, M['wire'], 'wire')


def daybed(x, y, M, color='cushion', w=2.2, rot=0.0):
    base = bevel(cube((w, 1.5, 0.35), (x, y, 0.18), (0, 0, rot)), 0.05); assign(base, M['wood'])
    mattress = bevel(cube((w - 0.1, 1.4, 0.22), (x, y, 0.46), (0, 0, rot)), 0.08, 4); assign(mattress, M[color])
    for i, dx in enumerate((-0.6, 0.0, 0.6)):
        p = bevel(cube((0.5, 0.18, 0.42), (x + dx * math.cos(rot), y + 0.55 + dx * math.sin(rot), 0.75), (math.radians(-15), 0, rot)), 0.07, 4)
        assign(p, M['pink'] if i % 2 == 0 else M['cushion'])


def umbrella(x, y, M):
    assign(cyl(0.04, 2.6, (x, y, 1.3), 12), M['wood'])
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=1.4, depth=0.5, location=(x, y, 2.75))
    assign(bpy.context.object, M['pink'])


def villa_wall(M, y=9.5, night=False, windows=(-7.5, -4.5, 4.5, 7.5), door=True, colour='plaster'):
    # A low wall, so there's sky above it, under a pink trim; sliding glass
    # doors in the middle; potted palms along the foot of it.
    assign(cube((24, 0.5, 4.6), (0, y, 2.3)), M[colour])
    assign(bevel(cube((25, 1.0, 0.3), (0, y - 0.1, 4.7)), 0.05), M['pink'])
    for x in windows:
        assign(cube((1.6, 0.1, 1.8), (x, y - 0.28, 2.2)), M['window'] if night else M['glass'])
        for (sx, sz, px, pz) in [(0.08, 1.8, x, 2.2), (1.6, 0.08, x, 2.2), (1.9, 0.12, x, 1.25)]:
            assign(cube((sx, 0.14, sz), (px, y - 0.34, pz)), M['trunk'])
    if door:
        for dx in (-0.8, 0.8):
            assign(cube((1.5, 0.1, 2.5), (dx, y - 0.28, 1.25)), M['window'] if night else M['glass'])
            assign(cube((0.08, 0.14, 2.5), (dx - 0.75, y - 0.34, 1.25)), M['white'])
        assign(cube((3.3, 0.14, 0.1), (0, y - 0.34, 2.5)), M['white'])
    for x in (-10.5, -2.8, 2.8, 10.5):
        potted(x, y - 0.8, M, 1.0)


def potted(x, y, M, s=1.0):
    assign(bevel(cyl(0.35 * s, 0.6 * s, (x, y, 0.3 * s), 24), 0.03), M['peach'])
    for k in range(5):
        a = k / 5 * 2 * math.pi
        assign(sphere(0.32 * s, (x + 0.18 * s * math.cos(a), y + 0.12 * s * math.sin(a), 0.85 * s + 0.15 * s * (k % 2)), 14), M['leaf'] if k % 2 else M['leaf2'])


def planks(M, y0, y1, colour='deck2', w=24):
    # Lines in the decking, so the floor reads as boards and gives the eye depth.
    y = y0
    while y < y1:
        assign(cube((w, 0.04, 0.012), (0, y, 0.006)), M[colour])
        y += 0.55


def clouds(M):
    for (x, z, s) in ((-11, 9.5, 1.6), (-4, 11.5, 1.2), (6, 10, 1.8), (13, 12, 1.3)):
        for k in range(4):
            c = sphere(s * (0.8 + 0.25 * (k % 2)), (x + k * s * 0.9, 38, z + (k % 2) * s * 0.3), 16)
            c.scale = (1.3, 0.4, 0.8); assign(c, M['cloud'])


def sky(mood):
    sc = bpy.context.scene
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    nt = world.node_tree; bg = nt.nodes['Background']
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    cr = ramp.color_ramp
    skies = SKIES[mood]
    cr.elements[0].position, cr.elements[0].color = skies[0][0], (*skies[0][1], 1)
    cr.elements[1].position, cr.elements[1].color = skies[-1][0], (*skies[-1][1], 1)
    for pos, col in skies[1:-1]:
        e = cr.elements.new(pos); e.color = (*col, 1)
    fill = nt.nodes.new('ShaderNodeBackground'); fill.inputs['Color'].default_value = (*skies[1][1], 1) if len(skies) > 2 else (*skies[0][1], 1)
    fill.inputs['Strength'].default_value = {'night': 0.25, 'dark': 0.15, 'day': 0.55, 'warm': 0.45, 'evening': 0.3}[mood]
    lp = nt.nodes.new('ShaderNodeLightPath'); mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0]); nt.links.new(fill.outputs[0], mix.inputs[1]); nt.links.new(bg.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes['World Output'].inputs['Surface'])


def sun(mood):
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
    s = bpy.context.object
    if mood == 'day':
        s.data.energy = 2.1; s.data.color = (1.0, 0.96, 0.88); s.rotation_euler = (math.radians(50), 0, math.radians(35))
    elif mood == 'evening':
        s.data.energy = 1.0; s.data.color = (1.0, 0.72, 0.5); s.rotation_euler = (math.radians(55), 0, math.radians(-30))
    elif mood == 'warm':
        s.data.energy = 1.4; s.data.color = (1.0, 0.8, 0.7); s.rotation_euler = (math.radians(55), 0, math.radians(-30))
    else:
        s.data.energy = 0.25 if mood == 'night' else 0.12; s.data.color = (0.6, 0.65, 1.0); s.rotation_euler = (math.radians(60), 0, math.radians(20))
    s.data.angle = math.radians(0.3)


def point(loc, color, energy, size=0.05):
    bpy.ops.object.light_add(type='POINT', location=loc)
    l = bpy.context.object.data; l.color = color; l.energy = energy; l.shadow_soft_size = size


def night_sky_dressing(M):
    for i in range(40):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=random.uniform(0.05, 0.1), subdivisions=1,
                                              location=(random.uniform(-26, 26), 40, random.uniform(9, 26)))
        assign(bpy.context.object, M['bulb'])
    assign(sphere(2.2, (-14, 40, 20)), emissive('moon', (1.0, 0.95, 0.85), 2.0))


def camera(loc, look, lens=26):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object; bpy.context.scene.camera = cam
    cam.rotation_euler = (Vector(look) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens


def palette(mood, casa=False):
    M = {
        'deck': mat('deck', (0.62, 0.36, 0.18)), 'stone': mat('stone', (0.8, 0.72, 0.62)),
        'plaster': mat('plaster', (0.98, 0.9, 0.86)), 'plaster2': mat('plaster2', (0.98, 0.82, 0.86)),
        'cushion': mat('cushion', (0.98, 0.95, 0.92)), 'pink': mat('pink', (1.0, 0.12, 0.42)),
        'peach': mat('peach', (1.0, 0.62, 0.5)), 'wood': mat('wood', (0.7, 0.45, 0.25)),
        'leaf': mat('leaf', (0.12, 0.62, 0.3)), 'leaf2': mat('leaf2', (0.07, 0.45, 0.24)),
        'trunk': mat('trunk', (0.55, 0.38, 0.22)), 'water': mat('water', (0.1, 0.78, 0.85)),
        'grass': mat('grass', (0.3, 0.72, 0.28)), 'hedge': mat('hedge', (0.1, 0.5, 0.25)),
        'wire': mat('wire', (0.15, 0.1, 0.12)), 'tile': mat('tile', (0.62, 0.9, 0.88)),
        'white': mat('white', (0.96, 0.96, 0.96)), 'metal': mat('metal', (0.75, 0.78, 0.82)),
        'navy': mat('navy', (0.18, 0.2, 0.42)), 'duvet': mat('duvet', (1.0, 0.55, 0.7)),
        'rug': mat('rug', (0.98, 0.78, 0.5)), 'mirror': mat('mirror', (0.75, 0.88, 0.95)),
        'rattan': mat('rattan', (0.85, 0.66, 0.4)), 'teal': mat('teal', (0.05, 0.62, 0.6)),
        'orange': mat('orange', (1.0, 0.5, 0.12)), 'glass': mat('glass', (0.55, 0.8, 0.9)),
        'bulb': emissive('bulb', (1.0, 0.88, 0.6), 1.15), 'window': emissive('window', (1.0, 0.74, 0.42), 0.95),
        'neon': emissive('neon', (1.0, 0.2, 0.58), 1.25), 'candle': emissive('candle', (1.0, 0.75, 0.35), 1.3),
        'poolglow': emissive('poolglow', (0.15, 0.85, 0.95), 0.75), 'lamp': emissive('lamp', (1.0, 0.85, 0.6), 1.1),
        'deck2': mat('deck2', (0.5, 0.28, 0.14)), 'yellow': mat('yellow', (1.0, 0.82, 0.25)),
        'cloud': emissive('glow', (1.0, 1.0, 1.0), 0.95), 'ripple': emissive('glow', (0.75, 0.98, 1.0), 0.9),
        'tile2': mat('tile2', (0.45, 0.8, 0.8)),
    }
    # The villa's walls are warm, never white (the first render read as a hospital).
    M['plaster'] = mat('plaster', (1.0, 0.8, 0.72))
    if casa:
        M['plaster'] = mat('plaster', (0.98, 0.72, 0.45)); M['pink'] = mat('pink', (0.05, 0.6, 0.62))
        M['neon'] = emissive('neon', (0.2, 0.95, 0.9), 1.25)
    return M


# ── the sets ──────────────────────────────────────────────────────────
def build_daybeds(M, night=False, casa=False):
    assign(cube((80, 80, 0.1), (0, 0, -0.05)), M['deck'])
    planks(M, -4, 2.6)
    # the pool across the middle distance, ripples on it, glowing at night
    assign(cube((15, 3.6, 0.1), (0, 4.8, 0.02)), M['poolglow'] if night else M['water'])
    for (x, y, w) in ((-4, 4.0, 2.2), (2.5, 4.6, 3.0), (-1, 5.6, 1.8), (5, 5.3, 1.4)):
        assign(cube((w, 0.06, 0.02), (x, y, 0.08)), M['ripple'])
    assign(bevel(cube((15.6, 0.3, 0.2), (0, 2.85, 0.1)), 0.03), M['stone'])
    # daybeds either side of the near deck, the camera between them, cushions in every colour
    daybed(-4.8, 1.0, M, 'cushion', 2.4, math.radians(20))
    daybed(4.8, 1.0, M, 'cushion', 2.4, math.radians(-20))
    for (x, c) in ((-5.4, 'yellow'), (-4.2, 'teal'), (4.2, 'yellow'), (5.4, 'teal')):
        assign(bevel(cube((0.45, 0.45, 0.16), (x, 0.7, 0.66)), 0.07, 4), M[c])
    if not night:
        umbrella(-7.2, 2.2, M); umbrella(7.2, 2.2, M)
        clouds(M)
    # loungers along the far side of the pool, and a towel on each
    for i, x in enumerate((-5, -2.5, 2.5, 5)):
        assign(bevel(cube((0.8, 2.0, 0.25), (x, 7.6, 0.3)), 0.05, 3), M['white'])
        assign(cube((0.6, 1.2, 0.03), (x, 7.4, 0.45)), M[('pink', 'teal', 'yellow', 'peach')[i]])
    villa_wall(M, 9.6, night)
    heart((0, 9.2, 3.6), 0.05, M['neon'])
    palm(-8.0, 8.0, 6.0, 0.7, M); palm(8.4, 8.2, 6.2, -0.8, M); palm(-11, 4.5, 4.8, -0.5, M); palm(11.2, 4.0, 5.0, 0.6, M)
    potted(-8.6, -0.6, M, 1.3); potted(8.6, -0.6, M, 1.3)
    if night:
        string_lights(-8, 8, 3.2, 4.0, M)
        point((0, 8.8, 3.6), (1.0, 0.25, 0.6), 35)
        point((0, 4.8, 0.6), (0.2, 0.8, 1.0), 60, 0.5)
        night_sky_dressing(M)
    camera((0, -6.0, 2.3), (0, 3.4, 1.4), 26)


def build_kitchen(M, night=False):
    # Chequered floor; the islanders stand in front of the island, the
    # kitchen's life behind them: shelves of mugs and jars, the fridge,
    # lampshades over the counter, plants trailing from the shelf.
    assign(cube((40, 40, 0.1), (0, 0, -0.05)), M['tile'])
    for i in range(-12, 13):
        for j in range(0, 14):
            if (i + j) % 2 == 0:
                assign(cube((0.7, 0.7, 0.012), (i * 0.7, -4 + j * 0.7, 0.006)), M['tile2'])
    assign(cube((16, 0.4, 5), (0, 6.2, 2.5)), M['plaster2'])
    # the island, behind where people stand
    assign(bevel(cube((7.4, 1.2, 1.0), (0, 3.4, 0.5)), 0.04), M['white'])
    for x in (-3.0, -1.5, 0, 1.5, 3.0):
        assign(cube((0.06, 0.02, 0.8), (x, 2.79, 0.5)), M['peach'])
    assign(bevel(cube((7.6, 1.35, 0.08), (0, 3.4, 1.04)), 0.02), M['wood'])
    assign(cyl(0.38, 0.14, (-1.6, 3.3, 1.15), 32), M['white'])
    for k, c in enumerate(('orange', 'yellow', 'leaf', 'orange', 'pink')):
        assign(sphere(0.12, (-1.75 + (k % 3) * 0.15, 3.25 + (k // 3) * 0.12, 1.28 + (k // 3) * 0.08), 12), M[c])
    for x in (1.2, 1.5):
        assign(cyl(0.07, 0.22, (x, 3.3, 1.19), 12), M['glass'])
    assign(cyl(0.18, 0.4, (2.6, 3.4, 1.28), 16), M['teal'])
    for k in range(4):
        assign(sphere(0.18, (2.6 + 0.1 * math.cos(k * 1.6), 3.4 + 0.1 * math.sin(k * 1.6), 1.6 + 0.08 * k), 12), M['leaf'] if k % 2 else M['leaf2'])
    # the back wall
    for z in (2.0, 2.9):
        assign(bevel(cube((7, 0.45, 0.08), (-1.8, 5.85, z)), 0.02), M['wood'])
        for i in range(9):
            if i % 3 == 2:
                assign(cyl(0.16, 0.42, (-5 + i * 0.8, 5.8, z + 0.25), 16), M['glass'])
            else:
                assign(cyl(0.13, 0.26, (-5 + i * 0.8, 5.8, z + 0.17), 16), M[('pink', 'teal', 'yellow', 'white')[i % 4]])
    for k in range(5):
        curve([(-5.2 + k * 0.2, 5.75, 2.9), (-5.3 + k * 0.25, 5.65, 2.3), (-5.2 + k * 0.2, 5.6, 1.6)], 0.035, M['leaf'], 'vine')
    assign(bevel(cube((1.8, 1.0, 3.0), (5.0, 5.5, 1.5)), 0.1, 4), M['teal'])
    assign(cube((0.07, 0.07, 1.1), (4.3, 4.98, 1.8)), M['white'])
    assign(cube((1.8, 0.05, 0.05), (5.0, 4.98, 2.1)), M['white'])
    for x in (-2.4, 0, 2.4):
        curve([(x, 3.4, 5.2), (x, 3.4, 3.9)], 0.01, M['wire'], 'cord')
        bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.42, radius2=0.12, depth=0.45, location=(x, 3.4, 3.7))
        assign(bpy.context.object, M['pink'] if not night else M['lamp'])
    assign(cube((3.2, 0.05, 1.5), (-4.2, 6.0, 4.0)), M['window'] if night else M['glass'])
    potted(-7.0, 4.8, M, 1.2); potted(7.4, 4.6, M, 1.2)
    camera((0, -4.6, 2.0), (0, 3.6, 1.5), 26)


def build_lawn(M, night=False):
    assign(cube((80, 80, 0.1), (0, 0, -0.05)), M['grass'])
    # two hanging egg chairs either side
    for x in (-3.2, 3.2):
        assign(cyl(0.05, 2.8, (x, 3.0, 1.4), 12), M['metal'])
        curve([(x, 3.0, 2.8), (x + 0.7, 3.0, 3.1), (x + 1.2, 3.0, 2.6)], 0.05, M['metal'], 'arc')
        egg = sphere(0.75, (x + 1.2, 3.0, 1.35), 32); egg.scale = (0.9, 0.85, 1.15); assign(egg, M['rattan'])
        assign(sphere(0.55, (x + 1.2, 2.55, 1.2), 24), M['cushion'])
        curve([(x + 1.2, 3.0, 2.6), (x + 1.2, 3.0, 2.2)], 0.02, M['wire'], 'chain')
    # hedges, flowers, palms, a pergola with lights
    for i in range(9):
        h = bevel(cube((2.4, 1.0, 1.4), (-10 + i * 2.5, 7.5, 0.7)), 0.25, 3); assign(h, M['hedge'])
        for k in range(3):
            assign(sphere(0.14, (-10.6 + i * 2.5 + k * 0.6, 7.0, 1.3 + random.random() * 0.2), 12), M['pink'] if (i + k) % 2 else M['peach'])
    palm(-7.5, 9.5, 6.0, 0.6, M); palm(7.8, 9.8, 6.2, -0.7, M); palm(0.5, 12.0, 6.6, 0.3, M)
    for x in (-4.5, 4.5):
        assign(cube((0.18, 0.18, 3.4), (x, 5.2, 1.7)), M['wood'])
    assign(cube((9.2, 0.18, 0.18), (0, 5.2, 3.4)), M['wood'])
    string_lights(-4.5, 4.5, 5.2, 3.35, M, 0.5, 18)
    villa_wall(M, 14, night, (-6, 6), False)
    if night:
        night_sky_dressing(M)
        for x in (-6.5, 6.5):
            assign(cyl(0.05, 1.0, (x, 4.0, 0.5), 8), M['wood']); assign(sphere(0.16, (x, 4.0, 1.1), 12), M['lamp'])
    else:
        clouds(M)
    camera((0, -4.8, 1.8), (0, 4.0, 1.7), 26)


def build_terrace(M, night=True):
    assign(cube((30, 30, 0.1), (0, 0, -0.05)), M['deck'])
    # the low sofas, a coffee table, lanterns, the railing and the night beyond
    for (x, y, r, w) in ((-3.4, 2.2, 25, 3.0), (3.4, 2.2, -25, 3.0)):
        base = bevel(cube((w, 1.1, 0.42), (x, y, 0.21), (0, 0, math.radians(r))), 0.06, 3); assign(base, M['rattan'])
        assign(bevel(cube((w - 0.1, 1.0, 0.2), (x, y, 0.5), (0, 0, math.radians(r))), 0.08, 4), M['cushion'])
        back = bevel(cube((w, 0.25, 0.7), (x - 0.35 * math.sin(math.radians(r)), y + 0.45, 0.75), (0, 0, math.radians(r))), 0.06, 3)
        assign(back, M['rattan'])
    assign(bevel(cube((1.6, 1.0, 0.4), (0, 3.0, 0.2)), 0.05), M['wood'])
    for x in (-0.4, 0.45):
        assign(cyl(0.12, 0.3, (x, 3.0, 0.55), 16), M['candle'])
    for x in (-7, 7):
        assign(cyl(0.22, 0.6, (x, 4.2, 0.3), 16), M['wood']); assign(sphere(0.2, (x, 4.2, 0.75), 12), M['lamp'])
    for i in range(26):
        x = -13 + i
        assign(cube((0.06, 0.06, 1.1), (x, 6.5, 0.55)), M['metal'])
    assign(cube((26, 0.08, 0.08), (0, 6.5, 1.1)), M['metal'])
    # the hills and the sea below
    for i, (x, h) in enumerate(((-16, 5), (-6, 3.5), (5, 4.5), (15, 3))):
        bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=9, depth=h, location=(x, 40, h / 2 - 1))
        assign(bpy.context.object, M['navy'])
    for i in range(30):
        if night:
            assign(sphere(0.12, (random.uniform(-20, 20), random.uniform(30, 36), random.uniform(0.3, 2)), 8), M['window'])
    string_lights(-6, 6, 4.5, 3.8, M, 0.6)
    if night:
        night_sky_dressing(M)
        point((0, 3.0, 1.2), (1.0, 0.7, 0.4), 60, 0.3)
    else:
        clouds(M)
        assign(cube((80, 20, 0.1), (0, 45, -0.6)), M['water'])
    camera((0, -3.8, 1.7), (0, 4.0, 1.3), 26)


def build_bedroom(M, lights_out=False):
    assign(cube((30, 30, 0.1), (0, 0, -0.05)), M['rug'] if not lights_out else M['navy'])
    assign(cube((20, 0.4, 5), (0, 6.6, 2.5)), M['plaster2'])
    heart((0, 6.3, 3.6), 0.06, M['neon'])
    # a row of beds facing the camera, pink duvets, white pillows
    for i, x in enumerate((-6.6, -3.3, 0, 3.3, 6.6)):
        y = 4.2
        assign(bevel(cube((2.4, 0.2, 1.4), (x, y + 1.6, 0.9)), 0.06, 3), M['wood'])
        assign(bevel(cube((2.3, 3.0, 0.5), (x, y, 0.3)), 0.06), M['white'])
        assign(bevel(cube((2.32, 2.2, 0.18), (x, y - 0.35, 0.62)), 0.08, 4), M['duvet'] if i % 2 == 0 else M['peach'])
        for dx in (-0.55, 0.55):
            assign(bevel(cube((0.85, 0.5, 0.22), (x + dx, y + 1.15, 0.68)), 0.08, 4), M['cushion'])
        assign(bevel(cube((0.5, 0.45, 0.6), (x + 1.45, y + 1.3, 0.3)), 0.03), M['wood'])
        assign(sphere(0.14, (x + 1.45, y + 1.3, 0.75), 12), M['lamp'] if lights_out else M['peach'])
    if lights_out:
        point((0, 5.5, 3.6), (1.0, 0.3, 0.65), 45, 0.2)
        for x in (-5.15, 1.75, 8.05):
            point((x, 5.5, 0.9), (1.0, 0.75, 0.45), 12, 0.1)
    else:
        point((0, 3, 4.5), (1.0, 0.9, 0.8), 200, 1.5)
    camera((0, -3.2, 1.9), (0, 4.5, 1.1), 24)


def build_dressing(M):
    assign(cube((30, 30, 0.1), (0, 0, -0.05)), M['tile'])
    assign(cube((16, 0.4, 5), (0, 4.6, 2.5)), M['plaster2'])
    # the mirrors with bulbs round them, the long vanity, stools
    for x in (-4.2, -1.4, 1.4, 4.2):
        assign(cube((1.9, 0.08, 1.6), (x, 4.35, 2.2)), M['mirror'])
        for k in range(8):
            t = k / 7
            for (bx, bz) in ((x - 1.05, 1.5 + t * 1.4), (x + 1.05, 1.5 + t * 1.4)):
                assign(sphere(0.07, (bx, 4.3, bz), 10), M['bulb'])
        for k in range(6):
            assign(sphere(0.07, (x - 0.85 + k * 0.34, 4.3, 3.1), 10), M['bulb'])
    assign(bevel(cube((12, 0.9, 0.1), (0, 3.8, 1.0)), 0.02), M['white'])
    assign(cube((12, 0.8, 0.95), (0, 3.85, 0.48)), M['pink'])
    for i, x in enumerate((-4.6, -3.6, -1.2, 0.8, 1.9, 4.0)):
        assign(cyl(0.08, 0.25 + 0.1 * (i % 3), (x, 3.7, 1.15 + 0.06 * (i % 3)), 12), M[('peach', 'teal', 'orange')[i % 3]])
    for x in (-4.2, -1.4, 1.4, 4.2):
        assign(cyl(0.3, 0.1, (x, 2.8, 0.7), 24), M['white']); assign(cyl(0.04, 0.65, (x, 2.8, 0.33), 8), M['metal'])
    # No point light: in cel bands its falloff draws a disc on the wall that reads as a sun.
    for x in (-4.2, -1.4, 1.4, 4.2):
        for (dx, dz, ln) in ((-0.5, 0.2, 0.5), (-0.25, 0.1, 0.3)):
            assign(cube((ln, 0.02, 0.04), (x + dx, 4.29, 2.2 + dz), (0, math.radians(35), 0)), M['white'])
    camera((0, -2.6, 1.75), (0, 4.0, 1.7), 26)


def build_hideaway(M):
    assign(cube((30, 30, 0.1), (0, 0, -0.05)), M['navy'])
    assign(cube((14, 0.4, 5), (0, 5.2, 2.5)), M['plaster2'])
    # the big bed, drapes, candles everywhere, petals
    assign(bevel(cube((4.2, 3.4, 0.55), (0, 3.0, 0.3)), 0.06), M['white'])
    assign(bevel(cube((4.22, 2.6, 0.2), (0, 2.6, 0.66)), 0.1, 4), M['pink'])
    for dx in (-1.1, 0, 1.1):
        assign(bevel(cube((0.95, 0.5, 0.3), (dx, 4.2, 0.78)), 0.1, 4), M['cushion'])
    assign(bevel(cube((4.6, 0.25, 2.2), (0, 4.75, 1.4)), 0.08, 3), M['wood'])
    for x in (-2.6, 2.6):
        drape = cube((0.9, 0.08, 4.2), (x, 4.4, 2.1)); assign(drape, M['duvet'])
    heart((0, 5.0, 3.6), 0.06, M['neon'])
    for i in range(16):
        x = random.choice((-1, 1)) * random.uniform(2.0, 5.5); y = random.uniform(0.8, 4.6)
        h = random.uniform(0.15, 0.5)
        assign(cyl(0.08, h, (x, y, h / 2), 12), M['white']); assign(sphere(0.05, (x, y, h + 0.06), 8), M['candle'])
    for i in range(40):
        p = cube((0.1, 0.07, 0.01), (random.uniform(-2, 2), random.uniform(1.4, 3.8), 0.78), (0, 0, random.random() * 3))
        assign(p, M['pink'] if i % 3 else M['peach'])
    point((-3.5, 2.5, 1.0), (1.0, 0.65, 0.35), 50, 0.2); point((3.5, 2.5, 1.0), (1.0, 0.65, 0.35), 50, 0.2)
    point((0, 4.6, 3.6), (1.0, 0.3, 0.65), 30, 0.2)
    camera((0, -3.4, 1.8), (0, 3.6, 1.0), 26)


BUILDS = {
    'daybeds-day': ('day', lambda M: build_daybeds(M)),
    'pool-night': ('night', lambda M: build_daybeds(M, night=True)),
    'casa-night': ('night', lambda M: build_daybeds(M, night=True, casa=True)),
    'casa-day': ('day', lambda M: build_daybeds(M, casa=True)),
    'kitchen-day': ('day', lambda M: build_kitchen(M)),
    'kitchen-night': ('evening', lambda M: build_kitchen(M, night=True)),
    'lawn-day': ('day', lambda M: build_lawn(M)),
    'lawn-night': ('night', lambda M: build_lawn(M, night=True)),
    'terrace-night': ('night', lambda M: build_terrace(M)),
    'terrace-day': ('day', lambda M: build_terrace(M, night=False)),
    'bedroom-day': ('warm', lambda M: build_bedroom(M)),
    'bedroom-night': ('dark', lambda M: build_bedroom(M, lights_out=True)),
    'dressing-day': ('warm', lambda M: build_dressing(M)),
    'hideaway-night': ('dark', lambda M: build_hideaway(M)),
}


def render(name):
    mood, fn = BUILDS[name]
    reset()
    random.seed(7)
    NOINK.clear()
    STEPS[0] = LIGHTS[mood]['steps']
    AMBIENT[0], AMBIENT[1] = LIGHTS[mood]['amb']
    M = palette(mood, casa=name.startswith('casa'))
    fn(M)
    sky(mood); sun(mood)
    sc = bpy.context.scene
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
    sc.render.filepath = f'{OUT}/{name}.webp'
    bpy.ops.render.render(write_still=True)


for s in SETS:
    render(s)

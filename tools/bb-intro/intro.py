"""
tools/bb-intro/intro.py — the Big Brother opening titles and closing, rendered in Blender.

Run headless (the wrapper, render.py, builds the config from a season):

    blender -b -P tools/bb-intro/intro.py -- <config.json>

The config:
    kind      'intro' | 'outro'
    cast      [{ name, avatar }]       the season's houseguests, in any order
    title     'Big Brother 1'          season line under the logo
    subtitle  'The Room Decided'       optional
    audio     path to the music        (assets/audio/bb/theme.mp3 or ending.mp3)
    seconds   length of the video      (the intro runs to the end of the theme)
    out       path of the .mp4
    preview   optional list of frames to render as PNG instead of the video

The look follows the viewer (feedback: live TV x modern broadcast): a dark
navy studio, cyan light, the Big Brother eye, and the cast as a wall of lit
portrait screens. Everything that glows is an emission material, so EEVEE
renders it fast and flat. The OUTRO never shows the season's result: it plays
after every episode, including the first.
"""
import bpy, sys, json, math, os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
CFG = json.load(open(argv[0], encoding='utf-8'))
KIND = CFG.get('kind', 'intro')
FPS = 24
SECONDS = float(CFG.get('seconds', 40))
FRAMES = int(round(SECONDS * FPS))
CYAN = (0.13, 0.88, 1.0)
GOLD = (0.96, 0.77, 0.26)
NAVY = (0.0025, 0.005, 0.014)

# ── a clean scene ──────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.resolution_percentage = 100
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        continue
try:
    scene.eevee.taa_render_samples = 16
except AttributeError:
    pass
scene.view_settings.view_transform = 'Standard'

world = bpy.data.worlds.new('studio')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
bg.inputs[0].default_value = (*NAVY, 1)
bg.inputs[1].default_value = 1.0


def emission(name, color, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*color, 1)
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs[0], out.inputs[0])
    return m


def image_emission(name, path, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(path, check_existing=True)
    em.inputs['Strength'].default_value = strength
    nt.links.new(tex.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs[0])
    return m


def key(obj, frame, **props):
    """Keyframe location / rotation_euler / scale (tuples) at a frame."""
    for prop, val in props.items():
        setattr(obj, prop, val)
        obj.keyframe_insert(data_path=prop, frame=frame)


def text(body, size, color, strength=2.0, extrude=0.02, align='CENTER'):
    cu = bpy.data.curves.new(f'txt-{body[:12]}', type='FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = 'CENTER'
    ob = bpy.data.objects.new(f'txt-{body[:12]}', cu)
    scene.collection.objects.link(ob)
    ob.data.materials.append(emission(f'm-{body[:12]}', color, strength))
    return ob


def plane(name, w, h, mat):
    bpy.ops.mesh.primitive_plane_add(size=1)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (w, h, 1)
    ob.rotation_euler = (math.radians(90), 0, 0)   # stand up, facing -Y (the camera)
    ob.data.materials.append(mat)
    return ob


# ── the Big Brother eye ────────────────────────────────────────────────
def build_eye(parent_loc, scale=1.0):
    root = bpy.data.objects.new('eye', None)
    scene.collection.objects.link(root)
    root.location = parent_loc
    # the almond: a bezier circle squashed, drawn as a tube
    cu = bpy.data.curves.new('almond', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.06
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(3)
    pts = [(-2.2, 0, 0), (0, 0, 1.15), (2.2, 0, 0), (0, 0, -1.15)]
    for i, (bp, p) in enumerate(zip(sp.bezier_points, pts)):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'VECTOR' if i in (0, 2) else 'AUTO'
    sp.use_cyclic_u = True
    almond = bpy.data.objects.new('almond', cu)
    scene.collection.objects.link(almond)
    almond.parent = root
    almond.data.materials.append(emission('m-almond', (0.92, 0.97, 1.0), 3.0))
    # the iris and the pupil, facing the camera
    bpy.ops.mesh.primitive_torus_add(major_radius=0.82, minor_radius=0.09, rotation=(math.radians(90), 0, 0))
    iris = bpy.context.active_object
    iris.parent = root
    iris.data.materials.append(emission('m-iris', CYAN, 5.0))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.05, rotation=(math.radians(90), 0, 0))
    ring = bpy.context.active_object
    ring.parent = root
    ring.data.materials.append(emission('m-ring', CYAN, 3.0))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.05, rotation=(math.radians(90), 0, 0), location=(0, 0.02, 0))
    pupil = bpy.context.active_object
    pupil.parent = root
    pupil.data.materials.append(emission('m-pupil', (0.01, 0.02, 0.04), 1.0))
    # the shine
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0.28, -0.05, 0.3))
    shine = bpy.context.active_object
    shine.parent = root
    shine.data.materials.append(emission('m-shine', (1, 1, 1), 6.0))
    root.scale = (scale, scale, scale)
    return root, almond


# ── the stage: a floor grid and a back wall of light strips ────────────
def build_stage():
    strip = emission('m-strip', CYAN, 1.6)
    for i in range(-9, 10, 3):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(i * 1.6, 9, 2))
        ob = bpy.context.active_object
        ob.scale = (0.06, 0.06, 14)
        ob.data.materials.append(strip)
    halo = emission('m-halo', (0.03, 0.14, 0.2), 0.16)
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=9, fill_type='NGON', location=(0, 8.5, 6), rotation=(math.radians(90), 0, 0))
    bpy.context.active_object.data.materials.append(halo)
    floor_mat = emission('m-floor', (0.006, 0.014, 0.03), 0.6)
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 6, -6))
    floor = bpy.context.active_object
    floor.data.materials.append(floor_mat)
    line = emission('m-grid', CYAN, 0.7)
    for i in range(-20, 21, 2):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(i, 6, -5.98))
        ob = bpy.context.active_object
        ob.scale = (0.015, 40, 0.01)
        ob.data.materials.append(line)
    for j in range(-14, 30, 2):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, j, -5.98))
        ob = bpy.context.active_object
        ob.scale = (40, 0.015, 0.01)
        ob.data.materials.append(line)


# ── the cast: a wall of lit portrait screens ───────────────────────────
def build_wall(cast, cols):
    cards = []
    rows = max(1, math.ceil(len(cast) / cols))
    cw, ch, gap = 2.0, 2.0, 0.55
    total_w = cols * cw + (cols - 1) * gap
    total_h = rows * (ch + 0.6) + (rows - 1) * gap
    rim = emission('m-rim', CYAN, 4.0)
    for i, p in enumerate(cast):
        r, c = divmod(i, cols)
        in_row = min(cols, len(cast) - r * cols)
        row_w = in_row * cw + (in_row - 1) * gap
        x = -row_w / 2 + cw / 2 + c * (cw + gap)
        z = total_h / 2 - ch / 2 - r * (ch + 0.6 + gap)
        frame = plane(f'rim-{i}', cw + 0.12, ch + 0.12, rim)
        frame.location = (x, 0.02, z)
        face = plane(f'face-{i}', cw, ch, image_emission(f'img-{i}', p['avatar'], 1.0))
        face.location = (x, 0, z)
        label = text(p['name'].upper(), 0.26, (1, 1, 1), 2.5)
        label.rotation_euler = (math.radians(90), 0, 0)
        label.location = (x, 0, z - ch / 2 - 0.32)
        cards.append({'frame': frame, 'face': face, 'label': label, 'x': x, 'z': z})
    return cards, total_w, total_h


def card_hidden(card, frame):
    for k in ('frame', 'face', 'label'):
        ob = card[k]
        key(ob, frame, scale=(0.0001, 0.0001, 0.0001) if k != 'label' else (0.0001, 0.0001, 0.0001))


def card_pop(card, f0, dur=10):
    """A card flips in: hidden, then a quick overshoot to full size."""
    sizes = {'frame': (2.12 / 2, 1, 2.12 / 2), 'face': (1.0, 1, 1.0), 'label': (1, 1, 1)}
    for k, full in sizes.items():
        ob = card[k]
        base = ob.scale.copy()
        rest = (base[0], base[1], base[2]) if False else None
    for k in ('frame', 'face'):
        ob = card[k]
        w = ob['w']; h = ob['h']
        key(ob, f0, scale=(0.0001, h, 1), rotation_euler=(math.radians(90), 0, math.radians(80)))
        key(ob, f0 + int(dur * 0.7), scale=(w * 1.06, h * 1.06, 1), rotation_euler=(math.radians(90), 0, 0))
        key(ob, f0 + dur, scale=(w, h, 1))
    lb = card['label']
    key(lb, f0 + int(dur * 0.6), scale=(0.0001, 0.0001, 0.0001))
    key(lb, f0 + dur + 4, scale=(1, 1, 1))


# ── camera ─────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 35
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.rotation_euler = (math.radians(90), 0, 0)   # looking down +Y


def cam_at(frame, x, y, z):
    key(cam, frame, location=(x, y, z))


build_stage()
cast = CFG.get('cast', [])
cols = 6 if len(cast) > 12 else max(1, min(6, len(cast)))
cards, wall_w, wall_h = build_wall(cast, cols) if cast else ([], 0, 0)
for c in cards:
    for k in ('frame', 'face'):
        c[k]['w'] = c[k].scale[0]
        c[k]['h'] = c[k].scale[1]

title = CFG.get('title', 'Big Brother')
subtitle = CFG.get('subtitle', '')

if not cards:
    # THE GENERIC PAIR (no cast): the eye and the logo, centred, and nothing else.
    eye, almond = build_eye((0, -2, 2.4), 1.0)
    logo = text('BIG BROTHER', 1.05, (1, 1, 1), 3.0, extrude=0.06)
    logo.rotation_euler = (math.radians(90), 0, 0)
    logo.location = (0, -2, 0.2)
    # no season line on the generic pair: it would only say "Big Brother" twice
    season = None
    if title and title != 'Big Brother':
        season = text(title + (f'  ·  {subtitle}' if subtitle else ''), 0.38, CYAN, 4.0)
        season.rotation_euler = (math.radians(90), 0, 0)
        season.location = (0, -2, -0.75)
    if KIND == 'intro':
        key(eye, 1, scale=(1, 1, 0.04)); key(eye, 18, scale=(1, 1, 0.04)); key(eye, 44, scale=(1, 1, 1.08)); key(eye, 52, scale=(1, 1, 1))
        for ob, f in ((logo, 70), (season, 96)) if season else ((logo, 70),):
            key(ob, f, scale=(0.0001, 0.0001, 0.0001)); key(ob, f + 14, scale=(1, 1, 1))
        cam_at(1, 0, -7, 2.4); cam_at(120, 0, -11, 1.0); cam_at(FRAMES - 20, 0, -12.5, 0.9)
    else:
        key(eye, 1, scale=(1, 1, 1))
        cam_at(1, -0.6, -12.5, 0.9); cam_at(FRAMES - 60, 0.6, -11.5, 0.9)
        key(eye, FRAMES - 40, scale=(1, 1, 1)); key(eye, FRAMES - 12, scale=(1, 1, 0.03))
elif KIND == 'intro':
    # 0 ─ 3.5 s: the eye opens out of the dark, close up
    eye, almond = build_eye((0, -2, wall_h / 2 + 2.6), 1.0)
    key(eye, 1, scale=(1.0, 1.0, 0.04))
    key(eye, 18, scale=(1.0, 1.0, 0.04))
    key(eye, 44, scale=(1.0, 1.0, 1.08))
    key(eye, 52, scale=(1.0, 1.0, 1.0))
    cam_at(1, 0, -9, wall_h / 2 + 2.6)
    cam_at(84, 0, -11, wall_h / 2 + 2.6)
    # 3.5 ─ 8 s: BIG BROTHER, and the season line
    logo = text('BIG BROTHER', 1.05, (1, 1, 1), 3.0, extrude=0.06)
    logo.rotation_euler = (math.radians(90), 0, 0)
    logo.location = (0, -2, wall_h / 2 + 0.6)
    key(logo, 70, scale=(0.0001, 0.0001, 0.0001))
    key(logo, 84, scale=(1.08, 1.08, 1.08))
    key(logo, 90, scale=(1, 1, 1))
    season = text(f'{title}' + (f'  ·  {subtitle}' if subtitle else ''), 0.38, CYAN, 4.0)
    season.rotation_euler = (math.radians(90), 0, 0)
    season.location = (0, -2, wall_h / 2 - 0.35)
    key(season, 96, scale=(0.0001, 0.0001, 0.0001))
    key(season, 108, scale=(1, 1, 1))
    cam_at(150, 0, -14, wall_h / 2 + 1.5)
    # the title steps up so the wall can come up below it
    TOP = wall_h / 2
    key(logo, 170, location=(0, -2, TOP + 0.6))
    key(logo, 196, location=(0, -2, TOP + 2.4))
    key(season, 170, location=(0, -2, TOP - 0.35))
    key(season, 196, location=(0, -2, TOP + 1.45))
    key(eye, 170, location=(0, -2, TOP + 2.6), scale=(1, 1, 1))
    key(eye, 196, location=(0, -2, TOP + 4.1), scale=(0.62, 0.62, 0.62))
    # 8 s ─ the end of the cast: each houseguest, one at a time, the camera on them
    for c in cards:
        card_hidden(c, 1)
    start, per = 200, max(18, int((FRAMES - 200 - 130) / max(1, len(cards))))
    for i, c in enumerate(cards):
        f0 = start + i * per
        card_pop(c, f0, 10)
        cam_at(f0 - 4, c['x'], -5.4, c['z'] - 0.15)
        cam_at(f0 + per - 6, c['x'] + 0.25, -4.9, c['z'] - 0.15)
    # the last 5 s: pull back to the whole house under the eye
    end = FRAMES - 120
    # everything from the wall's foot to the top of the eye has to be in frame:
    # 35 mm on 16:9 sees about 1.03 x distance across and 0.58 x distance tall
    top, foot = TOP + 6.0, -wall_h / 2 - 0.8
    dist = max((top - foot) / 0.58 * 1.08, wall_w / 1.03 * 1.12)
    cam_at(end, 0, -9, 0)
    cam_at(FRAMES - 20, 0, -dist, (top + foot) / 2)
    key(logo, end, location=(0, -2, TOP + 2.4))
    key(eye, end, scale=(0.62, 0.62, 0.62))
    key(eye, FRAMES - 30, scale=(0.8, 0.8, 0.8))
else:
    # THE CLOSE: the whole house on the wall, a slow drift across it, then the
    # eye closes over the logo. No result of any kind is shown.
    for c in cards:
        card_hidden(c, 1)
    for i, c in enumerate(cards):
        card_pop(c, 6 + i * 4, 10)
    top, foot = wall_h / 2 + 4.6, -wall_h / 2 - 0.8
    dist = max((top - foot) / 0.58 * 1.08, wall_w / 1.03 * 1.12)
    cam_at(1, -wall_w * 0.12, -dist * 0.8, 0.0)
    cam_at(FRAMES - 150, wall_w * 0.12, -dist * 0.8, 0.0)
    logo = text('BIG BROTHER', 1.05, (1, 1, 1), 3.0, extrude=0.06)
    logo.rotation_euler = (math.radians(90), 0, 0)
    logo.location = (0, -3, wall_h / 2 + 1.8)
    season = text(f'{title}' + (f'  ·  {subtitle}' if subtitle else ''), 0.38, CYAN, 4.0)
    season.rotation_euler = (math.radians(90), 0, 0)
    season.location = (0, -3, wall_h / 2 + 0.95)
    eye, almond = build_eye((0, -3, wall_h / 2 + 3.6), 0.7)
    for ob in (logo, season):
        key(ob, FRAMES - 160, scale=(0.0001, 0.0001, 0.0001))
        key(ob, FRAMES - 140, scale=(1, 1, 1))
    key(eye, 1, scale=(0.7, 0.7, 0.7))
    cam_at(FRAMES - 120, 0, -dist, (top + foot) / 2)
    cam_at(FRAMES - 30, 0, -dist * 0.92, (top + foot) / 2 + 0.6)
    # the eye closes
    key(eye, FRAMES - 40, scale=(0.7, 0.7, 0.7))
    key(eye, FRAMES - 12, scale=(0.7, 0.7, 0.03))

# every move eases in and out
for ob in bpy.data.objects:
    ad = ob.animation_data
    if ad and ad.action:
        fcs = getattr(ad.action, 'fcurves', None)
        if fcs is None:
            try:
                fcs = [fc for layer in ad.action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
            except Exception:
                fcs = []
        for fc in fcs:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'

# ── glow: the compositor's glare on everything that emits ──────────────
try:
    ng = bpy.data.node_groups.new('glow', 'CompositorNodeTree')
    ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new('CompositorNodeRLayers')
    glare = ng.nodes.new('CompositorNodeGlare')
    for name, val in (('Type', 'Bloom'), ('Quality', 'Medium'), ('Threshold', 1.2), ('Strength', 0.8), ('Size', 0.6)):
        try:
            glare.inputs[name].default_value = val
        except Exception as e:
            print('glare', name, 'not set:', e)
    out = ng.nodes.new('NodeGroupOutput')
    ng.links.new(rl.outputs['Image'], glare.inputs['Image'])
    ng.links.new(glare.outputs['Image'], out.inputs[0])
    scene.compositing_node_group = ng
except Exception as e:
    print('compositor glow skipped:', e)

# ── output ─────────────────────────────────────────────────────────────
preview = CFG.get('preview')
if preview:
    scene.render.image_settings.file_format = 'PNG'
    for f in preview:
        scene.frame_set(int(f))
        scene.render.filepath = f"{CFG['out']}-{int(f):04d}.png"
        bpy.ops.render.render(write_still=True)
    sys.exit(0)

# the music, muxed into the video
se = scene.sequence_editor_create()
strips = se.strips if hasattr(se, 'strips') else se.sequences
if CFG.get('audio') and os.path.exists(CFG['audio']):
    snd = strips.new_sound('music', CFG['audio'], 1, 1)
    # the closing fades out over its last two seconds
    try:
        snd.volume = 1.0
        snd.keyframe_insert('volume', frame=max(1, FRAMES - 48))
        snd.volume = 0.0
        snd.keyframe_insert('volume', frame=FRAMES)
    except Exception:
        pass
try:
    scene.render.image_settings.media_type = 'VIDEO'   # Blender 5: video is its own media type
except Exception:
    pass
scene.render.image_settings.file_format = 'FFMPEG'
ff = scene.render.ffmpeg
ff.format = 'MPEG4'
ff.codec = 'H264'
ff.constant_rate_factor = 'MEDIUM'
ff.ffmpeg_preset = 'GOOD'
ff.audio_codec = 'AAC'
ff.audio_bitrate = 160
scene.render.filepath = CFG['out']
bpy.ops.render.render(animation=True)
if not os.path.exists(CFG['out']):
    sys.exit(1)

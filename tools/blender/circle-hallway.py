"""The Circle's visit hallway, rendered in Blender (2026-10-02).

Run inside Blender (Scripting tab, or the MCP bridge). It builds the set in a
scene of its own ("CircleHallway") and leaves every other scene alone, then
renders the three files the viewer uses (js/vp-ci/visit-stage.js HALL):

    assets/sets/circle/hallway.webp       the start still (and the clip's poster)
    assets/sets/circle/hallway-end.webp   the last frame, held after the walk
    assets/sets/circle/hallway-walk.mp4   the walk: 5 s, 24 fps, 1280x720, H.264

Set OUT to the repo's assets/sets/circle folder. The stills come out as PNG;
convert them with Pillow (quality 85 webp: about 28 KB each).

Lessons from building it, kept here so the next set does not relearn them:
- In this Blender (5.1) transform_apply() applies LOCATION too unless told
  not to: a box's origin moved to the world origin, and every later move or
  scale shifted the geometry far from where it stood. Always pass
  location=False, rotation=False.
- AgX turns bright emission white: keep neon strengths moderate, colours
  fully saturated, and add the glow in the compositor (Glare, Fog Glow).
- A still scaled with CSS only wobbles in place; a walk has to be a camera
  move, so the doors pass.
"""
import bpy, math, os

OUT = r"C:\path\to\repo\assets\sets\circle"   # set before running
W, H, L = 4.4, 3.0, 18.0                       # hall width, height, length (runs along +Y)

sc = bpy.data.scenes.get('CircleHallway') or bpy.data.scenes.new('CircleHallway')
bpy.context.window.scene = sc
for o in list(sc.collection.all_objects):
    bpy.data.objects.remove(o, do_unlink=True)


def principled(name, color, rough=0.5, emit=None, strength=0.0, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m


def neon(name, strength, axis):
    """The Circle's gradient: hot pink -> violet -> cyan along one axis."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB'); el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, (1.0, 0.05, 0.45, 1)
    el[1].position, el[1].color = 1.0, (0.0, 0.75, 1.0, 1)
    el.new(0.5).color = (0.42, 0.10, 1.0, 1)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = strength
    nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
    nt.links.new(sep.outputs[axis], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m


def box(name, loc, size, m):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(m)
    return o


M = {
    'wall': principled('ciWall', (0.93, 0.91, 0.99), 0.6),
    'floor': principled('ciFloor', (0.62, 0.61, 0.76), 0.18),
    'ceil': principled('ciCeil', (0.97, 0.96, 1.0), 0.7, emit=(0.95, 0.93, 1.0), strength=0.25),
    'runner': principled('ciRunner', (0.025, 0.02, 0.09), 0.55),
    'far': principled('ciFar', (0.10, 0.07, 0.32), 0.6),
    'door': principled('ciDoor', (0.035, 0.04, 0.16), 0.35),
    'panel': principled('ciPanel', (0.07, 0.08, 0.27), 0.3),
    'frame': principled('ciFrame', (0.98, 0.98, 1.0), 0.4),
    'gold': principled('ciGold', (1.0, 0.72, 0.15), 0.25, metal=0.9),
    'digit': principled('ciPlateText', (0.10, 0.06, 0.0), 0.6),
    'sconce': principled('ciSconce', (1, 0.95, 0.8), 0.5, emit=(1.0, 0.92, 0.70), strength=9),
    'strip': principled('ciStrip', (1, 1, 1), 0.5, emit=(1.0, 0.97, 0.88), strength=7),
    'leaf': principled('ciLeaf', (0.12, 0.55, 0.30), 0.6),
    'pot': principled('ciPot', (0.97, 0.97, 1.0), 0.4),
    'neon': neon('ciNeonWall', 6.0, 'Y'),
    'ring': neon('ciNeonRing', 10.0, 'X'),
}

box('Floor', (0, L / 2, -0.05), (W, L, 0.1), M['floor'])
box('Ceiling', (0, L / 2, H + 0.05), (W, L, 0.1), M['ceil'])
box('WallL', (-W / 2 - 0.05, L / 2, H / 2), (0.1, L, H), M['wall'])
box('WallR', (W / 2 + 0.05, L / 2, H / 2), (0.1, L, H), M['wall'])
box('FarWall', (0, L + 0.05, H / 2), (W, 0.1, H), M['far'])
box('Runner', (0, L / 2, 0.006), (1.5, L, 0.012), M['runner'])
for x in (-0.8, 0.8):
    box(f'RunnerNeon{x}', (x, L / 2, 0.016), (0.08, L, 0.022), M['neon'])
for sx in (-1, 1):
    box(f'StripeLow{sx}', (sx * (W / 2 - 0.012), L / 2, 1.28), (0.025, L, 0.13), M['neon'])
    box(f'StripeHigh{sx}', (sx * (W / 2 - 0.012), L / 2, H - 0.16), (0.025, L, 0.06), M['neon'])
for i in range(8):
    box(f'CeilStrip{i}', (0, 1.2 + i * 2.2, H - 0.005), (1.8, 0.35, 0.02), M['strip'])

# six doors, three a side; odd numbers on the left
for i, (sx, y) in enumerate([(-1, 3.2), (1, 3.2), (-1, 8.0), (1, 8.0), (-1, 12.8), (1, 12.8)]):
    n, wallface, inward = i + 1, sx * (W / 2), -sx
    box(f'Frame{n}', (wallface + inward * 0.03, y, 1.12), (0.06, 1.25, 2.3), M['frame'])
    box(f'Door{n}', (wallface + inward * 0.065, y, 1.08), (0.03, 1.05, 2.14), M['door'])
    face = wallface + inward * 0.08
    box(f'PanelLo{n}', (face + inward * 0.004, y, 0.62), (0.008, 0.74, 0.6), M['panel'])
    box(f'PanelHi{n}', (face + inward * 0.004, y, 1.52), (0.008, 0.74, 0.72), M['panel'])
    box(f'Plate{n}', (face + inward * 0.008, y, 1.95), (0.016, 0.34, 0.22), M['gold'])
    bpy.ops.object.text_add(location=(face + inward * 0.018, y, 1.95))
    t = bpy.context.active_object; t.name = f'Num{n}'
    t.data.body = str(n); t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.size = 0.17; t.data.extrude = 0.003
    t.rotation_euler = (math.radians(90), 0, math.radians(90 if sx < 0 else -90))
    t.data.materials.append(M['digit'])
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(face + inward * 0.035, y + (0.4 if sx < 0 else -0.4), 1.02))
    bpy.context.active_object.name = f'Knob{n}'; bpy.context.active_object.data.materials.append(M['gold'])
    box(f'Sconce{n}', (wallface + inward * 0.04, y, 2.5), (0.06, 0.34, 0.08), M['sconce'])

# the Circle on the far wall, and two plants
bpy.ops.mesh.primitive_torus_add(major_radius=0.62, minor_radius=0.075, location=(0, L - 0.02, 1.62), rotation=(math.radians(90), 0, 0))
ring = bpy.context.active_object; ring.name = 'CircleRing'; ring.data.materials.append(M['ring'])
ring.scale = (1.45, 1.45, 1.6)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0, L - 0.05, 1.62 + 0.62 * 1.45))
bpy.context.active_object.name = 'RingDot'; bpy.context.active_object.data.materials.append(M['strip'])
for x in (-1.55, 1.55):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=0.5, location=(x, L - 0.45, 0.25))
    bpy.context.active_object.data.materials.append(M['pot'])
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.42, subdivisions=2, location=(x, L - 0.45, 0.85))
    lf = bpy.context.active_object; lf.scale = (1, 1, 1.25); lf.data.materials.append(M['leaf'])

# lights, world, camera
for name, energy, y, color in (('Fill', 330, 6, (0.95, 0.93, 1.0)), ('Fill2', 260, 13, (1, 1, 1))):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.size = 3.5; ld.color = color
    lo = bpy.data.objects.new(name, ld); sc.collection.objects.link(lo); lo.location = (0, y, H - 0.2)
ld = bpy.data.lights.new('FarFill', 'AREA'); ld.energy = 120; ld.size = 3.0; ld.color = (0.8, 0.7, 1.0)
lo = bpy.data.objects.new('FarFill', ld); sc.collection.objects.link(lo)
lo.location = (0, 15.8, 1.6); lo.rotation_euler = (-math.pi / 2, 0, 0)
world = bpy.data.worlds.get('ciWorld') or bpy.data.worlds.new('ciWorld'); sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.52, 0.65, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.12
cam = bpy.data.cameras.new('HallCam'); cam.lens = 22
co = bpy.data.objects.new('HallCam', cam); sc.collection.objects.link(co)
co.rotation_euler = (math.radians(90), 0, 0); sc.camera = co

# the walk: eased, with a slight bob, ending between doors 5 and 6
sc.frame_start, sc.frame_end = 1, 120
sc.render.fps = 24
y0, y1 = 0.4, 7.9
for f in range(1, 121, 4):
    t = (f - 1) / 119; e = t * t * (3 - 2 * t)
    co.location = (0, y0 + (y1 - y0) * e, 1.55 + 0.018 * math.sin(t * math.pi * 7))
    co.keyframe_insert('location', frame=f)
co.location = (0, y1, 1.55); co.keyframe_insert('location', frame=120)

# look: AgX Punchy, and a fog glow on what is bright
r = sc.render
r.engine = 'BLENDER_EEVEE'
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Punchy'
sc.view_settings.exposure = -0.35
sc.eevee.taa_render_samples = 48
g = bpy.data.node_groups.new('ciComp', 'CompositorNodeTree')
sc.compositing_node_group = g
g.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
gout = g.nodes.new('NodeGroupOutput'); rl = g.nodes.new('CompositorNodeRLayers'); gl = g.nodes.new('CompositorNodeGlare')
gl.inputs['Type'].default_value = 'Fog Glow'
for k, v in (('Threshold', 0.45), ('Strength', 1.2), ('Size', 0.75), ('Saturation', 1.5), ('Quality', 'High')):
    gl.inputs[k].default_value = v
g.links.new(rl.outputs['Image'], gl.inputs['Image']); g.links.new(gl.outputs['Image'], gout.inputs[0])


def still(frame, name):
    r.image_settings.media_type = 'IMAGE'; r.image_settings.file_format = 'PNG'
    r.resolution_x, r.resolution_y = 1600, 900
    sc.frame_set(frame); r.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)


still(1, 'hallway.png')
still(120, 'hallway-end.png')
r.resolution_x, r.resolution_y = 1280, 720
r.image_settings.media_type = 'VIDEO'; r.image_settings.file_format = 'FFMPEG'
r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
r.ffmpeg.constant_rate_factor = 'MEDIUM'; r.ffmpeg.ffmpeg_preset = 'GOOD'; r.ffmpeg.audio_codec = 'NONE'
sc.eevee.taa_render_samples = 24
r.filepath = os.path.join(OUT, 'hallway-walk')
bpy.ops.render.render(animation=True)

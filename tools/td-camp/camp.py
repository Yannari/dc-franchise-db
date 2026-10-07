# ══════════════════════════════════════════════════════════════════════
# tools/td-camp/camp.py — every Total Drama venue's spots, built and rendered in Blender
# ══════════════════════════════════════════════════════════════════════
#
# The stepped viewer (spec docs/superpowers/specs/2026-10-06-td-stepped-viewer-design.md §6)
# stages each camp scene at the spot the engine says it happened (js/camp-access.js
# ACCESS_PROFILES). Every spot of every venue is a render here, painted the way the shows
# paint their backgrounds (paint_kit.py): flat two-tone colour with a dry-brush mottle, no
# outline on scenery, layered cut-out pines, hills and clouds. Each venue lives in
# venues/<venue>.py, built against the real plates from the Total Drama and Disventure Camp wikis.
#
# Run headless (relative outdirs resolve to C:\ in headless Blender: pass absolute):
#   "/c/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b -P tools/td-camp/camp.py -- <venue|all> [spot|all] [day|night|all] [preview]
# Output: assets/sets/td/<venue>/<spot>-<day|night>.webp, 1920x1080.
import bpy, bmesh, math, os, sys, random
from mathutils import Vector

REPO = r'C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db'
exec(open(os.path.join(REPO, 'tools', 'bb-house', 'house.py'), encoding='utf-8').read(), globals())
OUT_TD = os.path.join(REPO, 'assets', 'sets', 'td')

NIGHT_TINT = 0.55   # how much darker the painted colours are at night (the moon is weak)

def C(hexcol, tod, k=None):
    """A colour for this time of day: night darkens and cools it a little, never to black."""
    if tod == 'day':
        return hexcol
    r, g, b = (int(hexcol.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    k = NIGHT_TINT if k is None else k
    r, g, b = r * k * 0.92, g * k * 0.95, b * k * 1.12
    return '#%02x%02x%02x' % tuple(max(24, min(255, int(v))) for v in (r, g, b))

_n = [0]
def uid(base):
    _n[0] += 1
    return f'{base}.{_n[0]:03d}'

def icorock(name, size, loc, color, seed=1, rot_z=0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    rnd = random.Random(seed)
    for v in bm.verts:
        v.co *= 0.8 + rnd.random() * 0.35
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me))
    ob.location = loc; ob.scale = size; ob.rotation_euler = (0, 0, math.radians(rot_z))
    me.materials.append(mat(name.split('.')[0] + 'Mat', color, rough=0.9))
    return ob

def string_lights(p0, p1, n=14, sag=0.6, tod='night', colors=('#ffd27a', '#ff8a6a', '#8ad0ff', '#b8ff8a')):
    for i in range(n + 1):
        t = i / n
        x = p0[0] + (p1[0] - p0[0]) * t; y = p0[1] + (p1[1] - p0[1]) * t
        zz = p0[2] + (p1[2] - p0[2]) * t - sag * 4 * t * (1 - t)
        col = colors[i % len(colors)]
        sphere(uid('Bulb'), 0.07, (x, y, zz), mat('Bulb' + col, col, emit=col if tod == 'night' else None, strength=4.0 if tod == 'night' else 0))

def post(loc, h=3.0, tod='day', r=0.08, color='#7a5232'):
    cyl(uid('Post'), r, h, (loc[0], loc[1], loc[2] + h / 2), mat('Post' + color + tod, C(color, tod)), verts=10, bevel=0)

def lamp_post(loc, h=3.2, tod='day', glow='#ffd27a'):
    post(loc, h, tod, r=0.06, color='#4a4a52')
    sphere(uid('LampGlobe'), 0.22, (loc[0], loc[1], loc[2] + h + 0.1), mat('LampGlobe' + tod, '#fff1c8' if tod == 'night' else '#e9e4d6', emit='#fff1c8' if tod == 'night' else None, strength=4 if tod == 'night' else 0))
    if tod == 'night':
        point(uid('LampLight'), (loc[0], loc[1], loc[2] + h), 280, glow, radius=0.2)

def tv_camera(loc=(0, -11, 1.7), look=(0, 6, 1.2), lens=28):
    cam = camera(loc, (0, 0, 0), lens=lens)
    d = Vector(look) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return cam

def render_spot(venue, spot, tod, preview=False, w=1920, h=1080):
    sc = bpy.context.scene
    for ob in sc.objects:
        for md in list(ob.modifiers):
            if md.type == 'BEVEL': ob.modifiers.remove(md)
        if ob.type == 'CAMERA': ob.data.dof.use_dof = False
    L = dict(TD_LOOKS['b'])
    for m in bpy.data.materials:
        if m.use_nodes and m.users: _td_material(m, L)
    noink = bpy.data.collections.get('NoInk') or bpy.data.collections.new('NoInk')
    if noink.name not in sc.collection.children: sc.collection.children.link(noink)
    painted = PAINT['on']
    for ob in list(sc.collection.objects):
        if painted:
            if not ob.get('ink'): noink.objects.link(ob)
            continue
        if ob.name.startswith(NOINK + ('Star', 'Moon', 'Flame', 'Hill', 'Ground', 'Water', 'PineTier', 'Frond', 'Bush', 'Ember', 'Fly', 'Bulb', 'Leaf')) \
                or (ob.name.startswith('Pine') and 'far' in (ob.active_material.name if ob.active_material else '')):
            noink.objects.link(ob)
    thick = L['thick'] * (0.55 if preview else 1.0) * (0.7 if painted else 1.0)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = thick
    vl = bpy.context.view_layer; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    if not fs.linesets: fs.linesets.new('Ink')
    ls = fs.linesets[0]
    ls.select_by_visibility = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True; ls.select_external_contour = True
    ls.select_by_collection = True; ls.collection = noink; ls.collection_negation = 'EXCLUSIVE'
    st = ls.linestyle
    for md in list(st.color_modifiers): st.color_modifiers.remove(md)
    st.thickness = thick; st.color = (0.1, 0.08, 0.1)
    cm = st.color_modifiers.new('fromMaterial', 'MATERIAL'); cm.material_attribute = 'LINE'; cm.blend = 'MIX'; cm.influence = 1.0
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 24 if preview else 80
    sc.render.resolution_x, sc.render.resolution_y = (w // 2, h // 2) if preview else (w, h)
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 88
    d = os.path.join(OUT_TD, venue); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f'{spot}-{tod}{"-preview" if preview else ""}.webp')
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path

# Spots seen by day and by night. Indoor spots render once; the ceremony and the exit are always at night.
SCENES = {}
OUTDOOR = {}
NIGHT_ONLY = {'ceremony', 'exit'}

# The painted look (the show's backgrounds): materials, cut-outs, sky. See paint_kit.py.
exec(open(os.path.join(REPO, 'tools', 'td-camp', 'paint_kit.py'), encoding='utf-8').read(), globals())

# Every venue lives in its own file (venues/<venue>.py) and adds itself to SCENES / OUTDOOR.
import glob as _glob
for _vf in sorted(_glob.glob(os.path.join(REPO, 'tools', 'td-camp', 'venues', '*.py'))):
    exec(open(_vf, encoding='utf-8').read(), globals())

def run(venue, spot='all', tods='all', preview=False):
    out = []
    venues = SCENES if venue == 'all' else {venue: SCENES[venue]}
    for v, spots in venues.items():
        for s, fn in spots.items():
            if spot != 'all' and s != spot: continue
            both = ('day', 'night') if s in OUTDOOR.get(v, set()) else (('night',) if s in NIGHT_ONLY else ('day',))
            for tod in both if tods == 'all' else (tods,):
                clear(); _MATS.clear(); _n[0] = 0; PAINT['on'] = False
                for c in list(bpy.data.collections): bpy.data.collections.remove(c)
                fn(tod)
                out.append(render_spot(v, s, tod, preview=preview))
                print('RENDERED', out[-1])
    return out

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    run(argv[0] if argv else 'hosted-camp', argv[1] if len(argv) > 1 else 'all', argv[2] if len(argv) > 2 else 'all', 'preview' in argv)

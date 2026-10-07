# ══════════════════════════════════════════════════════════════════════
# tools/td-camp/paint_kit.py — the painted look of the Total Drama backgrounds
# ══════════════════════════════════════════════════════════════════════
# The show's backgrounds (Camp Wawanakwa, the film lot, Pahkitew, Stawaki) are painted,
# not drawn: flat colour in two tones (lit and shade), a dry-brush mottle, no black
# outline on scenery, thin dark lines only on buildings and props. Depth comes from
# layers of flat cut-outs — angular pines in navy, blue and teal, purple mountains with
# jagged pine tops, flat-topped pines on bare trunks, a dark twisted pine framing the
# edge — over a sky with curly clouds and a swirly sun.
#
# Everything here builds on house.py's helpers. A painted scene calls paint_mode() first;
# render_spot then inks only objects marked ob['ink'] = 1.

PAINT = {'on': False}

# ── The live layer. What moves in a scene (fire, clouds, smoke, bulbs, water) is not baked into
# the plate: each is recorded as a MARK, projected to the frame and written beside the image as
# <spot>-<tod>.json, and the viewer animates a painted sprite there. Marks also say where people
# can be: 'seat' (a stump, a bench, a log) and 'stand' (open floor in shot).
MARKS = []
LIVE = {'on': True}        # False only while rendering the sprites themselves
NEED_SPRITES = set()


def mark(kind, loc, parent=None, **kw):
    MARKS.append(dict(kind=kind, loc=tuple(loc), parent=parent, **kw))


def stand(x, y, z=0.0, **kw):
    mark('stand', (x, y, z), **kw)


def seat(x, y, z, **kw):
    mark('seat', (x, y, z), **kw)

def paint_mode():
    PAINT['on'] = True


def _mix_hex(a, b, t):
    a = [int(a.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(b.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _dark(c, k=0.72):
    return _mix_hex(c, '#1a1424', 1 - k)


def pmat(name, lit, shade=None, mottle=0.35, mscale=4.0, unlit=False, alpha=1.0, line=None):
    """A painted material: two tones split by the light (shadows included), a soft
    dry-brush mottle on top, emitted flat so nothing else shades it."""
    key = ('P', name)
    if key in _MATS and _MATS[key].name in bpy.data.materials:
        return _MATS[key]
    shade = shade or _mix_hex(lit, '#3a2a5a', 0.28)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear(); L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    if unlit:
        col_sock = None
        base = nt.nodes.new('ShaderNodeRGB'); base.outputs[0].default_value = hexc(lit)
        col_sock = base.outputs[0]
    else:
        dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
        s2r = nt.nodes.new('ShaderNodeShaderToRGB'); L.new(dif.outputs[0], s2r.inputs[0])
        bw = nt.nodes.new('ShaderNodeRGBToBW'); L.new(s2r.outputs[0], bw.inputs[0])
        step = nt.nodes.new('ShaderNodeValToRGB'); step.color_ramp.interpolation = 'LINEAR'
        e = step.color_ramp.elements; e[0].position, e[0].color = 0.16, (0, 0, 0, 1); e[1].position, e[1].color = 0.2, (1, 1, 1, 1)
        L.new(bw.outputs[0], step.inputs[0])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        mix.inputs['A'].default_value = hexc(shade); mix.inputs['B'].default_value = hexc(lit)
        L.new(step.outputs[0], mix.inputs['Factor'])
        col_sock = mix.outputs['Result']
    if mottle > 0:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = mscale; nz.inputs['Detail'].default_value = 6.0
        nz.inputs['Roughness'].default_value = 0.75
        L.new(tc.outputs['Object'], nz.inputs['Vector'])
        r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
        e = r.color_ramp.elements; e[0].position, e[0].color = 0.0, (0, 0, 0, 1); e[1].position, e[1].color = 0.56, (1, 1, 1, 1)
        L.new(nz.outputs['Fac'], r.inputs[0])
        f = nt.nodes.new('ShaderNodeMath'); f.operation = 'MULTIPLY'; f.inputs[1].default_value = mottle
        L.new(r.outputs[0], f.inputs[0])
        mm = nt.nodes.new('ShaderNodeMix'); mm.data_type = 'RGBA'; mm.blend_type = 'MULTIPLY'
        L.new(f.outputs[0], mm.inputs['Factor']); L.new(col_sock, mm.inputs['A'])
        mm.inputs['B'].default_value = hexc(_mix_hex('#ffffff', '#6a5a7a', 0.45))
        col_sock = mm.outputs['Result']
    em = nt.nodes.new('ShaderNodeEmission'); L.new(col_sock, em.inputs['Color']); em.inputs['Strength'].default_value = 1.0
    if alpha < 1:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
        mx.inputs['Fac'].default_value = alpha
        L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs['Surface'])
        try: m.surface_render_method = 'BLENDED'
        except Exception: m.blend_method = 'BLEND'
    else:
        L.new(em.outputs[0], out.inputs['Surface'])
    m.line_color = hexc(line or _dark(lit, 0.45))
    _MATS[key] = m
    return m


def inked(ob):
    ob['ink'] = 1
    for c in ob.children: c['ink'] = 1
    return ob


# ── flat cut-outs, standing up and facing the camera (which looks along +y) ──
def card(name, pts, y, material, x=0.0, z=0.0, rot_z=0.0, shadow=False):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((px, 0, pz)) for px, pz in pts]
    try:
        bm.faces.new(vs)
    except ValueError:
        pass
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); ob.location = (x, y, z); ob.rotation_euler = (0, 0, math.radians(rot_z))
    me.materials.append(material)
    ob.visible_shadow = shadow
    return ob


def _blob_pts(rx, rz, n=40, wob=0.12, seed=0, flat_bottom=False):
    rnd = random.Random(seed); pts = []
    ph = [rnd.random() * 6.28 for _ in range(3)]
    for i in range(n):
        a = i / n * 2 * math.pi
        k = 1 + wob * (math.sin(a * 3 + ph[0]) * .5 + math.sin(a * 5 + ph[1]) * .3 + math.sin(a * 9 + ph[2]) * .2)
        x, z = math.cos(a) * rx * k, math.sin(a) * rz * k
        if flat_bottom and z < -rz * 0.35: z = -rz * 0.35
        pts.append((x, z))
    return pts


def pine_card(x, y, h, w, col, seed=0, teeth=4, lean=0.0, z=0.0, alpha=1.0, name='PineCard'):
    """The show's background pine: a tall narrow triangle, its sides cut by a few sharp teeth."""
    rnd = random.Random(seed)
    m = pmat('PineCard' + col + str(alpha), col, unlit=True, mottle=0.0, alpha=alpha)
    left, right = [], []
    for k in range(teeth + 1):
        t = k / teeth                                    # 0 at the tip, 1 at the base
        zz = h * (1 - t)
        half = w / 2 * t
        jag = w * 0.16 * (0.6 + rnd.random() * 0.6)
        right.append((half + lean * (1 - t), zz)); left.append((-half + lean * (1 - t), zz))
        if 0 < k < teeth:
            right.append((half - jag + lean * (1 - t), zz - h * 0.02)); left.append((-half + jag + lean * (1 - t), zz - h * 0.02))
    pts = [(lean, h)] + right[1:] + [(w * 0.04, 0), (-w * 0.04, 0)] + list(reversed(left[1:]))
    return card(uid(name), pts, y, m, x=x, z=z)


def ridge_card(y, x0, x1, base, height, col, seed=0, humps=4, teeth=0, tooth_col=None, z=-1.0, alpha=1.0):
    """A mountain range as one flat shape: soft humps, optionally with a band of pine teeth along the top."""
    rnd = random.Random(seed); n = 120; pts = []
    ph = [rnd.random() * 6.28 for _ in range(3)]
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t
        hh = base + height * (0.55 + 0.3 * math.sin(t * humps * math.pi + ph[0]) + 0.15 * math.sin(t * humps * 2.3 * math.pi + ph[1]))
        pts.append((x, hh))
    poly = [(x0, z - 2)] + pts + [(x1, z - 2)]
    card(uid('Hill'), poly, y, pmat('Ridge' + col + str(alpha), col, unlit=True, mottle=0.0, alpha=alpha), z=0)
    if teeth:
        tc = tooth_col or _mix_hex(col, '#1a1424', 0.18)
        for i in range(teeth):
            t = (i + rnd.random() * 0.6) / teeth; x = x0 + (x1 - x0) * t
            hh = base + height * (0.55 + 0.3 * math.sin(t * humps * math.pi + ph[0]) + 0.15 * math.sin(t * humps * 2.3 * math.pi + ph[1]))
            s = (x1 - x0) / teeth * (0.9 + rnd.random() * 0.8)
            pine_card(x, y - 0.05, s * 2.2, s, tc, seed=seed * 100 + i, teeth=2, z=hh - s * 0.9, alpha=alpha, name='HillPine')


def umbrella_pine(x, y, h, col='#3f5a3a', trunk='#4a2e22', seed=0, s=1.0):
    """The flat-topped pine of the show: a bare trunk, short branches, two to four flat discs of needles."""
    rnd = random.Random(seed)
    tm = pmat('Trunk' + trunk, trunk, unlit=True, mottle=0)
    card(uid('Trunk'), [(-0.14 * s, 0), (0.14 * s, 0), (0.06 * s, h), (-0.06 * s, h)], y, tm, x=x)
    for k in range(rnd.randint(2, 4)):
        zz = h * (0.55 + k * 0.15); dx = rnd.uniform(-0.9, 0.9) * s
        w = (1.2 + rnd.random() * 1.0) * s; hh = 0.34 * s
        card(uid('Branch'), [(0, zz - 0.35 * s), (dx, zz - 0.04), (dx, zz + 0.04), (0, zz - 0.22 * s)], y + 0.01, tm, x=x)
        card(uid('Disc'), _blob_pts(w, hh, 28, 0.2, seed + k * 7, flat_bottom=True), y - 0.02 - k * 0.01,
             pmat('Disc' + col, col, mottle=0.5, mscale=3, unlit=True), x=x + dx, z=zz)


def crown_tree(x, y, h, crown_col, trunk='#5a3a28', seed=0, s=1.0, birch=False):
    """A round-crowned tree: a mottled blob of leaves on a trunk; a birch has a white trunk and white branches."""
    rnd = random.Random(seed)
    tcol = '#dcd8cc' if birch else trunk
    tw = 0.07 if birch else 0.14
    card(uid('Trunk'), [(x - tw * s, 0), (x + tw * s, 0), (x + tw * 0.5 * s, h * 0.8), (x - tw * 0.5 * s, h * 0.8)], y + 0.02, pmat('Trunk' + tcol, tcol, unlit=True, mottle=0))
    card(uid('Crown'), _blob_pts(1.3 * s, 1.1 * s, 40, 0.16, seed), y, pmat('Crown' + crown_col, crown_col, mottle=0.55, mscale=2.5, unlit=True), x=x, z=h * 0.8)
    if birch:
        for k in range(4):
            a = rnd.uniform(-1.1, 1.1); L = (0.8 + rnd.random() * 0.6) * s; z0 = h * (0.5 + rnd.random() * 0.3)
            x1, z1 = x + math.sin(a) * L, z0 + math.cos(a) * L
            card(uid('BirchBranch'), [(x - 0.03, z0), (x + 0.03, z0), (x1 + 0.015, z1), (x1 - 0.015, z1)], y - 0.03, pmat('Trunk' + tcol, tcol, unlit=True, mottle=0))


def twisted_pine(x, y, h, col='#26324a', seed=0, s=1.0, flip=False):
    """The dark framing pine: a leaning, kinked trunk with long flat clouds of needles that droop at the ends."""
    rnd = random.Random(seed); f = -1 if flip else 1
    m = pmat('Twisted' + col, col, unlit=True, mottle=0.25, mscale=2)
    pts = [(-0.3 * s, 0), (0.3 * s, 0), (0.25 * s + f * 0.3 * s, h * 0.4), (0.15 * s - f * 0.2 * s, h * 0.7), (0.08 * s + f * 0.3 * s, h),
           (-0.08 * s + f * 0.3 * s, h), (-0.15 * s - f * 0.2 * s, h * 0.7), (-0.25 * s + f * 0.3 * s, h * 0.4)]
    card(uid('TwTrunk'), pts, y, m, x=x)
    for k in range(4):
        zz = h * (0.42 + k * 0.17); w = (2.8 - k * 0.5) * s
        cx = x + f * (0.5 + rnd.random() * 0.8) * s * (1 if k % 2 == 0 else -0.6)
        n = 40; pts = []
        for i in range(n + 1):                         # the top edge: a low wavy arc
            t = i / n; xx = -w / 2 + w * t
            pts.append((xx, 0.28 * s * math.sin(t * math.pi) ** 0.6 + 0.05 * s * math.sin(t * 13 + k)))
        for i in range(n, -1, -1):                     # the underside sags, and droops into a tail at both ends
            t = i / n; xx = -w / 2 + w * t
            droop = 0.45 * s * (max(0, (abs(t - 0.5) - 0.32)) / 0.18) ** 1.5
            pts.append((xx + (0.15 * s if t > 0.5 else -0.15 * s) * (droop / (0.45 * s + 1e-6)), -0.1 * s * math.sin(t * math.pi) - droop))
        card(uid('TwCloud'), pts, y - 0.01, m, x=cx, z=zz)


def curly_cloud(x, y, z, s, col='#eef3fb', rim='#b9c6e0'):
    """A cartoon cloud: a few puffs on a flat base, a rim of a darker blue behind, a curl at one end.
    Live: the viewer drifts the cloud sprite across the sky from the mark."""
    if LIVE['on']:
        mark('cloud', (x, y, z), size=s, sprite='cloud-curly-%s-%s' % (col[1:], rim[1:]))
        NEED_SPRITES.add(('cloud', 'curly', col, rim))
        return
    base = pmat('Cloud' + col, col, unlit=True, mottle=0); rm = pmat('CloudRim' + rim, rim, unlit=True, mottle=0)
    puffs = ((-1.2, 0, 0.7), (-0.3, 0.35, 0.95), (0.7, 0.15, 0.8), (1.5, -0.05, 0.55))
    for (px, pz, r) in puffs:
        card(uid('CloudPuff'), _blob_pts(r * s, r * s * 0.8, 24, 0.0, 0), y, base, x=x + px * s, z=z + pz * s)
        card(uid('CloudPuff'), _blob_pts(r * s * 1.1, r * s * 0.9, 24, 0.0, 0), y + 0.05, rm, x=x + px * s, z=z + pz * s - 0.06 * s)
    card(uid('CloudBase'), [(-1.55 * s, -0.42 * s), (1.75 * s, -0.42 * s), (1.75 * s, 0.1 * s), (-1.55 * s, 0.1 * s)], y - 0.01, base, x=x, z=z)


def swirl_sun(x, y, z, s, tod='day'):
    """The show's sun: a pale disc, concentric soft rings, and wide translucent shafts of light."""
    if tod == 'night':
        card(uid('Moon'), _blob_pts(s, s, 48, 0, 0), y, pmat('MoonP', '#f6eec0', unlit=True, mottle=0), x=x, z=z)
        return
    for k, (r, a) in enumerate(((2.6, 0.12), (1.9, 0.18), (1.35, 0.28))):
        card(uid('SunRing'), _blob_pts(r * s, r * s, 48, 0.03, k), y + 0.1 + k * 0.01, pmat('SunRing' + str(k), '#fdf6c8', unlit=True, mottle=0, alpha=a), x=x, z=z)
    card(uid('Sun'), _blob_pts(s, s, 48, 0, 0), y, pmat('SunP', '#fffbe2', unlit=True, mottle=0), x=x, z=z)
    for k, (w, rot) in enumerate(((3.4, -24), (2.2, -38))):
        sh = card(uid('Shaft'), [(-w * s / 2, -18 * s), (w * s / 2, -18 * s), (w * s / 2, 2 * s), (-w * s / 2, 2 * s)], y - 0.3 - k * 0.1,
                  pmat('Shaft' + str(k), '#fff8d0', unlit=True, mottle=0, alpha=0.13), x=x, z=z)
        sh.rotation_euler = (0, math.radians(rot), 0)


def paint_sky(top, low, horizon_z=0.0):
    """A plain two-colour sky gradient for the camera; flat light for everything else."""
    w = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear(); L = nt.links
    out = nt.nodes.new('ShaderNodeOutputWorld')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    grad = _ramp(nt, [(0.0, low), (0.3, top), (1.0, top)])
    bg = nt.nodes.new('ShaderNodeBackground')
    L.new(tc.outputs['Generated'], sep.inputs[0]); L.new(sep.outputs['Z'], grad.inputs['Fac'])
    L.new(grad.outputs['Color'], bg.inputs['Color'])
    L.new(bg.outputs[0], out.inputs['Surface'])


def paint_sun(azimuth=-35, elevation=40, energy=4.0):
    ld = bpy.data.lights.new('TDSun', 'SUN'); ld.energy = energy; ld.angle = math.radians(1.5)
    ob = _link(bpy.data.objects.new('TDSun', ld))
    ob.rotation_euler = (math.radians(90 - elevation), 0, math.radians(azimuth))
    return ob


def ground_plane(lit, shade=None, size=(220, 220), loc=(0, 60, 0), mottle=0.3, name='PGround'):
    return box(name, (size[0], size[1], 0.2), (loc[0], loc[1], loc[2] - 0.1), pmat(name + lit, lit, shade, mottle=mottle, mscale=0.35), bevel=0)


def brush_patch(name, r, loc, col, sx=1.0, sy=1.0, seed=0, mottle=0.25, z=0.012):
    """A worn patch of ground with a dry-brush edge."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    rnd = random.Random(seed); n = 96
    ph = [rnd.random() * 6.28 for _ in range(4)]
    vs = []
    for i in range(n):
        a = i / n * 2 * math.pi
        k = 1 + 0.10 * math.sin(a * 2 + ph[0]) + 0.06 * math.sin(a * 5 + ph[1]) + 0.035 * math.sin(a * 23 + ph[2]) + 0.025 * (rnd.random() - 0.5)
        vs.append(bm.verts.new((math.cos(a) * r * sx * k, math.sin(a) * r * sy * k, 0)))
    bm.faces.new(vs); bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(name, me)); ob.location = (loc[0], loc[1], z)
    me.materials.append(pmat(name.split('.')[0] + col, col, mottle=mottle, mscale=0.5))
    return ob


def flower(x, y, col='#e2943a'):
    pts = []
    for i in range(10):
        a = i / 10 * 2 * math.pi; r = 0.18 if i % 2 == 0 else 0.09
        pts.append((math.cos(a) * r, math.sin(a) * r))
    me = bpy.data.meshes.new('Flower'); bm = bmesh.new(); vs = [bm.verts.new((px, py, 0)) for px, py in pts]
    bm.faces.new(vs); bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(uid('Flower'), me)); ob.location = (x, y, 0.02)
    me.materials.append(pmat('Flower' + col, col, unlit=True, mottle=0))


def rock_shelf(x, y, w, d, h, col='#9a6e5a', seed=0, layers=3):
    """Layered sedimentary rock: flat slabs stacked a little offset, as the show paints its ledges."""
    rnd = random.Random(seed); obs = []
    for k in range(layers):
        ww = w * (1 - k * 0.18); dd = d * (1 - k * 0.15)
        ob = box(uid('Shelf'), (ww, dd, h / layers), (x + rnd.uniform(-.2, .2) * w * .2, y + k * d * 0.08, h / layers * (k + 0.5)),
                 pmat('Shelf' + col, col, _mix_hex(col, '#3a2a4a', 0.32), mottle=0.35, mscale=1.5), bevel=0)
        ob.rotation_euler = (0, 0, math.radians(rnd.uniform(-6, 6))); inked(ob); obs.append(ob)
    return obs


# ══════════════════════════════════════════════════════════════════════
# TDI CABIN — grey clapboard on cinder blocks, a patched orange shingle roof
# running down over the porch, rails, steps, a stovepipe.
# ══════════════════════════════════════════════════════════════════════
def tdi_cabin(loc, tod, rot_z=0, w=7.0, d=4.6, h=2.6, wall='#9a9a84', roof='#a85a2c', trim='#4f4630', stairs_side=1):
    x, y, z = loc
    N = (lambda c: c) if tod == 'day' else (lambda c: C(c, tod))
    wall, roof, trim = N(wall), N(roof), N(trim)
    g = _group(uid('TCabin'), loc, rot_z)
    lift = 0.7
    W = pmat('CabWall' + wall, wall, _mix_hex(wall, '#3a3a5a', 0.34), mottle=0.28, mscale=0.6)
    R = pmat('CabRoof' + roof, roof, _mix_hex(roof, '#3a1a3a', 0.38), mottle=0.3, mscale=0.7)
    Rp = pmat('CabRoofP' + roof, _mix_hex(roof, '#2a1020', 0.18), _mix_hex(roof, '#3a1a3a', 0.45), mottle=0.2, mscale=1.2)
    T = pmat('CabTrim' + trim, trim, _dark(trim, .7), mottle=0.15)
    G = pmat('CabBlock' + tod, N('#8e8c86'), N('#64627a'), mottle=0.2)
    S = pmat('CabSeam', _mix_hex(wall, '#2a2a3a', 0.35), unlit=True, mottle=0)
    def add(ob, ink=True):
        _child(g, ob)
        if ink: ob['ink'] = 1
        return ob
    add(box(uid('CabBody'), (w, d, h), (0, 0, lift + h / 2), W, bevel=0))
    for i in range(1, 10):                                   # clapboard seams on the front and the sides
        zz = lift + i * h / 10
        add(box(uid('Seam'), (w + 0.02, 0.02, 0.025), (0, -d / 2 - 0.005, zz), S, bevel=0), ink=False)
        for sx in (-1, 1):
            add(box(uid('Seam'), (0.02, d + 0.02, 0.025), (sx * (w / 2 + 0.005), 0, zz), S, bevel=0), ink=False)
    for xx in (-w / 2 + 0.3, 0, w / 2 - 0.3):               # cinder blocks
        for yy in (-d / 2 + 0.3, d / 2 - 0.3):
            add(box(uid('Block'), (0.45, 0.35, lift), (xx, yy, lift / 2), G, bevel=0))
    # gables
    for sx in (-1, 1):
        me = bpy.data.meshes.new('Gable'); bm = bmesh.new()
        v = [bm.verts.new(p) for p in ((sx * w / 2, -d / 2, lift + h), (sx * w / 2, d / 2, lift + h), (sx * w / 2, 0, lift + h + 1.5))]
        bm.faces.new(v); bm.to_mesh(me); bm.free()
        go = _link(bpy.data.objects.new(uid('Gable'), me)); me.materials.append(W); add(go)
    # roof: the front slope runs on down over the porch
    porch = 1.6
    import math as _m
    back = add(box(uid('RoofB'), (w + 0.7, d / 2 * 1.2, 0.16), (0, d * 0.28, lift + h + 0.78), R, bevel=0, rot=(-33, 0, 0)))
    front = add(box(uid('RoofF'), (w + 0.7, d / 2 * 1.2 + porch * 1.1, 0.16), (0, -d * 0.28 - porch * 0.45, lift + h + 0.78 - porch * 0.33), R, bevel=0, rot=(22, 0, 0)))
    rnd = random.Random(int(x * 10 + y))
    for k in range(7):                                       # patched shingles
        px = rnd.uniform(-w / 2 + 0.6, w / 2 - 0.6); py = rnd.uniform(0.1, 0.9)
        pz_y = -d * 0.28 - porch * 0.45 + (py - 0.5) * (d / 2 * 1.2 + porch * 1.1) * 0.9
        pz = lift + h + 0.78 - porch * 0.33 - (pz_y - (-d * 0.28 - porch * 0.45)) * math.tan(math.radians(22)) + 0.1
        add(box(uid('Shingle'), (rnd.uniform(0.5, 1.1), rnd.uniform(0.4, 0.8), 0.04), (px, pz_y, pz), Rp, bevel=0, rot=(22, 0, rnd.uniform(-4, 4))), ink=False)
    # porch deck, posts, rail with balusters, steps
    add(box(uid('Deck'), (w - 0.2, porch, 0.14), (0, -d / 2 - porch / 2, lift), T, bevel=0))
    for xx in (-w / 2 + 0.25, w / 2 - 0.25, -0.9, 0.9):
        add(box(uid('PorchPost'), (0.14, 0.14, h * 0.8), (xx, -d / 2 - porch + 0.1, lift + h * 0.4), T, bevel=0))
    for sxa, sxb in ((-w / 2 + 0.25, -0.9), (0.9, w / 2 - 0.25)):
        if (stairs_side > 0 and sxa > 0) or (stairs_side < 0 and sxa < 0):
            continue
        add(box(uid('Rail'), (sxb - sxa, 0.08, 0.08), ((sxa + sxb) / 2, -d / 2 - porch + 0.1, lift + 0.85), T, bevel=0))
        n = int((sxb - sxa) / 0.32)
        for i in range(n + 1):
            add(box(uid('Baluster'), (0.05, 0.05, 0.78), (sxa + i * (sxb - sxa) / n, -d / 2 - porch + 0.1, lift + 0.45), T, bevel=0), ink=False)
    sx0 = (0.9 + w / 2 - 0.25) / 2 * stairs_side
    for i in range(4):                                        # steps down off the porch
        add(box(uid('Step'), (1.6, 0.34, 0.1), (sx0, -d / 2 - porch - 0.17 - i * 0.32, lift - 0.17 - i * 0.17), T, bevel=0))
    for sx in (-0.85, 0.85):
        add(box(uid('StairRail'), (0.06, 1.5, 0.06), (sx0 + sx, -d / 2 - porch - 0.7, lift + 0.2), T, bevel=0, rot=(-28, 0, 0)))
    # door (screen door beside it), windows with green frames
    add(box(uid('Door'), (0.95, 0.06, 1.95), (0, -d / 2 - 0.03, lift + 0.98), pmat('CabDoor' + tod, N('#7a6a3a'), N('#5a4a2a'), mottle=0.3), bevel=0))
    scr = pmat('CabScreen' + tod, N('#7f8f62'), N('#5f6f44'), mottle=0.2)
    for xx in (-2.2, 2.2):
        add(box(uid('WinFrame'), (1.05, 0.06, 0.95), (xx, -d / 2 - 0.035, lift + 1.45), pmat('CabFrame' + tod, N('#5f6e34'), N('#4a5626'), mottle=0.1), bevel=0))
        add(box(uid('Pane'), (0.85, 0.07, 0.75), (xx, -d / 2 - 0.04, lift + 1.45), scr, bevel=0), ink=False)
    add(box(uid('ScreenDoor'), (0.85, 0.06, 1.9), (1.2, -d / 2 - 0.035, lift + 0.95), scr, bevel=0))
    add(box(uid('Vent'), (0.4, 0.06, 0.3), (-w / 2 - 0.03, 0, lift + h + 0.75), T, bevel=0, rot=(0, 0, 90)))
    add(cyl(uid('Stovepipe'), 0.13, 1.4, (-w * 0.2, d * 0.15, lift + h + 1.6), pmat('Pipe' + tod, N('#7a7a80'), N('#55556a'), mottle=0.1), verts=12, bevel=0))
    mark('smoke', (-w * 0.2, d * 0.15, lift + h + 2.5), parent=g)
    add(cyl(uid('PipeCap'), 0.26, 0.15, (-w * 0.2, d * 0.15, lift + h + 2.35), pmat('Pipe' + tod, N('#7a7a80'), N('#55556a'), mottle=0.1), verts=12, r2=0.05, bevel=0))
    return g


# ══════════════════════════════════════════════════════════════════════
# More of the kit: water, planks, signs, fire, torches, interiors.
# ══════════════════════════════════════════════════════════════════════
def N(c, tod):
    """A painted colour at this time of day (night darkens and cools it)."""
    return c if tod == 'day' else C(c, tod)


def pbox(name, size, loc, col, tod='day', shade=None, mottle=0.3, mscale=1.0, rot=(0, 0, 0), ink=True, unlit=False):
    ob = box(uid(name), size, loc, pmat(name + col + tod, N(col, tod), N(shade, tod) if shade else None, mottle=mottle, mscale=mscale, unlit=unlit), bevel=0, rot=rot)
    if ink: ob['ink'] = 1
    return ob


def pcyl(name, r, h, loc, col, tod='day', r2=None, verts=16, rot=(0, 0, 0), mottle=0.25, ink=True, unlit=False):
    ob = cyl(uid(name), r, h, loc, pmat(name + col + tod, N(col, tod), mottle=mottle, unlit=unlit), verts=verts, r2=r2, rot=rot, bevel=0)
    if ink: ob['ink'] = 1
    return ob


def ptext(text, loc, size, col, rot=(90, 0, 0)):
    cu = bpy.data.curves.new('PText', 'FONT'); cu.body = text; cu.size = size; cu.extrude = 0.01
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    ob = _link(bpy.data.objects.new(uid('PText'), cu)); ob.location = loc; ob.rotation_euler = [math.radians(a) for a in rot]
    cu.materials.append(pmat('PText' + col, col, unlit=True, mottle=0))
    return ob


def seams(name, length, axis, start, count, step, loc_fn, thick, col):
    """Plank seams: thin dark strips, never inked."""
    m = pmat('Seam' + col, col, unlit=True, mottle=0)
    for i in range(count):
        size, loc = loc_fn(start + i * step)
        box(uid(name), size, loc, m, bevel=0)


def water_plane(tod, y0=-20, y1=240, col='#3fb0b0', far='#5ac0bc', z=-0.12, streaks=40, seed=1, x0=-160, x1=160):
    mark('water', (0, max(y0, 0.5), z))
    ob = box('Water', (x1 - x0, y1 - y0, 0.1), ((x0 + x1) / 2, (y0 + y1) / 2, z - 0.05), pmat('WaterP' + col, N(col, tod), unlit=True, mottle=0.18, mscale=0.08), bevel=0)
    rnd = random.Random(seed)
    lm = pmat('Streak' + far + tod, N(far, tod), unlit=True, mottle=0)
    for i in range(streaks):
        y = rnd.uniform(max(y0, 2), min(y1, 90)); L = rnd.uniform(1.5, 6) * (1 + y / 30)
        box(uid('Streak'), (L, 0.06 * (1 + y / 25), 0.01), (rnd.uniform(-40, 40), y, z + 0.005), lm, bevel=0)
    return ob


def plank_floor(name, size, loc, col, tod, axis='x', step=0.32, seam='#4a3424', mottle=0.3):
    """A deck or floor of planks: the planks run along `axis`; seams between them."""
    sx, sy, sz = size; x, y, z = loc
    pbox(name, size, loc, col, tod, mottle=mottle, mscale=0.8)
    sm = pmat('Seam' + seam + tod, N(seam, tod), unlit=True, mottle=0)
    if axis == 'y':
        n = int(sx / step)
        for i in range(1, n):
            box(uid('PlankSeam'), (0.025, sy, 0.01), (x - sx / 2 + i * step, y, z + sz / 2 + 0.002), sm, bevel=0)
    else:
        n = int(sy / step)
        for i in range(1, n):
            box(uid('PlankSeam'), (sx, 0.025, 0.01), (x, y - sy / 2 + i * step, z + sz / 2 + 0.002), sm, bevel=0)


def flame(x, y, z, s=1.0, name='Flame'):
    """A painted flame: three tongues, orange, yellow, a pale heart. Cards that face the camera.
    Live: the plate keeps a bed of embers and the viewer animates the flame sprite on the mark."""
    if LIVE['on']:
        mark('fire', (x, y, z), size=s)
        NEED_SPRITES.add(('flame',))
        card(uid('Embers'), _blob_pts(0.5 * s, 0.12 * s, 16, 0.2, 1), y + 0.02, pmat('Embers', '#c8521f', unlit=True, mottle=0.3), x=x, z=z + 0.05 * s)
        return
    # tongues of flame: three orange, two yellow, a pale heart, each a leaning point
    for col, tongues, dz in (('#ff7a1f', ((-0.28, 0.85, -0.18), (0.0, 1.2, 0.02), (0.3, 0.9, 0.16)), 0),
                             ('#ffc23a', ((-0.14, 0.62, -0.08), (0.12, 0.78, 0.08)), 0.02),
                             ('#fff1a8', ((0.0, 0.42, 0.0),), 0.04)):
        for (cx, h, lean) in tongues:
            w = 0.34 if col == '#ff7a1f' else (0.24 if col == '#ffc23a' else 0.14)
            pts = [(cx - w, 0), (cx - w * 0.55, h * 0.4), (cx + lean * 0.5 - w * 0.15, h * 0.72), (cx + lean, h), (cx + lean * 0.4 + w * 0.2, h * 0.65), (cx + w * 0.6, h * 0.35), (cx + w, 0)]
            card(uid(name), [(px * s, pz * s) for px, pz in pts], y - dz, pmat('Flame' + col, col, unlit=True, mottle=0), x=x, z=z)


def tiki(x, y, tod, h=2.2, lit=None):
    lit = (tod == 'night') if lit is None else lit
    pcyl('TikiPole', 0.07, h, (x, y, h / 2), '#6b4a2a', tod)
    pcyl('TikiCup', 0.17, 0.32, (x, y, h + 0.1), '#4a3420', tod, r2=0.11)
    if lit:
        flame(x, y - 0.05, h + 0.24, 0.32)
        point(uid('TikiLight'), (x, y - 0.4, h + 0.4), 260, '#ffae5a', radius=0.3)


def fire_pit(x, y, tod, r=0.75, lit=None):
    lit = (tod == 'night') if lit is None else lit
    for i in range(11):
        a = i / 11 * 2 * math.pi
        ob = icorock(uid('PitStone'), (0.24, 0.2, 0.16), (x + math.cos(a) * r, y + math.sin(a) * r, 0.08), N('#8a8486', tod), seed=i)
        ob.data.materials.clear(); ob.data.materials.append(pmat('PitStone' + tod, N('#8a8486', tod), mottle=0.3)); ob['ink'] = 1
    for a in (25, 85, 145):
        pcyl('FireLog', 0.09, 1.1, (x, y, 0.2), '#5a3a22', tod, verts=8, rot=(0, 72, a))
    if lit:
        flame(x - 0.05, y - 0.1, 0.18, 1.0)
        point(uid('FireLight'), (x, y - 0.6, 1.2), 2400, '#ff9a4a', radius=0.4)


def oil_drum(x, y, tod, col='#4f6a7a'):
    pcyl('Drum', 0.42, 1.1, (x, y, 0.55), col, tod, verts=20)
    for zz in (0.3, 0.8):
        pcyl('DrumRib', 0.43, 0.05, (x, y, zz), '#3a4e5a', tod, verts=20, ink=False)


def wood_sign(x, y, z, w, h, text, tod, col='#9a6a3a', txt='#f2e6c8', tilt=0, posts=True, post_h=None):
    """A crooked plank sign on two posts."""
    if posts:
        ph = post_h or z
        for sx in (-w * 0.4, w * 0.4):
            pbox('SignPost', (0.16, 0.16, ph + h * 0.5), (x + sx, y + 0.05, (ph + h * 0.5) / 2), '#5a3a22', tod)
    b = pbox('SignBoard', (w, 0.12, h), (x, y, z), col, tod, rot=(0, tilt, 0))
    if text:
        t = ptext(text, (x, y - 0.08, z), h * 0.55, N(txt, tod), rot=(90, tilt, 0))


def stump_row(x0, y0, cols, rows, dx, dy, tod, r=0.3, h=0.42, jitter=0.15, seed=0):
    rnd = random.Random(seed)
    for j in range(rows):
        for i in range(cols):
            x = x0 + i * dx + rnd.uniform(-jitter, jitter); y = y0 + j * dy + rnd.uniform(-jitter, jitter)
            hh = h * rnd.uniform(0.85, 1.15)
            pcyl('Stump', r, hh, (x, y, hh / 2), '#7a4a32', tod, verts=10)
            pcyl('StumpTop', r * 0.96, 0.02, (x, y, hh + 0.01), '#c89a62', tod, verts=10, ink=False)
            seat(x, y, hh + 0.02)


def painted_room(W, D, H, tod, wall='#8a6a42', floor='#b08a4a', ceil='#5a4028', plank=0.32, wall_seam='#5a4228', floor_seam='#6a5028'):
    """An interior open to the camera: plank walls and floor, a dark ceiling."""
    plank_floor('Floor', (W, D, 0.2), (0, D / 2, -0.1), floor, tod, axis='y', step=0.5, seam=floor_seam)
    for nm, size, loc in (('BackWall', (W, 0.2, H), (0, D, H / 2)), ('LeftWall', (0.2, D, H), (-W / 2, D / 2, H / 2)), ('RightWall', (0.2, D, H), (W / 2, D / 2, H / 2))):
        pbox(nm, size, loc, wall, tod, mottle=0.3, mscale=0.7, ink=False)
    sm = pmat('WallSeam' + wall_seam + tod, N(wall_seam, tod), unlit=True, mottle=0)
    for i in range(1, int(W / plank)):
        box(uid('WSeam'), (0.03, 0.01, H), (-W / 2 + i * plank, D - 0.11, H / 2), sm, bevel=0)
    for i in range(1, int(D / plank)):
        for sx in (-1, 1):
            box(uid('WSeam'), (0.01, 0.03, H), (sx * (W / 2 - 0.11), i * plank, H / 2), sm, bevel=0)
    c = pbox('Ceiling', (W, D, 0.2), (0, D / 2, H + 0.1), ceil, tod, mottle=0.2, ink=False)
    c.visible_shadow = False     # the room's light comes in through it; a painted room is lit, not boxed in


def room_light(azimuth=-30, elevation=55, energy=3.0, fill=None):
    paint_sun(azimuth, elevation, energy)

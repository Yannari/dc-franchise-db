# ══════════════════════════════════════════════════════════════════════
# venues/_vkit.py — the vector kit: drawing a plate the way Disventure Camp's backgrounds are drawn
# ══════════════════════════════════════════════════════════════════════
# The user, 2026-10-07: "I want high level pro 1:1, not preschool drawing" — of every decor.
# The show's backgrounds are vector illustrations: smooth curved shapes, each filled flat or with a
# soft gradient, a darker shade shape and a paler highlight laid over it, thin dark outlines on
# props, soft glows around every light, and a lot of small detail. Boxes and cylinders under a
# painted material cannot get there. This kit draws that way.
#
# A plate built with it is laid out in the REFERENCE FRAME's own pixel space (1600 x 900): every
# shape is given in the frame's pixels and projected onto a card at the depth it lives at, so its
# place on screen is exactly where the show has it, while depth only orders the layers and keeps
# the marks (where people stand) honest. The camera is fixed: VCAM.

VCAM = {'loc': (0.0, -10.0, 1.6), 'lens': 30.0, 'w': 1600.0, 'h': 900.0}


def vcam():
    """The kit's camera: level, looking straight down +y (no pitch, so pixels map linearly)."""
    c = VCAM['loc']
    cam = camera(c, (0, 0, 0), lens=VCAM['lens'])
    cam.rotation_euler = (math.radians(90), 0, 0)
    return cam


def px(p, depth):
    """A point in the reference frame's pixels (x right, y down) to world (x, z) on the plane at y = depth."""
    cx, cy, cz = VCAM['loc']
    D = depth - cy
    half_w = D * 18.0 / VCAM['lens']
    half_h = half_w * VCAM['h'] / VCAM['w']
    return ((p[0] / VCAM['w'] - 0.5) * 2 * half_w, cz + (0.5 - p[1] / VCAM['h']) * 2 * half_h)


def pxs(pts, depth):
    return [px(p, depth) for p in pts]


def unit(depth):
    """How many metres one reference pixel is at this depth."""
    cx, cy, cz = VCAM['loc']
    return (depth - cy) * 36.0 / VCAM['lens'] / VCAM['w']


def smooth(pts, k=6, closed=True):
    """Catmull-Rom through the points: organic outlines from a few hand-placed control points."""
    n = len(pts)
    if n < 3:
        return list(pts)
    out = []
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[i]
        p1 = pts[i]; p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else p2
        for j in range(k):
            t = j / k; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3) for a in (0, 1)))
    if not closed:
        out.append(pts[-1])
    return out


def _area(pts):
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2


def grow(pts, d):
    """Offset a closed outline outward by d (pixels), for an outline drawn behind the fill. The side is
    checked, not assumed: grow one way, keep it if the shape got bigger."""
    n = len(pts)
    for s in (1, -1):
        out = _grow(pts, d, s)
        if abs(_area(out)) >= abs(_area(pts)):
            return out
    return out


def _grow(pts, d, s):
    n = len(pts)
    out = []
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        e1 = (b[0] - a[0], b[1] - a[1]); e2 = (c[0] - b[0], c[1] - b[1])
        n1 = (e1[1], -e1[0]); n2 = (e2[1], -e2[0])
        l1 = math.hypot(*n1) or 1; l2 = math.hypot(*n2) or 1
        nx, ny = n1[0] / l1 + n2[0] / l2, n1[1] / l1 + n2[1] / l2
        ln = math.hypot(nx, ny) or 1
        out.append((b[0] - s * nx / ln * d, b[1] - s * ny / ln * d))
    return out


def vmat(col, alpha=1.0):
    return pmat('V' + col + ('%.2f' % alpha), col, unlit=True, mottle=0, alpha=alpha)


def vgrad(top, bottom, name=None, alpha=1.0, vertical=True):
    """A flat shape filled with a two-colour gradient across its own height (or width)."""
    key = ('VG', top, bottom, alpha, vertical)
    if key in _MATS and _MATS[key].name in bpy.data.materials:
        return _MATS[key]
    m = bpy.data.materials.new(name or 'VG' + top + bottom)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    e = ramp.color_ramp.elements; e[0].position, e[0].color = 0.0, hexc(bottom); e[1].position, e[1].color = 1.0, hexc(top)
    L.new(sep.outputs['Z' if vertical else 'X'], ramp.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); L.new(ramp.outputs[0], em.inputs['Color'])
    if alpha < 1:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = alpha
        L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs['Surface'])
        try: m.surface_render_method = 'BLENDED'
        except Exception: m.blend_method = 'BLEND'
    else:
        L.new(em.outputs[0], out.inputs['Surface'])
    _MATS[key] = m
    return m


def vglowmat(col, strength=1.0):
    """A soft radial glow: full colour at the centre fading to nothing at the rim."""
    key = ('VGL', col, strength)
    if key in _MATS and _MATS[key].name in bpy.data.materials:
        return _MATS[key]
    m = bpy.data.materials.new('VGlow' + col)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Generated'], sep.inputs[0])
    cx = nt.nodes.new('ShaderNodeMath'); cx.operation = 'SUBTRACT'; cx.inputs[1].default_value = 0.5; L.new(sep.outputs['X'], cx.inputs[0])
    cz = nt.nodes.new('ShaderNodeMath'); cz.operation = 'SUBTRACT'; cz.inputs[1].default_value = 0.5; L.new(sep.outputs['Z'], cz.inputs[0])
    comb = nt.nodes.new('ShaderNodeCombineXYZ'); L.new(cx.outputs[0], comb.inputs['X']); L.new(cz.outputs[0], comb.inputs['Y'])
    ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; L.new(comb.outputs[0], ln.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    e = ramp.color_ramp.elements; e[0].position, e[0].color = 0.0, (1, 1, 1, 1); e[1].position, e[1].color = 0.5, (0, 0, 0, 1)
    ramp.color_ramp.interpolation = 'EASE'
    L.new(ln.outputs['Value'], ramp.inputs[0])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = strength
    L.new(ramp.outputs[0], mul.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = hexc(col)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
    L.new(mul.outputs[0], mx.inputs['Fac']); L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs['Surface'])
    # dithered, not blended: a blended card in front hides opaque shapes behind its square
    try: m.surface_render_method = 'DITHERED'
    except Exception: m.blend_method = 'HASHED'
    _MATS[key] = m
    return m


def vshape(name, pts, depth, col, line=None, lw=2.4, k=0, grad=None, alpha=1.0, dy=0.0):
    """One shape of the drawing. pts in reference pixels; k > 0 smooths them; col a hex or None with
    grad=(top, bottom); line draws a dark outline lw pixels wide behind it."""
    P = smooth(pts, k) if k else list(pts)
    mat = vgrad(grad[0], grad[1], alpha=alpha) if grad else vmat(col, alpha)
    ob = card(uid(name), pxs(P, depth), depth - dy, mat)
    if line:
        card(uid(name + 'Line'), pxs(grow(P, lw), depth), depth - dy + unit(depth) * 0.5 + 0.0005, vmat(line))
    return ob


def vline(name, pts, depth, col, w=2.0, closed=False, k=0):
    """A stroke: a polyline w pixels wide (rope, a crack, a bark line, a vein)."""
    P = smooth(pts, k, closed=closed) if k else list(pts)
    left, right = [], []
    for i, p in enumerate(P):
        a = P[max(i - 1, 0)]; b = P[min(i + 1, len(P) - 1)]
        dx, dyy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dyy) or 1
        nx, ny = -dyy / l * w / 2, dx / l * w / 2
        left.append((p[0] + nx, p[1] + ny)); right.append((p[0] - nx, p[1] - ny))
    return card(uid(name), pxs(left + right[::-1], depth), depth, vmat(col))


def vdisc(name, cx, cy, r, depth, col, n=24, ry=None, line=None, lw=2.0):
    pts = [(cx + math.cos(i / n * 2 * math.pi) * r, cy + math.sin(i / n * 2 * math.pi) * (ry or r)) for i in range(n)]
    return vshape(name, pts, depth, col, line=line, lw=lw)


def vglow(cx, cy, r, depth, col, strength=0.8):
    """A soft glow r pixels in radius around a light."""
    pts = [(cx - r, cy - r), (cx + r, cy - r), (cx + r, cy + r), (cx - r, cy + r)]
    return card(uid('Glow'), pxs(pts, depth), depth - 0.001, vglowmat(col, strength))


def vstars(depth, n, box, seed=0, col='#f2f4ff'):
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    for i in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1); r = rnd.choice((1.2, 1.6, 2.2, 1.2, 1.2))
        vdisc('Star', x, y, r, depth, col, n=6)


def vmark_stand(pxp, depth, **kw):
    """A place to stand at this pixel on the plane at this depth."""
    x, z = px(pxp, depth)
    stand(x, depth, z, **kw)


def vtraced(name, path, depth, step=0.00002):
    """Draw a traced frame (tools/td-camp/trace.py) as one mesh: every shape a flat face in the frame's
    pixel space on the plane at `depth`, a material per colour, the biggest shapes furthest back and
    each smaller one a hair in front, so details sit on top the way the artist layered them."""
    import json
    d = json.load(open(os.path.join(REPO, 'tools', 'td-camp', 'traced', path), encoding='utf-8'))
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    mats = {}
    for i, sh in enumerate(d['shapes']):
        y = depth - i * step
        vs = []
        for p in sh['pts']:
            x, z = px(p, depth)
            vs.append(bm.verts.new((x, y, z)))
        try:
            f = bm.faces.new(vs)
        except ValueError:
            continue
        if sh['c'] not in mats:
            mats[sh['c']] = len(mats)
            me.materials.append(vmat(sh['c']))
        f.material_index = mats[sh['c']]
    bm.to_mesh(me); bm.free()
    ob = _link(bpy.data.objects.new(uid(name), me))
    ob.visible_shadow = False
    return ob

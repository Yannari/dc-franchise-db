"""The illustrated look for every Traitors set (2026-10-02).

The first renders were Cycles and photographic, and next to the cartoon
portraits they read as "a little too real" (the user). Every set script runs
this after building its scene and before rendering:

    exec(open(".../tools/blender/traitors-toon.py").read()); toonify(scene)

What it does:
- Every Principled BSDF is replaced by a cel-shaded equivalent: the light
  falling on the surface (Shader to RGB, EEVEE only) is split into hue,
  saturation and value, the VALUE is cut into a few flat bands, and the
  result is multiplied by the surface's own colour. The light keeps its tint
  (warm candle, cool moon); the glossy reflections go.
- Emission is kept on top, so windows, flames and the lattice still glow.
- Pure emission and volume materials are left alone.
- Ink lines (Freestyle): silhouettes, creases and borders in dark brown.
- The engine becomes EEVEE.

Idempotent: a material already converted carries a node labelled TOON.
"""
import bpy

# (light level from, shade): flat steps keyed to the REAL light level, so a
# candlelit room stays dark and only the pools of light reach the top bands
BANDS = ((0.0, 0.02), (0.025, 0.09), (0.09, 0.26), (0.3, 0.55), (0.75, 0.95))
INK = (0.045, 0.028, 0.02)


def _toon_for(nt, pr):
    """build the cel-shaded replacement for one Principled node; returns its output socket"""
    N, L = nt.nodes, nt.links
    x, y = pr.location
    dif = N.new('ShaderNodeBsdfDiffuse'); dif.location = (x, y - 300)
    dif.inputs['Color'].default_value = (1, 1, 1, 1)
    if pr.inputs['Normal'].links:
        L.new(pr.inputs['Normal'].links[0].from_socket, dif.inputs['Normal'])
    s2r = N.new('ShaderNodeShaderToRGB'); s2r.location = (x + 200, y - 300)
    L.new(dif.outputs['BSDF'], s2r.inputs['Shader'])
    sep = N.new('ShaderNodeSeparateColor'); sep.mode = 'HSV'; sep.location = (x + 400, y - 300)
    L.new(s2r.outputs['Color'], sep.inputs['Color'])
    ramp = N.new('ShaderNodeValToRGB'); ramp.location = (x + 600, y - 400)
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position = BANDS[0][0]; els[0].color = (BANDS[0][1],) * 3 + (1,)
    els[1].position = BANDS[-1][0]; els[1].color = (BANDS[-1][1],) * 3 + (1,)
    for pos, shade in BANDS[1:-1]:
        e = els.new(pos); e.color = (shade,) * 3 + (1,)
    # value goes in compressed: lights are bright, the bands are about the shape of the light
    L.new(sep.outputs['Blue'], ramp.inputs['Fac'])
    comb = N.new('ShaderNodeCombineColor'); comb.mode = 'HSV'; comb.location = (x + 900, y - 300)
    L.new(sep.outputs['Red'], comb.inputs['Red'])
    sat = N.new('ShaderNodeMath'); sat.operation = 'MULTIPLY'; sat.inputs[1].default_value = 0.7; sat.location = (x + 800, y - 200)
    L.new(sep.outputs['Green'], sat.inputs[0]); L.new(sat.outputs[0], comb.inputs['Green'])
    # the band, scaled back to the light's real strength so a dim room stays dim
    lum = N.new('ShaderNodeMath'); lum.operation = 'MINIMUM'; lum.inputs[1].default_value = 1.0; lum.location = (x + 600, y - 550)
    L.new(sep.outputs['Blue'], lum.inputs[0])
    gain = N.new('ShaderNodeMath'); gain.operation = 'MULTIPLY'; gain.location = (x + 800, y - 500)
    L.new(ramp.outputs['Color'], gain.inputs[0]); gain.inputs[1].default_value = 1.0
    L.new(gain.outputs[0], comb.inputs['Blue'])
    # times the surface colour
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.location = (x + 1100, y - 200)
    mul.inputs['Factor'].default_value = 1.0
    if pr.inputs['Base Color'].links:
        L.new(pr.inputs['Base Color'].links[0].from_socket, mul.inputs[6])
    else:
        mul.inputs[6].default_value = pr.inputs['Base Color'].default_value
    L.new(comb.outputs['Color'], mul.inputs[7])
    # plus whatever the surface emits of its own
    em_strength = pr.inputs['Emission Strength'].default_value
    color_out = mul.outputs[2]
    if em_strength > 0 or pr.inputs['Emission Color'].links:
        ec = N.new('ShaderNodeMix'); ec.data_type = 'RGBA'; ec.blend_type = 'MULTIPLY'; ec.location = (x + 1100, y - 450)
        ec.inputs['Factor'].default_value = 1.0
        if pr.inputs['Emission Color'].links:
            L.new(pr.inputs['Emission Color'].links[0].from_socket, ec.inputs[6])
        else:
            ec.inputs[6].default_value = pr.inputs['Emission Color'].default_value
        ec.inputs[7].default_value = (em_strength,) * 3 + (1,)
        add = N.new('ShaderNodeMix'); add.data_type = 'RGBA'; add.blend_type = 'ADD'; add.location = (x + 1300, y - 300)
        add.inputs['Factor'].default_value = 1.0
        L.new(mul.outputs[2], add.inputs[6]); L.new(ec.outputs[2], add.inputs[7])
        color_out = add.outputs[2]
    em = N.new('ShaderNodeEmission'); em.location = (x + 1500, y - 300); em.label = 'TOON'
    em.inputs['Strength'].default_value = 1.0
    L.new(color_out, em.inputs['Color'])
    return em.outputs['Emission']


def toonify_material(m):
    if not m or not m.use_nodes or not m.node_tree: return
    nt = m.node_tree
    if any(n.label == 'TOON' for n in nt.nodes): return
    prs = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED']
    for pr in prs:
        out = _toon_for(nt, pr)
        for to in [l.to_socket for l in pr.outputs['BSDF'].links]:
            nt.links.new(out, to)          # an input takes one link: this replaces the old one
    if prs:
        mark = nt.nodes.new('NodeFrame'); mark.label = 'TOON'


def toonify(sc, ink=2.2, exposure=None):
    mats = set()
    for ob in sc.collection.all_objects:
        if ob.type == 'MESH':
            for slot in ob.material_slots:
                if slot.material: mats.add(slot.material)
    for m in mats: toonify_material(m)
    sc.render.engine = 'BLENDER_EEVEE'
    for attr, val in (('taa_render_samples', 64), ('volumetric_tile_size', '4'), ('volumetric_samples', 96),
                      ('use_volumetric_shadows', True), ('volumetric_end', 120.0)):
        try: setattr(sc.eevee, attr, val)
        except Exception: pass
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    if exposure is not None: sc.view_settings.exposure = exposure
    # ink
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = ink
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = 2.35   # ~135 degrees
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("trs_ink")
    ls.select_by_visibility = True; ls.select_by_edge_types = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    ls.select_external_contour = True
    sty = ls.linestyle
    sty.color = INK; sty.thickness = ink; sty.alpha = 0.85

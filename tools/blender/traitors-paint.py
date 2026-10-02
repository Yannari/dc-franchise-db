"""The painted look for every Traitors set (2026-10-02).

Chosen by the user over the photographic first renders ("too real") and over
cel shading (tried 2026-10-02 and removed: it read as a low-poly game outdoors): the
set keeps its real light, candle glow and haze, and the compositor's
Kuwahara filter smooths it into brush strokes, like a digital matte
painting. "It matched with the aesthetic."

Every set script runs this after building its scene and before rendering:

    g = {}; exec(open(".../traitors-paint.py").read(), g); g["paint"](scene)

- Cycles, the AgX view (the set scripts' own light and exposure are kept)
- Freestyle off (no ink: the brush strokes are the outline)
- a compositor node group: Render Layers -> Kuwahara (anisotropic) -> output.
  The brush size is given for the FULL 1920-wide frame and scaled with the
  render percentage, so a half-size preview looks like the final.
- the alpha of a transparent pass (the conclave's table) is carried around
  the filter, not through it, so the cut-out edge stays clean.
"""
import bpy

BRUSH = 11          # Kuwahara size at 1920 wide


def paint(sc, brush=BRUSH, sharpness=0.55, eccentricity=1.0):
    sc.render.engine = 'CYCLES'
    sc.render.use_freestyle = False
    sc.view_settings.view_transform = 'AgX'
    if sc.view_settings.look == 'None': sc.view_settings.look = 'AgX - Punchy'
    name = "trs_paint_" + sc.name
    ng = bpy.data.node_groups.get(name) or bpy.data.node_groups.new(name, "CompositorNodeTree")
    ng.nodes.clear()
    if not any(i.in_out == 'OUTPUT' for i in ng.interface.items_tree):
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = ng.nodes.new("CompositorNodeRLayers"); rl.scene = sc
    kw = ng.nodes.new("CompositorNodeKuwahara")
    size = max(2, round(brush * sc.render.resolution_percentage / 100 * sc.render.resolution_x / 1920))
    for inp in kw.inputs:
        n = inp.name.lower()
        if n == "size": inp.default_value = size
        elif n == "sharpness": inp.default_value = sharpness
        elif n == "eccentricity": inp.default_value = eccentricity
        elif n == "type":
            try: inp.default_value = 'Anisotropic'
            except Exception: pass
    # the filter paints the colour; the alpha goes round it untouched
    sep = ng.nodes.new("CompositorNodeSeparateColor")
    setA = ng.nodes.new("CompositorNodeSetAlpha")
    # Blender 5 moved the mode onto a menu socket; older ones keep .mode
    if "Type" in setA.inputs: setA.inputs["Type"].default_value = "Replace Alpha"
    else: setA.mode = 'REPLACE_ALPHA'
    out = ng.nodes.new("NodeGroupOutput")
    L = ng.links
    L.new(rl.outputs["Image"], kw.inputs[0])
    L.new(rl.outputs["Alpha"], setA.inputs["Alpha"])
    L.new(kw.outputs[0], setA.inputs["Image"])
    L.new(setA.outputs[0], out.inputs[0])
    ng.nodes.remove(sep)
    sc.compositing_node_group = ng
    sc.render.use_compositing = True
    return size

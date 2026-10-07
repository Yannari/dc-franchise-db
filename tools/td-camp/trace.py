"""tools/td-camp/trace.py — trace a reference frame into flat vector shapes for the plate builder.

    python tools/td-camp/trace.py <image> <out.json> [colors=40] [min_area=60]

The show's backgrounds are flat colour with shade and highlight shapes, so they trace cleanly:
  1. the frame is scaled to 1600x900 and lightly smoothed (removes compression noise, keeps edges);
  2. k-means picks its main colours, and every pixel takes the nearest one;
  3. specks smaller than min_area pixels are merged into the colour around them (a mode filter);
  4. each colour's connected areas are outlined (OpenCV contours, holes kept), simplified to within
     ~0.8 px, and written in draw order: biggest areas first, so small details land on top.
Output: {"w":1600,"h":900,"shapes":[{"c":"#rrggbb","pts":[[x,y],...],"holes":[[[x,y],...]],"a":area}]}
The Blender side (venues/_vkit.py vtraced) draws them as flat cards in the same pixel space.
"""
import sys, json
import numpy as np
import cv2

W, H = 1600, 900


def trace(path, colors=40, min_area=60, cut=None, fill=None):
    """cut: polygons (in 1600x900 px) around characters in the frame; that area is filled in from its
    surroundings (OpenCV inpainting) before tracing, and the polygons are passed on so the plate can
    redraw what stood behind the character by hand."""
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        from PIL import Image
        img = cv2.cvtColor(np.array(Image.open(path).convert('RGB')), cv2.COLOR_RGB2BGR)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    if cut:
        m = np.zeros((H, W), np.uint8)
        for poly in cut:
            cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
        m = cv2.dilate(m, np.ones((9, 9), np.uint8))
        if fill:
            # what stood behind the character, drawn by hand (a render of the same frame), blended in
            # with a soft edge so the seam disappears
            f = cv2.imread(fill, cv2.IMREAD_COLOR)
            if f is None:
                from PIL import Image
                f = cv2.cvtColor(np.array(Image.open(fill).convert('RGB')), cv2.COLOR_RGB2BGR)
            f = cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA)
            a = cv2.GaussianBlur(m.astype(np.float32) / 255.0, (0, 0), 5)[..., None]
            img = (img * (1 - a) + f * a).astype(np.uint8)
        else:
            img = cv2.inpaint(img, m, 12, cv2.INPAINT_TELEA)
    img = cv2.bilateralFilter(img, 7, 40, 7)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centers = cv2.kmeans(lab, colors, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    labels = labels.reshape(H, W).astype(np.uint8)
    # merge specks: any connected area under min_area takes the most common label on its border
    for _ in range(2):
        for k in range(colors):
            n, cc, stats, _ = cv2.connectedComponentsWithStats((labels == k).astype(np.uint8), 8)
            for i in range(1, n):
                if stats[i, cv2.CC_STAT_AREA] >= min_area:
                    continue
                m = (cc == i).astype(np.uint8)
                ring = cv2.dilate(m, np.ones((3, 3), np.uint8)) - m
                around = labels[ring.astype(bool)]
                if around.size:
                    labels[m.astype(bool)] = np.bincount(around, minlength=colors).argmax()
    rgb = cv2.cvtColor(centers.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB).reshape(-1, 3)
    shapes = []
    for k in range(colors):
        mask = (labels == k).astype(np.uint8) * 255
        if not mask.any():
            continue
        # a hair of dilation so neighbouring shapes overlap instead of leaving seams
        mask = cv2.dilate(mask, np.ones((2, 2), np.uint8))
        cs, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        if hier is None:
            continue
        hier = hier[0]
        col = '#%02x%02x%02x' % tuple(int(v) for v in rgb[k])
        for i, c in enumerate(cs):
            if hier[i][3] != -1:
                continue                       # a hole; collected with its parent below
            a = cv2.contourArea(c)
            if a < min_area:
                continue
            outer = cv2.approxPolyDP(c, 0.8, True).reshape(-1, 2).tolist()
            holes = []
            j = hier[i][2]
            while j != -1:
                if cv2.contourArea(cs[j]) >= min_area:
                    holes.append(cv2.approxPolyDP(cs[j], 0.8, True).reshape(-1, 2).tolist())
                j = hier[j][0]
            if len(outer) >= 3:
                shapes.append({'c': col, 'pts': outer, 'holes': holes, 'a': a})
    shapes.sort(key=lambda s: -s['a'])
    return {'w': W, 'h': H, 'shapes': shapes, 'cut': cut or []}


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    colors = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    min_area = int(sys.argv[4]) if len(sys.argv) > 4 else 60
    cut = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else None
    fill = sys.argv[6] if len(sys.argv) > 6 else None
    d = trace(src, colors, min_area, cut, fill)
    json.dump(d, open(out, 'w'))
    print(out, len(d['shapes']), 'shapes')

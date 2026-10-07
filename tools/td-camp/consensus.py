"""Rebuild a clean background from several frames of the same shot with different people in it.
Every frame is aligned to the last one (ORB + RANSAC homography); then for every pixel the two frames
whose colours agree best give the background there if they agree (Lab distance < thr). Pixels no pair
agrees on, and caption polygons, are written as 'unknown' for a hand fill."""
import sys, json, numpy as np, cv2
from PIL import Image
W, H = 1600, 900
def load(p): return cv2.cvtColor(np.array(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS)), cv2.COLOR_RGB2BGR)
def align(img, ref):
    g1 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); g2 = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(8000)
    k1, d1 = orb.detectAndCompute(g1, None); k2, d2 = orb.detectAndCompute(g2, None)
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:2000]
    A = np.float32([k1[x.queryIdx].pt for x in m]).reshape(-1, 1, 2); B = np.float32([k2[x.trainIdx].pt for x in m]).reshape(-1, 1, 2)
    Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 2.0)
    print('aligned', int(inl.sum()), 'inliers of', len(m))
    return cv2.warpPerspective(img, Hm, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def consensus(paths, thr=6.0, caption=()):
    F0 = [load(p) for p in paths]
    ref = F0[-1]
    F = np.stack([cv2.cvtColor(align(f, ref) if i < len(F0) - 1 else f, cv2.COLOR_BGR2LAB).astype(np.float32) for i, f in enumerate(F0)])
    n = len(paths)
    best = np.full((H, W), 1e9, np.float32); out = np.zeros((H, W, 3), np.float32)
    for i in range(n):
        for j in range(i + 1, n):
            d = np.linalg.norm(F[i] - F[j], axis=2)
            m = d < best
            best[m] = d[m]; out[m] = ((F[i] + F[j]) / 2)[m]
    unknown = (best > thr).astype(np.uint8) * 255
    for poly in caption:
        cv2.fillPoly(unknown, [np.array(poly, np.int32)], 255)
    unknown = cv2.morphologyEx(unknown, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    unknown = cv2.dilate(unknown, np.ones((5, 5), np.uint8))
    return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR), unknown
if __name__ == '__main__':
    cfg = json.load(open(sys.argv[1]))
    bgr, unk = consensus(cfg['frames'], cfg.get('thr', 6.0), cfg.get('caption', []))
    cv2.imwrite(cfg['out'], bgr); cv2.imwrite(cfg['out'].replace('.png', '-unknown.png'), unk)
    print('unknown px', int((unk > 0).sum()))

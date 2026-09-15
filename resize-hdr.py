#!/usr/bin/env python3
"""
HDR resize — pure Python, bez závislostí.
Čte Radiance RGBE .hdr soubory (new RLE), zmenší na polovinu, zapíše nový .hdr.
Originální soubory zůstávají nedotčené.
"""

import math
import os

# ── RGBE <-> float ────────────────────────────────────────────────────────────

def rgbe_to_float(r, g, b, e):
    if e == 0:
        return 0.0, 0.0, 0.0
    scale = 2.0 ** (e - 136)   # == 2^(e-128) / 256
    return r * scale, g * scale, b * scale

def float_to_rgbe(r, g, b):
    max_c = max(r, g, b)
    if max_c < 1e-32:
        return 0, 0, 0, 0
    m, exp = math.frexp(max_c)
    scale = m * 256.0 / max_c
    return (
        min(255, max(0, int(r * scale))),
        min(255, max(0, int(g * scale))),
        min(255, max(0, int(b * scale))),
        min(255, max(0, exp + 128)),
    )

# ── Čtení HDR ─────────────────────────────────────────────────────────────────

def read_header(f):
    while True:
        line = f.readline()
        if not line or line in (b'\n', b'\r\n'):
            break

def read_resolution(f):
    line = f.readline().decode('ascii').strip()
    parts = line.split()
    if len(parts) == 4 and parts[0] == '-Y' and parts[2] == '+X':
        return int(parts[3]), int(parts[1])   # width, height
    raise ValueError(f"Nepodporovaný formát rozlišení: '{line}'")

def read_scanline(f, width):
    hdr = f.read(4)
    if len(hdr) < 4:
        raise ValueError("Neočekávaný konec souboru při čtení scanlinu")
    if hdr[0] != 2 or hdr[1] != 2:
        raise ValueError(
            f"Očekáván nový RLE formát (2,2,...), nalezeno ({hdr[0]},{hdr[1]}). "
            "Soubor pravděpodobně používá starý RGBE formát."
        )
    scan_w = (hdr[2] << 8) | hdr[3]
    if scan_w != width:
        raise ValueError(f"Šířka scanlinu {scan_w} neodpovídá {width}")

    channels = []
    for _ in range(4):
        ch = []
        while len(ch) < width:
            code = f.read(1)[0]
            if code > 128:                      # run
                val = f.read(1)[0]
                ch.extend([val] * (code - 128))
            else:                               # literály
                ch.extend(f.read(code))
        channels.append(ch[:width])

    return list(zip(*channels))                 # [(r,g,b,e), ...]

# ── Resize ────────────────────────────────────────────────────────────────────

def resize_half(img, width, height):
    nw, nh = width // 2, height // 2
    out = []
    for y in range(nh):
        row = []
        for x in range(nw):
            p = [rgbe_to_float(*img[y*2 + dy][x*2 + dx])
                 for dy in range(2) for dx in range(2)]
            row.append(float_to_rgbe(
                sum(v[0] for v in p) * 0.25,
                sum(v[1] for v in p) * 0.25,
                sum(v[2] for v in p) * 0.25,
            ))
        out.append(row)
    return out, nw, nh

# ── Zápis HDR ─────────────────────────────────────────────────────────────────

def write_hdr(path, width, height, img):
    with open(path, 'wb') as f:
        f.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n')
        f.write(f'-Y {height} +X {width}\n'.encode())
        for row in img:
            f.write(bytes([2, 2, (width >> 8) & 0xFF, width & 0xFF]))
            for c in range(4):
                data = bytes(px[c] for px in row)
                i = 0
                while i < width:
                    n = min(128, width - i)
                    f.write(bytes([n]))
                    f.write(data[i:i + n])
                    i += n

# ── Hlavní logika ─────────────────────────────────────────────────────────────

def process(src, dst):
    print(f"\n→ {os.path.basename(src)}")
    with open(src, 'rb') as f:
        read_header(f)
        width, height = read_resolution(f)
        print(f"  Rozlišení: {width}×{height}")
        img = [read_scanline(f, width) for _ in range(height)]

    print(f"  Resize na {width//2}×{height//2} …", end=' ', flush=True)
    img2, w2, h2 = resize_half(img, width, height)
    print("hotovo")

    write_hdr(dst, w2, h2, img2)
    src_kb = os.path.getsize(src) // 1024
    dst_kb = os.path.getsize(dst) // 1024
    print(f"  Uloženo: {dst_kb} KB  (bylo {src_kb} KB, {dst_kb*100//src_kb} %)")

HDRI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hdri')
FILES = ['venice_sunset_1k.hdr', 'dikhololo_night_1k.hdr']

for name in FILES:
    src = os.path.join(HDRI_DIR, name)
    dst = os.path.join(HDRI_DIR, name.replace('_1k.', '_512.'))
    if not os.path.exists(src):
        print(f"Soubor nenalezen: {src}")
        continue
    if os.path.exists(dst):
        print(f"Přeskočeno (již existuje): {os.path.basename(dst)}")
        continue
    process(src, dst)

print("\nDokončeno. Originální 1k soubory zůstaly nedotčené.")

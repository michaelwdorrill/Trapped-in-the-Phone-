"""
Generate pixel-art border images for Trapped in the Phone!

Uses a 2x2 pixel block design with staircase corners, 7-band orange gradient,
black outline, and gray drop shadow. The interior is transparent.
Beveled 3D look: top/left = highlight (bands 7-5), bottom/right = shadow (bands 1-3).

Usage:
    python generate_border.py <width> <height> [output_filename]

Example:
    python generate_border.py 600 400
    python generate_border.py 300 80 my_button.png
"""

import sys
import os
from PIL import Image

# ── Color palette (all drawing in 2x2 blocks) ──────────────────────────
T = (0, 0, 0, 0)             # transparent
K = (0, 0, 0, 255)           # black outline
G = (127, 127, 127, 100)     # gray drop shadow

# Orange gradient bands: 1 = darkest, 7 = lightest
B = {
    1: (255, 135,  15, 255),
    2: (255, 155,  40, 255),
    3: (255, 175,  65, 255),
    4: (255, 195,  90, 255),
    5: (255, 215, 115, 255),
    6: (255, 235, 140, 255),
    7: (255, 255, 165, 255),
}


def put(img, bx, by, color):
    """Fill a 2x2 pixel block at block coordinates (bx, by)."""
    px, py = bx * 2, by * 2
    w, h = img.size
    for dy in range(2):
        for dx in range(2):
            x, y = px + dx, py + dy
            if 0 <= x < w and 0 <= y < h:
                img.putpixel((x, y), color)


def hline(img, bx_start, bx_end, by, color):
    """Draw a horizontal line of blocks from bx_start to bx_end (inclusive)."""
    for bx in range(bx_start, bx_end + 1):
        put(img, bx, by, color)


def vline(img, bx, by_start, by_end, color):
    """Draw a vertical line of blocks from by_start to by_end (inclusive)."""
    for by in range(by_start, by_end + 1):
        put(img, bx, by, color)


def generate_border(width, height):
    """
    Generate a border image at the given pixel dimensions.

    Coordinate system (all in 2x2 block units), derived from the 80x61 mockup:

    Key named positions for bw (block width) and bh (block height):
      OL  = 2          outer left K column
      OR  = bw - 3     outer right K column
      T4L = 6          band-4 fill left column
      T4R = bw - 7     band-4 fill right column
      TpK = 2          top K bar row
      BtK = bh - 3     bottom K bar row
      Tp4 = 6          top band-4 row
      Bt4 = bh - 7     bottom band-4 row
      IL  = 7          inner frame left K column
      IR  = bw - 8     inner frame right K column
      IBL = 11         inner K bar left column
      IBR = bw - 12    inner K bar right column
    """
    if width % 2 != 0:
        width += 1
    if height % 2 != 0:
        height += 1

    bw = width // 2
    bh = height // 2

    min_bw, min_bh = 24, 24
    if bw < min_bw or bh < min_bh:
        print(f"Error: minimum size is {min_bw*2}x{min_bh*2}px. Got {width}x{height}px.")
        sys.exit(1)

    img = Image.new('RGBA', (width, height), T)

    # ── Key coordinates ────────────────────────────────────────────────
    OL  = 2           # outer left K
    OR  = bw - 3      # outer right K
    T4L = 6           # band-4 fill left
    T4R = bw - 7      # band-4 fill right
    TpK = 2           # top K bar row
    BtK = bh - 3      # bottom K bar row
    Tp4 = 6           # top band-4 row
    Bt4 = bh - 7      # bottom band-4 row
    IL  = 7           # inner frame left K
    IR  = bw - 8      # inner frame right K
    IBL = 11          # inner K bar left
    IBR = bw - 12     # inner K bar right

    # ══════════════════════════════════════════════════════════════════
    # TOP STAIRCASE (rows TpK to Tp4, i.e. rows 2-6 in mockup)
    # Goes from outside in: K bar, band-7, band-6, band-5, band-4
    # ══════════════════════════════════════════════════════════════════

    # Row TpK (=2): K bar
    hline(img, T4L, T4R, TpK, K)

    # Row TpK+1 (=3): K, band-7 fill, K
    put(img, T4L - 1, TpK + 1, K)
    hline(img, T4L, T4R, TpK + 1, B[7])
    put(img, T4R + 1, TpK + 1, K)

    # Row TpK+2 (=4): K, band-6 fill, K
    put(img, T4L - 2, TpK + 2, K)
    hline(img, T4L - 1, T4R + 1, TpK + 2, B[6])
    put(img, T4R + 2, TpK + 2, K)

    # Row TpK+3 (=5): K, 6, band-5 fill, 2, K
    put(img, T4L - 3, TpK + 3, K)
    put(img, T4L - 2, TpK + 3, B[6])
    hline(img, T4L - 1, T4R + 1, TpK + 3, B[5])
    put(img, T4R + 2, TpK + 3, B[2])
    put(img, T4R + 3, TpK + 3, K)

    # Row Tp4 (=6): K, 7, 6, 5, band-4 fill, 3, 2, 1, K
    put(img, OL, Tp4, K)
    put(img, OL + 1, Tp4, B[7])
    put(img, OL + 2, Tp4, B[6])
    put(img, OL + 3, Tp4, B[5])
    hline(img, T4L, T4R, Tp4, B[4])
    put(img, T4R + 1, Tp4, B[3])
    put(img, T4R + 2, Tp4, B[2])
    put(img, T4R + 3, Tp4, B[1])
    put(img, OR, Tp4, K)

    # ══════════════════════════════════════════════════════════════════
    # BOTTOM STAIRCASE (rows Bt4 to BtK, i.e. rows 24-28 in mockup)
    # Goes from inside out: band-4, band-3, band-2, band-1, K bar
    # (shadow side - uses darker bands for fill)
    # ══════════════════════════════════════════════════════════════════

    # Row Bt4 (=24): K, 7, 6, 5, band-4 fill, 3, 2, 1, K  (same as Tp4)
    put(img, OL, Bt4, K)
    put(img, OL + 1, Bt4, B[7])
    put(img, OL + 2, Bt4, B[6])
    put(img, OL + 3, Bt4, B[5])
    hline(img, T4L, T4R, Bt4, B[4])
    put(img, T4R + 1, Bt4, B[3])
    put(img, T4R + 2, Bt4, B[2])
    put(img, T4R + 3, Bt4, B[1])
    put(img, OR, Bt4, K)

    # Row Bt4+1 (=25/94): K, 6, 5, band-3 fill, 2, K
    put(img, T4L - 3, Bt4 + 1, K)
    put(img, T4L - 2, Bt4 + 1, B[6])
    put(img, T4L - 1, Bt4 + 1, B[5])
    hline(img, T4L, T4R + 1, Bt4 + 1, B[3])
    put(img, T4R + 2, Bt4 + 1, B[2])
    put(img, T4R + 3, Bt4 + 1, K)

    # Row Bt4+2 (=26): K, band-2 fill, K
    put(img, T4L - 2, Bt4 + 2, K)
    hline(img, T4L - 1, T4R + 1, Bt4 + 2, B[2])
    put(img, T4R + 2, Bt4 + 2, K)

    # Row Bt4+3 (=27): K, band-1 fill, K
    put(img, T4L - 1, Bt4 + 3, K)
    hline(img, T4L, T4R, Bt4 + 3, B[1])
    put(img, T4R + 1, Bt4 + 3, K)

    # Row BtK (=28): K bar
    hline(img, T4L, T4R, BtK, K)

    # ══════════════════════════════════════════════════════════════════
    # LEFT VERTICAL BAR (rows Tp4+1 to Bt4-1, i.e. rows 7-23)
    # K, 7, 6, 5, 4
    # ══════════════════════════════════════════════════════════════════
    for by in range(Tp4 + 1, Bt4):
        put(img, OL, by, K)
        put(img, OL + 1, by, B[7])
        put(img, OL + 2, by, B[6])
        put(img, OL + 3, by, B[5])
        put(img, T4L, by, B[4])

    # ══════════════════════════════════════════════════════════════════
    # RIGHT VERTICAL BAR (rows Tp4+1 to Bt4-1, i.e. rows 7-23)
    # 4, 3, 2, 1, K
    # ══════════════════════════════════════════════════════════════════
    for by in range(Tp4 + 1, Bt4):
        put(img, T4R, by, B[4])
        put(img, T4R + 1, by, B[3])
        put(img, T4R + 2, by, B[2])
        put(img, T4R + 3, by, B[1])
        put(img, OR, by, K)

    # ══════════════════════════════════════════════════════════════════
    # INNER FRAME - TOP CORNERS (rows Tp4+1 to Tp4+6, i.e. rows 7-12)
    # Beveled inset with shadow (g) fills
    # ══════════════════════════════════════════════════════════════════

    # Row Tp4+1 (=7): KK, 45, K-bar, 54, KK
    put(img, IL, Tp4 + 1, K)
    put(img, IL + 1, Tp4 + 1, K)
    put(img, IL + 2, Tp4 + 1, B[4])
    put(img, IL + 3, Tp4 + 1, B[5])
    hline(img, IBL, IBR, Tp4 + 1, K)
    put(img, IR - 3, Tp4 + 1, B[5])
    put(img, IR - 2, Tp4 + 1, B[4])
    put(img, IR - 1, Tp4 + 1, K)
    put(img, IR, Tp4 + 1, K)

    # Row Tp4+2 (=8): KK, 56, K, g-fill, K, 65, KK
    put(img, IL, Tp4 + 2, K)
    put(img, IL + 1, Tp4 + 2, K)
    put(img, IL + 2, Tp4 + 2, B[5])
    put(img, IL + 3, Tp4 + 2, B[6])
    put(img, IBL, Tp4 + 2, K)
    hline(img, IBL + 1, IBR - 1, Tp4 + 2, G)
    put(img, IBR, Tp4 + 2, K)
    put(img, IR - 3, Tp4 + 2, B[6])
    put(img, IR - 2, Tp4 + 2, B[5])
    put(img, IR - 1, Tp4 + 2, K)
    put(img, IR, Tp4 + 2, K)

    # Row Tp4+3 (=9): 45, 67, K, g-fill, K, 76, 54
    put(img, IL, Tp4 + 3, B[4])
    put(img, IL + 1, Tp4 + 3, B[5])
    put(img, IL + 2, Tp4 + 3, B[6])
    put(img, IL + 3, Tp4 + 3, B[7])
    put(img, IBL, Tp4 + 3, K)
    hline(img, IBL + 1, IBR - 1, Tp4 + 3, G)
    put(img, IBR, Tp4 + 3, K)
    put(img, IR - 3, Tp4 + 3, B[7])
    put(img, IR - 2, Tp4 + 3, B[6])
    put(img, IR - 1, Tp4 + 3, B[5])
    put(img, IR, Tp4 + 3, B[4])

    # Row Tp4+4 (=10): 5, 6, 7, K, g, g, ..., K, 7, 6, 5
    put(img, IL, Tp4 + 4, B[5])
    put(img, IL + 1, Tp4 + 4, B[6])
    put(img, IL + 2, Tp4 + 4, B[7])
    put(img, IL + 3, Tp4 + 4, K)
    put(img, IL + 4, Tp4 + 4, G)
    put(img, IL + 5, Tp4 + 4, G)
    # right side
    put(img, IR - 3, Tp4 + 4, K)
    put(img, IR - 2, Tp4 + 4, B[7])
    put(img, IR - 1, Tp4 + 4, B[6])
    put(img, IR, Tp4 + 4, B[5])

    # Row Tp4+5 (=11): K, K, K, g, g, ..., K, K, K
    put(img, IL, Tp4 + 5, K)
    put(img, IL + 1, Tp4 + 5, K)
    put(img, IL + 2, Tp4 + 5, K)
    put(img, IL + 3, Tp4 + 5, G)
    put(img, IL + 4, Tp4 + 5, G)
    put(img, IR - 2, Tp4 + 5, K)
    put(img, IR - 1, Tp4 + 5, K)
    put(img, IR, Tp4 + 5, K)

    # Row Tp4+6 (=12): K, g, g, g, ..., K
    put(img, IL, Tp4 + 6, K)
    put(img, IL + 1, Tp4 + 6, G)
    put(img, IL + 2, Tp4 + 6, G)
    put(img, IL + 3, Tp4 + 6, G)
    put(img, IR, Tp4 + 6, K)

    # ══════════════════════════════════════════════════════════════════
    # INNER FRAME - STABLE WALLS (rows Tp4+7 to Bt4-6)
    # Left: K, g, g    Right: K
    # ══════════════════════════════════════════════════════════════════
    for by in range(Tp4 + 7, Bt4 - 5):
        put(img, IL, by, K)
        put(img, IL + 1, by, G)
        put(img, IL + 2, by, G)
        put(img, IR, by, K)

    # ══════════════════════════════════════════════════════════════════
    # INNER FRAME - BOTTOM CORNERS (rows Bt4-5 to Bt4-1, i.e. rows 19-23)
    # Reverse order of top corners, but NO shadow (g) fills inside
    # ══════════════════════════════════════════════════════════════════

    # Row Bt4-5 (=19): K, K, K, ..., K, K, K
    put(img, IL, Bt4 - 5, K)
    put(img, IL + 1, Bt4 - 5, K)
    put(img, IL + 2, Bt4 - 5, K)
    put(img, IR - 2, Bt4 - 5, K)
    put(img, IR - 1, Bt4 - 5, K)
    put(img, IR, Bt4 - 5, K)

    # Row Bt4-4 (=20): 5, 6, 7, K, ..., K, 7, 6, 5
    put(img, IL, Bt4 - 4, B[5])
    put(img, IL + 1, Bt4 - 4, B[6])
    put(img, IL + 2, Bt4 - 4, B[7])
    put(img, IL + 3, Bt4 - 4, K)
    put(img, IR - 3, Bt4 - 4, K)
    put(img, IR - 2, Bt4 - 4, B[7])
    put(img, IR - 1, Bt4 - 4, B[6])
    put(img, IR, Bt4 - 4, B[5])

    # Row Bt4-3 (=21): 4, 5, 6, 7, K, ..., K, 7, 6, 5, 4
    put(img, IL, Bt4 - 3, B[4])
    put(img, IL + 1, Bt4 - 3, B[5])
    put(img, IL + 2, Bt4 - 3, B[6])
    put(img, IL + 3, Bt4 - 3, B[7])
    put(img, IL + 4, Bt4 - 3, K)
    put(img, IR - 4, Bt4 - 3, K)
    put(img, IR - 3, Bt4 - 3, B[7])
    put(img, IR - 2, Bt4 - 3, B[6])
    put(img, IR - 1, Bt4 - 3, B[5])
    put(img, IR, Bt4 - 3, B[4])

    # Row Bt4-2 (=22): K, K, 5, 6, K, ..., K, 6, 5, K, K
    put(img, IL, Bt4 - 2, K)
    put(img, IL + 1, Bt4 - 2, K)
    put(img, IL + 2, Bt4 - 2, B[5])
    put(img, IL + 3, Bt4 - 2, B[6])
    put(img, IL + 4, Bt4 - 2, K)
    put(img, IR - 4, Bt4 - 2, K)
    put(img, IR - 3, Bt4 - 2, B[6])
    put(img, IR - 2, Bt4 - 2, B[5])
    put(img, IR - 1, Bt4 - 2, K)
    put(img, IR, Bt4 - 2, K)

    # Row Bt4-1 (=23): K, K, 4, 5, K-bar, 5, 4, K, K
    put(img, IL, Bt4 - 1, K)
    put(img, IL + 1, Bt4 - 1, K)
    put(img, IL + 2, Bt4 - 1, B[4])
    put(img, IL + 3, Bt4 - 1, B[5])
    hline(img, IBL, IBR, Bt4 - 1, K)
    put(img, IR - 3, Bt4 - 1, B[5])
    put(img, IR - 2, Bt4 - 1, B[4])
    put(img, IR - 1, Bt4 - 1, K)
    put(img, IR, Bt4 - 1, K)

    # ══════════════════════════════════════════════════════════════════
    # DROP SHADOW
    # Right side: 1 block at row Tp4+1, then 2 blocks wide from Tp4+2 down
    # Bottom: staircase shadow + 2 full rows under the frame
    # ══════════════════════════════════════════════════════════════════

    # Right shadow column(s)
    # Row Tp4+1: 1 block at OR+1
    put(img, OR + 1, Tp4 + 1, G)
    # Rows Tp4+2 through Bt4: 2 blocks at OR+1, OR+2
    for by in range(Tp4 + 2, Bt4 + 1):
        put(img, OR + 1, by, G)
        put(img, OR + 2, by, G)

    # Bottom staircase shadow (3 blocks each row, stepping left)
    # Row Bt4+1 (=25): g at OR, OR+1, OR+2
    hline(img, OR, OR + 2, Bt4 + 1, G)
    # Row Bt4+2 (=26): g at OR-1, OR, OR+1
    hline(img, OR - 1, OR + 1, Bt4 + 2, G)
    # Row Bt4+3 (=27): g at OR-2, OR-1, OR
    hline(img, OR - 2, OR, Bt4 + 3, G)
    # Row BtK (=28): g at OR-3, OR-2, OR-1
    hline(img, OR - 3, OR - 1, BtK, G)

    # Full bottom shadow rows
    # Row BtK+1 (=29): g from col 7 to col 35
    hline(img, T4L + 1, T4R + 2, BtK + 1, G)
    # Row BtK+2 (=30): g from col 8 to col 34
    hline(img, T4L + 2, T4R + 1, BtK + 2, G)

    return img


def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_border.py <width> <height> [output_filename]")
        print("Example: python generate_border.py 600 400 my_border.png")
        sys.exit(1)

    width = int(sys.argv[1])
    height = int(sys.argv[2])
    filename = sys.argv[3] if len(sys.argv) > 3 else f"border_{width}x{height}.png"

    print(f"Generating {width}x{height} border...")
    img = generate_border(width, height)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, filename)
    img.save(output_path)
    print(f"Saved to: {output_path}")


if __name__ == '__main__':
    main()

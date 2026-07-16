#!/usr/bin/env python3
"""
Generate the site's physics-equation background watermark.

Reads equations/equations.txt (one raw LaTeX expression per line, no $
signs needed) and lays them out in 3 columns as a tileable PNG, saved to
images/equations_bg.png.

Each equation's rendered width is measured first; anything too wide for
its column gets its font size shrunk to fit, so nothing gets clipped or
wraps into a neighboring column (this is what was happening to Ampere's
law before — it was wider than the tile itself).

Usage:
    python3 equations/generate_bg.py

Requires: matplotlib, Pillow (same as the rest of this repo's tooling).
"""

import random
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager  # noqa: F401  (ensures font cache is built)

matplotlib.rcParams['mathtext.fontset'] = 'cm'

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE_FILE = os.path.join(HERE, 'equations.txt')
OUTPUT_FILE = os.path.join(os.path.dirname(HERE), 'images', 'equations_bg.png')

N_COLUMNS = 3
BASE_FONTSIZE = 46      # pt, before any per-equation shrink-to-fit
MIN_FONTSIZE = 4        # pt, essentially no floor — guarantees a fit over readability
DPI = 150
COLOR = '#555555'
ALPHA = 0.30
MAX_ROTATION_DEG = 8    # kept modest so tilted text doesn't bleed into neighbors
COLUMN_MARGIN_FRAC = 0.08  # fraction of column width reserved as side margin


def load_equations(path):
    eqs = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            eqs.append(line)
    return eqs


def measure_text(fig, ax, s, fontsize, rotation=0):
    """Render text off-canvas and measure its axis-aligned bbox in inches,
    INCLUDING rotation — a rotated string has a wider footprint than the
    same string at rotation=0, so this must match what will actually be
    drawn or the fit check underestimates long equations."""
    t = ax.text(0, 0, s, fontsize=fontsize, rotation=rotation)
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    bbox = t.get_window_extent(renderer=renderer)  # in display (pixel) units
    t.remove()
    width_in = bbox.width / fig.dpi
    height_in = bbox.height / fig.dpi
    return width_in, height_in


def main():
    equations = load_equations(SOURCE_FILE)
    if not equations:
        raise SystemExit(f"No equations found in {SOURCE_FILE}")

    random.seed(None)  # fresh shuffle each run
    random.shuffle(equations)

    # Canvas sizing: wide enough for 3 comfortable columns, tall enough for
    # however many equations we have divided across them.
    col_width_in = 13.0
    W = col_width_in * N_COLUMNS
    rows_per_col = -(-len(equations) // N_COLUMNS)  # ceil division
    row_height_in = 2.0
    H = rows_per_col * row_height_in + 1.0

    fig, ax = plt.subplots(figsize=(W, H), dpi=DPI)
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis('off')
    fig.patch.set_alpha(0)
    ax.patch.set_alpha(0)

    col_budget_in = col_width_in * (1 - 2 * COLUMN_MARGIN_FRAC)

    columns = [[] for _ in range(N_COLUMNS)]
    for i, eq in enumerate(equations):
        columns[i % N_COLUMNS].append(eq)

    for col_idx, col_eqs in enumerate(columns):
        col_x0 = col_idx * col_width_in
        for row_idx, eq in enumerate(col_eqs):
            latex = f"${eq}$"
            rotation = random.uniform(-MAX_ROTATION_DEG, MAX_ROTATION_DEG)

            fontsize = BASE_FONTSIZE
            width_in, height_in = measure_text(fig, ax, latex, fontsize, rotation)

            # Shrink to fit the column's width budget if needed.
            if width_in > col_budget_in:
                scale = col_budget_in / width_in
                fontsize = max(MIN_FONTSIZE, fontsize * scale)
                width_in, height_in = measure_text(fig, ax, latex, fontsize, rotation)

            y = H - (row_idx + 0.5) * row_height_in + random.uniform(-0.15, 0.15)
            x = col_x0 + col_width_in * COLUMN_MARGIN_FRAC + random.uniform(0, 0.3)
            ax.text(x, y, latex, fontsize=fontsize, rotation=rotation,
                    color=COLOR, alpha=ALPHA, ha='left', va='center')

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    plt.savefig(OUTPUT_FILE, transparent=True, dpi=DPI, bbox_inches='tight', pad_inches=0.1)
    print(f"Saved {OUTPUT_FILE}")
    print(f"{len(equations)} equations across {N_COLUMNS} columns, {rows_per_col} rows/column")


if __name__ == '__main__':
    main()

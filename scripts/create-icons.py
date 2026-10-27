"""Render the original geometric PostNook bookmark mark; no external assets."""
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parents[1] / 'public' / 'icons'
folder.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 128):
    scale = 4
    canvas = Image.new('RGBA', (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    unit = size * scale / 40
    def points(values): return [(round(x * unit), round(y * unit)) for x, y in values]
    draw.polygon(points([(6, 2), (27, 2), (34, 9), (34, 38), (20, 31), (6, 38)]), fill='#6246c6')
    draw.polygon(points([(27, 2), (27, 10), (34, 10)]), fill='#b6a0ff')
    draw.line(points([(13, 25), (13, 13), (27, 25), (27, 13)]), fill='white', width=max(2, round(unit * 3)), joint='curve')
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(folder / f'icon-{size}.png')
print('Created four packaged icons from the original PostNook geometric mark.')

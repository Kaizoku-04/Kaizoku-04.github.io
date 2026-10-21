"""Portrait for the hero: background removed, black and white, 4:5 crop centred on the face."""
from pathlib import Path
from PIL import Image, ImageOps
from rembg import remove, new_session

RAW = Path('/media/kaizoku/D/Me/portfolio/_raw/portrait-cutout.png')
OUT = Path('/media/kaizoku/D/Me/portfolio/assets/media/portrait.webp')
if not RAW.exists():
    src = ImageOps.exif_transpose(Image.open('/media/kaizoku/D/Me/photos/IMG_7428.JPG'))
    src.thumbnail((2400, 2400))
    remove(src, session=new_session('isnet-general-use')).save(RAW)
cut = Image.open(RAW)
bg = Image.new('RGB', cut.size, (0, 0, 0)); bg.paste(cut, mask=cut.split()[3])
g = ImageOps.autocontrast(ImageOps.grayscale(bg), cutoff=0.5)
w, h = g.size
face_x = 0.405 * w            # nose bridge in the source frame
cw, pad = int(h * 0.875), int(h * 0.094)   # 4:5 frame with black headroom
left = max(0, min(w - cw, int(face_x - cw / 2)))
frame = Image.new('L', (cw, int(cw * 1.25)), 0)
frame.paste(g.crop((left, 0, left + cw, h)), (0, pad))
g = frame
g.resize((900, 1125), Image.LANCZOS).save(OUT, quality=86, method=6)
print(g.size, left)

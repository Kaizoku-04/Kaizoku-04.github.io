"""Web versions of the certificates: a full image and a thumbnail each."""
import subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageOps

C = Path('/media/kaizoku/D/Me/Certificates')
OUT = Path('/media/kaizoku/D/Me/portfolio/assets/certs')
OUT.mkdir(parents=True, exist_ok=True)
items = {
    'ras-chair': 'RAS_Chair.pdf', 'nasa-space-apps': 'NASA Space Apps .jpg', 'htu-sumo': 'HTU_Sumo_Robots_2024.jpg',
    'just-robotics': 'JUST_Robotics_2023.jpg', 'acm-just': 'ACM_Problem_Solving_2024.jpg', 'ieeextreme': 'IEEEXtreme.png',
    'jpc': 'jpc-4.png', 'robbing-balloons': 'Atypical.jpeg', 'astrocode': 'Astrocode.pdf', 'robotna-iot': 'Robotna.png',
    'ros2-odometry': 'Odometr&Control.png', 'ros2-localization': 'Localization&Mapping.jpg',
    'kaggle-intro-ml': 'Mohannad Rababah - Intro to Machine Learning.png',
    'kaggle-intermediate-ml': 'Mohannad Rababah - Intermediate Machine Learning.png',
    'kaggle-deep-learning': 'Mohannad Rababah - Intro to Deep Learning.png',
    'kaggle-feature-eng': 'Mohannad Rababah - Feature Engineering.png',
    'kaggle-dataviz': 'Mohannad Rababah - Data Visualization.png', 'kaggle-pandas': 'Mohannad Rababah - Pandas.png',
}
tmp = Path(tempfile.mkdtemp())
for name, f in items.items():
    src = C / f
    if src.suffix == '.pdf':
        subprocess.run(['pdftoppm', '-r', '150', '-f', '1', '-l', '1', '-png', str(src), str(tmp / name)], check=True)
        src = next(tmp.glob(name + '*.png'))
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    full = im.copy(); full.thumbnail((1600, 1600), Image.LANCZOS); full.save(OUT / f'{name}.webp', quality=82, method=6)
    th = im.copy(); th.thumbnail((640, 640), Image.LANCZOS); th.save(OUT / f'{name}-thumb.webp', quality=78, method=6)
    print(name, full.size)

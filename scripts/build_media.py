"""Builds web-sized media for the site from the raw sources on D. Re-runnable."""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageOps

D = Path('/media/kaizoku/D')
OUT = D / 'Me/portfolio/assets/media'
OUT.mkdir(parents=True, exist_ok=True)

def img(src, name, width=1600, crop=None, gray=False, q=80):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0]*w), int(crop[1]*h), int(crop[2]*w), int(crop[3]*h)))
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if gray:
        im = ImageOps.grayscale(im)
    im.save(OUT / f'{name}.webp', quality=q, method=6)
    return im.size

def clip(src, name, start, dur, width=1280, crf=27, vf_extra=''):
    """dur=None keeps the whole video from start."""
    vf = f'scale={width}:-2:flags=lanczos{vf_extra},format=yuv420p'
    base = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + ['-i', str(src), '-an', '-vf', vf]
    subprocess.run(base + ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-movflags', '+faststart', str(OUT / f'{name}.mp4')], check=True)
    subprocess.run(base + ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', str(crf + 8), '-row-mt', '1', str(OUT / f'{name}.webm')], check=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start + 0.5), '-i', str(src), '-frames:v', '1',
                    '-vf', f'scale={width}:-2', '-q:v', '4', str(OUT / f'{name}-poster.jpg')], check=True)

R = D / 'Robotics'
# Sumo, real robot
sumo = R / 'Sumo/real_footage'
img(sumo / 'WhatsApp Image 2026-10-21 at 8.58.16 PM.jpeg', 'sumo-real-front', 1200)
img(sumo / 'WhatsApp Image 2026-10-21 at 8.58.16 PM (1).jpeg', 'sumo-real-side', 1200)
img(sumo / 'WhatsApp Image 2026-10-21 at 8.58.16 PM (3).jpeg', 'sumo-real-internals', 1000, crop=(0, 0.255, 1, 0.745))
clip(sumo / 'WhatsApp Video 2026-10-21 at 8.58.16 PM.mp4', 'sumo-real-wiring', 0, 9.6, width=474, crf=28)

# FloraBot
fv = R / 'FloraBot/main/Visualization'
# the three SOFEX screen videos, full length, 30 fps
clip(fv / 'screen/renders/sim-field/sim_field_PREVIEW.mp4', 'florabot-sim', 0, None, vf_extra=',fps=30')
clip(fv / 'screen/renders/hardware/hardware_tv.mp4', 'florabot-hardware', 0, None, vf_extra=',fps=30')
clip(fv / 'screen/renders/ai_pipeline_v2_tv.mp4', 'florabot-ai', 0, None, crf=25, vf_extra=',fps=30')

# OpenAMR
sr = R / 'OpenAMR/sim/renders'
for f, n in [('2026-09-25_presentation_warehouse/overview.png', 'amr-isaac-overview'),
             ('2026-09-25_presentation_warehouse/aisle.png', 'amr-isaac-aisle'),
             ('2026-09-25_presentation_warehouse/charging.png', 'amr-isaac-charging'),
             ('2026-09-25_presentation_warehouse/receiving_arm.png', 'amr-isaac-arm'),
             ('2026-09-26_box_handoff/handoff.png', 'amr-isaac-handoff'),
             ('2026-10-21_v2_revL/view_iso.jpg', 'amr-v2-iso'),
             ('2026-10-21_v2_revL/state_driving.jpg', 'amr-v2-driving'),
             ('2026-10-21_v2_revL/view_side.jpg', 'amr-v2-side'),
             ('2026-10-21_v2_revL/view_front.jpg', 'amr-v2-front'),
             ('2026-10-16_v2_concept/v1_fleet_lineup.png', 'amr-v2-fleet')]:
    img(sr / f, n, 1600)

# Leadership (Instagram, IEEE RAS JUST)
ig = D / 'Me/portfolio/_raw/instagram/img'
for f, n in [
             ('2025-12-04_DR2j3jYjN9O_4.jpg', 'ras-arduino-group'),
             ('2025-12-04_DR2j3jYjN9O_1.jpg', 'ras-arduino-teaching'),
             ('2025-12-04_DR2j3jYjN9O_12.jpg', 'ras-arduino-handson'),
             ('2025-12-04_DR2j3jYjN9O_10.jpg', 'ras-arduino-linefollower'),
             ('2026-01-06_DTLUv-PjECF_0.jpg', 'ras-solidworks'),
             ('2026-03-13_DV0xCvRiENk_0.jpg', 'ras-iftar'),
             ('2026-09-01_DcvHDpWDDlY_0.jpg', 'ras-esp32'),
             ('2026-09-01_DcwYB7Co4w2_0.jpg', 'ras-day'),
             ('2026-09-11_DdJJQM3jPTl_1.jpg', 'ras-day-session')]:
    img(ig / f, n, 1080)

# Portrait: background removed, black and white
from rembg import remove, new_session
src = ImageOps.exif_transpose(Image.open(D / 'Me/photos/IMG_7428.JPG'))
src.thumbnail((2000, 2000))
cut = remove(src, session=new_session('isnet-general-use'))
bg = Image.new('RGB', cut.size, (0, 0, 0)); bg.paste(cut, mask=cut.split()[3])
g = ImageOps.autocontrast(ImageOps.grayscale(bg), cutoff=0.5)
w, h = g.size  # keep head and shoulders, portrait crop
g = g.crop((int(w * 0.16), 0, int(w * 0.84), h))
g.resize((900, round(900 * g.height / g.width)), Image.LANCZOS).save(OUT / 'portrait.webp', quality=86, method=6)
print('ok')

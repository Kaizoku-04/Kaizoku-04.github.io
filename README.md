# Mohannad Rababah — portfolio

Static site: `index.html`, `assets/`. No build step; open `index.html` through any static server.

`scripts/` regenerates the web media from the original project files on the author's machine
(`build_media.py`, `build_certs.py`, `build_portrait.py`).

When `site.css`, `site.js` or `binary.js` changes, bump the `?v=` number on their links in `index.html`, so browsers holding the old files fetch the new ones.

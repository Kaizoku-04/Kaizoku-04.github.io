(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Top bar gains a rule once the page scrolls.
  const bar = document.querySelector('.bar');
  const onScroll = () => bar.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the section in view.
  const links = new Map([...document.querySelectorAll('.bar nav a')].map(a => [a.getAttribute('href').slice(1), a]));
  const sectionObs = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach(a => a.classList.remove('is-current'));
      links.get(en.target.id)?.classList.add('is-current');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

  // Media sit in black and white and take their colour when they reach the middle of the screen.
  // Videos only play while on screen.
  const toned = document.querySelectorAll('.media figure, .gallery figure, .honors__media figure');
  toned.forEach(f => f.querySelector('img, video')?.classList.add('tone'));
  const liveObs = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const el = en.target.querySelector('.tone');
      el?.classList.toggle('is-live', en.isIntersecting);
    }
  }, { rootMargin: '-30% 0px -30% 0px' });
  toned.forEach(f => liveObs.observe(f));

  const videos = document.querySelectorAll('video[data-autoplay]');
  if (reduced) {
    videos.forEach(v => { v.controls = true; v.preload = 'metadata'; });
  } else {
    const playObs = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const v = en.target;
        if (en.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => { v.controls = true; }); }
        else v.pause();
      }
    }, { threshold: 0.25 });
    videos.forEach(v => playObs.observe(v));
  }

  // Certificate viewer.
  const viewer = document.getElementById('viewer');
  const vimg = viewer.querySelector('img');
  document.querySelectorAll('[data-full]').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.querySelector('span')?.textContent || btn.textContent;
      vimg.src = btn.dataset.full;
      vimg.alt = `Certificate: ${label.trim()}`;
      viewer.setAttribute('aria-label', label.trim());
      viewer.showModal();
    });
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { vimg.removeAttribute('src'); });
})();

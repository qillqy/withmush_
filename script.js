(() => {
  'use strict';

  // 1. Block unexpected popup ads while preserving safe external links
  const nativeOpen = window.open.bind(window);
  window.open = (url, target, features) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      return nativeOpen(url, target || '_blank', features || 'noopener,noreferrer');
    }
    return null;
  };

  // 2. Auto-clean injected third-party ad iframes/scripts
  const adGuard = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const tag = node.tagName.toLowerCase();
        if (tag === 'iframe' || (tag === 'script' && node.src && !node.src.startsWith(location.origin))) {
          node.remove();
        }
      }
    }
  });
  adGuard.observe(document.documentElement, { childList: true, subtree: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  // ==========================================================================
  // 3. EDITORIAL LOADING SCREEN
  // ==========================================================================
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderPct = document.getElementById('preloader-pct');

  function runPreloader() {
    if (!preloader) {
      document.body.classList.remove('is-loading');
      return;
    }

    if (reducedMotion.matches) {
      preloader.remove();
      document.body.classList.remove('is-loading');
      return;
    }

    let current = 0;
    let finished = false;
    const startTime = performance.now();
    const minDuration = 780;
    let assetsReady = false;

    const readyPromise = Promise.all([
      document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
      new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
      })
    ]);

    readyPromise.then(() => { assetsReady = true; });
    window.setTimeout(() => { assetsReady = true; }, 2100);

    function finishPreloader() {
      if (finished) return;
      finished = true;
      if (preloaderBar) preloaderBar.style.transform = 'scaleX(1)';
      if (preloaderPct) preloaderPct.textContent = '100%';
      window.setTimeout(() => {
        preloader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        window.setTimeout(() => preloader.remove(), 950);
      }, 140);
    }

    function tick(now) {
      if (finished) return;
      const elapsed = now - startTime;
      const target = assetsReady
        ? 100
        : Math.min(88, (elapsed / minDuration) * 84);

      current += (target - current) * (assetsReady ? 0.18 : 0.1);
      if (assetsReady && elapsed >= minDuration && current > 98.6) {
        finishPreloader();
        return;
      }

      const clamped = Math.min(99, Math.max(0, current));
      if (preloaderBar) preloaderBar.style.transform = `scaleX(${(clamped / 100).toFixed(4)})`;
      if (preloaderPct) preloaderPct.textContent = `${String(Math.round(clamped)).padStart(2, '0')}%`;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  runPreloader();

  // ==========================================================================
  // 4. CMS DATA STORE (artGallery + projects + educationExperience)
  // ==========================================================================
  const STORAGE_KEY = 'withmush_cms_data_v2';

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function getDefaultData() {
    const src = window.CMS_DATA || {};
    return {
      artGallery: Array.isArray(src.artGallery) ? cloneData(src.artGallery) : [],
      projects: Array.isArray(src.projects) ? cloneData(src.projects) : [],
      educationExperience: Array.isArray(src.educationExperience) ? cloneData(src.educationExperience) : []
    };
  }

  function loadCmsData() {
    const defaults = getDefaultData();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.educationExperience)) {
          return {
            artGallery: Array.isArray(parsed.artGallery) ? parsed.artGallery : defaults.artGallery,
            projects: parsed.projects,
            educationExperience: parsed.educationExperience
          };
        }
      }
    } catch (_) {
      // Fallback to window.CMS_DATA
    }
    return defaults;
  }

  function persistCmsData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (_) {
      showToast('Browser storage is full. Click Publish to GitHub to save images to your repo.');
      return false;
    }
  }

  let cmsState = loadCmsData();
  let activeProjectCategory = 'all';
  let activeTimelineFilter = 'all';

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // 5. FLUID INTERSECTION REVEAL & SKILL BAR OBSERVER
  // ==========================================================================
  let revealObserver = null;

  function initRevealObserver() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      document.querySelectorAll('.skill-meter').forEach(meter => {
        const fill = meter.querySelector('.skill-fill');
        const level = Number(meter.dataset.level || 0) / 100;
        if (fill) fill.style.transform = `scaleX(${level})`;
      });
      return;
    }

    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        el.classList.add('is-visible');
        if (el.classList.contains('skill-meter')) {
          const fill = el.querySelector('.skill-fill');
          const level = Number(el.dataset.level || 0) / 100;
          if (fill) fill.style.transform = `scaleX(${level})`;
        }
        revealObserver.unobserve(el);
      }
    }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
  }

  function observeReveals(elements, stepMs = 55) {
    elements.forEach((el, index) => {
      if (reducedMotion.matches || !revealObserver) {
        el.classList.add('is-visible');
        if (el.classList.contains('skill-meter')) {
          const fill = el.querySelector('.skill-fill');
          const level = Number(el.dataset.level || 0) / 100;
          if (fill) fill.style.transform = `scaleX(${level})`;
        }
        return;
      }
      el.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * stepMs}ms`);
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  initRevealObserver();

  observeReveals([...document.querySelectorAll(
    '.resume-heading, .terminal > :not(.blank), .cms-band-header, .skill-meter, .email-link'
  )], 45);

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    if (revealObserver) revealObserver.disconnect();
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('.skill-meter').forEach(meter => {
      const fill = meter.querySelector('.skill-fill');
      const level = Number(meter.dataset.level || 0) / 100;
      if (fill) fill.style.transform = `scaleX(${level})`;
    });
  });

  // ==========================================================================
  // 6. SUBTLE POINTER TILT FOR FRAMED CARDS & ARTWORKS
  // ==========================================================================
  function bindFluidTilt(elements) {
    if (reducedMotion.matches || !finePointer.matches) return;
    elements.forEach(el => {
      if (el.dataset.tiltBound === '1') return;
      el.dataset.tiltBound = '1';
      el.addEventListener('pointermove', e => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-y * 4.5).toFixed(2);
        const ry = (x * 4.5).toFixed(2);
        el.style.transform = `perspective(900px) translate3d(0, -6px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ==========================================================================
  // 7. SLIDING FILTER PILL INDICATOR
  // ==========================================================================
  function updateFilterIndicator(bar) {
    if (!bar) return;
    const indicator = bar.querySelector('.filter-indicator');
    const activeBtn = bar.querySelector('.cms-filter-btn.is-active');
    if (!indicator || !activeBtn) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translate3d(${activeBtn.offsetLeft}px, 0, 0)`;
  }

  // ==========================================================================
  // 8. RENDER CMS 1: ART GALLERY
  // ==========================================================================
  const artGrid = document.getElementById('cms-art-grid');
  const artCount = document.getElementById('art-count');

  function renderArtGallery() {
    if (!artGrid) return;
    const items = cmsState.artGallery || [];
    if (artCount) {
      artCount.textContent = `${items.length} ${items.length === 1 ? 'artwork' : 'artworks'}`;
    }

    if (!items.length) {
      artGrid.innerHTML = `<div class="cms-empty-state" style="grid-column:1/-1;">No artworks published yet.</div>`;
      return;
    }

    artGrid.innerHTML = items.map((art, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const hasImage = Boolean(art.image && art.image.trim());
      const visual = hasImage
        ? `<img class="painting" src="${escapeHtml(art.image)}" alt="${escapeHtml(art.title || 'Artwork')}" loading="lazy" decoding="async">`
        : `<div class="frame-art-placeholder art-placeholder">
             <span class="frame-art-index">${num}</span>
             <span class="frame-art-barcode" aria-hidden="true">${escapeHtml((art.title || 'ARTWORK').slice(0, 12).toUpperCase())}</span>
             <span class="frame-art-cat">${escapeHtml(art.medium || 'Visual Art')}</span>
           </div>`;

      return `
        <figure class="painting-item" tabindex="0" role="button" data-art-id="${escapeHtml(art.id)}" aria-label="View artwork ${escapeHtml(art.title)}">
          <div class="painting-frame-wrap">${visual}</div>
          <figcaption class="painting-caption">
            <span class="painting-caption-title">${num} // ${escapeHtml(art.title || 'Untitled')}</span>
            <span class="painting-caption-meta">${escapeHtml([art.medium, art.year].filter(Boolean).join(' · '))}</span>
          </figcaption>
        </figure>`;
    }).join('');

    const cards = [...artGrid.querySelectorAll('.painting-item')];
    cards.forEach(card => {
      const open = () => openArtModal(card.dataset.artId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    observeReveals(cards, 75);
    bindFluidTilt(cards);
  }

  // ==========================================================================
  // 9. RENDER CMS 2: PROJECTS GALLERY
  // ==========================================================================
  const projectsGrid = document.getElementById('cms-projects-grid');
  const projectsCount = document.getElementById('projects-count');
  const projectsFilterBar = document.getElementById('projects-filter-bar');

  function renderProjectFilters() {
    if (!projectsFilterBar) return;
    const categories = ['all', ...new Set(cmsState.projects.map(p => (p.category || 'General').trim()).filter(Boolean))];
    if (!categories.includes(activeProjectCategory)) activeProjectCategory = 'all';

    projectsFilterBar.innerHTML = '<span class="filter-indicator" aria-hidden="true"></span>' +
      categories.map(cat => {
        const label = cat === 'all' ? 'All' : cat;
        const active = cat === activeProjectCategory;
        return `<button type="button" class="cms-filter-btn${active ? ' is-active' : ''}" data-filter="${escapeHtml(cat)}" role="tab" aria-selected="${active}">${escapeHtml(label)}</button>`;
      }).join('');

    projectsFilterBar.querySelectorAll('.cms-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeProjectCategory = btn.dataset.filter;
        projectsFilterBar.querySelectorAll('.cms-filter-btn').forEach(b => {
          const isAct = b === btn;
          b.classList.toggle('is-active', isAct);
          b.setAttribute('aria-selected', String(isAct));
        });
        updateFilterIndicator(projectsFilterBar);
        renderProjectsGrid();
      });
    });

    requestAnimationFrame(() => updateFilterIndicator(projectsFilterBar));
  }

  function renderProjectsGrid() {
    if (!projectsGrid) return;
    const filtered = activeProjectCategory === 'all'
      ? cmsState.projects
      : cmsState.projects.filter(p => (p.category || 'General').trim() === activeProjectCategory);

    if (projectsCount) {
      projectsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'}`;
    }

    if (!filtered.length) {
      projectsGrid.innerHTML = `<div class="cms-empty-state">No projects in this category yet.</div>`;
      return;
    }

    projectsGrid.innerHTML = filtered.map((proj, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const stackTags = (proj.stack || []).slice(0, 3).map(t => `<span class="frame-tag">${escapeHtml(t)}</span>`).join('');
      const hasImage = Boolean(proj.image && proj.image.trim());
      const visual = hasImage
        ? `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" loading="lazy" decoding="async">`
        : `<div class="frame-art-placeholder">
             <span class="frame-art-index">${num}</span>
             <span class="frame-art-barcode" aria-hidden="true">${escapeHtml((proj.title || 'PROJECT').slice(0, 14).toUpperCase())}</span>
             <span class="frame-art-cat">${escapeHtml(proj.category || 'Project')}</span>
           </div>`;

      return `
        <article class="gallery-frame-card" tabindex="0" role="button" data-project-id="${escapeHtml(proj.id)}" aria-label="View project details for ${escapeHtml(proj.title)}">
          <div class="frame-canvas">${visual}</div>
          <div class="frame-plaque">
            <div class="frame-meta">
              <span>${num} // ${escapeHtml(proj.category || 'Project')}</span>
              <span>${escapeHtml(proj.year || '')}</span>
            </div>
            <h4 class="frame-title">${escapeHtml(proj.title)}</h4>
            <p class="frame-summary">${escapeHtml(proj.summary || proj.description || '')}</p>
            <div class="frame-footer">
              <div class="frame-tags">${stackTags}</div>
              <span class="frame-cue">Details &rarr;</span>
            </div>
          </div>
        </article>`;
    }).join('');

    const cards = [...projectsGrid.querySelectorAll('.gallery-frame-card')];
    cards.forEach(card => {
      const open = () => openProjectModal(card.dataset.projectId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    observeReveals(cards, 70);
    bindFluidTilt(cards);
  }

  // ==========================================================================
  // 10. RENDER CMS 3: EDUCATION & EXPERIENCE TIMELINE
  // ==========================================================================
  const timelineList = document.getElementById('cms-timeline-list');
  const timelineCount = document.getElementById('timeline-count');
  const timelineFilterBar = document.getElementById('timeline-filter-bar');

  function normalizeTimelineType(type) {
    if (type === 'experience' || type === 'pengalaman') return 'experience';
    return 'education';
  }

  if (timelineFilterBar) {
    timelineFilterBar.querySelectorAll('.cms-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTimelineFilter = btn.dataset.filter;
        timelineFilterBar.querySelectorAll('.cms-filter-btn').forEach(b => {
          const isAct = b === btn;
          b.classList.toggle('is-active', isAct);
          b.setAttribute('aria-selected', String(isAct));
        });
        updateFilterIndicator(timelineFilterBar);
        renderTimeline();
      });
    });
    requestAnimationFrame(() => updateFilterIndicator(timelineFilterBar));
  }

  function renderTimeline() {
    if (!timelineList) return;
    const filtered = activeTimelineFilter === 'all'
      ? cmsState.educationExperience
      : cmsState.educationExperience.filter(item => normalizeTimelineType(item.type) === activeTimelineFilter);

    if (timelineCount) {
      timelineCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`;
    }

    if (!filtered.length) {
      timelineList.innerHTML = `<li class="cms-empty-state">No entries in this category yet.</li>`;
      return;
    }

    timelineList.innerHTML = filtered.map(item => {
      const isExp = normalizeTimelineType(item.type) === 'experience';
      const badgeLabel = isExp ? 'Experience' : 'Education';
      const orgLine = [item.organization, item.location].filter(Boolean).join(' · ');
      const highlights = (item.highlights || []).map(h => `<span class="timeline-chip">[+] ${escapeHtml(h)}</span>`).join('');

      return `
        <li class="timeline-entry">
          <span class="timeline-node" aria-hidden="true"></span>
          <article class="timeline-frame-card">
            <div class="timeline-card-top">
              <span class="timeline-type-badge${isExp ? ' is-experience' : ''}">${badgeLabel}</span>
              <span class="timeline-period">${escapeHtml(item.period || '')}</span>
            </div>
            <h4 class="timeline-title">${escapeHtml(item.title)}</h4>
            ${orgLine ? `<p class="timeline-org">${escapeHtml(orgLine)}</p>` : ''}
            <p class="timeline-summary">${escapeHtml(item.summary || '')}</p>
            ${highlights ? `<div class="timeline-highlights">${highlights}</div>` : ''}
          </article>
        </li>`;
    }).join('');

    observeReveals([...timelineList.querySelectorAll('.timeline-entry')], 75);
  }

  // Initial CMS render
  renderArtGallery();
  renderProjectFilters();
  renderProjectsGrid();
  renderTimeline();

  // ==========================================================================
  // 11. MODAL SYSTEM (Detail Lightbox + Passcode Auth + CMS Studio)
  // ==========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modalEl.classList.add('is-open'));
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    window.setTimeout(() => {
      if (!modalEl.classList.contains('is-open')) modalEl.hidden = true;
    }, 380);
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(document.getElementById(btn.dataset.closeModal));
    });
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const openOverlay = document.querySelector('.modal-overlay.is-open');
      if (openOverlay) closeModal(openOverlay);
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      requestCmsAccess('artGallery');
    }
  });

  // Detail Lightbox (shared for Projects & Art Gallery)
  const projectModal = document.getElementById('project-modal');

  function openArtModal(artId) {
    const art = (cmsState.artGallery || []).find(a => a.id === artId);
    if (!art || !projectModal) return;

    const visual = document.getElementById('project-modal-visual');
    visual.classList.add('is-artwork');
    if (art.image && art.image.trim()) {
      visual.innerHTML = `<img src="${escapeHtml(art.image)}" alt="${escapeHtml(art.title)}">`;
    } else {
      visual.innerHTML = `
        <div class="frame-art-placeholder">
          <span class="frame-art-index">${escapeHtml(art.year || 'ART')}</span>
          <span class="frame-art-barcode" aria-hidden="true">${escapeHtml((art.title || 'ARTWORK').slice(0, 18).toUpperCase())}</span>
          <span class="frame-art-cat">${escapeHtml(art.medium || 'Visual Art')}</span>
        </div>`;
    }

    document.getElementById('project-modal-category').textContent = art.medium || 'Visual Art';
    document.getElementById('project-modal-year').textContent = art.year || '';
    document.getElementById('project-modal-status').textContent = '';
    document.getElementById('project-modal-title').textContent = art.title || 'Untitled';
    document.getElementById('project-modal-desc').textContent = art.description || '';
    document.getElementById('project-modal-stack').innerHTML = '';
    document.getElementById('project-modal-links').innerHTML = '';

    openModal(projectModal);
  }

  function openProjectModal(projectId) {
    const proj = cmsState.projects.find(p => p.id === projectId);
    if (!proj || !projectModal) return;

    const visual = document.getElementById('project-modal-visual');
    visual.classList.remove('is-artwork');
    if (proj.image && proj.image.trim()) {
      visual.innerHTML = `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}">`;
    } else {
      visual.innerHTML = `
        <div class="frame-art-placeholder">
          <span class="frame-art-index">${escapeHtml(proj.year || 'WORK')}</span>
          <span class="frame-art-barcode" aria-hidden="true">${escapeHtml((proj.title || 'PROJECT').slice(0, 18).toUpperCase())}</span>
          <span class="frame-art-cat">${escapeHtml(proj.category || 'Project')}</span>
        </div>`;
    }

    document.getElementById('project-modal-category').textContent = proj.category || 'Project';
    document.getElementById('project-modal-year').textContent = proj.year || '';
    document.getElementById('project-modal-status').textContent = proj.status ? `• ${proj.status}` : '';
    document.getElementById('project-modal-title').textContent = proj.title || '';
    document.getElementById('project-modal-desc').textContent = proj.description || proj.summary || '';

    const stackEl = document.getElementById('project-modal-stack');
    stackEl.innerHTML = (proj.stack || []).map(s => `<span class="frame-tag">${escapeHtml(s)}</span>`).join('');

    const linksEl = document.getElementById('project-modal-links');
    const links = [];
    if (proj.link) links.push(`<a class="project-ext-link" href="${escapeHtml(proj.link)}" target="_blank" rel="noopener noreferrer">Visit Project &nearr;</a>`);
    if (proj.repo) links.push(`<a class="project-ext-link is-secondary" href="${escapeHtml(proj.repo)}" target="_blank" rel="noopener noreferrer">Source Code &nearr;</a>`);
    linksEl.innerHTML = links.join('');

    openModal(projectModal);
  }

  // ==========================================================================
  // 12. PRIVATE CMS STUDIO (Passcode Gate + 3 CMS Modules + Export)
  // ==========================================================================
  const cmsModal = document.getElementById('cms-modal');
  const cmsItemsList = document.getElementById('cms-items-list');
  const cmsForm = document.getElementById('cms-form');
  const cmsListLabel = document.getElementById('cms-list-label');
  const cmsToast = document.getElementById('cms-toast');
  let cmsActiveTab = 'artGallery';
  let cmsSelectedId = null;
  let toastTimer = null;

  function showToast(msg) {
    if (!cmsToast) return;
    cmsToast.textContent = msg;
    cmsToast.hidden = false;
    requestAnimationFrame(() => cmsToast.classList.add('is-shown'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      cmsToast.classList.remove('is-shown');
      setTimeout(() => { cmsToast.hidden = true; }, 350);
    }, 2800);
  }

  // Pure-JS SHA-256 helper (works identically on https://, localhost, and file://)
  function sha256Hex(message) {
    const bytes = new TextEncoder().encode(message);
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bitLen = bytes.length * 8;
    const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);
    const W = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < paddedLen; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = view.getUint32(i + t * 4, false);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(v => v.toString(16).padStart(8, '0')).join('');
  }

  // Default passcode: "withmush2026" (stored as SHA-256 hash)
  const CMS_PASSCODE_HASH = 'dd46f188df67d0c4d0266d5caf7c72be42d0a4c3586b4833a235f615a81b0603';
  const AUTH_SESSION_KEY = 'withmush_cms_unlocked_v1';
  const cmsAuthModal = document.getElementById('cms-auth-modal');
  const cmsAuthForm = document.getElementById('cms-auth-form');
  const cmsAuthInput = document.getElementById('cms-auth-input');
  const cmsAuthError = document.getElementById('cms-auth-error');
  const cmsAuthCard = cmsAuthModal?.querySelector('.cms-auth-card');
  let pendingCmsTab = 'artGallery';

  function isCmsUnlocked() {
    try { return sessionStorage.getItem(AUTH_SESSION_KEY) === '1'; } catch (_) { return false; }
  }

  function setCmsUnlocked(val) {
    try {
      if (val) sessionStorage.setItem(AUTH_SESSION_KEY, '1');
      else sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (_) {}
  }

  const cmsContentBody = document.getElementById('cms-content-body');
  const cmsGithubPane = document.getElementById('cms-github-pane');

  function setCmsTabUI(tab) {
    const validTabs = ['artGallery', 'projects', 'educationExperience', 'github'];
    cmsActiveTab = validTabs.includes(tab) ? tab : 'artGallery';
    document.querySelectorAll('.cms-tab-btn').forEach(btn => {
      const isAct = btn.dataset.cmsTab === cmsActiveTab;
      btn.classList.toggle('is-active', isAct);
      btn.setAttribute('aria-selected', String(isAct));
    });
    const isGh = cmsActiveTab === 'github';
    if (cmsContentBody) cmsContentBody.hidden = isGh;
    if (cmsGithubPane) cmsGithubPane.hidden = !isGh;
    if (isGh) {
      populateGitHubForm();
    } else {
      const list = cmsState[cmsActiveTab] || [];
      if (!list.some(item => item.id === cmsSelectedId)) {
        cmsSelectedId = list[0]?.id || null;
      }
      renderCmsStudio();
    }
  }

  function openCmsStudio(tab = 'artGallery') {
    setCmsTabUI(tab);
    openModal(cmsModal);
  }

  function requestCmsAccess(tab = 'artGallery') {
    pendingCmsTab = tab;
    if (isCmsUnlocked()) {
      openCmsStudio(tab);
      return;
    }
    if (!cmsAuthModal) return;
    if (cmsAuthInput) cmsAuthInput.value = '';
    if (cmsAuthError) cmsAuthError.hidden = true;
    openModal(cmsAuthModal);
    window.setTimeout(() => cmsAuthInput?.focus(), 120);
  }

  cmsAuthForm?.addEventListener('submit', e => {
    e.preventDefault();
    const value = String(cmsAuthInput?.value || '');
    if (sha256Hex(value) === CMS_PASSCODE_HASH) {
      setCmsUnlocked(true);
      closeModal(cmsAuthModal);
      window.setTimeout(() => openCmsStudio(pendingCmsTab), 220);
      showToast('CMS Studio unlocked.');
    } else {
      if (cmsAuthError) cmsAuthError.hidden = false;
      if (cmsAuthCard) {
        cmsAuthCard.classList.remove('is-shaking');
        void cmsAuthCard.offsetWidth;
        cmsAuthCard.classList.add('is-shaking');
      }
      cmsAuthInput?.select();
    }
  });

  // Secret mobile trigger: tap 5x quickly on the RESUME barcode heading
  const resumeTitleEl = document.getElementById('resume-title');
  if (resumeTitleEl) {
    let tapCount = 0;
    let tapTimer = null;
    resumeTitleEl.addEventListener('click', () => {
      tapCount += 1;
      clearTimeout(tapTimer);
      if (tapCount >= 5) {
        tapCount = 0;
        requestCmsAccess('artGallery');
      } else {
        tapTimer = setTimeout(() => { tapCount = 0; }, 1800);
      }
    });
  }

  document.querySelectorAll('.cms-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setCmsTabUI(btn.dataset.cmsTab));
  });

  function syncAndRefreshUI() {
    persistCmsData(cmsState);
    renderArtGallery();
    renderProjectFilters();
    renderProjectsGrid();
    renderTimeline();
    renderCmsStudio();
  }

  function moveItem(index, delta) {
    const arr = cmsState[cmsActiveTab];
    const target = index + delta;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    syncAndRefreshUI();
  }

  function renderCmsStudio() {
    const arr = cmsState[cmsActiveTab] || [];
    const labels = {
      artGallery: `Artworks (${arr.length})`,
      projects: `Projects (${arr.length})`,
      educationExperience: `Timeline Entries (${arr.length})`
    };
    cmsListLabel.textContent = labels[cmsActiveTab] || `Items (${arr.length})`;

    if (!arr.length) {
      cmsItemsList.innerHTML = `<li class="cms-item-sub" style="padding:12px;">No items yet. Click "+ Add New".</li>`;
      cmsForm.innerHTML = `<p class="cms-item-sub" style="grid-column:1/-1;">Click <strong>+ Add New</strong> on the left to create your first entry.</p>`;
      return;
    }

    if (!arr.some(item => item.id === cmsSelectedId)) {
      cmsSelectedId = arr[0].id;
    }

    cmsItemsList.innerHTML = arr.map((item, idx) => {
      let sub = '';
      if (cmsActiveTab === 'artGallery') {
        sub = `${item.medium || 'Visual Art'} · ${item.year || '-'}`;
      } else if (cmsActiveTab === 'projects') {
        sub = `${item.category || 'Project'} · ${item.year || '-'}`;
      } else {
        sub = `${normalizeTimelineType(item.type) === 'experience' ? 'Experience' : 'Education'} · ${item.period || '-'}`;
      }
      return `
        <li class="cms-list-item${item.id === cmsSelectedId ? ' is-selected' : ''}" data-id="${escapeHtml(item.id)}">
          <div class="cms-item-info">
            <div class="cms-item-title">${escapeHtml(item.title || 'Untitled')}</div>
            <div class="cms-item-sub">${escapeHtml(sub)}</div>
          </div>
          <div class="cms-item-order">
            <button type="button" class="cms-mini-btn" data-move="up" data-idx="${idx}" title="Move up">&uarr;</button>
            <button type="button" class="cms-mini-btn" data-move="down" data-idx="${idx}" title="Move down">&darr;</button>
          </div>
        </li>`;
    }).join('');

    cmsItemsList.querySelectorAll('.cms-list-item').forEach(li => {
      li.addEventListener('click', e => {
        if (e.target.closest('.cms-mini-btn')) return;
        cmsSelectedId = li.dataset.id;
        renderCmsStudio();
      });
    });

    cmsItemsList.querySelectorAll('.cms-mini-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        moveItem(Number(btn.dataset.idx), btn.dataset.move === 'up' ? -1 : 1);
      });
    });

    const current = arr.find(item => item.id === cmsSelectedId);
    if (!current) return;

    if (cmsActiveTab === 'artGallery') {
      cmsForm.innerHTML = `
        <div class="cms-field is-full">
          <label for="f-title">Artwork Title</label>
          <input id="f-title" name="title" type="text" value="${escapeHtml(current.title)}" required>
        </div>
        <div class="cms-field">
          <label for="f-medium">Medium / Style</label>
          <input id="f-medium" name="medium" type="text" value="${escapeHtml(current.medium)}" placeholder="Abstract Painting / Acrylic on Canvas">
        </div>
        <div class="cms-field">
          <label for="f-year">Year</label>
          <input id="f-year" name="year" type="text" value="${escapeHtml(current.year)}" placeholder="2026">
        </div>
        <div class="cms-field is-full">
          <label for="f-image">Image (local path ./assets/..., URL, or upload preview)</label>
          <div class="cms-image-row">
            <input id="f-image" name="image" type="text" value="${escapeHtml(current.image)}" placeholder="./assets/painting-new.png">
            <label class="cms-upload-label">
              Upload Image
              <input id="f-image-file" type="file" accept="image/*" hidden>
            </label>
          </div>
        </div>
        <div class="cms-field is-full">
          <label for="f-description">Artist Note / Description</label>
          <textarea id="f-description" name="description">${escapeHtml(current.description)}</textarea>
        </div>
        <div class="cms-form-actions">
          <button type="button" id="cms-delete-item" class="cms-btn cms-btn-danger">Delete Artwork</button>
          <button type="submit" class="cms-btn cms-btn-primary">Save Changes</button>
        </div>`;
    } else if (cmsActiveTab === 'projects') {
      cmsForm.innerHTML = `
        <div class="cms-field is-full">
          <label for="f-title">Project Title</label>
          <input id="f-title" name="title" type="text" value="${escapeHtml(current.title)}" required>
        </div>
        <div class="cms-field">
          <label for="f-category">Category</label>
          <input id="f-category" name="category" type="text" value="${escapeHtml(current.category)}" placeholder="Data Science / Web Development / Art">
        </div>
        <div class="cms-field">
          <label for="f-year">Year</label>
          <input id="f-year" name="year" type="text" value="${escapeHtml(current.year)}" placeholder="2026">
        </div>
        <div class="cms-field">
          <label for="f-status">Status</label>
          <input id="f-status" name="status" type="text" value="${escapeHtml(current.status)}" placeholder="Completed / Active">
        </div>
        <div class="cms-field">
          <label for="f-stack">Tech Stack / Tags (comma-separated)</label>
          <input id="f-stack" name="stack" type="text" value="${escapeHtml((current.stack || []).join(', '))}" placeholder="Python, SQL, HTML">
        </div>
        <div class="cms-field is-full">
          <label for="f-image">Image (local path ./assets/..., URL, or upload preview)</label>
          <div class="cms-image-row">
            <input id="f-image" name="image" type="text" value="${escapeHtml(current.image)}" placeholder="./assets/project-1.png">
            <label class="cms-upload-label">
              Upload Image
              <input id="f-image-file" type="file" accept="image/*" hidden>
            </label>
          </div>
        </div>
        <div class="cms-field is-full">
          <label for="f-summary">Short Summary (shown on gallery card)</label>
          <textarea id="f-summary" name="summary">${escapeHtml(current.summary)}</textarea>
        </div>
        <div class="cms-field is-full">
          <label for="f-description">Full Description (shown in detail modal)</label>
          <textarea id="f-description" name="description">${escapeHtml(current.description)}</textarea>
        </div>
        <div class="cms-field">
          <label for="f-link">Live / Demo URL (optional)</label>
          <input id="f-link" name="link" type="url" value="${escapeHtml(current.link)}" placeholder="https://...">
        </div>
        <div class="cms-field">
          <label for="f-repo">Repository URL (optional)</label>
          <input id="f-repo" name="repo" type="url" value="${escapeHtml(current.repo)}" placeholder="https://github.com/...">
        </div>
        <div class="cms-form-actions">
          <button type="button" id="cms-delete-item" class="cms-btn cms-btn-danger">Delete Project</button>
          <button type="submit" class="cms-btn cms-btn-primary">Save Changes</button>
        </div>`;
    } else {
      const normalizedType = normalizeTimelineType(current.type);
      cmsForm.innerHTML = `
        <div class="cms-field">
          <label for="f-type">Type</label>
          <select id="f-type" name="type">
            <option value="education"${normalizedType === 'education' ? ' selected' : ''}>Education</option>
            <option value="experience"${normalizedType === 'experience' ? ' selected' : ''}>Experience</option>
          </select>
        </div>
        <div class="cms-field">
          <label for="f-period">Period / Year</label>
          <input id="f-period" name="period" type="text" value="${escapeHtml(current.period)}" placeholder="2024 — Present">
        </div>
        <div class="cms-field is-full">
          <label for="f-title">Degree / Role / Title</label>
          <input id="f-title" name="title" type="text" value="${escapeHtml(current.title)}" required>
        </div>
        <div class="cms-field">
          <label for="f-organization">Institution / Organization</label>
          <input id="f-organization" name="organization" type="text" value="${escapeHtml(current.organization)}" placeholder="Telkom University">
        </div>
        <div class="cms-field">
          <label for="f-location">Location</label>
          <input id="f-location" name="location" type="text" value="${escapeHtml(current.location)}" placeholder="Indonesia / Remote">
        </div>
        <div class="cms-field is-full">
          <label for="f-summary">Description</label>
          <textarea id="f-summary" name="summary">${escapeHtml(current.summary)}</textarea>
        </div>
        <div class="cms-field is-full">
          <label for="f-highlights">Highlights / Skills (comma-separated)</label>
          <input id="f-highlights" name="highlights" type="text" value="${escapeHtml((current.highlights || []).join(', '))}" placeholder="Python, Statistics, Machine Learning">
        </div>
        <div class="cms-form-actions">
          <button type="button" id="cms-delete-item" class="cms-btn cms-btn-danger">Delete Entry</button>
          <button type="submit" class="cms-btn cms-btn-primary">Save Changes</button>
        </div>`;
    }

    const fileInput = document.getElementById('f-image-file');
    if (fileInput) {
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
          const compressed = await compressImageFile(file);
          document.getElementById('f-image').value = compressed;
          showToast('Image optimized & loaded. Click Save Changes, then Publish to GitHub.');
        } catch (_) {
          showToast('Could not read image file.');
        }
      });
    }

    document.getElementById('cms-delete-item')?.addEventListener('click', () => {
      cmsState[cmsActiveTab] = cmsState[cmsActiveTab].filter(item => item.id !== cmsSelectedId);
      cmsSelectedId = cmsState[cmsActiveTab][0]?.id || null;
      syncAndRefreshUI();
      showToast('Item deleted.');
    });
  }

  cmsForm?.addEventListener('submit', e => {
    e.preventDefault();
    const arr = cmsState[cmsActiveTab];
    const current = arr.find(item => item.id === cmsSelectedId);
    if (!current) return;
    const fd = new FormData(cmsForm);

    if (cmsActiveTab === 'artGallery') {
      current.title = String(fd.get('title') || '').trim() || 'Untitled Artwork';
      current.medium = String(fd.get('medium') || '').trim() || 'Visual Art';
      current.year = String(fd.get('year') || '').trim();
      current.image = String(fd.get('image') || '').trim();
      current.description = String(fd.get('description') || '').trim();
    } else if (cmsActiveTab === 'projects') {
      current.title = String(fd.get('title') || '').trim() || 'Untitled Project';
      current.category = String(fd.get('category') || '').trim() || 'General';
      current.year = String(fd.get('year') || '').trim();
      current.status = String(fd.get('status') || '').trim();
      current.image = String(fd.get('image') || '').trim();
      current.summary = String(fd.get('summary') || '').trim();
      current.description = String(fd.get('description') || '').trim();
      current.link = String(fd.get('link') || '').trim();
      current.repo = String(fd.get('repo') || '').trim();
      current.stack = String(fd.get('stack') || '').split(',').map(s => s.trim()).filter(Boolean);
    } else {
      current.type = String(fd.get('type') || 'education');
      current.period = String(fd.get('period') || '').trim();
      current.title = String(fd.get('title') || '').trim() || 'Untitled Entry';
      current.organization = String(fd.get('organization') || '').trim();
      current.location = String(fd.get('location') || '').trim();
      current.summary = String(fd.get('summary') || '').trim();
      current.highlights = String(fd.get('highlights') || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    syncAndRefreshUI();
    showToast('Changes saved and synced live.');
  });

  document.getElementById('cms-add-new')?.addEventListener('click', () => {
    const prefix = cmsActiveTab === 'artGallery' ? 'art' : (cmsActiveTab === 'projects' ? 'proj' : 'exp');
    const id = `${prefix}-${Date.now()}`;
    if (cmsActiveTab === 'artGallery') {
      cmsState.artGallery.unshift({
        id,
        title: 'New Artwork',
        medium: 'Abstract Painting',
        year: String(new Date().getFullYear()),
        image: '',
        description: 'Write a short artist note about the concept, colors, or process behind this piece.'
      });
    } else if (cmsActiveTab === 'projects') {
      cmsState.projects.unshift({
        id,
        title: 'New Project',
        category: 'Data Science',
        year: String(new Date().getFullYear()),
        status: 'In Progress',
        summary: 'Brief summary of what this project explores or solves.',
        description: 'Describe the problem, architecture, and key outcomes of this project.',
        stack: ['Python'],
        image: '',
        link: '',
        repo: ''
      });
    } else {
      cmsState.educationExperience.unshift({
        id,
        type: 'education',
        period: `${new Date().getFullYear()} — Present`,
        title: 'New Education / Experience',
        organization: 'Institution or Organization',
        location: 'Remote',
        summary: 'Describe your role, focus areas, or key achievements.',
        highlights: ['Core Skill']
      });
    }
    cmsSelectedId = id;
    syncAndRefreshUI();
    showToast('New item added.');
  });

  function buildCmsFileString() {
    return `/**\n * WITHMUSH_ PORTFOLIO CMS DATA\n * Generated via built-in CMS Studio\n */\n\nwindow.CMS_DATA = ${JSON.stringify(cmsState, null, 2)};\n`;
  }

  function compressImageFile(file, maxDim = 1600, quality = 0.86) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read_failed'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => resolve(reader.result);
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = outType === 'image/png'
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // 12B. GITHUB DIRECT PUBLISH (GitHub Contents API)
  // ==========================================================================
  const GH_CONFIG_KEY = 'withmush_gh_config_v1';
  const ghForm = document.getElementById('cms-github-form');
  const ghStatusEl = document.getElementById('cms-gh-status');
  const publishBtn = document.getElementById('cms-publish-btn');

  function getGitHubConfig() {
    const defaults = { owner: 'qillqy', repo: 'withmush_', branch: 'main', token: '' };
    try {
      const saved = JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        return {
          owner: String(saved.owner || defaults.owner).trim(),
          repo: String(saved.repo || defaults.repo).trim(),
          branch: String(saved.branch || defaults.branch).trim(),
          token: String(saved.token || '').trim()
        };
      }
    } catch (_) {}
    return defaults;
  }

  function saveGitHubConfig(cfg) {
    try {
      localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
    } catch (_) {}
  }

  function setGhStatus(text, tone = '') {
    if (!ghStatusEl) return;
    ghStatusEl.textContent = text;
    ghStatusEl.classList.remove('is-ok', 'is-error');
    if (tone === 'ok') ghStatusEl.classList.add('is-ok');
    if (tone === 'error') ghStatusEl.classList.add('is-error');
  }

  function populateGitHubForm() {
    if (!ghForm) return;
    const cfg = getGitHubConfig();
    ghForm.elements.owner.value = cfg.owner;
    ghForm.elements.repo.value = cfg.repo;
    ghForm.elements.branch.value = cfg.branch;
    ghForm.elements.token.value = cfg.token;
    if (cfg.token) {
      setGhStatus(`Ready to publish to ${cfg.owner}/${cfg.repo} (${cfg.branch}).`, 'ok');
    } else {
      setGhStatus('Not connected yet. Enter your GitHub token to enable 1-click publishing.');
    }
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function githubRequest(url, token, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {})
      }
    });
    let body = null;
    try { body = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, body };
  }

  async function putGitHubFile(cfg, filePath, base64Content, commitMessage) {
    const apiBase = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
    const existing = await githubRequest(`${apiBase}?ref=${encodeURIComponent(cfg.branch)}`, cfg.token);
    const payload = {
      message: commitMessage,
      content: base64Content,
      branch: cfg.branch
    };
    if (existing.ok && existing.body?.sha) {
      payload.sha = existing.body.sha;
    }
    const put = await githubRequest(apiBase, cfg.token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!put.ok) {
      throw new Error(put.body?.message || `GitHub API error (${put.status})`);
    }
    return put.body;
  }

  async function testGitHubConnection() {
    const cfg = {
      owner: String(ghForm?.elements.owner.value || '').trim(),
      repo: String(ghForm?.elements.repo.value || '').trim(),
      branch: String(ghForm?.elements.branch.value || 'main').trim(),
      token: String(ghForm?.elements.token.value || '').trim()
    };
    if (!cfg.token) {
      setGhStatus('Please paste your GitHub Personal Access Token first.', 'error');
      return;
    }
    setGhStatus('Testing connection to GitHub...');
    try {
      const res = await githubRequest(`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, cfg.token);
      if (res.ok) {
        saveGitHubConfig(cfg);
        setGhStatus(`Connected to ${res.body.full_name} (default branch: ${res.body.default_branch}).`, 'ok');
        showToast('GitHub connection verified.');
      } else {
        setGhStatus(`Connection failed: ${res.body?.message || res.status}`, 'error');
      }
    } catch (err) {
      setGhStatus(`Network error: ${err.message}`, 'error');
    }
  }

  async function publishToGitHub() {
    const cfg = getGitHubConfig();
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      setCmsTabUI('github');
      setGhStatus('Add your GitHub token first, then click Publish to GitHub.', 'error');
      showToast('Set up your GitHub token in tab 04 first.');
      return;
    }

    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.textContent = 'Publishing...';
    }

    try {
      let uploadedCount = 0;
      const collections = [
        ...(cmsState.artGallery || []),
        ...(cmsState.projects || [])
      ];

      for (const item of collections) {
        if (typeof item.image === 'string' && item.image.startsWith('data:image/')) {
          const match = item.image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (!match) continue;
          const extRaw = match[1].toLowerCase().replace('jpeg', 'jpg');
          const ext = ['jpg', 'png', 'webp', 'gif'].includes(extRaw) ? extRaw : 'jpg';
          const safeId = String(item.id || 'img').replace(/[^a-z0-9_-]/gi, '');
          const relPath = `assets/uploads/${safeId}-${Date.now()}.${ext}`;
          await putGitHubFile(cfg, relPath, match[2], `chore(cms): upload ${relPath}`);
          item.image = `./${relPath}`;
          uploadedCount += 1;
        }
      }

      const fileString = buildCmsFileString();
      await putGitHubFile(cfg, 'cms-data.js', utf8ToBase64(fileString), 'chore(cms): update portfolio content');

      persistCmsData(cmsState);
      renderArtGallery();
      renderProjectFilters();
      renderProjectsGrid();
      renderTimeline();
      if (cmsActiveTab !== 'github') renderCmsStudio();

      const imgNote = uploadedCount ? ` (+${uploadedCount} image${uploadedCount > 1 ? 's' : ''})` : '';
      setGhStatus(`Published to ${cfg.owner}/${cfg.repo}@${cfg.branch}${imgNote}. Live site updates in ~30–60s.`, 'ok');
      showToast(`Published to GitHub${imgNote}! Live in ~30–60s.`);
    } catch (err) {
      setGhStatus(`Publish failed: ${err.message}`, 'error');
      showToast(`Publish failed: ${err.message}`);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish to GitHub';
      }
    }
  }

  ghForm?.addEventListener('submit', e => {
    e.preventDefault();
    const cfg = {
      owner: String(ghForm.elements.owner.value || '').trim(),
      repo: String(ghForm.elements.repo.value || '').trim(),
      branch: String(ghForm.elements.branch.value || 'main').trim(),
      token: String(ghForm.elements.token.value || '').trim()
    };
    saveGitHubConfig(cfg);
    setGhStatus(`Settings saved for ${cfg.owner}/${cfg.repo} (${cfg.branch}).`, 'ok');
    showToast('GitHub settings saved in this browser.');
  });

  document.getElementById('gh-test-btn')?.addEventListener('click', testGitHubConnection);
  document.getElementById('gh-clear-btn')?.addEventListener('click', () => {
    const cfg = getGitHubConfig();
    cfg.token = '';
    saveGitHubConfig(cfg);
    populateGitHubForm();
    showToast('GitHub token cleared from this browser.');
  });

  publishBtn?.addEventListener('click', publishToGitHub);

  document.getElementById('cms-download-btn')?.addEventListener('click', () => {
    const blob = new Blob([buildCmsFileString()], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cms-data.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('cms-data.js downloaded.');
  });

  document.getElementById('cms-lock-btn')?.addEventListener('click', () => {
    setCmsUnlocked(false);
    closeModal(cmsModal);
    showToast('CMS Studio locked.');
  });

  document.getElementById('cms-reset-btn')?.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    cmsState = getDefaultData();
    if (cmsActiveTab !== 'github') {
      cmsSelectedId = cmsState[cmsActiveTab][0]?.id || null;
    }
    syncAndRefreshUI();
    showToast('Reset to default cms-data.js.');
  });

  if (new URLSearchParams(location.search).has('cms')) {
    requestCmsAccess('artGallery');
  }

  // ==========================================================================
  // 13. FLUID SCROLL ENGINE (Lerp Parallax, Scroll Progress, Scrollspy)
  // ==========================================================================
  const header = document.querySelector('.header');
  const progressBar = document.querySelector('.scroll-progress');
  const navLinks = [...document.querySelectorAll('.nav a')];
  const sections = ['about', 'resume', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
  const heroScene = document.querySelector('.hero-scene');
  const heroBg = document.querySelector('.hero-background');
  const heroBarcode = document.querySelector('.hero-barcode');
  const heroPerson = document.querySelector('.hero-person');

  let targetScrollY = window.scrollY;
  let smoothScrollY = window.scrollY;
  let rafId = null;

  function updateNavState(y) {
    header.classList.toggle('is-scrolled', y > 16);
    const marker = y + Math.min(window.innerHeight * 0.35, 280);
    let active = sections[0]?.id || 'about';
    for (const section of sections) {
      if (section.getBoundingClientRect().top + y <= marker) active = section.id;
    }
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 2 && sections.length) {
      active = sections[sections.length - 1].id;
    }
    for (const link of navLinks) {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function renderFluidFrame() {
    smoothScrollY += (targetScrollY - smoothScrollY) * 0.14;
    if (Math.abs(targetScrollY - smoothScrollY) < 0.2) {
      smoothScrollY = targetScrollY;
    }

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progressBar) {
      const ratio = Math.min(1, Math.max(0, smoothScrollY / maxScroll));
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    if (heroScene && !reducedMotion.matches) {
      const heroH = heroScene.offsetHeight || window.innerHeight;
      const p = Math.min(1.25, Math.max(0, smoothScrollY / heroH));
      const isMobile = window.innerWidth <= 900;

      if (heroBg) {
        heroBg.style.transform = `translate3d(0, ${(p * (isMobile ? 24 : 64)).toFixed(2)}px, 0) scale(1.03)`;
      }
      if (heroBarcode) {
        heroBarcode.style.transform = `translate3d(0, ${(p * (isMobile ? 34 : 95)).toFixed(2)}px, 0)`;
        heroBarcode.style.opacity = String(Math.max(0, 1 - p * 1.15).toFixed(3));
      }
      if (heroPerson) {
        const fade = Math.max(0, Math.min(1, 1 - Math.max(0, p - 0.38) / 0.55));
        heroPerson.style.transform = `translate3d(0, ${(p * (isMobile ? 12 : 28)).toFixed(2)}px, 0)`;
        heroPerson.style.opacity = fade.toFixed(3);
      }
    }

    updateNavState(targetScrollY);

    if (Math.abs(targetScrollY - smoothScrollY) >= 0.2) {
      rafId = requestAnimationFrame(renderFluidFrame);
    } else {
      rafId = null;
    }
  }

  function scheduleFluidFrame() {
    targetScrollY = window.scrollY;
    if (!rafId) rafId = requestAnimationFrame(renderFluidFrame);
  }

  window.addEventListener('scroll', scheduleFluidFrame, { passive: true });
  window.addEventListener('resize', () => {
    scheduleFluidFrame();
    updateFilterIndicator(projectsFilterBar);
    updateFilterIndicator(timelineFilterBar);
  }, { passive: true });

  renderFluidFrame();
})();

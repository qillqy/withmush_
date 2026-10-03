(() => {
  'use strict';

  const header = document.querySelector('.header');
  const links = [...document.querySelectorAll('.nav a')];
  const sections = ['about', 'resume', 'contact'].map(id => document.getElementById(id));
  let framePending = false;

  function updateNavigation() {
    header.classList.toggle('is-scrolled', window.scrollY > 16);
    const marker = window.scrollY + Math.min(window.innerHeight * .35, 280);
    let active = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) active = section.id;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = sections[sections.length - 1].id;
    }
    for (const link of links) {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    framePending = false;
  }

  function queueNavigationUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateNavigation);
  }

  window.addEventListener('scroll', queueNavigationUpdate, { passive: true });
  window.addEventListener('resize', queueNavigationUpdate);
  updateNavigation();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll(
    '.resume-heading, .terminal > :not(.blank), .painting, .email-link'
  )];

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .05 });

    targets.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', (index % 3) * 60 + 'ms');
      element.classList.add('reveal');
      observer.observe(element);
    });

    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      targets.forEach(element => element.classList.add('is-visible'));
    });
  }
})();

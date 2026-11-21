'use strict';
(() => {
  const stage = document.querySelector('#stage');
  const routeCaption = document.querySelector('.k-route-caption');
  const originalRouteCaption = routeCaption?.textContent;
  function setup() {
    const kai = stage.classList.contains('k-scene-intro');
    const mia = stage.classList.contains('k-scene-mia');
    if (routeCaption) routeCaption.textContent = mia ? 'BUILD → CHECK → SPEAK' : originalRouteCaption;
    if (!kai && !mia) return;
    const portrait = stage.querySelector(kai ? '.k-portrait > img' : '.k-mia > img');
    if (!portrait || portrait.dataset.reactive) return;
    portrait.dataset.reactive = 'true';
    portrait.classList.add('entry-character');
    portrait.tabIndex = 0;
    portrait.setAttribute('role', 'button');
    portrait.setAttribute('aria-label', kai ? 'Meet Kai' : 'Meet Mia');
    portrait.setAttribute('aria-expanded', 'false');
    const parent = portrait.parentElement;
    const message = document.createElement('div');
    message.className = 'entry-message';
    message.id = 'entry-personality';
    message.hidden = true;
    message.innerHTML = kai ? '<strong>Late again?</strong><span>Help Kai fix his morning.</span>' : '<strong>What if it’s wrong?</strong><span>Help Mia build the question.</span>';
    portrait.setAttribute('aria-controls', message.id);
    parent.append(message);
    const hint = document.createElement('span');
    hint.className = 'entry-discovery';
    hint.textContent = kai ? 'Meet Kai · hover or tap' : 'Meet Mia · hover or tap';
    parent.append(hint);
    let cta = stage.querySelector('[data-do="round"]');
    if (mia) {
      cta = document.createElement('button');
      cta.className = 'cta entry-mia-cta';
      cta.textContent = 'START MIA’S CHALLENGE →';
      stage.querySelector('.k-end-actions').prepend(cta);
      cta.addEventListener('click', () => {
        location.href = 'mia.html';
      });
    }
    cta?.classList.add('entry-story-cta');
    let pinned = false, hovering = false, focused = false;
    function update() {
      const active = pinned || hovering || focused;
      parent.classList.toggle('entry-active', active);
      cta?.classList.toggle('entry-cta-active', active);
      message.hidden = !active;
      portrait.setAttribute('aria-expanded', String(active));
    }
    portrait.addEventListener('pointerenter', e => {if(e.pointerType==='mouse'){hovering=true;update();}});
    portrait.addEventListener('pointerleave', () => {hovering=false;update();});
    portrait.addEventListener('focus', () => {focused=true;update();});
    portrait.addEventListener('blur', () => {focused=false;update();});
    portrait.addEventListener('click', () => {pinned=!pinned;update();});
    portrait.addEventListener('keydown', e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();pinned=!pinned;update();}if(e.key==='Escape'){pinned=false;hovering=false;focused=false;update();}});
    parent.addEventListener('keydown', e => {if(e.key==='Escape'){pinned=false;hovering=false;focused=false;update();}});
  }
  new MutationObserver(setup).observe(stage,{childList:true});
  setup();
})();

'use strict';
// Presentation-only layer. The activity, audio and learning state remain untouched.
(() => {
  const stage = document.querySelector('#stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let character = null, scene = '', frame = 0, point = null;
  const enabled = () => !reduce.matches && !document.body.classList.contains('motion-paused');
  function reset() {
    cancelAnimationFrame(frame); frame = 0; point = null;
    stage.style.removeProperty('--moment-x');
    stage.style.removeProperty('--moment-y');
    stage.classList.remove('moment-near');
  }
  function discover() {
    reset();
    scene = stage.classList.contains('k-scene-intro') ? 'chaos' : stage.classList.contains('k-scene-complete') ? 'calm' : stage.classList.contains('k-scene-mia') ? 'precise' : '';
    character = scene === 'chaos' ? stage.querySelector('.k-portrait > img') : scene === 'calm' ? stage.querySelector('.k-complete-top > img') : scene === 'precise' ? stage.querySelector('.k-mia > img') : null;
  }
  function respond() {
    frame = 0;
    if (!character || !point || !enabled()) return reset();
    const r = character.getBoundingClientRect();
    const dx = (point.x - r.left - r.width / 2) / Math.max(r.width / 2, 1);
    const dy = (point.y - r.top - r.height / 2) / Math.max(r.height / 2, 1);
    const near = Math.abs(dx) < 1.2 && Math.abs(dy) < 1.12;
    const strength = scene === 'chaos' ? 3.5 : scene === 'calm' ? 1.5 : 1;
    stage.classList.toggle('moment-near', near);
    stage.style.setProperty('--moment-x', (near ? Math.max(-1, Math.min(1, dx)) * strength : 0) + 'px');
    stage.style.setProperty('--moment-y', (near ? Math.max(-1, Math.min(1, dy)) * strength * .6 : 0) + 'px');
  }
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !character || !enabled()) return;
    point = {x:e.clientX, y:e.clientY};
    if (!frame) frame = requestAnimationFrame(respond);
  }, {passive:true});
  stage.addEventListener('pointerleave', reset);
  window.addEventListener('scroll', reset, {passive:true});
  document.addEventListener('visibilitychange', () => { if(document.hidden) reset(); });
  new MutationObserver(discover).observe(stage, {childList:true});
  new MutationObserver(() => { if(!enabled()) reset(); }).observe(document.body, {attributes:true, attributeFilter:['class']});
  reduce.addEventListener('change', reset);
  discover();
})();

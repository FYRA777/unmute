'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduce.matches;
try{paused=paused||localStorage.getItem('unmute-motion')==='off';}catch{}
const motion=$('.motion-control');
function setMotion(value){paused=value;document.body.classList.toggle('motion-paused',value);motion.setAttribute('aria-pressed',String(value));motion.setAttribute('aria-label',value?'Enable motion':'Pause motion');$('span',motion).textContent=value?'off':'on';}
setMotion(paused);
motion.addEventListener('click',()=>{setMotion(!paused);try{localStorage.setItem('unmute-motion',paused?'off':'on');}catch{}});
reduce.addEventListener('change',e=>{setMotion(e.matches);if(e.matches)finishIntro();});
const intro=$('#intro');let introTimer;let introOpen=false;
function finishIntro(){clearTimeout(introTimer);intro.hidden=true;introOpen=false;$$('header,main,footer').forEach(el=>el.inert=false);if(document.activeElement===$('#skip-intro'))$('.hero-actions .cta').focus({preventScroll:true});}
function startIntro(){if(paused||reduce.matches)return;intro.hidden=false;introOpen=true;intro.style.animation='none';void intro.offsetWidth;intro.style.animation='';$$('header,main,footer').forEach(el=>el.inert=true);$('#skip-intro').focus({preventScroll:true});introTimer=setTimeout(finishIntro,3350);}
$('#skip-intro').addEventListener('click',finishIntro);
document.addEventListener('keydown',e=>{if(introOpen&&e.key==='Escape')finishIntro();if(introOpen&&e.key==='Tab'){e.preventDefault();$('#skip-intro').focus();}});
intro.addEventListener('animationend',e=>{if(e.animationName==='intro-end')finishIntro();});
$('#replay').addEventListener('click',()=>{if(paused){setMotion(false);}window.scrollTo({top:0,behavior:'instant'});startIntro();});
// The page exists beneath the intro. Both a timer and CSS end it independently.
if(!location.hash)startIntro();
const characters=$$('.character');
characters.forEach(character=>character.addEventListener('click',()=>{const selected=character.getAttribute('aria-pressed')==='true';characters.forEach(el=>el.setAttribute('aria-pressed','false'));character.setAttribute('aria-pressed',String(!selected));}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')characters.forEach(el=>el.setAttribute('aria-pressed','false'));});
document.addEventListener('click',e=>{if(!e.target.closest('.character'))characters.forEach(el=>el.setAttribute('aria-pressed','false'));});
const hero=$('.hero'),cast=$('.cast');
hero.addEventListener('pointermove',e=>{if(paused||e.pointerType!=='mouse'||innerWidth<701)return;const r=hero.getBoundingClientRect();cast.style.setProperty('--x',`${((e.clientX-r.left)/r.width-.5)*10}px`);cast.style.setProperty('--y',`${((e.clientY-r.top)/r.height-.5)*6}px`);});
hero.addEventListener('pointerleave',()=>{cast.style.setProperty('--x','0px');cast.style.setProperty('--y','0px');});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const target=$(a.getAttribute('href'));if(!target)return;e.preventDefault();finishIntro();target.scrollIntoView({behavior:paused?'instant':'smooth',block:'start'});if(target.id==='kai'){$('#kai').classList.remove('entered');void $('#kai').offsetWidth;$('#kai').classList.add('entered');}history.replaceState(null,'',a.getAttribute('href'));if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});}));
let dialogTrigger=null;
$$('[data-dialog]').forEach(button=>button.addEventListener('click',()=>{const active=$('dialog[open]');if(active)active.close();dialogTrigger=button;const dialog=$('#'+button.dataset.dialog);dialog.showModal();$('.dialog-close',dialog).focus();}));
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(dialogTrigger&&dialogTrigger.isConnected&&!dialogTrigger.closest('dialog'))dialogTrigger.focus({preventScroll:true});});});

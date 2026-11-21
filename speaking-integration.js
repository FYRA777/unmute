'use strict';
(() => {
  const stage=document.querySelector('#stage');if(!stage)return;
  let active=null;
  function clear(){active?.dispose();active=null;document.body.classList.remove('voice-recording');}
  function mount(anchor,theme,prompt,onReady){
    clear();const host=document.createElement('section');host.setAttribute('aria-label','Optional voice practice');anchor.before(host);
    active=new SpeakingRecorder(host,{theme,prompt,onReady:()=>{host.remove();active=null;onReady();},onRecording:value=>document.body.classList.toggle('voice-recording',value)});
    return host;
  }
  function setup(){
    if(active&&!active.host.isConnected)clear();
    const kai=stage.classList.contains('k-scene-speak');
    const kaiNext=kai?stage.querySelector('[data-do="independent"]'):null;
    if(kaiNext&&!kaiNext.dataset.voiceSetup){
      kaiNext.dataset.voiceSetup='true';kaiNext.hidden=true;
      mount(kaiNext.parentElement,'kai','TELL KAI’S MORNING.',()=>{kaiNext.hidden=false;kaiNext.click();});
    }
    const partner=stage.querySelector('[data-action="go:answers"]');
    if(partner&&!partner.dataset.voiceSetup){
      partner.dataset.voiceSetup='true';partner.hidden=true;
      mount(partner.parentElement,'mia','Say the question here first.',()=>{partner.hidden=false;const cue=document.createElement('p');cue.className='lead';cue.textContent='NOW ASK YOUR PARTNER.';partner.parentElement.before(cue);partner.focus();});
    }
    const answer=stage.querySelector('[data-action="nextAnswer"]');
    if(active?.shortAnswer&&!active.anchor?.isConnected){active.host.remove();clear();}
    if(answer&&!answer.dataset.voiceSetup){
      answer.dataset.voiceSetup='true';const trigger=document.createElement('button');trigger.type='button';trigger.className='voice-practice-trigger';trigger.textContent='🎙 PRACTICE IT';answer.before(trigger);
      trigger.onclick=()=>{trigger.hidden=true;const prompt=stage.querySelector('#feedback p')?.textContent||'SAY YOUR ANSWER.';mount(answer.parentElement,'mia',prompt,()=>{trigger.hidden=false;answer.focus();});active.shortAnswer=true;active.anchor=answer;};
    }
  }
  new MutationObserver(setup).observe(stage,{childList:true,subtree:true});
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',e=>{if(e.persisted){stage.querySelectorAll('.voice-practice,.voice-practice-trigger').forEach(n=>n.remove());stage.querySelectorAll('[data-voice-setup]').forEach(n=>{delete n.dataset.voiceSetup;n.hidden=false;});setup();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){if(active.state==='recording')active.stop();else if(active.state==='requesting'){active.cancel();active.state='idle';active.render();}active.audio.pause();}});
  setup();
})();

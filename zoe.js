'use strict';
(()=>{
 const $=q=>document.querySelector(q),stage=$('#stage'),C=ZoeConversation;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let eligible=false,old={},off=false,opening=0;
 try{eligible=JSON.parse(sessionStorage.getItem('unmute-leo')||'{}').done===true;old=JSON.parse(sessionStorage.getItem('unmute-zoe')||'{}');off=localStorage.getItem('unmute-motion')==='off';opening=Number(sessionStorage.getItem('zoe-oral-opening')||0)%3;}catch{}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let screen='cover',turn=0,current=C.openings[opening],clues=[],latestClue='',result=null,help=false,voiceNotice='';
 const audio=new ZoeAudio(paint,level=>{if(!off&&!reduced.matches)stage.style.setProperty('--level',level);});
 const button=(text,act,primary=false)=>`<button data-act="${act}" class="${primary?'primary':'secondary'}">${text}</button>`;
 function portrait(pose){return `<div class="character"><button class="character-button" data-act="zoe" aria-label="Zoe: listen first" aria-pressed="false"><img src="assets/zoe/${pose}.png" alt="Zoe, curious and listening"></button><i class="thread-mark"></i><div class="caption" hidden><strong>STILL CURIOUS?</strong><span>Listen. Use the answer.</span></div></div>`;}
 function hush(){window.speechSynthesis?.cancel();}
 function speak(){hush();voiceNotice='';const voices=window.speechSynthesis?.getVoices()||[];const voice=voices.find(v=>/^en\b/i.test(v.lang)&&v.localService);if(!voice){voiceNotice='No voice here. Read the question, then say your answer.';paint();return;}const u=new SpeechSynthesisUtterance(current.q);u.voice=voice;u.lang=voice.lang;u.rate=.9;u.onerror=()=>{voiceNotice='Read the question, then say your answer.';paint();};speechSynthesis.speak(u);}
 function motion(){document.body.classList.toggle('motion-paused',off||reduced.matches);$('#motion').textContent=off||reduced.matches?'MOTION OFF':'MOTION ON';$('#motion').setAttribute('aria-pressed',String(off||reduced.matches));}
 function render(){hush();$('#journey').innerHTML='<li class="done">KAI ✓</li><li class="done">MIA ✓</li><li class="done">LEO ✓</li><li aria-current="step">ZOE ●</li><li>YOU ○</li>';$('#memory').innerHTML=clues.map(c=>`<span class="node">${esc(c.toUpperCase())}</span>`).join('');$('#position').textContent=screen==='talk'?`VOICE ${turn+1} OF 3`:'';
  if(!eligible){stage.innerHTML='<div class="work"><h1>KEEP GOING.</h1><p>Finish Leo first.</p><a class="primary link-button" href="leo.html">BACK TO LEO</a></div>';return;}
  if(screen==='cover')stage.innerHTML=`<section class="scene"><div><p class="eyebrow">ZOE</p><h1>THE ANSWER<br>IS <em>THE CLUE.</em></h1><p class="lead">LISTEN FIRST.</p><div class="actions">${button('SHOW ME','start',true)}</div></div>${portrait('cover')}</section>`;
  if(screen==='talk')stage.innerHTML=`<section class="scene oral-scene"><div><p class="eyebrow">LISTEN. THEN ANSWER ZOE.</p>${latestClue?`<div class="heard-node">${esc(latestClue.toUpperCase())}?</div>`:''}<h1 class="oral-question">${esc(current.q)}</h1><div class="question-play">${button('LISTEN TO ZOE','hear')}</div><p id="voice-notice" class="small"></p><div class="oral-wave" aria-hidden="true">${Array.from({length:25},(_,i)=>`<i style="--bar:${.2+(i%7)/7}"></i>`).join('')}</div><div id="record-state" role="status" aria-live="polite"></div><div id="record-actions" class="actions"></div><div id="heard" aria-live="polite"></div><div class="actions">${button('NEED HELP?','help')}</div><div id="oral-help"></div><p class="small">Playback stays here until you leave. Your browser may send speech to its online service to get the words.</p></div>${portrait('listening')}</section>`;
  if(screen==='end')stage.innerHTML=`<section class="scene final"><div>${latestClue?`<p class="thought">${esc(latestClue.toUpperCase())}. GOT IT.</p>`:''}<p class="eyebrow">THAT’S ZOE’S MOVE.</p><h1>LISTEN.<br><em>USE THE ANSWER.</em><br>ASK ONE MORE.</h1><p class="lead">NOW TRY IT FOR REAL.</p><div class="actions"><a class="primary link-button" href="you.html">STEP INTO YOU →</a>${button('TRY AGAIN','restart')}</div></div>${portrait('focused')}</section>`;
  paint();stage.focus();
 }
 function paint(){if(screen!=='talk'||!$('#record-actions'))return;const t=audio.get(turn),state=audio.state;document.body.classList.toggle('voice-recording',state==='recording');$('#voice-notice').textContent=voiceNotice;const listen=$('[data-act=hear]');if(listen)listen.disabled=['recording','requesting','stopping'].includes(state);
  let status='YOUR TURN.',actions=button('RECORD','record',true);
  if(state==='requesting'){status='MICROPHONE…';actions=button('CANCEL','cancel');}
  if(state==='recording'){status='● RECORDING…';actions=button('STOP','stop',true);}
  if(state==='stopping'){status='ONE SECOND…';actions='';}
  if(state==='ready'){status='LISTEN TO YOURSELF.';actions=button('LISTEN','listen')+button('TRY AGAIN','retry')+button('USE THIS','use',true);}
  if(state==='error'||state==='unavailable'){status='NO MIC? THAT’S OKAY. SAY IT OUT LOUD.';actions=button('TRY AGAIN','retry')+button('KEEP TALKING','skip',true);}
  $('#record-state').textContent=status;$('#record-actions').innerHTML=actions;
  let heard='';result=null;
  if(state==='ready'){
   if(t?.transcript){result=C.follow(t.transcript,current.context);heard=result?`<span class="label">I HEARD:</span><strong>${esc(result.clue.toUpperCase())}</strong>`:'<p>I COULDN’T FIND A CLUE. TELL ME MORE.</p>';}
   else heard=t?.words==='failed'?'<p>I COULDN’T GET THE WORDS.</p>':'<p>YOUR VOICE IS STILL HERE.</p>';
   if(!t?.transcript)heard+=button('KEEP TALKING','use');
  }
  if(audio.playError)heard+='<p>CAN’T PLAY. TRY AGAIN.</p>';
  $('#heard').innerHTML=heard;
  const figure=$('.oral-scene .character');if(figure){figure.classList.toggle('clue-found',!!result);const img=figure.querySelector('img');const src='assets/zoe/'+(result?'found-clue':'listening')+'.png';if(img.getAttribute('src')!==src)img.setAttribute('src',src);}
  $('#oral-help').innerHTML=help?`<div class="support">${result?esc(result.starter):clues.length?'Use your last answer. Tell me more.':'Say one thing you like.'}<br>NOW SAY IT.</div>`:'';
 }
 function advance(skip=false){const t=audio.get(turn);const found=skip?null:C.follow(t?.transcript,current.context);if(skip)audio.skip(turn);else audio.accept(turn);
  latestClue=found?.clue||'';
  if(found){clues.push(found.clue);current={q:found.question,context:found.context};}else current={q:'TELL ME MORE.',context:current.context};
  help=false;voiceNotice='';turn++;
  if(turn===3){screen='end';try{sessionStorage.setItem('unmute-zoe',JSON.stringify({done:true,preferredName:old.preferredName||'',favoriteThing:clues[0]||'',scene:'focused'}));}catch{}}
  render();
 }
 stage.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;
  if(a==='zoe'){const c=e.target.closest('.character');c.classList.toggle('active');c.querySelector('.caption').hidden=!c.classList.contains('active');c.querySelector('button').setAttribute('aria-pressed',String(c.classList.contains('active')));}
  if(a==='start'){screen='talk';render();speak();}
  if(a==='hear'&&audio.state!=='recording')speak();
  if(a==='record'){hush();audio.record(turn);}
  if(a==='stop')audio.stop();
  if(a==='listen'){hush();audio.play(turn);}
  if(a==='retry'){audio.cancel();audio.stopPlayback();audio.remove(turn);paint();}
  if(a==='cancel'){audio.cancel();paint();}
  if(a==='use')advance();if(a==='skip')advance(true);
  if(a==='help'){help=!help;paint();}
  if(a==='restart'){audio.dispose();opening=(opening+1)%3;try{sessionStorage.setItem('zoe-oral-opening',String(opening));}catch{}current=C.openings[opening];turn=0;clues=[];latestClue='';screen='cover';render();}
 });
 stage.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const c=e.target.closest('.character');if(c){c.classList.add('active');c.querySelector('.caption').hidden=false;}});
 stage.addEventListener('pointerout',e=>{const c=e.target.closest('.character');if(c&&!c.contains(e.relatedTarget)){c.classList.remove('active');c.querySelector('.caption').hidden=true;}});
 $('#back').onclick=()=>{audio.dispose();hush();if(screen==='cover')location.href='leo.html';else{turn=0;clues=[];latestClue='';current=C.openings[opening];screen='cover';render();}};
 $('#help').onclick=()=>{$('#dialog-title').textContent='LISTEN. THEN SPEAK.';$('#dialog-copy').textContent='Record your answer. Listen to it. Use it, or try again. Zoe follows the words the mic can hear.';$('#dialog').showModal();};$('#close').onclick=()=>$('#dialog').close();
 $('#motion').onclick=()=>{off=!off;try{localStorage.setItem('unmute-motion',off?'off':'on');}catch{}motion();};reduced.addEventListener('change',motion);
 window.addEventListener('pagehide',()=>{hush();audio.dispose();});document.addEventListener('visibilitychange',()=>{if(document.hidden){hush();if(audio.state==='recording')audio.stop();else if(audio.state==='requesting')audio.cancel();audio.stopPlayback();}});
 motion();render();
})();

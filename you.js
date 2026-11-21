'use strict';
(() => {
const $=q=>document.querySelector(q),stage=$('#stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clean=(v,n=48)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const people={kai:{name:'KAI',move:'PUT IT IN ORDER.',color:'lime',img:'assets/kai/relieved.png',close:'YOU STARTED.'},mia:{name:'MIA',move:'BUILD IT.',color:'violet',img:'assets/mia/confident.png',close:'YOU BUILT IT.'},leo:{name:'LEO',move:'KEEP GOING.',color:'cyan',img:'assets/leo/confident.png',close:'YOU KEPT GOING.'},zoe:{name:'ZOE',move:'ASK ONE MORE.',color:'coral',img:'assets/zoe/focused.png',close:'YOU LISTENED.'}};
const plan=[['self','ask',1],['partner','answer',1],['self','ask',2],['partner','answer',2],['partner','ask',1],['self','answer',1],['self','ask',3],['partner','answer',3],['partner','ask',2],['self','answer',2],['self','ask',4],['partner','answer',4]].map(([who,kind,num],id)=>({who,kind,num,id}));
const screens=['entry','partner','topic','studio','reflect','celebrate','rate','final'];
const feelings=['I FELT GOOD.','I NEEDED HELP.','I WANT MORE PRACTICE.','I SPOKE MORE TODAY.','I KEPT GOING.'];
const feedback=['HELPED ME SPEAK','EASY TO USE','I LIKED THE CHARACTERS','I WANT MORE PRACTICE','I NEEDED MORE HELP'];
let zoe={},off=false,restored=false;try{zoe=JSON.parse(sessionStorage.getItem('unmute-zoe')||'{}')||{};off=localStorage.getItem('unmute-motion')==='off';}catch{}
const eligible=zoe.done===true,source=[zoe.favoriteThing,zoe.favoriteSong,zoe.favoriteCharacter].map(x=>clean(x)).filter(Boolean);
let s={screen:'entry',name:clean(zoe.preferredName,24),partnerType:'',partnerName:'',topic:'',topicDetails:[],newTopic:false,started:false,turn:0,used:[],help:'',level:1,stuck:false,category:'',feelings:[],rating:0,feedback:[],comment:''};
try{const prefs=JSON.parse(sessionStorage.getItem('unmute-you-studio-prefs')||'null');if(prefs){s.partnerType=clean(prefs.partnerType);s.partnerName=clean(prefs.partnerName,24);restored=prefs.hadAudio===true;}}catch{}
const persist=()=>{try{sessionStorage.setItem('unmute-you-studio-prefs',JSON.stringify({partnerType:s.partnerType,partnerName:s.partnerName,hadAudio:audio.turns.size>0,rating:s.rating,feedback:s.feedback,comment:s.comment}));}catch{}};
const b=(label,act,primary=false)=>`<button type="button" class="${primary?'cta':'secondary'}" data-act="${act}">${label}</button>`;
const head=(tag,title,copy='')=>`<p class="eyebrow">${tag}</p><h1 class="you-title">${title}</h1>${copy?`<p class="lead">${copy}</p>`:''}`;
const mic=()=>'<div class="mic-scene"><img src="assets/you/broadcast-mic.svg" alt="A broadcast microphone on a studio arm"><i class="mic-light" aria-hidden="true"></i></div>';
const partner=()=>s.partnerName||'YOUR PARTNER',learner=()=>s.name||'YOU',turn=()=>plan[s.turn];
const audio=new StudioAudio(()=>paintAudio(),level=>{const room=$('#studio');if(room&&!off&&!reduced.matches)room.style.setProperty('--voice-level',String(level));});
let uiKey='';
function route(){$('.studio-route').hidden=!eligible;$('#journey').innerHTML=['KAI','MIA','LEO','ZOE','YOU'].map((x,i)=>`<li ${i===4?'aria-current="step"':''}>${x} ${i<4||s.screen==='final'?'✓':'●'}</li>`).join('');}
function go(screen){if(!screens.includes(screen))return;audio.cancel();audio.stopPlayback();s.screen=screen;s.help='';s.stuck=false;persist();render();}
function latestAnswer(){return [...audio.turns.values()].filter(x=>x.accepted&&plan[x.id]?.who==='partner'&&plan[x.id]?.kind==='answer'&&x.id<=s.turn).at(-1);}
function clueFrom(text){const tokens=String(text||'').match(/[\p{L}\p{N}’'-]+/gu)||[];const stop=new Set(['i','you','he','she','it','we','they','a','an','the','like','likes','love','watch','listen','to','do','does','my','is','am','are','at','in','on','with','and','yes','no','really','very','often']);return tokens.filter(x=>!stop.has(x.toLowerCase())).slice(-3).join(' ');}
function relevant(){if(s.stuck)return ['leo'];const t=turn(),current=audio.get(s.turn);if(t?.who==='partner'&&t.kind==='answer'&&current?.url)return ['zoe'];if(t?.who==='partner'&&t.kind==='ask')return ['zoe','leo'];if(t?.who==='self'&&t.kind==='answer')return ['leo'];if(latestAnswer()&&t?.who==='self'&&t.kind==='ask')return ['zoe','kai'];return ['kai','mia'];}
function crew(){return `<div class="support-crew"><p class="crew-note">NEED HELP? TAP A FRIEND.</p>${Object.entries(people).map(([k,c])=>`<button class="support-person" style="--accent:var(--${c.color})" data-act="support:${k}" data-person="${k}" aria-expanded="false" aria-controls="help-panel"><img src="${c.img}" alt="${c.name}" draggable="false"><strong>${c.name}</strong><small>${c.move}</small></button>`).join('')}</div>`;}
function studio(){return `<section class="studio-room" id="studio"><div class="studio-heading"><p class="eyebrow">UNMUTE / THE STUDIO</p><span class="topic-line">${esc([s.topic,...s.topicDetails].join(' · '))}</span></div><div class="voice-deck"><div class="person-station" id="self-station"><strong>${esc(learner())}</strong><small>YOUR VOICE</small></div>${mic()}<div class="person-station" id="partner-station"><strong>${esc(partner())}</strong><small>THEIR VOICE</small></div><div class="voice-line" aria-hidden="true"></div><div class="wave" aria-hidden="true">${Array.from({length:27},(_,i)=>`<i style="--bar-height:${10+(13-Math.abs(i-13))*2}px"></i>`).join('')}</div></div><div class="question-progress"><span>QUESTIONS YOU ASKED</span><ol id="question-trail"></ol></div><div class="studio-workspace"><div id="turn-panel" class="turn-panel"></div><aside class="support-dock"><button class="secondary" data-act="stuck">I’M STUCK</button><section id="help-panel" class="help-panel" aria-live="polite" hidden></section></aside>${crew()}</div><p class="studio-controls-note">YOUR AUDIO STAYS HERE. Reloading clears it.</p><details id="recap" class="studio-recap"><summary>YOUR CONVERSATION · LISTEN AGAIN</summary><ol class="recap-list" id="recap-list"></ol></details></section>`;}
function render(){route();let html='';if(!eligible){stage.innerHTML=`<section class="setup">${head('YOUR VOICE IS NEXT.','FINISH ZOE FIRST.')}<a class="cta" href="zoe.html">BACK TO ZOE</a></section>`;return;}
 if(s.screen==='entry')html=`<section class="studio-entry"><div class="strategy-strip">${Object.values(people).map(c=>`<p style="--accent:var(--${c.color})"><strong>${c.name}</strong>${c.move}</p>`).join('')}</div><div class="entry-copy">${head('YOUR VOICE STARTS HERE.',`${s.name?esc(s.name.toUpperCase())+',<br>':''}<em>YOUR TURN.</em>`)}${restored?'<p class="small">Welcome back. Start a new talk.</p>':''}<div class="actions">${b('STEP IN','go:partner',true)}</div></div>${mic()}</section>`;
 if(s.screen==='partner')html=`<section class="setup">${head('CHOOSE ONE PERSON.','WHO ARE YOU<br>TALKING TO?')}<div class="option-grid">${['CLASSMATE','FRIEND','TEACHER','FAMILY','MY PARTNER'].map(x=>`<button data-act="partner:${x}" aria-pressed="${s.partnerType===x}">${x}</button>`).join('')}</div><div id="partner-name-block" ${s.partnerType?'':'hidden'}><h2 class="you-subtitle">WHAT IS THEIR NAME?</h2><label for="partner-name">First name or nickname · optional<input id="partner-name" maxlength="24" autocomplete="off" value="${esc(s.partnerName)}"></label><div class="actions">${b('CONTINUE','partnerNext',true)}${b('SKIP','skipName')}</div></div></section>`;
 if(s.screen==='topic'){const keep=source.length&&!s.newTopic;html=`<section class="setup">${head('CHOOSE YOUR TOPIC.',keep?'TALK ABOUT<br>THIS AGAIN?':'WHAT DO YOU WANT<br>TO TALK ABOUT?')}${keep?source.map(x=>`<span class="topic-tag">${esc(x)}</span>`).join('')+`<div class="actions">${b('YES, KEEP IT','keepTopic',true)}${b('NEW TOPIC','newTopic')}</div>`:`<div class="option-grid">${['MY DAY','MY ROUTINE','MUSIC & SHOWS','THINGS I LIKE','MY CHOICE'].map(x=>b(esc(x),'topic:'+x)).join('')}</div>`}</section>`;}
 if(s.screen==='studio'){stage.innerHTML=studio();renderTurn();stage.focus();return;}
 if(s.screen==='reflect')html=`<section class="setup">${head('YOU USED YOUR VOICE.','HOW DID IT FEEL?')}<div class="feeling-list">${feelings.map((x,i)=>`<button data-act="feeling:${i}" aria-pressed="${s.feelings.includes(i)}">${x}</button>`).join('')}</div><h2 class="you-subtitle">WHO HELPED YOU?</h2><div class="support-used">${s.used.map(k=>`<span style="--accent:var(--${people[k].color})">${people[k].name}</span>`).join('')||'<p class="small">You did not open a friend this time.</p>'}</div><p class="lead">USE WHAT HELPS YOU SPEAK.</p><div class="actions">${b('CONTINUE','go:celebrate',true)}</div></section>`;
 if(s.screen==='celebrate')html=`<section class="celebration">${head('YOU USED YOUR VOICE.','WE HELPED.<br><em class="delayed">YOU SPOKE.</em>')}<div class="closing-crew">${Object.entries(people).map(([k,c])=>`<button style="--accent:var(--${c.color})" data-act="celebrate:${k}" aria-pressed="false"><img src="${c.img}" alt="${c.name}"><strong>${c.name}</strong><p>${c.close}</p></button>`).join('')}</div><p class="lead">IT DIDN’T HAVE TO BE PERFECT.</p><div class="actions">${b('CONTINUE','go:rate',true)}</div></section>`;
 if(s.screen==='rate')html=`<section class="setup">${head('THIS IS ABOUT UNMUTE. NOT YOUR ENGLISH.','HOW WAS UNMUTE<br>FOR YOU?')}<div class="rating-row" role="group" aria-label="Rate UNMUTE from 1 to 5">${[1,2,3,4,5].map(i=>`<button data-act="rating:${i}" aria-pressed="${s.rating===i}" aria-label="${i} out of 5 for UNMUTE">${i} ☆</button>`).join('')}</div><p class="small">1 · Not for me. &nbsp; 5 · I liked it.</p><div class="feedback-list">${feedback.map((x,i)=>`<button data-act="feedback:${i}" aria-pressed="${s.feedback.includes(i)}">${x}</button>`).join('')}</div><label for="comment">WANT TO SAY MORE? · optional<textarea id="comment" maxlength="300">${esc(s.comment)}</textarea></label><div class="actions">${b('CONTINUE','finish',true)}${b('SKIP','finish')}</div></section>`;
 if(s.screen==='final')html=`<section class="final-studio"><div class="closing-lights" aria-hidden="true">${Object.values(people).map((c,i)=>`<i style="--accent:var(--${c.color});--left:${20+i*23}%;--angle:${-25+i*18}deg"></i>`).join('')}</div><div class="final-copy"><p class="eyebrow">${s.name?'THANK YOU, '+esc(s.name.toUpperCase())+'.':'YOUR VOICE STARTS HERE.'}</p><h2 class="you-subtitle">YOUR VOICE.</h2><h1 class="you-title delayed">UNMUTE.</h1><p class="tagline">Different support.<br>Same destination: speak.</p><div class="actions">${b('TALK AGAIN','repeat',true)}<a class="text-link" href="index.html#home">HOME</a></div></div>${mic()}<div class="final-echoes" aria-hidden="true">${Object.values(people).map(c=>`<img src="${c.img}" alt="">`).join('')}</div></section>`;
 stage.innerHTML=html;stage.focus();window.scrollTo({top:0,behavior:'instant'});
}
function renderTurn(){
 uiKey='';const panel=$('#turn-panel');if(!panel)return;
 if(!s.started){panel.innerHTML=head('YOU BOTH ASK. YOU BOTH ANSWER.','READY?','Listen to each other.')+`<div class="actions">${b('START TALKING','start',true)}</div>`;}
 else if(s.turn>=plan.length){panel.innerHTML=head('YOU HAD A REAL CONVERSATION.','YOU ASKED.<br>YOU ANSWERED.<br>YOU LISTENED.')+`<div class="actions">${b('CONTINUE','go:reflect',true)}</div>`;$('#recap').open=true;}
 else {const t=turn(),who=partner().toUpperCase(),title=t.who==='self'?(t.kind==='ask'?'YOUR TURN.':'YOUR ANSWER.'):(s.partnerName?who+'’S TURN.':'PARTNER’S TURN.'),copy=t.who==='self'?(t.kind==='ask'?'ASK '+who+'.':'ANSWER '+who+'.'):(t.kind==='answer'?'LET '+who+' ANSWER.':'LET '+who+' ASK YOU.');panel.innerHTML=head(t.kind==='ask'?'ASK ONE QUESTION.':'LISTEN. THEN ANSWER.',title,copy)+'<div id="audio-ui"></div><div id="heard-text" aria-live="polite"></div><p id="play-error" role="status" class="small"></p>';}
 $('#help-panel').hidden=!s.help;paintAudio();renderHelp();updateRecap();
}
function paintAudio(){
 const room=$('#studio');if(!room||s.screen!=='studio')return;
 const t=turn(),clip=audio.get(s.turn),busy=audio.current===s.turn&&['requesting','recording','stopping','unavailable','error'].includes(audio.state),status=busy?audio.state:clip?.url?'ready':'idle';
 const speaking=audio.playing!==null&&audio.playing!==undefined?plan[audio.playing]?.who:t?.who;
 room.dataset.recording=String(audio.state==='recording');room.dataset.playing=String(audio.playing!==null&&audio.playing!==undefined);room.dataset.speaker=speaking||'self';room.style.setProperty('--studio-accent',speaking==='partner'?'var(--coral)':'var(--cyan)');
 $('#self-station').classList.toggle('active',speaking==='self'&&s.started&&s.turn<plan.length);$('#partner-station').classList.toggle('active',speaking==='partner'&&s.started&&s.turn<plan.length);
 const active=relevant();stage.querySelectorAll('.support-person').forEach(el=>{el.classList.toggle('relevant',active.includes(el.dataset.person));el.setAttribute('aria-expanded',String(el.dataset.person===s.help));});
 $('#question-trail').innerHTML=[1,2,3,4].map(n=>{const q=plan.find(x=>x.who==='self'&&x.kind==='ask'&&x.num===n),done=audio.get(q.id)?.accepted;return `<li class="${done?'used':''}">QUESTION ${n} ${done?'✓':''}</li>`;}).join('');
 if(!s.started||!t)return;
 const key=s.turn+':'+status;const ui=$('#audio-ui');if(ui&&key!==uiKey){uiKey=key;let controls='',note='';
  if(status==='idle')controls=b(t.who==='partner'?'RECORD '+esc(partner().toUpperCase()):'RECORD','record',true);
  if(status==='requesting'){note='ALLOW THE MIC.';controls=b('KEEP TALKING','noMic');}
  if(status==='recording'){note='RECORDING…';controls=b('STOP','stop',true);}
  if(status==='stopping'){note='ONE SECOND…';controls=b('KEEP TALKING','noMic');}
  if(status==='ready')controls=b(t.who==='partner'?'LISTEN TO '+esc(partner().toUpperCase()):'LISTEN','listen')+b('TRY AGAIN','retry')+b(clip.transcript?'USE THIS':clip.words==='failed'?'KEEP TALKING':'CONTINUE','use',true);
  if(status==='unavailable'||status==='error'){note=status==='error'?'MIC NOT AVAILABLE.':'NO MIC? THAT’S OKAY.';controls=b('TRY AGAIN','record')+b('KEEP TALKING','noMic',true);}
  ui.innerHTML=(note?`<p class="record-status" role="status">${note}</p>`:'')+`<div class="audio-controls">${controls}</div>`+(['error','unavailable'].includes(status)?'<p class="audio-note">Say it out loud. Listen to each other.</p>':'');
 }
 const text=$('#heard-text');if(text){if(status==='ready'){const words=clip.transcript;if(words){text.innerHTML=`<div class="transcript"><p class="small">${t.who==='partner'?'WHAT '+esc(partner().toUpperCase())+' SAID':'WHAT THE MIC HEARD'}</p><p>${esc(words)}</p></div>`;}else text.innerHTML=`<p class="audio-note">${clip.words==='failed'?'I COULDN’T GET THE WORDS.':'NO WORDS THIS TIME.'}<br>Your voice is still here.</p>`;}else text.innerHTML='';}
 if($('#play-error'))$('#play-error').textContent=audio.playError?'CAN’T PLAY? TRY AGAIN.':'';
 if(s.help==='zoe')renderHelp();
}
function updateRecap(){const list=$('#recap-list');if(!list)return;list.innerHTML=[...audio.turns.values()].filter(x=>x.accepted).map(x=>`<li><p class="recap-speaker">${esc(plan[x.id].who==='self'?learner():partner())} 🎙</p><blockquote>${x.transcript?'“'+esc(x.transcript)+'”':'VOICE TURN '+String(x.id+1).padStart(2,'0')}</blockquote>${x.url?b('PLAY','play:'+x.id):'<small>SPOKEN OUT LOUD · NO RECORDING</small>'}</li>`).join('')||'<li class="small">Your voices will appear here.</li>';}
function openSupport(key){if(!people[key])return;s.help=key;s.level=1;s.category='';if(!s.used.includes(key))s.used.push(key);paintAudio();renderHelp();}
function renderHelp(){const panel=$('#help-panel');if(!panel)return;if(!s.help){panel.hidden=true;return;}const key=s.help,c=people[key];panel.hidden=false;panel.dataset.person=key;panel.style.setProperty('--accent','var(--'+c.color+')');let title='',copy='';
 if(key==='kai'){title='WHAT COMES FIRST?';copy=s.level===1?'Put your words in order.':'<span class="structure">WHAT + DO + YOU + …?<br>WHERE + DO + YOU + …?<br>WHAT TIME + DO + YOU + …?<br>DO + YOU + …?<br>DOES + HE / SHE + …?</span><br>NOW SAY IT.';}
 if(key==='mia'){title='BUILD YOUR QUESTION.';copy=s.level===1?'WHAT…? WHERE…?<br>WHAT TIME…?<br>DO YOU…? DOES…?<br>FINISH IT. SAY IT.':'<span class="structure">WHERE + DO + YOU + VERB…?</span><br>FINISH IT. SAY IT.';}
 if(key==='leo'){title='LOST A WORD?';copy=s.level===1?'SAY WHAT YOU KNOW.':'WAIT…<br>I MEAN…<br>HOW DO YOU SAY…?<br>ONE SECOND…<br>SAY WHAT YOU KNOW.';}
 if(key==='zoe'){const current=audio.get(s.turn),answer=turn()?.who==='partner'&&turn()?.kind==='answer'&&current?.url?current:latestAnswer(),clue=clueFrom(answer?.transcript);title='LISTEN FIRST.';if(clue){title=esc(clue.toUpperCase())+'.';copy=`ASK ABOUT ${esc(clue.toUpperCase())}.`;const actual=answer.transcript,at=actual.toLowerCase().lastIndexOf(clue.toLowerCase());if(at>=0&&$('#heard-text')&&current===answer)$('#heard-text').innerHTML=`<div class="transcript"><p class="small">WHAT ${esc(partner().toUpperCase())} SAID</p><p>${esc(actual.slice(0,at))}<mark>${esc(actual.slice(at,at+clue.length))}</mark>${esc(actual.slice(at+clue.length))}</p></div>`;
 if(s.level>1)copy+='<br><span class="structure">WHAT…?<br>'+(/music|song|bts/i.test((answer.transcript||'')+' '+s.topic)?'WHAT SONG…?<br>':'WHERE…?<br>')+'DO YOU…?</span>';
 }else{copy='LISTEN AGAIN.<br>WHAT DID YOU HEAR?';if(answer?.url)copy+='<div class="actions">'+b('PLAY','play:'+answer.id)+'</div>';copy+='<div class="clue-choices">'+['PERSON','PLACE','TIME','THING'].map(x=>b(x,'category:'+x)).join('')+'</div>';if(s.category)copy+='<p>'+esc(s.category)+'. ASK ABOUT IT.</p>';if(s.level>1)copy+='<p class="structure">'+({PLACE:'WHERE…?',TIME:'WHAT TIME…?',PERSON:'WHAT DOES…?',THING:'WHAT…?'}[s.category]||'WHAT…? WHERE…? WHAT TIME…?')+'</p>';}}
 panel.innerHTML=`<p class="help-name">${c.name}</p><h3>${title}</h3><div class="help-copy">${copy}</div><div class="actions">${s.level===1?b('MORE HELP','moreHelp'):''}${b('NOW SAY IT','closeSupport')}</div>`;
}
function advance(){const clip=audio.get(s.turn);if(!clip?.url)return;audio.accept(s.turn);s.turn++;s.help='';s.stuck=false;persist();renderTurn();$('#turn-panel').setAttribute('tabindex','-1');$('#turn-panel').focus();}
function reset(){audio.dispose();s={...s,screen:'partner',started:false,turn:0,used:[],help:'',level:1,stuck:false,category:'',feelings:[],rating:0,feedback:[],comment:''};persist();render();}
stage.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||!eligible)return;const a=el.dataset.act;
 if(a.startsWith('go:'))go(a.slice(3));
 else if(a.startsWith('partner:')){s.partnerType=a.slice(8);stage.querySelectorAll('[data-act^="partner:"]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));$('#partner-name-block').hidden=false;}
 else if(a==='partnerNext'||a==='skipName'){s.partnerName=a==='skipName'?'':clean($('#partner-name').value,24);go('topic');}
 else if(a==='newTopic'){s.newTopic=true;render();}
 else if(a==='keepTopic'){s.topic=source[0];s.topicDetails=source.slice(1);go('studio');}
 else if(a.startsWith('topic:')){s.topic=a.slice(6);s.topicDetails=[];go('studio');}
 else if(a==='start'){s.started=true;renderTurn();}
 else if(a==='record'||a==='retry'){s.help='';audio.record(s.turn);renderHelp();}
 else if(a==='stop')audio.stop();
 else if(a==='listen')audio.play(s.turn);
 else if(a==='use')advance();
 else if(a==='noMic'){audio.skip(s.turn);s.turn++;s.help='';s.stuck=false;persist();renderTurn();}
 else if(a.startsWith('play:'))audio.play(Number(a.slice(5)));
 else if(a==='stuck'){s.stuck=true;paintAudio();}
 else if(a.startsWith('support:'))openSupport(a.slice(8));
 else if(a==='moreHelp'){s.level=2;renderHelp();}
 else if(a.startsWith('category:')){s.category=a.slice(9);renderHelp();}
 else if(a==='closeSupport'){s.help='';renderHelp();paintAudio();}
 else if(a.startsWith('feeling:')){const i=Number(a.slice(8));s.feelings=s.feelings.includes(i)?s.feelings.filter(x=>x!==i):[...s.feelings,i];el.setAttribute('aria-pressed',String(s.feelings.includes(i)));}
 else if(a.startsWith('celebrate:'))el.setAttribute('aria-pressed',String(el.getAttribute('aria-pressed')!=='true'));
 else if(a.startsWith('rating:')){s.rating=Number(a.slice(7));stage.querySelectorAll('[data-act^="rating:"]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));persist();}
 else if(a.startsWith('feedback:')){const i=Number(a.slice(9));s.feedback=s.feedback.includes(i)?s.feedback.filter(x=>x!==i):[...s.feedback,i];el.setAttribute('aria-pressed',String(s.feedback.includes(i)));persist();}
 else if(a==='finish'){s.comment=clean($('#comment').value,300);go('final');}
 else if(a==='repeat')reset();
});
stage.addEventListener('input',e=>{if(e.target.id==='partner-name')s.partnerName=clean(e.target.value,24);if(e.target.id==='comment')s.comment=clean(e.target.value,300);persist();});
$('#back').onclick=()=>{audio.cancel();audio.stopPlayback();if(s.screen==='studio'&&s.started&&s.turn>0){s.turn--;s.help='';renderTurn();return;}if(s.screen==='studio'&&s.started){s.started=false;renderTurn();return;}const i=screens.indexOf(s.screen);if(i>0)go(screens[i-1]);else location.href='zoe.html';};
const showHelp=()=>$('#help-dialog').showModal();$('#help').onclick=showHelp;$('#footer-help').onclick=showHelp;$('#close-help').onclick=()=>$('#help-dialog').close();
function motion(){const pause=off||reduced.matches;document.body.classList.toggle('motion-paused',pause);$('#motion').innerHTML='Motion <span>'+(pause?'off':'on')+'</span>';$('#motion').setAttribute('aria-pressed',String(pause));}
$('#motion').onclick=()=>{off=!off;try{localStorage.setItem('unmute-motion',off?'off':'on');}catch{}motion();};reduced.addEventListener('change',motion);
window.addEventListener('pagehide',()=>{persist();audio.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted){s.started=false;s.turn=0;s.screen='entry';render();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(audio.state==='recording')audio.stop();else if(audio.state==='requesting'){audio.cancel();paintAudio();}audio.stopPlayback();paintAudio();}});
motion();render();
})();

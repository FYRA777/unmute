'use strict';
/* YOU only. Audio and recognized words stay in page memory. No remote recognition. */
class StudioAudio {
 constructor(change=()=>{},level=()=>{}){this.change=change;this.level=level;this.turns=new Map();this.generation=0;this.playGeneration=0;this.state='idle';this.audio=new Audio();this.audio.onended=()=>{this.playing=null;this.change();};this.audio.onerror=()=>{this.playing=null;this.playError=true;this.change();};}
 get(id){return this.turns.get(id);}
 emit(){this.change();}
 stopPlayback(){this.playGeneration++;this.audio.pause();this.playing=null;this.level(0);}
 async play(id){const t=this.get(id);if(!t?.url)return;this.stopPlayback();const playGen=this.playGeneration;this.playError=false;this.audio.src=t.url;this.audio.currentTime=0;try{await this.audio.play();if(playGen!==this.playGeneration)return;this.playing=id;this.emit();}catch{if(playGen!==this.playGeneration)return;this.playError=true;this.emit();}}
 release(){clearTimeout(this.limit);cancelAnimationFrame(this.frame);if(this.stream){this.stream.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=null;}this.source?.disconnect();this.source=null;if(this.context){this.context.close().catch(()=>{});this.context=null;}this.level(0);}
 stopRecognition(abort=false){if(this.recognition){try{abort?this.recognition.abort():this.recognition.stop();}catch{}if(abort){this.recognition.onresult=null;this.recognition.onerror=null;this.recognition.onend=null;this.recognition=null;}}}
 cancel(){this.generation++;clearTimeout(this.finishTimer);this.stopRecognition(true);if(this.media){this.media.onstop=null;this.media.ondataavailable=null;this.media.onerror=null;try{if(this.media.state!=='inactive')this.media.stop();}catch{}this.media=null;}this.release();this.state='idle';}
 remove(id){const old=this.get(id);if(old?.url)URL.revokeObjectURL(old.url);this.turns.delete(id);}
 async record(id){
  if(['recording','requesting','stopping'].includes(this.state))return;
  this.cancel();this.stopPlayback();this.remove(id);this.current=id;const gen=this.generation;
  const turn={id,url:null,transcript:'',words:'unavailable',accepted:false};this.turns.set(id,turn);
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){this.state='unavailable';this.emit();return;}
  this.state='requesting';this.emit();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(gen!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
   this.stream=stream;const media=new MediaRecorder(stream);this.media=media;const chunks=[];
   media.ondataavailable=e=>{if(gen===this.generation&&e.data.size)chunks.push(e.data);};
   media.onerror=()=>this.fail(gen);
   media.onstop=()=>{if(gen!==this.generation)return;this.release();this.media=null;if(!chunks.length){this.fail(gen);return;}turn.url=URL.createObjectURL(new Blob(chunks,{type:media.mimeType||chunks[0].type}));this.finishTimer=setTimeout(()=>{if(gen!==this.generation)return;this.stopRecognition(true);if(turn.words==='listening')turn.words=turn.transcript?'heard':'failed';this.state='ready';this.emit();},turn.words==='listening'?1200:0);};
   stream.getTracks().forEach(t=>t.onended=()=>this.fail(gen));media.start();this.state='recording';this.emit();this.meter(stream);this.recognize(turn,gen);
   this.limit=setTimeout(()=>this.stop(),180000);
  }catch{if(gen===this.generation){this.cancel();this.state='unavailable';this.emit();}}
 }
 async recognize(turn,gen){
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return;
  try{
   const rec=new R();if(!('processLocally' in rec)||typeof R.available!=='function')return;
   rec.processLocally=true;rec.lang='en-US';rec.continuous=true;rec.interimResults=false;
   const available=await R.available({langs:['en-US'],processLocally:true});
   if(gen!==this.generation||this.state!=='recording'||available!=='available')return;
   this.recognition=rec;turn.words='listening';
   rec.onresult=e=>{if(gen!==this.generation)return;const parts=[];for(let i=0;i<e.results.length;i++)if(e.results[i].isFinal)parts.push(e.results[i][0].transcript);turn.transcript=parts.join(' ').trim().slice(0,1600);turn.words=turn.transcript?'heard':'listening';this.emit();};
   rec.onerror=()=>{if(gen!==this.generation)return;turn.words=turn.transcript?'heard':'failed';this.emit();};
   rec.onend=()=>{if(gen!==this.generation)return;if(turn.words==='listening')turn.words=turn.transcript?'heard':'failed';this.emit();};
   rec.start();
  }catch{if(gen===this.generation){turn.words='failed';this.emit();}}
 }
 meter(stream){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.context=new AC();const analyser=this.context.createAnalyser();analyser.fftSize=256;this.source=this.context.createMediaStreamSource(stream);this.source.connect(analyser);const data=new Uint8Array(analyser.fftSize);const tick=()=>{if(!this.context)return;analyser.getByteTimeDomainData(data);let sum=0;for(const v of data)sum+=((v-128)/128)**2;this.level(Math.min(1,Math.sqrt(sum/data.length)*5));this.frame=requestAnimationFrame(tick);};tick();}catch{}}
 stop(){if(this.state!=='recording')return;this.state='stopping';this.emit();this.stopRecognition();try{this.media.stop();this.release();}catch{this.fail(this.generation);}}
 fail(gen){if(gen!==this.generation)return;this.cancel();this.state='error';this.emit();}
 accept(id){this.stopPlayback();this.stopRecognition(true);const t=this.get(id);if(t)t.accepted=true;this.state='idle';}
 skip(id){this.cancel();this.stopPlayback();this.remove(id);this.turns.set(id,{id,url:null,transcript:'',words:'unavailable',accepted:true,spoken:true});}
 dispose(){this.cancel();this.stopPlayback();this.audio.removeAttribute('src');for(const id of [...this.turns.keys()])this.remove(id);}
}
window.StudioAudio=StudioAudio;

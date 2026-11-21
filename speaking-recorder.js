'use strict';
/* One temporary, local recorder. No recognition, network or persistence. */
class SpeakingRecorder {
  constructor(host,{theme='neutral',prompt='',onReady=()=>{},onRecording=()=>{}}={}) {
    this.host=host;this.onReady=onReady;this.onRecording=onRecording;this.state='idle';this.generation=0;this.disposed=false;
    host.className='voice-practice';host.dataset.theme=theme;
    host.innerHTML='<p class="voice-label">YOUR VOICE</p><p class="voice-prompt"></p><p class="voice-intro">Practice here first. Then use your voice with someone.</p><div class="voice-status" role="status" aria-live="polite"></div><div class="voice-controls"></div><p class="voice-privacy">Your recording stays on this device.</p>';
    host.querySelector('.voice-prompt').textContent=prompt;
    this.status=host.querySelector('.voice-status');this.controls=host.querySelector('.voice-controls');
    this.audio=new Audio();this.audio.onended=()=>{if(!this.disposed&&this.state==='ready')this.render();};
    this.audio.onerror=()=>{if(!this.disposed){this.state='error';this.clearAudio();this.render();}};
    this.click=e=>{const a=e.target.closest('[data-voice]')?.dataset.voice;if(!a)return;e.stopPropagation();if(a==='record')this.record();if(a==='stop')this.stop();if(a==='listen')this.listen();if(a==='retry'){this.cancel();this.clearAudio();this.state='idle';this.render();}if(a==='ready')this.finish();};
    host.addEventListener('click',this.click);this.render();
  }
  button(label,action){return `<button type="button" data-voice="${action}">${label}</button>`;}
  render(){
    const b=(l,a)=>this.button(l,a);let text='',buttons='';
    if(this.state==='idle'){text='RECORD YOUR VOICE.';buttons=b('RECORD','record')+b('I’M READY','ready');}
    if(this.state==='requesting'){text='ALLOW THE MIC TO RECORD.';buttons=b('CONTINUE WITHOUT MIC','ready');}
    if(this.state==='recording'){text='● RECORDING...';buttons=b('STOP','stop')+b('CONTINUE WITHOUT MIC','ready');}
    if(this.state==='stopping'){text='GETTING YOUR VOICE READY…';buttons=b('CONTINUE WITHOUT MIC','ready');}
    if(this.state==='ready'){text='LISTEN TO YOURSELF.';buttons=b('▶ LISTEN','listen')+b('TRY AGAIN','retry')+b('I’M READY','ready');}
    if(this.state==='unavailable'){text='NO MIC? THAT’S OKAY.<br>SAY IT OUT LOUD.<small>Practice with your partner or teacher.</small>';buttons=b('CONTINUE','ready')+b('TRY MIC AGAIN','record');}
    if(this.state==='error'){text='MIC NOT AVAILABLE.<small>You can still say it out loud.</small>';buttons=b('TRY MIC AGAIN','record')+b('CONTINUE WITHOUT MIC','ready');}
    this.host.dataset.state=this.state;this.status.innerHTML=text;this.controls.innerHTML=buttons;
  }
  release(){if(this.stream){this.stream.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=null;}clearTimeout(this.limit);this.onRecording(false);}
  clearAudio(){this.audio.pause();this.audio.removeAttribute('src');if(this.url){URL.revokeObjectURL(this.url);this.url=null;}this.chunks=[];}
  cancel(){this.generation++;if(this.recorder){this.recorder.ondataavailable=null;this.recorder.onstop=null;this.recorder.onerror=null;try{if(this.recorder.state!=='inactive')this.recorder.stop();}catch{}this.recorder=null;}this.release();}
  async record(){
    if(this.disposed||['recording','requesting','stopping'].includes(this.state))return;
    this.cancel();this.clearAudio();const generation=this.generation;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){this.state='unavailable';this.render();return;}
    this.state='requesting';this.render();
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(this.disposed||generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;
      const recorder=new MediaRecorder(stream);this.recorder=recorder;this.chunks=[];
      recorder.ondataavailable=e=>{if(generation===this.generation&&e.data.size)this.chunks.push(e.data);};
      recorder.onerror=()=>this.fail();
      recorder.onstop=()=>{
        if(this.disposed||generation!==this.generation)return;
        this.release();this.recorder=null;
        if(!this.chunks.length){this.fail();return;}
        const blob=new Blob(this.chunks,{type:recorder.mimeType||this.chunks[0].type});this.chunks=[];
        this.url=URL.createObjectURL(blob);this.audio.src=this.url;this.state='ready';this.render();
      };
      stream.getTracks().forEach(t=>t.onended=()=>{if(this.state==='recording')this.fail();});
      recorder.start();this.state='recording';this.onRecording(true);this.render();
      // Bound temporary memory; this is never a learner time limit or score.
      this.limit=setTimeout(()=>this.stop(),180000);
    }catch{if(!this.disposed&&generation===this.generation){this.cancel();this.state='unavailable';this.render();}}
  }
  stop(){if(this.state!=='recording')return;this.state='stopping';this.render();try{this.recorder.stop();this.release();}catch{this.fail();}}
  fail(){if(this.disposed)return;this.cancel();this.clearAudio();this.state='error';this.render();}
  async listen(){if(!this.url)return;this.audio.pause();this.audio.currentTime=0;try{await this.audio.play();if(!this.disposed&&this.state==='ready')this.status.textContent='LISTENING…';}catch{if(!this.disposed){this.status.textContent='CAN’T PLAY? TRY AGAIN, OR SAY IT OUT LOUD.';}}}
  finish(){this.dispose();this.onReady();}
  dispose(){if(this.disposed)return;this.disposed=true;this.cancel();this.clearAudio();this.audio.onended=null;this.audio.onerror=null;this.host.removeEventListener('click',this.click);}
}
window.SpeakingRecorder=SpeakingRecorder;

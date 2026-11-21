'use strict';
window.ZoeConversation=(()=>{
 const openings=[{q:'WHAT MUSIC DO YOU LIKE?',context:'music'},{q:'WHAT DO YOU DO AFTER SCHOOL?',context:'activity'},{q:'WHAT DO YOU WATCH?',context:'show'}];
 function follow(raw,context){
  const text=String(raw||'').normalize('NFKC').replace(/[<>\u0000-\u001f]/g,'').trim().replace(/[.!?]+$/,'');
  if(!text||/\b(?:don't|do not|can't|cannot|not really|do not know)\b/i.test(text)||/^(yes|no|okay|um|uh|nothing|hello)$/i.test(text))return null;
  let clue='',kind=context,next='TELL ME MORE.';
  const m=re=>text.match(re)?.[1]?.trim();
  const favorite=text.match(/^(?:my\s+)?favou?rite\s+(singer|artist|band|song|character|show|movie|game|sport)\s+is\s+(.+)$/i);
  const watch=m(/^(?:i\s+)?(?:watch|am watching)\s+(.+)$/i);
  const play=m(/^(?:i\s+)?play\s+(.+)$/i);
  const listen=m(/^(?:i\s+)?listen to\s+(.+)$/i);
  const like=m(/^(?:i\s+)?(?:really\s+)?(?:like|love|enjoy)\s+(.+)$/i);
  if(/^with\s+/i.test(text)){clue=text.replace(/^with\s+/i,'');kind='person';next='TELL ME MORE.';}
  else if(/^(?:at night|in the morning|in the evening|after school|every day|at \d+(?::\d+)?(?:\s*(?:am|pm))?)$/i.test(text)){clue=text;next='WHAT DO YOU DO THEN?';}
  else if(/^(?:at|in|on)\s+/i.test(text)&&!like){clue=text;next=['sport','sport-place'].includes(context)?'WHO DO YOU PLAY WITH?':context==='game'?'WHO DO YOU PLAY WITH?':context==='show'?'WHO DO YOU WATCH WITH?':'WHO DO YOU GO WITH?';}
  else{
   if(favorite){clue=favorite[2];const type=favorite[1].toLowerCase();kind=['singer','artist','band'].includes(type)?'music':type==='movie'?'show':type;}
   else if(watch){clue=watch;kind='show';}
   else if(play){clue=play;kind=/\b(?:volleyball|football|basketball|soccer|tennis|badminton|baseball|sport)\b/i.test(play)?'sport':/\b(?:guitar|piano|drums|violin)\b/i.test(play)?'activity':'play';}
   else if(listen){clue=listen;kind='music';}
   else if(like)clue=like;
   else if(/^(?:i\s+)?(?:eat|read|draw|cook|use|study)\s+/i.test(text)){clue=text.replace(/^(?:i\s+)?(?:eat|read|draw|cook|use|study)\s+/i,'');kind='activity';}
   else if(!/\b(?:i|you|we|they|he|she|is|are|am)\b/i.test(text))clue=text;
   if(kind==='music'){next='WHAT SONG DO YOU LIKE?';kind='song';}
   else if(kind==='song'){next='WHEN DO YOU LISTEN TO IT?';kind='music-time';}
   else if(kind==='show'){next='WHAT CHARACTER DO YOU LIKE?';kind='character';}
   else if(kind==='character'||kind==='person'){next='WHAT DO YOU LIKE ABOUT THEM?';kind='detail';}
   else if(kind==='play'){next='WHO DO YOU PLAY WITH?';}
   else if(kind==='game'){next='WHAT CHARACTER DO YOU USE?';kind='game-character';}
   else if(kind==='game-character'){next='WHEN DO YOU PLAY?';kind='game';}
   else if(kind==='sport'){next='WHERE DO YOU PLAY?';kind='sport-place';}
   else if(kind==='activity'){next='WHERE DO YOU DO IT?';kind='activity-place';}
  }
  if(!clue||clue.length>80||clue.split(/\s+/).length>12)return null;
  return {clue,context:kind,question:next,starter:next.startsWith('WHAT SONG')?'WHAT SONG...?':next.startsWith('WHAT CHARACTER')?'WHAT CHARACTER...?':next.split(' ')[0]+'...?'};
 }
 return {openings,follow};
})();

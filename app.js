import { createGame, tick, bite, drinkTea, evolution, EVOLUTIONS, MODES } from './engine.js';
const $ = id => document.getElementById(id);
let mode = 'snack', state = createGame(), started = false, paused = false, sound = false, audio, last = 0, drawn = -1, finished = false;
const canvas = $('canvas'), ctx = canvas.getContext('2d');
let best = {};
try { best = JSON.parse(localStorage.getItem('baibai-best-v2') || '{}') || {}; } catch {}
function beep(freq = 360, length = .06) {
  if (!sound) return;
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o = audio.createOscillator(), g = audio.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(freq, audio.currentTime); o.frequency.exponentialRampToValueAtTime(freq / 2, audio.currentTime + length); g.gain.setValueAtTime(.09, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + length); } catch {}
}
function animate(el, name) { el.classList.remove(name); void el.offsetWidth; el.classList.add(name); }
function draw() {
 const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
 canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#d9d5bd'; ctx.beginPath(); ctx.ellipse(w/2,h-49,w*.36,34,0,0,Math.PI*2); ctx.fill();
 ctx.strokeStyle='#98a18a'; ctx.lineWidth=2; ctx.beginPath();ctx.ellipse(w/2,h-56,w*.36,32,0,0,Math.PI*2);ctx.fillStyle='#e5e8d6';ctx.fill();ctx.stroke();
 const n = Math.min(state.count,90), cols = Math.max(5,Math.floor(w/52)), size = Math.min(25,w/(cols*2.3));
 for(let i=0;i<n;i++) { const row=Math.floor(i/cols), col=i%cols; const rowCount=Math.min(cols,n-row*cols); const x=w/2+(col-(rowCount-1)/2)*size*1.65+Math.sin(i*7)*4; const y=h-65-row*size*.86; const r=size*(.93+Math.sin(i*3)*.08);
 ctx.save(); ctx.translate(x,y);ctx.rotate(Math.sin(i*12)*.14); ctx.fillStyle='#00000012';ctx.beginPath();ctx.ellipse(2,11,r,8,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(0,0,r,r*.76,0,0,Math.PI*2);ctx.fillStyle=i%7===0?'#c79262':'#f0d2a0';ctx.fill();ctx.strokeStyle='#664c32';ctx.lineWidth=1.4;ctx.stroke();
 ctx.beginPath();ctx.ellipse(-r*.23,-r*.28,r*.39,r*.16,-.3,0,Math.PI*2);ctx.fillStyle='#fff0cf99';ctx.fill();
 ctx.fillStyle='#423426';ctx.beginPath();ctx.arc(-r*.28,0,1.6,0,Math.PI*2);ctx.arc(r*.28,0,1.6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,r*.12,r*.13,0,Math.PI);ctx.stroke();ctx.restore(); }
 drawn=state.count;
}
function record() { $('best').innerHTML = `${Number.isFinite(best[mode]) ? best[mode].toFixed(1) : '—'} <small>秒</small>`; document.querySelector('.record .mini-title').textContent=MODES[mode].label+' 最速完食'; }
function render() {
 $('count').textContent=state.count.toLocaleString(); $('clock').textContent=state.elapsed.toFixed(1).padStart(4,'0')+' 秒';
 const remain=Math.max(0,state.next-state.elapsed); $('next').textContent=remain.toFixed(1)+' 秒'; $('timer-fill').style.width=(remain/state.interval*100)+'%'; $('stomach-fill').style.width=state.fullness+'%';
 $('stomach-label').textContent=state.fullness>90?'もう入らん！':state.fullness>65?'く、くるしい…':'まだいける'; $('stomach-fill').style.background=state.fullness>80?'var(--red)':'var(--green)';
 const evo=evolution(state), upcoming=EVOLUTIONS.find(e=>e.at>state.eaten), drinking=state.teaUntil>0, boosted=state.elapsed<state.boostUntil;
 $('evolution-name').textContent=evo.name;
 $('evolution-power').textContent=`一口 ${evo.power*(boosted?2:1)}個${boosted?' · 爆食い中！':''}`;
 $('evolution-next').textContent=upcoming?`あと${upcoming.at-state.eaten}個で「${upcoming.name}」`:'人間の限界、どこいった。';
 $('evolution-fill').style.width=(upcoming?(state.eaten-evo.at)/(upcoming.at-evo.at)*100:100)+'%';
 $('special').disabled=!started||paused||drinking||state.elapsed<state.teaReady||state.status!=='playing';
 $('tea-label').textContent=drinking?'お茶、ごくごく…':state.elapsed<state.teaReady?'お湯、沸かし中。':'お茶を飲む';
 $('tea-hint').textContent=drinking?`あと${(state.teaUntil-state.elapsed).toFixed(1)}秒で爆食い！`:state.elapsed<state.teaReady?`あと${(state.teaReady-state.elapsed).toFixed(1)}秒`:'1.5秒休む → 4秒爆食い / B';
 if(started){$('eat-label').textContent=drinking?'ごくごく…':boosted?'爆食い！！':'食う！';$('eat-hint').textContent=boosted?`満腹なし・一口2倍 あと${(state.boostUntil-state.elapsed).toFixed(1)}秒`:'クリック / Space でひとくち';}
 $('arena').classList.toggle('boosted',boosted); $('eat').disabled=paused||drinking||state.status!=='playing'; $('pause').disabled=!started||state.status!=='playing';
 if(drawn!==state.count)draw();
 if(state.status!=='playing'&&!finished) finish();
}
function reset(auto=false) { state=createGame(mode); started=auto; paused=false; finished=false; drawn=-1; $('result').hidden=true; $('pause').textContent='一時停止'; $('phase').textContent=auto?'お食事中。油断大敵。':'おやつ、待機中。'; $('eat-label').textContent=auto?'食う！':'いただきます！'; $('eat-hint').textContent=auto?'クリック / Space でひとくち':'クリックして開始'; $('burst').textContent=state.interval+'秒で2倍！'; $('quip').textContent='※ ひとつ残らずお召し上がりください。';  record();render(); }
function eat() {
 if(paused||state.status!=='playing')return;
 if(!started){started=true;$('phase').textContent='お食事中。油断大敵。';$('eat-label').textContent='食う！';$('eat-hint').textContent='クリック / Space でひとくち';}
 const previous=evolution(state); const amount=bite(state);
 if(amount){beep(amount===3?800:420+state.combo%8*40);animate($('count'),'pop');$('quip').textContent=amount===3?'三個食い！ 人間をやめかけている。':['もぐ。','もぐもぐ。','あんこが追いかけてくる。','まだおいしい。たぶん。'][state.eaten%4];}
 if(evolution(state)!==previous){$('quip').textContent=`進化！ ${evolution(state).name}。もはや食事ではない。`;$('announcement').textContent=$('quip').textContent;animate($('evolution'),'pop');beep(1200,.2);}
 else if(!amount&&!state.teaUntil){beep(90);$('quip').textContent='胃「一旦、落ち着こうか。」';animate($('arena'),'shake');}
 render();
}
function special(){if(!started||paused)return;if(drinkTea(state)){beep(650,.2);$('quip').textContent='お茶の間も増えます。落ち着いて、焦れ。';render();$('eat').focus();}}
function finish(){finished=true; const won=state.status==='won';if(won&&(!Number.isFinite(best[mode])||state.elapsed<best[mode])){best[mode]=state.elapsed;try{localStorage.setItem('baibai-best-v2',JSON.stringify(best));}catch{}record();}
 $('phase').textContent=won?'お皿の平和を守りました。':'まんじゅうが勝ちました。';$('result-label').textContent=won?'ごちそうさまでした':'たいへんよく食べましたが';$('result-title').textContent=won?'完 食 。':'人 類 敗 北 。';$('result-copy').textContent=won?'胃袋が、指数関数に勝った。':'世界は、あんこに包まれた。';$('result-stats').textContent=`${MODES[mode].label} / ${state.elapsed.toFixed(1)}秒 / ${state.eaten}個完食 / 増殖${state.doubles}回 / ${evolution(state).name}`;$('result').hidden=false;$('announcement').textContent=$('result-title').textContent+ $('result-stats').textContent;beep(won?1000:120,.4);$('retry').focus(); }
function togglePause(){if(!started||state.status!=='playing')return;paused=!paused;$('pause').textContent=paused?'再開する':'一時停止';$('phase').textContent=paused?'休憩中。増殖もお休み。':'お食事中。油断大敵。';render();}
$('eat').addEventListener('click',eat);$('special').addEventListener('click',special);$('pause').addEventListener('click',togglePause);$('retry').addEventListener('click',()=>{reset();$('eat').focus();});
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'音：あり':'音：なし';$('sound').setAttribute('aria-pressed',sound);beep();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button);});reset();}));
document.addEventListener('keydown',e=>{if(e.code==='Space'&& !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){if(document.activeElement.tagName==='BUTTON'&&![$('eat'),$('special')].includes(document.activeElement))return;e.preventDefault();if(!e.repeat)eat();}if(e.code==='KeyB'&&!e.repeat&&started)special();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&state.status==='playing')togglePause();});
$('share').addEventListener('click',async()=>{const text=`「バイバイまんじゅうを食い切れ」${state.status==='won'?'完食！':'人類敗北！'} ${MODES[mode].label} ${state.elapsed.toFixed(1)}秒、${state.eaten}個食べた。`;try{await navigator.clipboard.writeText(text);$('share').textContent='コピーしました！';}catch{$('share').textContent='コピーできませんでした';}setTimeout(()=>$('share').textContent='結果をコピー',2000);});
window.addEventListener('resize',draw);
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;if(started&&!paused&&state.status==='playing'){const before=state.count;tick(state,dt);if(state.count>before){beep(150,.2);animate($('arena'),'shake');$('quip').textContent='増えました。おめでとうございます。';}render();}requestAnimationFrame(frame);}
reset();requestAnimationFrame(frame);

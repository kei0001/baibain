export const OPPONENTS = [
 { name: '少食ののんびりさん', bite: 1, pace: 1, recovery: 6, tea: 18, description: 'ひとくちずつ。初めての増殖に。' },
 { name: '腹ペコの食いしん坊', bite: 3, pace: .95, recovery: 8, tea: 14, description: '三個ずつ食べる。育てたあんこで対抗！' },
 { name: '大食い王', bite: 5, pace: .65, recovery: 10, tea: 11, description: 'お茶の後は本気。増殖と満腹の総力戦。' }
];
export const UPGRADES = {
 speed: {name:'増殖力',description:'倍増までの時間 −0.4秒 / Lv',max:8},
 size: {name:'でかさ',description:'1個あたりの満腹 +2 / Lv',max:8},
 weight: {name:'あんこの重さ',description:'相手の満腹回復 −8% / Lv',max:8}
};
export function cleanSave(raw={}) {
 const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0?Math.min(v,max):0;
 return {xp:integer(raw?.xp,1000000),total:integer(raw?.total,10000000),unlocked:integer(raw?.unlocked,2),levels:Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,integer(raw?.levels?.[k],8)]))};
}
export function upgradeCost(level){return 35+level*25;}
export function buyUpgrade(save,key){if(!UPGRADES[key]||save.levels[key]>=8)return false;const cost=upgradeCost(save.levels[key]);if(save.xp<cost)return false;save.xp-=cost;save.levels[key]++;return true;}
export function newColony(stage=0,levels={}) {
 const safe=cleanSave({levels}).levels;
 stage=Math.max(0,Math.min(2,Math.floor(stage)||0));
 return {stage,levels:safe,count:[12,20,28][stage],peak:[12,20,28][stage],born:0,eaten:0,elapsed:0,progress:0,interval:7-safe.speed*.4,fullness:0,nextBite:1.25,teaReady:OPPONENTS[stage].tea,teaUntil:0,boostUntil:0,status:'playing',lastTap:-99,taps:0,doubles:0,settled:false};
}
export function encourage(s){if(s.status!=='playing'||s.elapsed-s.lastTap<.12)return false;s.lastTap=s.elapsed;s.progress+=.2;s.taps++;multiply(s);return true;}
function multiply(s){while(s.progress>=s.interval&&s.status==='playing'){s.progress-=s.interval;s.born+=s.count;s.count*=2;s.doubles++;s.peak=Math.max(s.peak,s.count);if(s.count>=1024)s.status='won';}}
export function advance(s,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 // Small deterministic steps keep tea, eating and multiplication ordered.
 while(dt>1e-9&&s.status==='playing'){const step=Math.min(.025,dt);dt-=step;s.elapsed+=step;const o=OPPONENTS[s.stage];
 s.fullness=Math.max(0,s.fullness-o.recovery*(1-s.levels.weight*.08)*step);
 s.progress+=step;multiply(s);if(s.status!=='playing')break;
 if(s.teaUntil){if(s.elapsed>=s.teaUntil){s.teaUntil=0;s.fullness=0;s.boostUntil=s.elapsed+3;s.nextBite=s.elapsed+.25;}continue;}
 if(s.elapsed>=s.teaReady){s.teaUntil=s.elapsed+2;s.teaReady=s.elapsed+o.tea;continue;}
 if(s.elapsed>=s.nextBite){s.nextBite=s.elapsed+o.pace;if(s.fullness<85){const amount=Math.min(s.count,o.bite*(s.elapsed<s.boostUntil?2:1));s.count-=amount;s.eaten+=amount;s.fullness=Math.min(100,s.fullness+amount*(7+s.levels.size*2));if(s.count===0)s.status='lost';}}
 }
}
export function score(s){return s.born+s.eaten*3+Math.floor(s.elapsed)*2+(s.status==='won'?300:0);}
export function reward(s){return Math.max(1,Math.floor(score(s)/15));}
export function settle(s,save){if(s.status==='playing'||s.settled)return 0;s.settled=true;const xp=reward(s);save.xp+=xp;save.total+=xp;if(s.status==='won')save.unlocked=Math.max(save.unlocked,Math.min(2,s.stage+1));return xp;}

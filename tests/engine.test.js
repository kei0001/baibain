import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tick, bite, drinkTea, evolution } from '../engine.js';
function play(mode, delay=0, rate=4, threshold=60) {
 const s=createGame(mode); let next=delay;
 while(s.status==='playing'&&s.elapsed<120){tick(s,.02);if(s.elapsed>=next){if(s.fullness>threshold)drinkTea(s);bite(s);next+=1/rate;}}
 return s;
}
test('remaining buns double, including while drinking',()=>{const s=createGame();tick(s,5);drinkTea(s);tick(s,1);assert.equal(s.count,96);assert.ok(s.teaUntil);assert.equal(bite(s),0);});
test('full stomach blocks eating and rest recovers',()=>{const s=createGame();s.fullness=95;assert.equal(bite(s),0);tick(s,1);assert.ok(bite(s)>0);});
test('tea has drinking time, finite boost and reusable cooldown',()=>{const s=createGame();s.fullness=95;assert.ok(drinkTea(s));assert.equal(bite(s),0);assert.equal(drinkTea(s),false);tick(s,1.5);assert.equal(s.fullness,0);assert.equal(bite(s),2);assert.ok(s.fullness>0);tick(s,4);assert.equal(bite(s),1);assert.equal(s.fullness,8);assert.equal(drinkTea(s),false);tick(s,2);assert.ok(drinkTea(s));});
test('evolution follows total eaten and persists through multiplication',()=>{const s=createGame();s.eaten=19;bite(s);assert.equal(evolution(s).power,2);tick(s,6);assert.equal(evolution(s).power,2);s.eaten=50;assert.equal(bite(s),5);s.eaten=100;assert.equal(bite(s),10);s.eaten=220;assert.equal(bite(s),20);});
test('easy and medium still allow recoveries after multiplication',()=>{for(const mode of ['snack','feast']){const s=play(mode,0,3);assert.equal(s.status,'won',mode);assert.ok(s.doubles>=1);}});
test('hell requires tea timing, not just the same tapping speed',()=>{const timely=play('hell',0,6,50);assert.equal(timely.status,'won');assert.ok(timely.doubles>=3);assert.equal(play('hell',0,6,80).status,'lost');for(const rate of [3,5,8,12])assert.equal(play('hell',0,rate,101).status,'lost');});
test('larger bites and boosted bites increase fullness more',()=>{const normal=createGame();bite(normal);const evolved=createGame();evolved.eaten=100;bite(evolved);assert.ok(evolved.fullness>normal.fullness);const boosted=createGame();boosted.boostUntil=4;bite(boosted);assert.ok(boosted.fullness>normal.fullness);});
test('hell accelerates on each doubling with a three-second floor',()=>{const s=createGame('hell');tick(s,4.5);assert.equal(s.interval,4.25);assert.equal(s.next,8.75);for(let i=0;i<12;i++){s.count=1;tick(s,s.next-s.elapsed);}assert.equal(s.interval,3);assert.equal(s.status,'playing');const easy=createGame();tick(easy,6);assert.equal(easy.interval,6);});
test('inaction loses; terminal states do not change',()=>{const s=createGame();tick(s,30);assert.equal(s.status,'lost');const snapshot=JSON.stringify(s);tick(s,20);bite(s);drinkTea(s);assert.equal(JSON.stringify(s),snapshot);});
test('last bite wins and no tea or multiplication afterwards',()=>{const s=createGame();s.count=1;bite(s);tick(s,100);assert.equal(s.status,'won');assert.equal(s.count,0);assert.equal(drinkTea(s),false);});

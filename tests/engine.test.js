import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tick, bite, drinkTea, evolution } from '../engine.js';
function play(mode, delay=0, rate=4) {
 const s=createGame(mode); let next=delay;
 while(s.status==='playing'&&s.elapsed<120){tick(s,.02);if(s.elapsed>=next){if(s.fullness>65)drinkTea(s);bite(s);next+=1/rate;}}
 return s;
}
test('remaining buns double, including while drinking',()=>{const s=createGame();tick(s,5);drinkTea(s);tick(s,1);assert.equal(s.count,96);assert.ok(s.teaUntil);assert.equal(bite(s),0);});
test('full stomach blocks eating and rest recovers',()=>{const s=createGame();s.fullness=95;assert.equal(bite(s),0);tick(s,1);assert.ok(bite(s)>0);});
test('tea has drinking time, finite boost and reusable cooldown',()=>{const s=createGame();s.fullness=95;assert.ok(drinkTea(s));assert.equal(bite(s),0);assert.equal(drinkTea(s),false);tick(s,1.5);assert.equal(s.fullness,0);assert.equal(bite(s),2);assert.equal(s.fullness,0);tick(s,4);assert.equal(bite(s),1);assert.equal(s.fullness,7);assert.equal(drinkTea(s),false);tick(s,2);assert.ok(drinkTea(s));});
test('evolution follows total eaten and persists through multiplication',()=>{const s=createGame();s.eaten=19;bite(s);assert.equal(evolution(s).power,2);tick(s,6);assert.equal(evolution(s).power,2);s.eaten=50;assert.equal(bite(s),5);s.eaten=100;assert.equal(bite(s),10);s.eaten=220;assert.equal(bite(s),20);});
test('every difficulty can recover after multiple multiplications',()=>{for(const mode of ['snack','feast','hell']){const s=play(mode,0,4);assert.equal(s.status,'won',mode);assert.ok(s.doubles>=1);assert.ok(s.cups>=1);}});
test('snack allows 2 taps per second and a 10-second late comeback',()=>{const slow=play('snack',0,2);assert.equal(slow.status,'won');assert.ok(slow.doubles>=3);const late=play('snack',10);assert.equal(late.status,'won');assert.ok(late.doubles>=3);});
test('inaction loses; terminal states do not change',()=>{const s=createGame();tick(s,30);assert.equal(s.status,'lost');const snapshot=JSON.stringify(s);tick(s,20);bite(s);drinkTea(s);assert.equal(JSON.stringify(s),snapshot);});
test('last bite wins and no tea or multiplication afterwards',()=>{const s=createGame();s.count=1;bite(s);tick(s,100);assert.equal(s.status,'won');assert.equal(s.count,0);assert.equal(drinkTea(s),false);});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tick, bite, secondStomach } from '../engine.js';
test('remaining buns double at each deadline',()=>{const s=createGame();bite(s);tick(s,5);assert.equal(s.count,46);tick(s,5);assert.equal(s.count,92);});
test('full stomach blocks bites, then recovers',()=>{const s=createGame('hell');while(s.fullness<=90)bite(s);const n=s.count;assert.equal(bite(s),0);assert.equal(s.count,n);tick(s,1);assert.ok(bite(s)>0);});
test('second stomach is single use',()=>{const s=createGame();bite(s);assert.ok(secondStomach(s));assert.equal(s.fullness,0);assert.equal(secondStomach(s),false);});
test('all difficulties are winnable with timed bites and a second stomach',()=>{for(const mode of ['snack','feast','hell']){const s=createGame(mode);for(let i=0;i<3000&&s.status==='playing';i++){tick(s,.1);if(s.fullness>85&&!s.used)secondStomach(s);bite(s);}assert.equal(s.status,'won',mode);}});
test('1024 buns loses and terminal states stop changing',()=>{const s=createGame();tick(s,30);assert.equal(s.status,'lost');const n=s.count;tick(s,20);bite(s);assert.equal(s.count,n);});
test('winning ends multiplication',()=>{const s=createGame();s.count=1;bite(s);tick(s,100);assert.equal(s.status,'won');assert.equal(s.count,0);});

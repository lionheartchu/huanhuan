const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome'}),base='http://127.0.0.1:8765/',out=(process.argv[2]||'output/playwright/sound-about')+'/';
await mkdir(out,{recursive:true});
const errors=[];
try{for(const width of [1440,390]){
 const kind=width===390?'mobile':'desktop',c=await b.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1,reducedMotion:'reduce'});
 await c.addInitScript(()=>{
  const Native=window.AudioContext;window.__audioContexts=[];window.__outputs=new Set();window.__maxOutputs=0;
  window.AudioContext=new Proxy(Native,{construct(T,args){const ac=new T(...args);window.__audioContexts.push(ac);const make=ac.createGain.bind(ac);ac.createGain=()=>{const g=make(),connect=g.connect.bind(g),disconnect=g.disconnect.bind(g);g.connect=(dest,...rest)=>{if(dest===ac.destination){window.__outputs.add(g);window.__maxOutputs=Math.max(window.__maxOutputs,window.__outputs.size);}return connect(dest,...rest);};g.disconnect=(...args)=>{window.__outputs.delete(g);return disconnect(...args);};return g;};return ac;}});
 });
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
 const waitOwner=owner=>p.waitForFunction(owner=>Ambient.owner===owner&&(owner===null||Ambient.playing),owner);
 const shot=async name=>{await p.mouse.move(0,0);await p.waitForTimeout(350);await p.screenshot({path:out+kind+'-'+name+'.png'});};
 const nav=async route=>{await p.locator(`${width===390?'.tab-bar':'.main-nav'} a[data-view="${route}"]`).click();await p.waitForTimeout(100);};
 const openSound=async()=>{await p.locator('[data-action="activity"][data-id="music"]').first().click();};
 assert.equal(await p.evaluate(()=>__audioContexts.length),0);assert.equal(await p.locator('#sound-toggle').getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#space-volume').count(),0);await shot('header-muted');
 await p.locator('#sound-toggle').focus();await p.keyboard.press('Enter');await waitOwner('space');await p.waitForTimeout(250);await shot('header-keyboard-focus');await p.locator('#sound-toggle').evaluate(e=>e.blur());await shot('header-sound');
 for(const route of ['reflect','care','now']){await nav(route);assert.equal(await p.evaluate(()=>Ambient.owner),'space');assert.equal(await p.evaluate(()=>__audioContexts.length),1);}
 console.log(`PASS ${kind}: muted default, keyboard toggle, one uninterrupted AudioContext across all routes`);
 await nav('care');await openSound();assert.equal(await p.evaluate(()=>Ambient.owner),'space');await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.waitForTimeout(250);
 assert.equal(await p.locator('#sound-toggle').getAttribute('data-state'),'paused');await shot('practice-ambient-paused');
 await p.locator('#toggle-timer').click();await waitOwner(null);const paused=await p.locator('#timer-value').innerText();await p.waitForTimeout(1100);assert.equal(await p.locator('#timer-value').innerText(),paused);
 await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.locator('#finish-button').click();await waitOwner('space');await p.locator('[data-action="feedback"][data-value="same"]').click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')).personal.sessions.at(-1).feedback),'same');
 console.log(`PASS ${kind}: practice takes ownership, pause stays quiet, finish restores ambient; feedback persists`);
 await openSound();await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.locator('#modal .modal-close').click();await waitOwner('space');
 await openSound();await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.locator('#modal [data-action="sound"]').click();assert.equal(await p.evaluate(()=>Ambient.owner),'practice-music');await p.locator('#modal .modal-close').click();await waitOwner(null);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>Ambient.owner),null);
 await openSound();await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.keyboard.press('Escape');await waitOwner(null);
 console.log(`PASS ${kind}: early close restores enabled ambient; disabling during practice and prior-off both stay off`);
 await p.locator('#sound-toggle').click();await waitOwner('space');await p.waitForTimeout(250);await openSound();await p.locator('#toggle-timer').click();await waitOwner('practice-music');await p.evaluate(()=>{accumulated=activeActivity.minutes*60;updateTimer();});await waitOwner('space');assert.ok(await p.locator('#toggle-timer').isDisabled());await p.keyboard.press('Escape');
 await p.locator('#sound-toggle').click();await waitOwner(null);await p.locator('#sound-toggle').click();await p.locator('#sound-toggle').click();await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>Ambient.owner),null);
 assert.equal(await p.evaluate(()=>__maxOutputs),1);console.log(`PASS ${kind}: timer completion restores, rapid toggle stays off, never more than one connected audio output`);
 await p.locator('[data-action="settings"]').click();await p.locator('[data-action="notes-open"]').click();await p.waitForTimeout(100);
 assert.ok(await p.locator('#design-notes').isVisible());assert.equal(await p.locator('#design-notes .about-journey>li').count(),5);assert.equal(await p.locator('.about-flow>li').count(),5);assert.equal(await p.locator('#about-technical').getAttribute('open'),null);
 await shot('about');
 await p.locator('#about-process').evaluate(e=>e.scrollIntoView());await shot('about-process');
 await p.locator('#about-glance').evaluate(e=>e.scrollIntoView());await shot('about-flow');
 await p.locator('#about-technical summary').click();await p.locator('#about-technical').evaluate(e=>e.scrollIntoView());await shot('technical-notes');
 await p.locator('#design-notes').evaluate(e=>e.scrollTop=e.scrollHeight);await shot('technical-notes-bottom');
 assert.equal(await p.locator('.main-nav a').count(),3);assert.equal(await p.locator('.tab-bar a').count(),3);
 assert.ok(await p.locator('#design-notes').evaluate(e=>e.scrollWidth<=e.clientWidth));
 await p.locator('#about-technical summary').click();assert.equal(await p.locator('#about-technical').getAttribute('open'),null);
 await p.keyboard.press('Escape');await p.waitForTimeout(100);assert.equal(await p.locator('#design-notes').isVisible(),false);assert.ok(await p.locator('[data-action="settings"]').evaluate(e=>document.activeElement===e));
 console.log(`PASS ${kind}: About entry, five stages, flow, disclosure, Escape and focus return; primary navigation unchanged`);
 await p.locator('[data-action="settings"]').click();const download=p.waitForEvent('download');await p.locator('[data-action="export"]').click();assert.ok((await download).suggestedFilename().endsWith('.json'));await p.keyboard.press('Escape');
 await c.close();
}
// Explicit playback failure must leave no false on-state and allow retry.
{
 const c=await b.newContext(),p=await c.newPage();await p.goto(base);
 await p.evaluate(()=>{window.savedResume=AudioContext.prototype.resume;AudioContext.prototype.resume=function(){return Promise.reject(new Error('blocked for regression'));};});
 await p.locator('#sound-toggle').click();await p.waitForFunction(()=>document.querySelector('#sound-toggle').getAttribute('aria-pressed')==='false');
 assert.equal(await p.evaluate(()=>Ambient.owner),null);assert.equal(await p.evaluate(()=>Ambient.playing),false);
 await p.evaluate(()=>{AudioContext.prototype.resume=window.savedResume;});await p.locator('#sound-toggle').click();await p.waitForFunction(()=>Ambient.owner==='space'&&Ambient.playing);
 console.log('PASS playback rejection leaves sound off, then explicit retry succeeds');await c.close();
}
// Other practices keep their volume controls; silent practices do not claim audio.
{
 const c=await b.newContext(),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'#care');
 await p.locator('#sound-toggle').click();await p.waitForFunction(()=>Ambient.owner==='space'&&Ambient.playing);
 await p.locator('[data-action="activity"][data-id="breath"]').first().click();await p.locator('#toggle-timer').click();assert.equal(await p.evaluate(()=>Ambient.owner),'space');await p.keyboard.press('Escape');
 await p.locator('[data-action="activity"][data-id="rain"]').first().click();await p.locator('#toggle-timer').click();await p.waitForFunction(()=>Ambient.owner==='practice-rain'&&Ambient.playing);
 await p.locator('#volume').fill('27');await p.locator('#volume').dispatchEvent('input');assert.equal(await p.evaluate(()=>Ambient.volume),.27);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>Ambient.owner==='space'&&Ambient.playing);assert.equal(await p.evaluate(()=>Ambient.volume),.3);
 await p.locator('[data-action="activity"][data-id="rain"]').first().click();assert.equal(await p.locator('#volume').inputValue(),'27');await p.keyboard.press('Escape');
 await p.reload();assert.equal(await p.evaluate(()=>Ambient.owner),null);assert.equal(await p.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
 console.log('PASS breathing preserves ambient, rain takes ownership, practice volume persists independently, reload defaults to muted');await c.close();
}
for(const width of [320,390,768,1024]){
 const c=await b.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(base);
 await p.locator('[data-action="settings"]').click();await p.locator('#modal [data-action="demo-enter"]').click();await p.waitForTimeout(150);
 const rects=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};};return {width:innerWidth,scroll:document.documentElement.scrollWidth,brand:rect(document.querySelector('.brand')),tools:rect(document.querySelector('.header-tools')),buttons:[...document.querySelectorAll('.header-tools button')].map(rect)};});
 assert.ok(rects.scroll<=width&&rects.brand.right<=rects.tools.left&&rects.tools.right<=width,JSON.stringify(rects));
 const sound=await p.locator('#sound-toggle').boundingBox();assert.ok(sound.width>=44&&sound.height>=44);
 await p.screenshot({path:out+width+'-demo-header.png'});console.log(`PASS ${width}px demo header: no overlapping items or page overflow`);await c.close();
}
// Exercise Settings in an isolated browser, retaining demo and legacy backups.
{
 const c=await b.newContext(),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
 const legacy={entries:[{id:'old1',emotion:'低落',intensity:3,note:'旧记录验证',ts:1792713600000}],sessions:[]};
 await p.evaluate(legacy=>{localStorage.clear();localStorage.setItem('huanhuan-v2',JSON.stringify(legacy));},legacy);await p.reload();
 await p.locator('[data-action="settings"]').click();await p.locator('[data-action="notes-open"]').click();await p.keyboard.press('Escape');
 await p.locator('[data-action="settings"]').click();
 const take=async action=>{const ready=p.waitForEvent('download');await p.locator(`#modal [data-action="${action}"]`).click();return JSON.parse(await readFile(await (await ready).path(),'utf8'));};
 assert.deepEqual(await take('export-backup'),legacy);
 const personal=await take('export');assert.equal(personal.entries.length,1);assert.equal(personal.entries[0].text,'旧记录验证');
 await p.locator('#modal [data-action="demo-enter"]').click();
 const demo=await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')).demo);
 await p.locator('[data-action="settings"]').click();await p.locator('#modal [data-action="clear-confirm"]').click();await p.locator('#modal [data-action="settings"]').click();
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')).personal.entries.length),1);
 await p.locator('#modal [data-action="clear-confirm"]').click();await p.locator('#modal [data-action="clear-data"]').click();
 const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')));assert.deepEqual(after.personal,{entries:[],sessions:[]});assert.deepEqual(after.demo,demo);
 assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v2-backup'))),legacy);
 await p.reload();assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')).personal),{entries:[],sessions:[]});
 console.log('PASS Settings after About: JSON export, exact legacy backup download, cancel deletion, delete personal only, demo and backup preserved across reload');await c.close();
}
assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
}finally{await b.close();}

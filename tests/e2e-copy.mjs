/* 文案清理后的截图：需要本地服务与 playwright-core。用法：node tests/e2e-copy.mjs <输出目录> */
import { chromium } from 'playwright-core';
const OUT=process.argv[2],BASE='http://localhost:8765/';const b=await chromium.launch({channel:'chrome'});const wait=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
const H=3600e3,D=24*H;const seed=[['a',2*H,'疲惫','今天开会开到很晚，有点累。',['工作']],['b',26*H,null,'说不上来。',[]],['c',3*D,'平静','和朋友散了很久的步。',['社交']]];
for(const kind of ['desktop','mobile']){
  const c=await b.newContext(kind==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(kind+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(kind+' console '+m.text());});
  const shot=n=>p.screenshot({path:`${OUT}/${kind}-${n}.png`});const hideToast=()=>p.evaluate(()=>document.getElementById('toast').classList.remove('show'));
  await p.goto(BASE);await p.evaluate(([set])=>{const now=Date.now();const es=set.map(([id,dt,emo,text,tr],i)=>({id,ts:now-dt,kind:'text',text,durationSec:null,emotion:emo,intensity:null,triggers:tr,note:'',ctx:null,form:{x:.5,depth:.5,seed:(i+3)*104729}}));localStorage.setItem('huanhuan-v3',JSON.stringify({v:3,mode:'personal',personal:{entries:es,sessions:[]},demo:null,migration:null}));},[seed]);
  await p.goto(BASE+'#now');await p.reload();await wait(1400);await shot('1-now');
  await p.fill('#say','今天想记下一点点。');await p.click('#say-keep');await wait(1300);await shot('1b-now-saved');
  await p.click('[data-action="composer-new"]');await wait(200);
  const bb=await p.locator('#orb-hit').boundingBox();
  if(kind==='desktop'){await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await wait(1200);await p.mouse.up();}
  else{const cdp=await c.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+bb.width/2,y:bb.y+bb.height/2}]});await wait(1200);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await wait(500);await p.locator('#orb-caption').scrollIntoViewIfNeeded();await shot('1c-now-wordless-choice');
  await p.click('[data-action="stay-leave"]');
  await p.goto(BASE+'#care');await wait(1300);await shot('2-care');
  await p.evaluate(()=>document.getElementById('lib').scrollIntoView());await wait(700);await shot('2b-care-practices');
  await p.evaluate(()=>scrollTo(0,0));await p.click('.care-top [data-action="activity"][data-id="breath"]');await wait(500);await shot('4-breathing-ready');
  await p.click('#toggle-timer');await wait(2500);await shot('4b-breathing-running');
  await p.click('#finish-button');await wait(500);await shot('5-practice-complete');
  await p.click('[data-action="feedback"][data-value="same"]');await wait(400);await shot('5b-after-feedback-toast');
  await p.goto(BASE+'#reflect');await wait(1300);await shot('3-reflect-ch1');
  await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(1300);await shot('3b-reflect-ch2');
  await p.click('.feel-bub >> nth=0',{force:true});await wait(800);await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(500);await shot('3c-reflect-ch2-selected');
  await p.evaluate(()=>document.getElementById('ch-3').scrollIntoView());await wait(1300);await shot('3d-reflect-ch3');
  await p.click('[data-action="settings"]');await wait(200);await p.click('#modal [data-action="demo-enter"]');await wait(600);await hideToast();
  await p.goto(BASE+'#reflect');await wait(1200);await p.evaluate(()=>document.getElementById('ch-4').scrollIntoView());await wait(1300);await shot('3e-reflect-ch4-demo');
  await p.evaluate(()=>scrollTo(0,0));await wait(300);await shot('6-demo-label');
  await c.close();
}
console.log('ERRORS',errors.length?errors:'none');await b.close();

/* 前后对比截图（固定视口与状态）：需要本地服务与 playwright-core。用法：node tests/e2e-before-after.mjs <输出目录> */
import { chromium } from 'playwright-core';
const OUT=process.argv[2],BASE='http://localhost:8765/';const b=await chromium.launch({channel:'chrome'});const wait=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
const H=3600e3,D=24*H;
const seed=[['a',2*H,'疲惫','今天开会开到很晚，有点累。',['工作']],['b',26*H,null,'说不上来。',[]],['c',3*D,'平静','和朋友散了很久的步。',['社交']]];
for(const kind of ['desktop','mobile']){
  const c=await b.newContext(kind==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(kind+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(kind+' console '+m.text());});
  const shot=n=>p.screenshot({path:`${OUT}/${kind}-${n}.png`});
  const ovf=async l=>{const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);if(w[0]>w[1])errors.push(`${kind} overflow ${l} ${w}`);};
  await p.goto(BASE);await p.evaluate(([set])=>{const now=Date.now();const es=set.map(([id,dt,emo,text,tr],i)=>({id,ts:now-dt,kind:'text',text,durationSec:null,emotion:emo,intensity:null,triggers:tr,note:'',ctx:null,form:{x:.5,depth:.5,seed:(i+3)*104729}}));localStorage.setItem('huanhuan-v3',JSON.stringify({v:3,mode:'personal',personal:{entries:es,sessions:[]},demo:null,migration:null}));},[seed]);
  await p.goto(BASE+'#now');await p.reload();await wait(1500);await shot('1-now');await ovf('now');
  await p.fill('#say','今天想记下一点点。');await wait(200);await shot('1b-now-typing');await p.fill('#say','');
  // demo for care / reflect
  await p.click('[data-action="settings"]');await wait(200);await p.click('#modal [data-action="demo-enter"]');await wait(500);
  await p.goto(BASE+'#care');await wait(1500);await p.evaluate(()=>document.getElementById('toast').classList.remove('show'));await shot('2-care-featured');await ovf('care');
  await p.evaluate(()=>document.getElementById('lib').scrollIntoView());await wait(800);await shot('3-care-recs-list');
  await p.goto(BASE+'#reflect');await wait(1200);await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(1400);await shot('4-reflect-ch2-initial');
  await p.click('.feel-bub >> nth=0',{force:true});await wait(900);await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(600);await shot('5-reflect-ch2-selected');await ovf('reflect');
  if(kind==='mobile'){await p.evaluate(()=>document.getElementById('feel-panel').scrollIntoView());await wait(500);await shot('5b-reflect-ch2-panel');}
  await c.close();
}
console.log('ERRORS',errors.length?errors:'none');await b.close();

/* 浏览器检查：需要本地服务 (python3 -m http.server 8765) 与 playwright-core（使用系统 Chrome）。用法：node tests/e2e-round2.mjs <截图输出目录> */
import { chromium } from 'playwright-core';
const BASE='http://localhost:8765/',OUT=process.argv[2];
const b=await chromium.launch({channel:'chrome'});const errors=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(const kind of ['desktop','mobile']){
  const opt=kind==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}};
  const c=await b.newContext(opt);const p=await c.newPage();p.on('pageerror',e=>errors.push(kind+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(kind+' console '+m.text());});
  const shot=(n,full=false)=>p.screenshot({path:`${OUT}/${kind}-${n}.png`,fullPage:full});
  const ovf=async l=>{const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);if(w[0]>w[1])errors.push(`${kind} overflow on ${l}: ${w}`);};
  await p.goto(BASE+'#now');await wait(1300);await shot('01-now-empty');await ovf('now');
  await p.fill('#say','投了好多简历都没有回复，今天真的有点累。');await p.click('#say-keep');await wait(1100);
  await p.click('[data-action="tag-emo"][data-value="疲惫"]');await wait(2200);await shot('02-now-saved');
  await p.click('[data-action="composer-new"]');await wait(200);
  // 示例
  await p.click('[data-action="settings"]');await wait(200);await p.click('#modal [data-action="demo-enter"]');await wait(1300);await shot('03-now-demo');await ovf('now demo');
  await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await wait(500);await shot('04-now-demo-below');
  await p.goto(BASE+'#reflect');await wait(1200);await shot('05-reflect-ch1');await ovf('reflect');
  await p.click('.rv-dot >> nth=3',{force:true});await wait(500);await shot('06-reflect-ch1-select');
  await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(1300);await shot('07-reflect-ch2-initial');
  await p.click('.feel-bub >> nth=0',{force:true});await wait(900);
  await p.evaluate(()=>document.getElementById('ch-2').scrollIntoView());await wait(500);await shot('08-reflect-ch2-selected');await ovf('reflect sel');
  if(kind==='mobile'){await p.evaluate(()=>document.getElementById('feel-panel').scrollIntoView());await wait(400);await shot('08b-reflect-ch2-panel');}
  await p.evaluate(()=>document.getElementById('ch-3').scrollIntoView());await wait(1300);await shot('09-reflect-ch3');
  await p.evaluate(()=>document.getElementById('ch-4').scrollIntoView());await wait(1300);await shot('10-reflect-ch4');
  await p.evaluate(()=>scrollTo(0,0));await wait(300);
  await p.click('[data-action="all-records"] >> nth=0');await wait(500);await shot('11-records-modal');await p.keyboard.press('Escape');
  await p.goto(BASE+'#care');await wait(1200);await shot('12-care-top');await ovf('care');
  await p.evaluate(()=>document.getElementById('lib').scrollIntoView());await wait(600);await shot('13-care-lib');
  await p.evaluate(()=>document.querySelector('.demo-bar [data-action="demo-exit"]').click());await wait(600);
  await p.goto(BASE+'#reflect');await wait(1200);await shot('14-reflect-personal',true);
  await c.close();
}
console.log('ERRORS',errors.length?errors:'none');await b.close();

/* 回望的稀疏数据检查（0/1/2/5 条与示例）：需要本地服务 (python3 -m http.server 8765) 与 playwright-core（使用系统 Chrome）。用法：node tests/e2e-sparse.mjs <截图输出目录> */
import { chromium } from 'playwright-core';
const OUT=process.argv[2],BASE='http://localhost:8765/';const b=await chromium.launch({channel:'chrome'});const wait=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
const H=3600e3,D=24*H;
const SETS={
  r0:[],
  r1:[['a',1*H,'疲惫','今天开会开到很晚，有点累。',['工作']]],
  r2:[['a',1*H,'疲惫','今天开会开到很晚，有点累。',['工作']],['b',26*H,null,'说不上来。',[]]],
  r4:[['a',1*H,'疲惫','今天开会开到很晚，有点累。',['工作']],['b',26*H,null,'说不上来。',[]],['c',2*D+3*H,'焦虑','面试结果还没出来。',['求职']],['d',3*D,'平静','和朋友散了很久的步。',['社交']],['e',4*D,'疲惫','连着两天熬夜。',['工作','睡眠']]],
};
async function ctx(kind){const c=await b.newContext(kind==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>errors.push(kind+': '+e.message));return{c,p};}
async function seed(p,set){await p.goto(BASE);await p.evaluate(([set])=>{const now=Date.now();const es=set.map(([id,dt,emo,text,tr],i)=>({id,ts:now-dt,kind:'text',text,durationSec:null,emotion:emo,intensity:null,triggers:tr,note:'',ctx:null,form:{x:.5,depth:.5,seed:(i+3)*104729}}));localStorage.setItem('huanhuan-v3',JSON.stringify({v:3,mode:'personal',personal:{entries:es,sessions:[]},demo:null,migration:null}));},[set]);await p.goto(BASE+'#reflect');await p.reload();await wait(1300);}
const at=async(p,id)=>{await p.evaluate(id=>document.getElementById(id).scrollIntoView(),id);await wait(1200);};
const W=async(p,l)=>{const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);if(w[0]>w[1])errors.push(l+' overflow '+w);};
for(const kind of ['desktop','mobile']){
  for(const [name,set] of Object.entries(SETS)){
    if(kind==='mobile'&&name==='r4')continue;
    const {c,p}=await ctx(kind);await seed(p,set);await W(p,kind+name);
    await p.screenshot({path:`${OUT}/${kind}-${name}-ch1.png`});
    if(set.length){
      await at(p,'ch-2');await p.screenshot({path:`${OUT}/${kind}-${name}-ch2.png`});
      const bubs=await p.$$eval('.feel-bub',x=>x.map(e=>[e.dataset.value,Math.round(e.getBoundingClientRect().width)]));console.log(kind,name,'bubbles',JSON.stringify(bubs),'moments',await p.$$eval('.moments',x=>x.length));
      await at(p,'ch-3');await p.screenshot({path:`${OUT}/${kind}-${name}-ch3.png`});
      if(name==='r2'){await at(p,'ch-2');await p.click('.moments');await wait(700);await at(p,'ch-2');await p.screenshot({path:`${OUT}/${kind}-r2-ch2-moments-selected.png`});
        if(kind==='mobile'){await p.evaluate(()=>document.getElementById('feel-panel').scrollIntoView());await wait(400);await p.screenshot({path:`${OUT}/mobile-r2-ch2-panel.png`});}
        await p.click('[data-action="feel-close"]');await wait(300);await p.click('.feel-bub',{force:true});await wait(700);await at(p,'ch-2');await p.screenshot({path:`${OUT}/${kind}-r2-ch2-bubble-selected.png`});}
    }
    await c.close();
  }
  // demo
  const {c,p}=await ctx(kind);await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await wait(300);
  await p.click('[data-action="demo-enter"]');await p.goto(BASE+'#reflect');await wait(1300);await W(p,kind+'demo');
  await p.screenshot({path:`${OUT}/${kind}-demo-ch1.png`});
  await at(p,'ch-2');await p.screenshot({path:`${OUT}/${kind}-demo-ch2.png`});
  console.log(kind,'demo bubbles',JSON.stringify(await p.$$eval('.feel-bub',x=>x.map(e=>[e.dataset.value,Math.round(e.getBoundingClientRect().width)]))));
  await p.click('.feel-bub >> nth=0',{force:true});await wait(800);await at(p,'ch-2');await p.screenshot({path:`${OUT}/${kind}-demo-ch2-selected.png`});
  if(kind==='mobile'){await p.evaluate(()=>document.getElementById('feel-panel').scrollIntoView());await wait(400);await p.screenshot({path:`${OUT}/mobile-demo-ch2-panel.png`});}
  await at(p,'ch-3');await p.screenshot({path:`${OUT}/${kind}-demo-ch3.png`});
  await c.close();
}
console.log('ERRORS',errors.length?errors:'none');await b.close();

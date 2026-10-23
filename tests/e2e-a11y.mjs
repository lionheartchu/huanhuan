/* 浏览器检查：需要本地服务 (python3 -m http.server 8765) 与 playwright-core（使用系统 Chrome）。用法：node tests/e2e-a11y.mjs <截图输出目录> */
import { chromium } from 'playwright-core';
const OUT=process.argv[2], BASE='http://localhost:8765/';
const b=await chromium.launch({channel:'chrome'});const errors=[];const ok=(c,m)=>console.log(c?'PASS':'FAIL',m);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function page(opt={}){const c=await b.newContext({viewport:{width:1440,height:900},...opt});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return {c,p};}
const store=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('huanhuan-v3')));
// 1 键盘
{const {c,p}=await page();await p.goto(BASE+'#now');await wait(800);
 ok(await p.evaluate(()=>Ambient.owner===null&&!Ambient.playing),'sound muted by default');
 await p.focus('#orb-hit');await p.keyboard.down('Space');await wait(600);
 ok(await p.evaluate(()=>Space.holding),'Space holds the orb');
 for(let i=0;i<4;i++){await p.keyboard.press('ArrowRight');await wait(80);}
 await wait(500);await p.screenshot({path:OUT+'/kb-hold.png'});
 await p.keyboard.up('Space');await wait(400);
 ok(await p.isVisible('#orb-choices'),'choices appear after keyboard release');
 ok((await store(p)).personal.entries.length===0,'nothing saved before explicit choice');
 await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.dataset.action),'Tab reaches: '+await p.evaluate(()=>document.activeElement.dataset.action));
 await p.keyboard.press('Enter');await wait(300);
 const s=await store(p);ok(s.personal.entries.length===1&&s.personal.entries[0].kind==='wordless'&&s.personal.entries[0].emotion===null,'Enter keeps wordless moment, emotion null');
 // 文字：Ctrl+Enter 保存
 await p.focus('#say');await p.keyboard.type('键盘保存');await p.keyboard.press('Control+Enter');await wait(900);
 ok((await store(p)).personal.entries.length===2,'Ctrl+Enter saves text');
 // 不保存：离开时没有隐藏记录
 await p.click('[data-action="composer-new"]');await p.fill('#say','这段不保存');await p.click('[data-action="say-discard"]');await wait(700);
 const bb=await p.locator('#orb-hit').boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await wait(500);await p.mouse.up();
 await p.click('.main-nav a[data-view="care"]');await wait(300);
 ok((await store(p)).personal.entries.length===2,'discard + leaving mid-interaction create no records');
 // 删除
 await p.click('.main-nav a[data-view="reflect"]');await wait(500);await p.click('[data-action="all-records"] >> nth=0');await wait(300);await p.click('.entry-open >> nth=0');await wait(300);
 await p.click('[data-action="delete"]');await p.click('[data-action="confirm-delete"]');await wait(300);
 ok((await store(p)).personal.entries.length===1,'delete from reflect works');
 // 示例隔离
 await p.click('[data-action="settings"]');await p.click('#modal [data-action="demo-enter"]');await wait(400);
 await p.click('.demo-bar [data-action="demo-reset"]');await wait(300);await p.click('.demo-bar [data-action="demo-exit"]');await wait(300);
 const s2=await store(p);ok(s2.personal.entries.length===1&&s2.personal.entries.every(e=>!e.demo)&&s2.demo.entries.length>20,'demo isolated from personal');
 await c.close();}
// 2 已有 v3 数据保留 + v2 迁移
{const {c,p}=await page();await p.goto(BASE);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('huanhuan-v2',JSON.stringify({entries:[{id:'old1',emotion:'低落',intensity:3,note:'旧版本写的话',ts:Date.now()-86400000},{id:'mk',mock:true,emotion:'焦虑'}],sessions:[]}));});
 await p.reload();await wait(600);const s=await store(p);
 ok(s.personal.entries.length===1&&s.personal.entries[0].text==='旧版本写的话','v2 migrated, mock dropped');
 ok(await p.evaluate(()=>!!localStorage.getItem('huanhuan-v2-backup')),'v2 backup kept');
 await p.reload();await wait(500);ok((await store(p)).personal.entries.length===1,'existing v3 data preserved across reload');
 await c.close();}
// 3 reduced motion
{const {c,p}=await page({reducedMotion:'reduce'});await p.goto(BASE+'#now');await wait(800);
 ok(await p.evaluate(()=>!Space.running),'reduced motion: no animation loop');
 const bb=await p.locator('#orb-hit').boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await wait(200);
 await p.screenshot({path:OUT+'/rm-hold.png'});await p.mouse.up();await wait(200);
 ok(await p.isVisible('#orb-choices'),'reduced motion: choices still appear');
 await p.click('[data-action="stay-leave"]');ok((await store(p)).personal.entries.length===0,'只是待了一会儿 saves nothing');
 await c.close();}
// 4 dark
{const {c,p}=await page({colorScheme:'dark'});await p.goto(BASE+'#now');await wait(900);await p.screenshot({path:OUT+'/dark-home.png'});
 await p.goto(BASE+'#care');await wait(600);await p.screenshot({path:OUT+'/dark-care.png'});await c.close();}
// 5 mobile horizontal overflow on all views
{const {c,p}=await page({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await p.goto(BASE);await p.evaluate(()=>localStorage.clear());
 for(const v of ['now','reflect','care']){await p.goto(BASE+'#'+v);await p.reload();await wait(600);const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok(w[0]<=390&&w[1]===390,`mobile ${v} no horizontal overflow ${w}`);}
 await p.evaluate(()=>{document.querySelector('[data-action="demo-enter"]')?.click();});await wait(500);
 for(const v of ['now','reflect','care']){await p.click(`.tab-bar a[data-view="${v}"]`);await wait(700);const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok(w[0]<=390&&w[1]===390,`mobile demo ${v} no overflow ${w}`);}
 await p.click('.tab-bar a[data-view="reflect"]');await wait(600);await p.screenshot({path:OUT+'/mobile-reflect-demo.png',fullPage:true});
 await c.close();}
{const {c,p}=await page();await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await wait(300);
 await p.click('[data-action="demo-enter"]');await p.goto(BASE+'#reflect');await wait(900);
 ok(await p.isHidden('#feel-panel'),'ch2 initial: no detail panel');
 const k=await p.getAttribute('.feel-bub >> nth=0','data-value');await p.click('.feel-bub >> nth=0',{force:true});await wait(600);
 ok(await p.isVisible('#feel-panel')&&await p.evaluate(()=>document.getElementById('ch-2').classList.contains('has-sel')),'ch2 click opens panel: '+k);
 const op=await p.evaluate(()=>getComputedStyle(document.querySelectorAll('.feel-bub')[1]).opacity);ok(+op<.5,'other bubbles fade back (opacity '+op+')');
 ok(await p.evaluate(k=>document.querySelector('#ch-3 .chip.active').textContent.includes(k)||k==='__none',k),'ch3 uses selected feeling as context');
 await p.keyboard.press('Escape');await wait(300);ok(await p.isHidden('#feel-panel'),'Esc closes panel');
 const finds=await p.$$eval('.find',x=>x.length);ok(finds>=1&&finds<=3,'ch4 shows 1–3 findings ('+finds+')');
 await p.click('.rv-dot >> nth=2',{force:true});await wait(300);ok(await p.evaluate(()=>document.querySelectorAll('.rv-node')[2].classList.contains('sel')),'ch1 node selection moves card');
 await c.close();}
console.log('ERRORS',errors.length?errors:'none');await b.close();

'use strict';
/* 缓缓 · 情绪花园（Canvas 2D）
   地面以下按触发因素分层；未照料的难受情绪是埋在对应土层的种子，
   照料过的、或本来就舒服的情绪，是地面上程序化绘制的花。 */
(function(root){
const {EMO,TRIG,hash}=root.HH;
const SHAPE={'焦虑':{n:5,w:.5},'烦躁':{n:7,w:.34,pt:1},'低落':{n:6,w:.46,droop:1},'疲惫':{n:4,w:.62},'委屈':{n:8,w:.3},'迷茫':{n:6,w:.4,pt:1},'平静':{n:5,w:.62},'开心':{n:10,w:.3}};
const G={cv:null,c:null,W:0,H:300,dpr:1,SURF:0,LT:0,LH:0,strata:null,lay:{seeds:[],flowers:[]},prev:new Map(),anims:[],motes:[],raf:0,on:false,hover:null,entries:[],onSeed:null,dark:false,rm:false,ro:null};
const mqD=window.matchMedia('(prefers-color-scheme: dark)'),mqR=window.matchMedia('(prefers-reduced-motion: reduce)');
G.dark=mqD.matches;G.rm=mqR.matches;
const onMQ=(mq,fn)=>mq.addEventListener?mq.addEventListener('change',fn):mq.addListener(fn);
onMQ(mqD,e=>{G.dark=e.matches;if(G.cv){buildStrata();draw(performance.now());}});
onMQ(mqR,e=>{G.rm=e.matches;if(G.cv){if(G.rm)stop();else start();draw(performance.now());}});

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=t=>1-Math.pow(1-clamp(t,0,1),3);
function rgb(hex){const n=parseInt(hex.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function rgba(hex,a){const[r,g,b]=rgb(hex);return`rgba(${r},${g},${b},${a})`;}
function mix(h1,h2,t){const a=rgb(h1),b=rgb(h2);return`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;}
function R(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

function pal(){
  return G.dark?{sky:['#1f1b26','#2a2433'],soil:['#3d342f','#39302b','#352c27','#312823','#2d2420','#29211d','#251e1a','#221b18','#1f1916'],label:'rgba(236,228,244,.42)',grass:'#6f8a72',stem:'#7f9a80',mote:'#e8dcf5',glint:'#d9c3a3',sun:'#f3e6c4'}
               :{sky:['#f7f4fa','#eee7f4'],soil:['#ece2d4','#e5d8c6','#ddcdb9','#d3c1ab','#c8b49d','#bca690','#af9883','#a18a77','#937c6b'],label:'rgba(76,62,58,.55)',labelDeep:'rgba(52,40,34,.62)',grass:'#93ab8f',stem:'#7f977c',mote:'#b9a5cf',glint:'#fff7e8',sun:'#f0d7a6'};
}

function mount(canvas,opts){
  G.cv=canvas;G.c=canvas.getContext('2d');G.onSeed=opts&&opts.onSeed;G.W=0;
  canvas.addEventListener('click',onClick);
  canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerleave',()=>{G.hover=null;canvas.style.cursor='';});
  if(G.ro)G.ro.disconnect();
  if(window.ResizeObserver){G.ro=new ResizeObserver(()=>resize());G.ro.observe(canvas);}
  else window.addEventListener('resize',resize);
  resize();start();
}
function unmount(){stop();if(G.ro)G.ro.disconnect();G.cv=null;}
function resize(){
  if(!G.cv)return;const w=Math.round(G.cv.clientWidth);if(!w)return;
  const h=Math.round(G.cv.clientHeight)||300;
  if(w===G.W&&h===G.H&&G.strata)return;
  if(w!==G.layW){G.prev.clear();G.layW=w;}
  G.W=w;G.H=h;G.dpr=Math.min(2,window.devicePixelRatio||1);
  G.cv.width=Math.round(w*G.dpr);G.cv.height=Math.round(h*G.dpr);
  G.SURF=Math.round(h*.4);G.LT=G.SURF+12;G.LH=(h-G.LT-4)/TRIG.length;
  buildStrata();layout();initMotes();draw(performance.now());
}

function buildStrata(){
  const P=pal(),W=G.W,H=G.H,o=document.createElement('canvas');o.width=Math.round(W*G.dpr);o.height=Math.round(H*G.dpr);
  const c=o.getContext('2d');c.scale(G.dpr,G.dpr);const r=R(7);
  // 天空
  const sky=c.createLinearGradient(0,0,0,G.SURF);sky.addColorStop(0,P.sky[0]);sky.addColorStop(1,P.sky[1]);c.fillStyle=sky;c.fillRect(0,0,W,G.SURF+4);
  const hr=new Date().getHours(),day=hr>=6&&hr<18,sx=W-56,sy=G.SURF*.32;
  const glow=c.createRadialGradient(sx,sy,0,sx,sy,60);glow.addColorStop(0,rgba(P.sun.startsWith('#')?P.sun:'#f0d7a6',day?.55:.25));glow.addColorStop(1,rgba('#f0d7a6',0));
  c.fillStyle=glow;c.beginPath();c.arc(sx,sy,60,0,7);c.fill();
  c.fillStyle=rgba(P.sun,day?.9:.75);c.beginPath();c.arc(sx,sy,day?13:10,0,7);c.fill();
  if(!day){c.fillStyle=P.sky[0];c.beginPath();c.arc(sx+5,sy-3,9,0,7);c.fill();
    for(let i=0;i<26;i++){c.fillStyle=rgba('#ffffff',.25+r()*.4);c.fillRect(r()*W,r()*G.SURF*.75,1.2,1.2);}}
  // 远山
  c.fillStyle=G.dark?'rgba(120,104,140,.16)':'rgba(170,150,196,.14)';c.beginPath();c.moveTo(0,G.SURF);
  for(let x=0;x<=W;x+=8)c.lineTo(x,G.SURF-18-Math.sin(x*.006+1)*12-Math.sin(x*.017)*5);c.lineTo(W,G.SURF);c.fill();
  // 土层：从深到浅画，波浪形的上边缘相互覆盖
  const edge=i=>i===0?G.SURF:G.LT+(i-1)*G.LH;
  for(let i=TRIG.length;i>=0;i--){
    const top=edge(i),ph=r()*6,amp=i===0?2.4:1.6;
    c.fillStyle=P.soil[i];c.beginPath();c.moveTo(0,H);
    for(let x=0;x<=W;x+=6)c.lineTo(x,top+Math.sin(x*.035+ph)*amp+Math.sin(x*.011+ph*2)*amp);
    c.lineTo(W,H);c.closePath();c.fill();
    if(i>0){c.strokeStyle=G.dark?'rgba(0,0,0,.25)':'rgba(110,80,55,.12)';c.lineWidth=1;c.beginPath();for(let x=0;x<=W;x+=6){const y=top+Math.sin(x*.035+ph)*amp+Math.sin(x*.011+ph*2)*amp;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
    // 小石子
    const y1=i===TRIG.length?H:edge(i+1);
    for(let k=0;k<Math.max(6,W/45);k++){c.fillStyle=G.dark?'rgba(255,240,220,.05)':'rgba(90,60,40,.09)';c.beginPath();c.ellipse(r()*W,top+4+r()*(y1-top-6),1+r()*2.4,.8+r()*1.4,r()*3,0,7);c.fill();}
  }
  // 土层标签
  c.font='10px "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';c.textBaseline='middle';
  TRIG.forEach((t,i)=>{c.fillStyle=(!G.dark&&i>=5)?P.labelDeep:P.label;c.fillText(t,12,G.LT+i*G.LH+G.LH/2+1);});
  // 草
  c.strokeStyle=P.grass;c.lineCap='round';
  for(let x=2;x<W;x+=3+r()*5){const h=2+r()*6;c.globalAlpha=.45+r()*.4;c.lineWidth=1;c.beginPath();c.moveTo(x,G.SURF+2);c.quadraticCurveTo(x+(r()-.5)*3,G.SURF-h*.6,x+(r()-.5)*4,G.SURF-h);c.stroke();}
  c.globalAlpha=1;G.strata=o;
}

function layout(){
  if(!G.W)return;
  G.lay.seeds.forEach(s=>G.prev.set(s.id,s)); // 记住种子的位置，照料后从这里化成花
  const ents=G.entries.slice().sort((a,b)=>a.ts-b.ts),W=G.W;
  const seeds=ents.filter(e=>EMO[e.emotion].v<0&&!e.cared).slice(-40);
  const flowers=ents.filter(e=>EMO[e.emotion].v>0||e.cared).sort((a,b)=>(a.caredTs||a.ts)-(b.caredTs||b.ts)).slice(-Math.max(14,Math.floor(W/26)));
  const scale=Math.min(1.2,Math.max(.85,G.H/300));
  G.lay={
    seeds:seeds.map(e=>{const h=hash(e.id),li=TRIG.indexOf((e.triggers||[])[0]),y0=li<0?G.SURF+3:G.LT+li*G.LH,y1=li<0?G.LT-1:y0+G.LH;
      return{id:e.id,emo:e.emotion,li,x:56+(h%10007)/10007*(W-74),y:y0+5+((h>>>8)%997)/997*Math.max(1,y1-y0-10),ph:((h>>>4)%628)/100};}),
    flowers:flowers.map(e=>{const h=hash(e.id);
      return{id:e.id,emo:e.emotion,x:16+(h%10007)/10007*(W-32),base:G.SURF+1+((h>>>5)%6),h:(24+e.intensity*6+((h>>>9)%14))*scale,r:(5.5+e.intensity*1.05+((h>>>3)%3)*.5)*scale,ph:((h>>>12)%1000)/1000};}).sort((a,b)=>a.base-b.base)
  };
}
function initMotes(){
  const r=R(11);G.motes=[];
  const n=Math.round(G.W/14);
  for(let i=0;i<n;i++){const soil=i%4===0;G.motes.push({soil,x:r()*G.W,y:soil?G.LT+r()*(G.H-G.LT):6+r()*(G.SURF-14),vx:(r()-.5)*(soil?.03:.12),vy:soil?-.01-r()*.02:-.04-r()*.06,r:soil?.8+r()*.8:.8+r()*1.3,ph:r()*6});}
}

function drawSeed(c,x,y,col,t,ph,a,hl){
  const pulse=G.rm?.6:.5+.5*Math.sin(t*1.7+ph),rad=hl?20:14;
  c.save();c.globalAlpha=a;
  const g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgba(col,.25+.3*pulse+(hl?.2:0)));g.addColorStop(1,rgba(col,0));
  c.fillStyle=g;c.beginPath();c.arc(x,y,rad,0,7);c.fill();
  c.translate(x,y);c.rotate(Math.sin(ph)*.5);
  c.fillStyle=col;c.beginPath();c.ellipse(0,0,hl?5:4.2,hl?7:6,0,0,7);c.fill();
  c.strokeStyle=rgba('#ffffff',G.dark?.25:.55);c.lineWidth=1;c.beginPath();c.ellipse(-1.2,-1.6,1.2,2.4,.3,0,7);c.stroke();
  c.restore();
}
function drawFlower(c,f,t,grow,alpha){
  const e=EMO[f.emo],S=SHAPE[f.emo]||SHAPE['平静'],P=pal(),g=ease(grow);if(g<=0)return;
  const sway=G.rm?0:Math.sin(t*.7+f.ph*6)*2.2,h=f.h*g,tx=f.x+sway*g,ty=f.base-h;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  c.strokeStyle=P.stem;c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(f.x,f.base);
  c.quadraticCurveTo(f.x+(f.ph-.5)*10,f.base-h*.55,tx,ty);c.stroke();
  if(g>.35){const ly=f.base-h*.4,lx=f.x+(f.ph-.5)*5,dir=f.ph>.5?1:-1;c.fillStyle=P.grass;c.save();c.translate(lx,ly);c.rotate(dir*-.6);c.beginPath();c.ellipse(dir*6,0,6.5*g,2.4*g,0,0,7);c.fill();c.restore();}
  const r=f.r*clamp((g-.35)/.65,0,1);
  if(r>.4){
    c.save();c.translate(tx,ty);
    if(S.droop){c.rotate(.35);c.scale(1,.72);}
    const rot=f.ph*6+(G.rm?0:t*.05);
    for(let k=0;k<S.n;k++){
      c.save();c.rotate(rot+k/S.n*Math.PI*2);c.fillStyle=rgba(e.c,.94);c.beginPath();
      if(S.pt){c.moveTo(0,0);c.quadraticCurveTo(r*.55,-r*S.w*1.25,r*1.12,0);c.quadraticCurveTo(r*.55,r*S.w*1.25,0,0);}
      else c.ellipse(r*.58,0,r*.58,r*S.w,0,0,7);
      c.fill();c.restore();
    }
    c.fillStyle=mix(e.c,'#ffffff',.45);
    for(let k=0;k<S.n;k++){c.save();c.rotate(rot+(k+.5)/S.n*Math.PI*2);c.beginPath();c.ellipse(r*.3,0,r*.3,r*S.w*.55,0,0,7);c.fill();c.restore();}
    c.fillStyle=e.d;c.beginPath();c.arc(0,0,r*.26,0,7);c.fill();
    c.restore();
  }
  c.restore();
}

function draw(now){
  if(!G.cv||!G.W)return;
  const c=G.c,t=now/1000,P=pal();
  c.setTransform(G.dpr,0,0,G.dpr,0,0);c.clearRect(0,0,G.W,G.H);
  if(G.strata)c.drawImage(G.strata,0,0,G.W,G.H);
  const hideS=new Set(),hideF=new Set();
  G.anims.forEach(a=>{if(a.type==='drop')hideS.add(a.id);else hideF.add(a.id);});
  // 新种子落下时，对应土层亮一下
  G.anims.forEach(a=>{if(a.type!=='drop'||a.li<0)return;const p=(now-a.t0)/a.dur,al=Math.sin(clamp(p,0,1)*Math.PI)*.28;
    c.fillStyle=rgba(G.dark?'#fff3e0':'#ffffff',al);c.fillRect(0,G.LT+a.li*G.LH,G.W,G.LH);});
  G.lay.flowers.forEach(f=>{if(!hideF.has(f.id))drawFlower(c,f,t,1);});
  G.lay.seeds.forEach(s=>{if(!hideS.has(s.id))drawSeed(c,s.x,s.y,EMO[s.emo].c,t,s.ph,1,G.hover===s.id);});
  // 漂浮的微粒
  G.motes.forEach(m=>{
    if(!G.rm){m.x+=m.vx+Math.sin(t*.4+m.ph)*.05;m.y+=m.vy;
      if(m.soil){if(m.y<G.LT)m.y=G.H-4;}else if(m.y<4){m.y=G.SURF-8;m.x=Math.random()*G.W;}
      if(m.x<0)m.x+=G.W;if(m.x>G.W)m.x-=G.W;}
    c.fillStyle=rgba(m.soil?P.glint:P.mote,(m.soil?.35:.45)*(.55+.45*Math.sin(t*1.3+m.ph)));
    c.beginPath();c.arc(m.x,m.y,m.r,0,7);c.fill();
  });
  // 动画
  G.anims=G.anims.filter(a=>{const p=(now-a.t0)/a.dur;if(p>=1)return false;
    if(a.type==='drop'){
      const s=G.lay.seeds.find(x=>x.id===a.id);if(!s)return false;
      const q=ease(p/.75),y=-10+(s.y+10)*q;drawSeed(c,s.x,y,EMO[s.emo].c,t,s.ph,1,true);
      if(p>.72){const k=(p-.72)/.28;c.strokeStyle=rgba(EMO[s.emo].c,.6*(1-k));c.lineWidth=1.2;c.beginPath();c.ellipse(s.x,s.y,6+k*22,2+k*6,0,0,7);c.stroke();}
    }else if(a.type==='bloom'){
      const f=G.lay.flowers.find(x=>x.id===a.id);if(!f)return false;
      drawFlower(c,f,t,p);
      for(let k=0;k<10;k++){const an=k/10*Math.PI*2+a.t0,rr=8+ease(p)*24;c.fillStyle=rgba(EMO[f.emo].c,.7*(1-p));c.beginPath();c.arc(f.x+Math.cos(an)*rr,f.base-f.h+Math.sin(an)*rr,1.6,0,7);c.fill();}
    }else if(a.type==='transform'){
      const f=G.lay.flowers.find(x=>x.id===a.id);if(!f)return false;
      const col=EMO[f.emo].c;
      if(p<.2){const j=p<.14?Math.sin(now/30)*1.2:0;drawSeed(c,a.sx+j,a.sy,col,t,0,1-clamp((p-.12)/.08,0,1),true);}
      const fade=1-clamp((p-.72)/.2,0,1);
      a.parts.forEach(q=>{const k=ease((p-.12-q.d)/.5);if(p<.12+q.d)return;
        const x=(1-k)*(1-k)*q.x0+2*(1-k)*k*q.cx+k*k*q.tx,y=(1-k)*(1-k)*q.y0+2*(1-k)*k*q.cy+k*k*q.ty;
        c.fillStyle=rgba(col,.9*fade);c.beginPath();c.arc(x,y,q.r,0,7);c.fill();});
      drawFlower(c,f,t,clamp((p-.55)/.45,0,1));
    }
    return true;});
  if(G.rm&&G.anims.length===0)G.anims=[];
}
function frame(now){draw(now);if(G.on)G.raf=requestAnimationFrame(frame);}
function start(){if(G.on||!G.cv)return;if(G.rm){draw(performance.now());return;}G.on=true;G.raf=requestAnimationFrame(frame);}
function stop(){G.on=false;cancelAnimationFrame(G.raf);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(G.cv)start();});

function seedAt(ev){
  const b=G.cv.getBoundingClientRect(),x=ev.clientX-b.left,y=ev.clientY-b.top;let best=null,bd=22*22;
  G.lay.seeds.forEach(s=>{const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){bd=d;best=s;}});
  return best;
}
function onClick(ev){const s=seedAt(ev);if(s&&G.onSeed)G.onSeed(s.id);}
function onMove(ev){const s=seedAt(ev),id=s?s.id:null;if(id!==G.hover){G.hover=id;G.cv.style.cursor=id?'pointer':'';if(G.rm)draw(performance.now());}}

function update(entries){G.entries=entries;layout();if(G.cv&&(G.rm||!G.on))draw(performance.now());}
function animate(type,id){
  if(G.rm||!G.cv){draw(performance.now());return;}
  const now=performance.now();
  if(type==='drop'){const s=G.lay.seeds.find(x=>x.id===id);G.anims.push({type,id,t0:now,dur:1300,li:s?s.li:-1});}
  else if(type==='bloom')G.anims.push({type,id,t0:now,dur:1800});
  else if(type==='transform'){
    const old=G.prev.get(id),f=G.lay.flowers.find(x=>x.id===id);if(!old||!f)return G.anims.push({type:'bloom',id,t0:now,dur:1800});
    const r=R(hash(id)),hx=f.x,hy=f.base-f.h,parts=[];
    for(let i=0;i<46;i++){const an=r()*Math.PI*2,rr=r()*f.r*1.1;
      parts.push({x0:old.x+(r()-.5)*8,y0:old.y+(r()-.5)*8,cx:(old.x+hx)/2+(r()-.5)*90,cy:Math.min(old.y,hy)-20-r()*70,tx:hx+Math.cos(an)*rr,ty:hy+Math.sin(an)*rr,d:r()*.16,r:1.1+r()*1.4});}
    G.anims.push({type,id,t0:now,dur:3000,sx:old.x,sy:old.y,parts});
  }
  start();
}
root.Garden={mount,unmount,update,animate,resize};
})(window);

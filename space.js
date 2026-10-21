'use strict';
/* 缓缓 · 空间（Canvas 2D）
   - 一团有重量、边缘柔和的“种子 / 光体”：按住、移动、松开都会得到连续、平滑、带余韵的回应。
     按住时长只用来模拟“触碰”，不声称测到了压力；动作的快慢不会被判成功或失败，也不用来猜情绪。
   - 留下的记忆以小生命形态落在地面上；所有情绪（包括未命名）都是完整的形态，陪伴过的只多一点光。
   参数是设计起点，不是有效剂量。 */
(function(root){
const {EMO,UNNAMED,hash}=root.HH;
const N=72,TAU=Math.PI*2;
const mqD=matchMedia('(prefers-color-scheme: dark)'),mqR=matchMedia('(prefers-reduced-motion: reduce)');
const S={on:false,raf:0,abort:null,sec:null,cv:null,c:null,hit:null,copy:null,W:0,H:0,dpr:1,ground:0,bg:null,grain:null,
  dark:mqD.matches,rm:mqR.matches,cb:{},mems:[],memMap:new Map(),hover:null,anims:[],ripples:[],last:0,t:0,
  o:{cx:0,cy:0,R:80,ox:0,oy:0,vx:0,vy:0,press:0,warm:0,appr:0,focus:false,hold:false,holdStart:0,holdTotal:0,kb:false,
     p:new Float32Array(N),pv:new Float32Array(N),ptr:{x:0,y:0,sx:0,sy:0,vx:0,vy:0,inside:false,init:false},trail:[]}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const k=(dt,tau)=>1-Math.exp(-dt/tau);
function rgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function rgba(h,a){const[r,g,b]=rgb(h);return`rgba(${r},${g},${b},${a})`;}
function mixHex(a,b,t){const x=rgb(a),y=rgb(b);return'#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function R(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const pal=()=>S.dark?{sky:['#141219','#1c1922','#252029'],hills:['rgba(125,108,150,.20)','rgba(110,135,112,.14)','rgba(95,82,115,.22)'],ground:['#2a2430','#1e1a22'],haze:'rgba(190,170,215,.07)',grass:'#5f7862',
  body:'#6f6189',hi:'#ab9bc6',edge:'#463b58',core:'#ecd79f',sage:'#9fbf9f',shadow:'rgba(0,0,0,.45)',seam:'rgba(255,255,255,.18)',mote:'#e9dcf7',stem:'#7f9a80',leaf:'#6f8f72'}
  :{sky:['#f7f4f9','#f0ebf4','#ece5ea'],hills:['rgba(172,152,198,.16)','rgba(146,172,146,.13)','rgba(160,140,182,.14)'],ground:['#e8e0d5','#ddd2c5'],haze:'rgba(250,248,252,.75)',grass:'#9fb49a',
  body:'#d6cbe4',hi:'#f8f5fb',edge:'#ad9cc6',core:'#efdcab',sage:'#b4cbad',shadow:'rgba(90,70,110,.22)',seam:'rgba(255,255,255,.55)',mote:'#b9a5cf',stem:'#8aa186',leaf:'#a3b99d'};

/* ---------- 挂载 / 卸载：所有监听都挂在 AbortController 上，卸载时一并移除 ---------- */
function mount(opt){
  unmount();
  S.sec=opt.section;S.cv=opt.canvas;S.c=S.cv.getContext('2d');S.hit=opt.hit;S.copy=opt.copy||null;S.cb=opt;
  S.abort=new AbortController();const sig={signal:S.abort.signal};
  const ro=window.ResizeObserver?new ResizeObserver(()=>resize()):null;if(ro){ro.observe(S.sec);S.abort.signal.addEventListener('abort',()=>ro.disconnect());}
  window.addEventListener('resize',resize,sig);
  // 物体：pointer capture 保证按住后移出区域也能持续、松开时一定能收到
  S.hit.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();try{S.hit.setPointerCapture(e.pointerId);}catch(_){}ptrAt(e,true);startHold(false);},sig);
  S.hit.addEventListener('pointermove',e=>{if(S.o.hold&&!S.o.kb)ptrAt(e);},sig);
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>S.hit.addEventListener(t,()=>{if(!S.o.kb)endHold();},sig));
  S.hit.addEventListener('focus',()=>{S.o.focus=true;kick();},sig);
  S.hit.addEventListener('blur',()=>{S.o.focus=false;if(S.o.kb)endHold();kick();},sig);
  S.hit.addEventListener('keydown',e=>{
    if((e.key===' '||e.key==='Enter')){e.preventDefault();if(!e.repeat&&!S.o.hold){const o=S.o;o.ptr.x=o.ptr.sx=o.cx;o.ptr.y=o.ptr.sy=o.cy;o.ptr.init=true;startHold(true);}return;}
    if(S.o.hold&&S.o.kb&&e.key.startsWith('Arrow')){e.preventDefault();const d=16,p=S.o.ptr;if(e.key==='ArrowLeft')p.x-=d;if(e.key==='ArrowRight')p.x+=d;if(e.key==='ArrowUp')p.y-=d;if(e.key==='ArrowDown')p.y+=d;p.x=clamp(p.x,S.o.cx-S.o.R*1.6,S.o.cx+S.o.R*1.6);p.y=clamp(p.y,S.o.cy-S.o.R*1.6,S.o.cy+S.o.R*1.2);kick();}
  },sig);
  S.hit.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&S.o.kb){e.preventDefault();endHold();}},sig);
  // 空间：只用来感知“靠近”和点选记忆；不阻止页面滚动
  S.sec.addEventListener('pointermove',e=>{if(!S.o.hold)ptrAt(e);S.o.ptr.inside=true;hoverMem(e);},Object.assign({passive:true},sig));
  S.sec.addEventListener('pointerleave',()=>{S.o.ptr.inside=false;S.hover=null;S.cv.style.cursor='';kick();},sig);
  S.cv.addEventListener('click',e=>{const m=memAt(e);if(m&&S.cb.onMemory)S.cb.onMemory(m.id);},sig);
  window.addEventListener('blur',()=>endHold(),sig);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){endHold();stopLoop();}else start();},sig);
  const onD=e=>{S.dark=e.matches;buildBg();kick();},onR=e=>{S.rm=e.matches;stopLoop();start();};
  mqD.addEventListener('change',onD,sig);mqR.addEventListener('change',onR,sig);
  S.W=0;resize();start();
}
function unmount(){
  if(S.abort)S.abort.abort();S.abort=null;stopLoop();
  if(S.o.hold){S.o.hold=false;S.o.press=0;}
  S.sec=S.cv=S.c=S.hit=S.copy=null;S.anims=[];S.ripples=[];S.o.trail=[];
}

function resize(){
  if(!S.sec)return;
  const w=Math.round(S.sec.clientWidth),h=Math.round(S.sec.clientHeight);if(!w||!h)return;
  const changed=w!==S.W||h!==S.H;
  S.W=w;S.H=h;S.dpr=Math.min(2,window.devicePixelRatio||1);
  if(changed){S.cv.width=Math.round(w*S.dpr);S.cv.height=Math.round(h*S.dpr);}
  const sb=S.sec.getBoundingClientRect(),hb=S.hit.getBoundingClientRect(),o=S.o;
  o.cx=hb.left-sb.left+hb.width/2;o.R=Math.max(54,hb.width*.34);o.cy=hb.top-sb.top+hb.height/2+o.R*.08;
  S.ground=Math.min(h-40,o.cy+o.R*.86);
  S.freeX=0;
  if(S.copy){const cb=S.copy.getBoundingClientRect();if(cb.bottom-sb.top>S.ground+10&&cb.right-sb.left<w*.7)S.freeX=cb.right-sb.left+12;}
  if(changed||!S.bg)buildBg();
  layoutMems();kick();
}

/* ---------- 背景：雾、远山、地面与颗粒，离屏绘制一次 ---------- */
function buildBg(){
  if(!S.W)return;const P=pal(),W=S.W,H=S.H,g=S.ground,o=document.createElement('canvas');
  o.width=Math.round(W*S.dpr);o.height=Math.round(H*S.dpr);const c=o.getContext('2d');c.scale(S.dpr,S.dpr);const r=R(17);
  const sky=c.createLinearGradient(0,0,0,g);sky.addColorStop(0,P.sky[0]);sky.addColorStop(.6,P.sky[1]);sky.addColorStop(1,P.sky[2]);c.fillStyle=sky;c.fillRect(0,0,W,g+2);
  // 三层远山，越近越低、越实
  P.hills.forEach((col,i)=>{
    const base=g-(46-i*14),amp=10+i*4,f1=.004+i*.0016,ph=r()*6;const hg=c.createLinearGradient(0,base-amp*1.4,0,g);hg.addColorStop(0,col);hg.addColorStop(1,col.replace(/[\d.]+\)$/,'0)'));c.fillStyle=hg;c.beginPath();c.moveTo(0,g+2);
    for(let x=0;x<=W;x+=6)c.lineTo(x,base-Math.sin(x*f1+ph)*amp-Math.sin(x*f1*2.7+ph*1.7)*amp*.35);
    c.lineTo(W,g+2);c.fill();
  });
  // 地面
  const gr=c.createLinearGradient(0,g,0,H);gr.addColorStop(0,P.ground[0]);gr.addColorStop(1,P.ground[1]);c.fillStyle=gr;c.fillRect(0,g,W,H-g);
  const hz=c.createLinearGradient(0,g-50,0,g+40);const hz0=P.haze.replace(/[\d.]+\)$/,'0)');hz.addColorStop(0,hz0);hz.addColorStop(.55,P.haze);hz.addColorStop(1,hz0);c.fillStyle=hz;c.fillRect(0,g-50,W,90);
  // 颗粒：地面更密，天空极淡
  for(let i=0;i<W*H/90;i++){const x=r()*W,y=g+r()*(H-g),a=.03+r()*.05;c.fillStyle=S.dark?`rgba(255,240,225,${a*.6})`:`rgba(90,64,48,${a})`;c.fillRect(x,y,1,1);}
  for(let i=0;i<W*g/700;i++){c.fillStyle=S.dark?'rgba(255,255,255,.035)':'rgba(120,100,140,.035)';c.fillRect(r()*W,r()*g,1,1);}
  // 地平线上稀疏的草
  c.strokeStyle=P.grass;c.lineCap='round';
  for(let x=10+r()*40;x<W;x+=46+r()*110){const n=3+Math.floor(r()*4);for(let j=0;j<n;j++){const hh=4+r()*9,xx=x+j*2.6+(r()-.5)*2;c.globalAlpha=.25+r()*.3;c.lineWidth=1;c.beginPath();c.moveTo(xx,g+1);c.quadraticCurveTo(xx+(r()-.5)*3,g-hh*.6,xx+(r()-.5)*5,g-hh);c.stroke();}}
  c.globalAlpha=1;S.bg=o;
  // 物体表面的颗粒纹理
  const gn=document.createElement('canvas');gn.width=gn.height=128;const gc=gn.getContext('2d');
  for(let i=0;i<2600;i++){gc.fillStyle=`rgba(${r()<.5?255:60},${r()<.5?250:50},${r()<.5?255:80},${.05+r()*.08})`;gc.fillRect(r()*128,r()*128,1,1);}
  S.grain=S.c.createPattern(gn,'repeat');
}

/* ---------- 记忆形态 ---------- */
function setMemories(entries,opt={}){
  S.memSrc=entries;S.accompanied=opt.accompanied||new Set();S.maxMem=opt.max||12;layoutMems();kick();
}
function layoutMems(){
  if(!S.W||!S.memSrc)return;
  const narrow=S.W<760,list=S.memSrc.slice().sort((a,b)=>a.ts-b.ts).slice(-(narrow?Math.min(S.maxMem,12):S.maxMem)),x0=Math.max(S.freeX,14),x1=S.W-14,top0=narrow?112:8,band=S.H-S.ground-top0-(narrow?58:30);
  S.mems=list.map(e=>{
    const f=e.form||{x:.5,depth:.5,seed:hash(e.id)},em=EMO[e.emotion]||UNNAMED,s=(S.o.R/72)*(.8+f.depth*.6);
    let x=x0+f.x*(x1-x0);
    if(Math.abs(x-S.o.cx)<S.o.R*1.15&&f.depth<.55)x+=(x<S.o.cx?-1:1)*S.o.R*1.2; // 不挡在物体正前方
    return{id:e.id,x:clamp(x,x0,x1),y:S.ground+top0+f.depth*Math.max(10,band),s,col:em.c,colD:em.d,kind:e.kind,named:!!EMO[e.emotion],acc:S.accompanied.has(e.id),seed:f.seed,h:(34+(f.seed%22))*s,ph:(f.seed>>>7)%628/100};
  }).sort((a,b)=>a.y-b.y);
  S.memMap=new Map(S.mems.map(m=>[m.id,m]));
}
function crown(m,t){const sway=S.rm?0:Math.sin(t*.6+m.ph)*1.6*m.s;return{x:m.x+sway+(m.ph-3)*.8,y:m.y-m.h};}
function drawMem(c,m,t,grow=1,hl=false){
  const P=pal(),g=clamp(grow,0,1);if(g<=0)return;const cr=crown(m,t),h=m.h*g,tx=m.x+(cr.x-m.x)*g,ty=m.y-h;
  c.save();
  c.fillStyle=P.shadow;c.globalAlpha=.5;c.beginPath();c.ellipse(m.x,m.y+1,7*m.s,2.2*m.s,0,0,TAU);c.fill();c.globalAlpha=1;
  // 半埋在土里的种子
  c.fillStyle=rgba(m.colD,S.dark?.55:.4);c.beginPath();c.ellipse(m.x,m.y,4.6*m.s,2.6*m.s,0,Math.PI,TAU);c.fill();
  // 茎与叶
  c.strokeStyle=P.stem;c.lineWidth=1.3*m.s;c.lineCap='round';c.beginPath();c.moveTo(m.x,m.y-1);c.quadraticCurveTo(m.x+(m.ph-3)*2.4*m.s,m.y-h*.55,tx,ty);c.stroke();
  if(g>.4){const ly=m.y-h*.38,dir=m.ph>3?1:-1;c.fillStyle=P.leaf;c.save();c.translate(m.x+(m.ph-3)*1.1*m.s,ly);c.rotate(dir*-.7);c.beginPath();c.ellipse(dir*5*m.s,0,5.5*m.s*g,1.9*m.s*g,0,0,TAU);c.fill();c.restore();
    if(m.acc){c.save();c.translate(m.x+(m.ph-3)*1.6*m.s,m.y-h*.6);c.rotate(dir*.8);c.beginPath();c.ellipse(-dir*4.5*m.s,0,4.6*m.s*g,1.6*m.s*g,0,0,TAU);c.fill();c.restore();}}
  // 顶部：灯笼一样的花苞（文字）或透明的水滴（无言）
  const r=9*m.s*clamp((g-.3)/.7,0,1);
  if(r>.3){
    if(m.acc||hl){const a=c.createRadialGradient(tx,ty,0,tx,ty,r*3.4);a.addColorStop(0,rgba(P.core,hl?.55:.42));a.addColorStop(1,rgba(P.core,0));c.fillStyle=a;c.beginPath();c.arc(tx,ty,r*3.4,0,TAU);c.fill();}
    if(m.kind==='wordless'){
      const gg=c.createRadialGradient(tx-r*.3,ty-r*.4,r*.1,tx,ty,r*1.05);gg.addColorStop(0,'rgba(255,255,255,.85)');gg.addColorStop(.6,rgba(m.col,.55));gg.addColorStop(1,rgba(m.colD,.35));
      c.fillStyle=gg;c.beginPath();c.arc(tx,ty-r*.2,r*.95,0,TAU);c.fill();c.strokeStyle=rgba('#ffffff',.5);c.lineWidth=.8;c.stroke();
    }else{
      c.fillStyle=P.leaf;[-1,1].forEach(d=>{c.save();c.translate(tx,ty+r*.55);c.rotate(d*.55);c.beginPath();c.ellipse(d*r*.42,-r*.15,r*.5,r*.22,0,0,TAU);c.fill();c.restore();});
      const gg=c.createLinearGradient(tx,ty-r*1.3,tx,ty+r*.6);gg.addColorStop(0,mixHex(m.col,'#ffffff',.55));gg.addColorStop(1,m.col);
      c.fillStyle=gg;c.beginPath();c.moveTo(tx,ty-r*1.35);c.bezierCurveTo(tx+r*1.05,ty-r*.6,tx+r*.85,ty+r*.55,tx,ty+r*.6);c.bezierCurveTo(tx-r*.85,ty+r*.55,tx-r*1.05,ty-r*.6,tx,ty-r*1.35);c.fill();
      c.strokeStyle=rgba(m.colD,.35);c.lineWidth=.7;c.beginPath();c.moveTo(tx,ty-r*1.1);c.quadraticCurveTo(tx+r*.15,ty-r*.3,tx,ty+r*.5);c.stroke();
    }
  }
  c.restore();
}
function memAt(e){
  if(!S.cv)return null;const b=S.cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;let best=null,bd=1e9;
  S.mems.forEach(m=>{const cr=crown(m,S.t);[[cr.x,cr.y],[m.x,m.y-m.h*.5],[m.x,m.y]].forEach(([px,py])=>{const d=(px-x)**2+(py-y)**2;if(d<bd){bd=d;best=m;}});});
  return best&&bd<(16*best.s)**2?best:null;
}
function hoverMem(e){const m=memAt(e),id=m?m.id:null;if(id!==S.hover){S.hover=id;S.cv.style.cursor=id?'pointer':'';kick();}}

/* ---------- 物体 ---------- */
function ptrAt(e,force){
  const b=S.sec.getBoundingClientRect(),p=S.o.ptr;p.x=e.clientX-b.left;p.y=e.clientY-b.top;
  if(!p.init||force&&!S.o.hold){if(!p.init){p.sx=p.x;p.sy=p.y;}p.init=true;}kick();
}
function startHold(kb){
  const o=S.o;if(o.hold)return;o.hold=true;o.kb=kb;o.holdStart=performance.now();
  if(S.rm){o.press=1;o.warm=.8;}
  if(S.cb.onInteract)S.cb.onInteract({type:'start',keyboard:kb});kick();
}
function endHold(){
  const o=S.o;if(!o.hold)return;o.hold=false;o.kb=false;
  const ms=performance.now()-o.holdStart;o.holdTotal+=ms;
  if(S.rm){o.press=0;o.warm=.35;}
  else S.ripples.push({x:o.cx+o.ox,y:o.cy+o.oy,t0:performance.now(),r:o.R});
  if(S.cb.onInteract)S.cb.onInteract({type:'end',ms,totalMs:o.holdTotal});kick();
}
function takeHoldTotal(){const t=S.o.holdTotal;S.o.holdTotal=0;return t;}

function stepObject(dt,now){
  const o=S.o,p=o.ptr;
  // 指针平滑：位置约 0.12 s，速度约 0.2 s
  const px=p.sx,py=p.sy;p.sx+=(p.x-p.sx)*k(dt,.12);p.sy+=(p.y-p.sy)*k(dt,.12);
  const ivx=(p.sx-px)/Math.max(dt,1e-3),ivy=(p.sy-py)/Math.max(dt,1e-3);p.vx+=(ivx-p.vx)*k(dt,.2);p.vy+=(ivy-p.vy)*k(dt,.2);
  const dx=p.sx-o.cx,dy=p.sy-o.cy,dist=Math.hypot(dx,dy);
  const apprT=o.hold||o.focus?1:p.inside&&p.init?clamp(1-(dist-o.R)/(o.R*1.6),0,1):0;
  o.appr+=(apprT-o.appr)*k(dt,.25);
  o.press+=((o.hold?1:0)-o.press)*k(dt,o.hold?.1:.5);
  o.warm=o.hold?o.warm+(1-o.warm)*k(dt,2.6):o.warm*Math.exp(-dt/1.6);
  // 物体中心被轻轻牵引（弹簧，约 0.8 s 回稳），最多偏离半径的 40%
  let tx=0,ty=0;if(o.hold){const m=o.R*.45,f=.45;tx=clamp(dx*f,-m,m);ty=clamp(dy*f,-m*.8,m*.5);}
  o.vx+=((tx-o.ox)*42-o.vx*8.5)*dt;o.vy+=((ty-o.oy)*42-o.vy*8.5)*dt;o.ox+=o.vx*dt;o.oy+=o.vy*dt;
  const speed=Math.hypot(p.vx,p.vy),sN=o.hold?clamp(speed/900,0,1):0,vdir=Math.atan2(p.vy,p.vx),pdir=Math.atan2(dy,dx),t=now/1000;
  for(let i=0;i<N;i++){
    const th=i/N*TAU,c=Math.cos(th),s=Math.sin(th);
    let tgt=S.rm?0:.013*Math.sin(t*.7+th*2+1.3)+.009*Math.sin(t*.43-th*3);
    tgt+=o.press*(.07*c*c-.1*Math.pow(Math.max(0,-s),1.5));
    tgt+=sN*(.16*Math.pow(Math.max(0,Math.cos(th-vdir)),2)-.04);
    tgt+=.035*o.appr*Math.pow(Math.max(0,Math.cos(th-pdir)),3);
    o.pv[i]+=((tgt-o.p[i])*60-o.pv[i]*9)*dt;o.p[i]+=o.pv[i]*dt;
  }
  if(o.hold&&!S.rm&&speed>25){o.trail.push({x:p.sx,y:p.sy,t:now});}
  while(o.trail.length&&now-o.trail[0].t>1400)o.trail.shift();
  if(S.cb.onTexture)S.cb.onTexture(o.press*.6+o.warm*.4,sN);
}
function objPath(c,o,breath,scale=1){
  const cx=o.cx+o.ox,cy=o.cy+o.oy,pts=[];
  for(let j=0;j<N;j++){
    const th=j/N*TAU,s=Math.sin(th);let r=o.R*breath*scale*(1+o.p[j]);
    r*=s<0?1+.17*Math.pow(-s,2.4):1-.08*Math.pow(s,4); // 上端收成种子的尖，底部略平，坐在地上
    pts.push(cx+Math.cos(th)*r*.93,cy+s*r);
  }
  const mx=i=>(pts[2*(i%N)]+pts[2*((i+1)%N)])/2,my=i=>(pts[2*(i%N)+1]+pts[2*((i+1)%N)+1])/2;
  c.beginPath();c.moveTo(mx(N-1),my(N-1));
  for(let j=0;j<N;j++)c.quadraticCurveTo(pts[2*j],pts[2*j+1],mx(j),my(j));
  c.closePath();
  return pts;
}
function drawObject(c,now){
  const o=S.o,P=pal(),t=now/1000,breath=S.rm?1:1+.016*Math.sin(t*TAU/7),cx=o.cx+o.ox,cy=o.cy+o.oy,R0=o.R;
  // 光晕：按住越久，扩散越远
  const ar=R0*(1.55+.95*o.warm+.25*o.appr),aa=.16+.4*o.warm+.1*o.appr;
  const au=c.createRadialGradient(cx,cy,R0*.4,cx,cy,ar);au.addColorStop(0,rgba(P.core,aa));au.addColorStop(.55,rgba(P.body,aa*.5));au.addColorStop(1,rgba(P.body,0));
  c.fillStyle=au;c.beginPath();c.arc(cx,cy,ar,0,TAU);c.fill();
  // 轨迹的余韵
  o.trail.forEach(q=>{const age=(now-q.t)/1400,rr=R0*.16*(1-age);if(rr<=0)return;const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,rr*2.2);g.addColorStop(0,rgba(P.core,.34*(1-age)));g.addColorStop(1,rgba(P.core,0));c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,rr*2.2,0,TAU);c.fill();});
  // 接触阴影
  const lift=clamp(-o.oy/R0,-.3,.5);c.fillStyle=P.shadow;c.globalAlpha=.9-lift*.6;c.beginPath();c.ellipse(o.cx+o.ox*.6,S.ground+2,R0*(.92-lift*.25),R0*.16,0,0,TAU);c.fill();c.globalAlpha=1;
  // 外层半透明的膜：让边缘柔和
  objPath(c,o,breath,1.07+.03*o.warm);c.fillStyle=rgba(P.body,S.dark?.22:.3);c.fill();
  // 身体
  const pts=objPath(c,o,breath);
  const body=c.createRadialGradient(cx-R0*.32,cy-R0*.45,R0*.08,cx,cy,R0*1.12);
  body.addColorStop(0,P.hi);body.addColorStop(.45,P.body);body.addColorStop(1,P.edge);c.fillStyle=body;c.fill();
  c.save();objPath(c,o,breath);c.clip();
  // 内核的光：随按住与温度变亮
  const ky=cy+R0*.12,core=c.createRadialGradient(cx+o.ox*.2,ky,0,cx,ky,R0*(.75+.25*o.warm));
  core.addColorStop(0,rgba(P.core,.5+.4*o.warm+.1*o.press));core.addColorStop(.5,rgba(P.sage,.18+.18*o.warm));core.addColorStop(1,rgba(P.sage,0));
  c.fillStyle=core;c.fillRect(cx-R0*1.5,cy-R0*1.5,R0*3,R0*3);
  // 细小的脉络
  c.strokeStyle=S.dark?'rgba(255,255,255,.07)':'rgba(140,118,170,.16)';c.lineWidth=1;
  [[-.5,.2],[.45,.35]].forEach(([dx,dy])=>{c.beginPath();c.moveTo(cx+dx*R0,cy+dy*R0-R0*.25);c.quadraticCurveTo(cx+dx*R0*.75,cy+dy*R0,cx+dx*R0*.55,cy+dy*R0+R0*.3);c.stroke();});
  // 种子的缝线与颗粒质感
  c.strokeStyle=P.seam;c.lineWidth=1.3;c.beginPath();c.moveTo(cx-R0*.06,cy-R0*1.02);c.bezierCurveTo(cx+R0*.2,cy-R0*.4,cx-R0*.16,cy+R0*.3,cx+R0*.04,cy+R0*.92);c.stroke();
  if(S.grain){c.globalAlpha=S.dark?.5:.65;c.fillStyle=S.grain;c.fillRect(cx-R0*1.5,cy-R0*1.5,R0*3,R0*3);c.globalAlpha=1;}
  // 底部的反光
  const bl=c.createLinearGradient(0,cy+R0*.4,0,cy+R0*1.05);bl.addColorStop(0,'rgba(0,0,0,0)');bl.addColorStop(1,S.dark?'rgba(0,0,0,.25)':'rgba(120,100,150,.16)');c.fillStyle=bl;c.fillRect(cx-R0*1.5,cy,R0*3,R0*1.5);
  c.restore();
  // 边缘的柔光
  objPath(c,o,breath);c.strokeStyle=rgba('#ffffff',S.dark?.12+.2*o.appr:.35+.3*o.appr);c.lineWidth=1.2;c.stroke();
  // 顶端的一点新芽：随按住变亮，轻轻摇
  const tip=Math.round(N*.75),tx=pts[2*tip],ty=pts[2*tip+1],sw=S.rm?0:Math.sin(t*.9)*.08,lv=1+.25*o.warm;
  c.save();c.translate(tx,ty+1);c.rotate(sw+o.vx*.0006);c.strokeStyle=P.stem;c.lineWidth=1.6;c.lineCap='round';
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-2,-R0*.12,R0*.03,-R0*.2);c.stroke();
  c.fillStyle=mixHex(P.leaf,P.core,.25*o.warm);
  c.save();c.translate(R0*.02,-R0*.17);c.rotate(-.7);c.beginPath();c.ellipse(-R0*.07*lv,0,R0*.075*lv,R0*.03*lv,0,0,TAU);c.fill();c.restore();
  c.save();c.translate(R0*.025,-R0*.19);c.rotate(.55);c.beginPath();c.ellipse(R0*.06*lv,0,R0*.065*lv,R0*.026*lv,0,0,TAU);c.fill();c.restore();
  c.restore();
}

/* ---------- 动画：文字或这一刻收拢成形，落进空间 ---------- */
function spawn(id,from){
  layoutMems();const m=S.memMap.get(id);if(!m)return;
  if(S.rm||!S.on){kick();return;}
  let fx,fy;const sb=S.sec.getBoundingClientRect();
  if(from==='object'){fx=S.o.cx;fy=S.o.cy-S.o.R*.2;}else if(from&&from.getBoundingClientRect){const r=from.getBoundingClientRect();fx=r.left-sb.left+r.width/2;fy=r.top-sb.top+r.height/2;}else{fx=S.W/2;fy=S.H*.3;}
  const r=R(m.seed),parts=[];for(let i=0;i<26;i++)parts.push({dx:(r()-.5)*60,dy:(r()-.5)*36,d:r()*.25,s:.6+r()});
  S.anims.push({id,t0:performance.now(),dur:2200,fx,fy,parts});kick();
}
function drawAnims(c,now){
  const P=pal(),t=now/1000;
  S.anims=S.anims.filter(a=>{
    const p=Math.max(0,(now-a.t0)/a.dur);if(p>=1)return false;const m=S.memMap.get(a.id);if(!m)return false;const cr=crown(m,t);
    a.parts.forEach(q=>{const k2=clamp((p-q.d)/.6,0,1),e=1-Math.pow(1-k2,3);if(k2<=0)return;
      const sx=a.fx+q.dx*(1-e*.2),sy=a.fy+q.dy*(1-e*.2),cxp=(sx+cr.x)/2,cyp=Math.min(sy,cr.y)-40;
      const x=(1-e)*(1-e)*sx+2*(1-e)*e*cxp+e*e*cr.x,y=(1-e)*(1-e)*sy+2*(1-e)*e*cyp+e*e*cr.y;
      c.fillStyle=rgba(P.core,.75*(1-clamp((p-.7)/.3,0,1)));c.beginPath();c.arc(x,y,1.4*q.s,0,TAU);c.fill();});
    drawMem(c,m,t,clamp((p-.5)/.5,0,1));
    return true;});
}

/* ---------- 主循环 ---------- */
function draw(now){
  if(!S.c||!S.W)return;const c=S.c,t=now/1000;S.t=t;
  c.setTransform(S.dpr,0,0,S.dpr,0,0);c.clearRect(0,0,S.W,S.H);
  if(S.bg)c.drawImage(S.bg,0,0,S.W,S.H);
  const hidden=new Set(S.anims.map(a=>a.id));
  S.mems.forEach(m=>{if(!hidden.has(m.id))drawMem(c,m,t,1,S.hover===m.id);});
  S.ripples=S.ripples.filter(rp=>{const p=Math.max(0,(now-rp.t0)/1300);if(p>=1)return false;c.strokeStyle=rgba(pal().core,.35*(1-p));c.lineWidth=1.2;c.beginPath();c.ellipse(rp.x,S.ground+2,rp.r*(1+p*1.4),rp.r*.22*(1+p*1.4),0,0,TAU);c.stroke();return true;});
  drawObject(c,now);
  drawAnims(c,now);
}
function frame(){
  if(!S.on)return;
  const now=performance.now(); // 与动画的起点使用同一个时钟
  const dt=clamp((now-(S.last||now))/1000,0,.05);S.last=now;
  stepObject(dt,now);draw(now);S.raf=requestAnimationFrame(frame);
}
function start(){if(!S.cv)return;if(document.hidden||S.rm){S.o.p.fill(0);draw(performance.now());return;}if(S.on)return;S.on=true;S.last=0;S.raf=requestAnimationFrame(frame);}
function stopLoop(){S.on=false;cancelAnimationFrame(S.raf);}
/* 减少动态：不跑循环，只在事件发生时画一帧静态形态 */
function kick(){if(S.rm&&S.cv){const o=S.o;o.appr=o.hold||o.focus?1:0;o.p.fill(0);if(o.hold){for(let i=0;i<N;i++){const th=i/N*TAU,c=Math.cos(th),s=Math.sin(th);o.p[i]=.045*c*c-.07*Math.pow(Math.max(0,-s),1.5);}}draw(performance.now());}}

root.Space={mount,unmount,setMemories,spawn,takeHoldTotal,get holding(){return S.o.hold;},get running(){return S.on;},get listening(){return !!S.abort;},get debug(){return{mems:S.mems.map(m=>[Math.round(m.x),Math.round(m.y),+m.s.toFixed(2)]),src:S.memSrc&&S.memSrc.length,W:S.W,H:S.H,ground:Math.round(S.ground),freeX:Math.round(S.freeX),anims:S.anims.length,on:S.on};}};
})(window);

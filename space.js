'use strict';
/* 生息 SHENGXI · 主交互形体 Breath Orb（Canvas 2D）
   几层半透明、无脸的有机形体叠在一起：sage 背层、杏色小层、lilac 主体、内里的光。
   - 靠近 / 聚焦：边缘朝指针微微隆起，细线变亮（约 0.25 s）。
   - 按下：接触点出现涟漪，主体被轻轻压扁；按住时几层慢慢分开、像在一起呼吸。
   - 按住移动：形体被牵引、拉长；各层的弹簧滞后不同，产生一点 2.5D 层次；留下渐隐的光迹。
   - 松开 / 取消：一圈涟漪后约 1 s 回到稳定形态。
   按住时长只是“停留了多久”，不是压力测量；动作快慢不判对错，也不用来推测情绪。
   reduced motion：不跑动画循环，只在事件发生时画静态的状态。 */
(function(root){
const TAU=Math.PI*2,N=64;
const mqR=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const k=(dt,tau)=>1-Math.exp(-dt/tau);
function rgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function rgba(h,a){const[r,g,b]=rgb(h);return`rgba(${r},${g},${b},${a})`;}
function R(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

/* 层：off 相对半径的位置；r 相对半径；lag 弹簧的松弛度（越大越慢）；amp 待机时的形变幅度 */
const LAYERS=[
  {key:'sage', off:[.16,0],   r:.98,sx:1.1, sy:.9, base:[.07,.6,.04,2.1],lag:1.7,amp:.035,spread:[.12,.03]},
  {key:'peach',off:[-.46,-.24],r:.56,sx:1.05,sy:.95,base:[.06,1.9,.03,.4],lag:2.3,amp:.05, spread:[-.16,-.08]},
  {key:'body', off:[-.06,.1], r:.78,sx:1.14,sy:.86,base:[.05,2.6,.03,1.2],lag:1, amp:.024,spread:[0,0]},
  {key:'inner',off:[.14,-.06],r:.5, sx:1.12,sy:.82,base:[.06,.2,.03,2.8],lag:.8, amp:.04, spread:[.06,-.07]}
];
const S={on:false,raf:0,abort:null,sec:null,cv:null,c:null,hit:null,W:0,H:0,dpr:1,grain:null,io:null,visible:true,
  rm:mqR.matches,cb:{},last:0,ripples:[],pulses:[],trail:[],
  o:{cx:0,cy:0,R:90,ox:0,oy:0,vx:0,vy:0,press:0,warm:0,appr:0,focus:false,hold:false,kb:false,holdStart:0,holdTotal:0,
     ptr:{x:0,y:0,sx:0,sy:0,vx:0,vy:0,inside:false,init:false}},
  L:LAYERS.map((l,i)=>Object.assign({},l,{p:new Float32Array(N),pv:new Float32Array(N),ox:0,oy:0,vx:0,vy:0,ph:[i*1.7,i*2.3+1,i*.9+2]}))};
/* 哑光、颜料感：每一层内部有多个色相的过渡；没有白色高光边、没有镜面反射 */
const pal=()=>({sage:['#e3ecd8','#b8cfae','#ece2c2'],peach:['#fbe5cf','#efbf9c','#e7c4d3'],body:['#faf4ec','#e4d9f3','#cdc1e8','#dfe3f0'],inner:'#fbf3e6',
  glow:'#d4c8ec',warmGlow:'#f3d6b6',line:'rgba(214,184,130,.62)',bead:['#c9dcc2','#96b493'],shadow:'rgba(96,78,130,.18)',speck:['#efc39d','#bdaedf']});
/* 颜料肌理：生产素材 pigment.webp，作为 Canvas pattern，只落在形体上 */
const PIG=new Image();PIG.decoding='async';PIG.onload=()=>{S.patch=null;kick();};PIG.src='assets/textures/pigment.webp';
/* 每帧重新采样大纹理很慢：按形体尺寸预先渲染一块肌理，之后每帧只 drawImage 一次 */
function pigmentPatch(R){
  if(!(PIG.complete&&PIG.naturalWidth))return null;
  const key=Math.round(R)+'@'+S.dpr;if(S.patch&&S.patchKey===key)return S.patch;
  const w=Math.ceil(R*3.6*S.dpr),h=Math.ceil(R*3.2*S.dpr),cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d'),pat=g.createPattern(PIG,'repeat');if(pat.setTransform)pat.setTransform(new DOMMatrix().scale(.42*S.dpr));
  g.fillStyle=pat;g.fillRect(0,0,w,h);S.patch=cv;S.patchKey=key;return cv;
}

/* ---------- 挂载 / 卸载 ---------- */
function mount(opt){
  unmount();
  S.sec=opt.section;S.cv=opt.canvas;S.c=S.cv.getContext('2d');S.hit=opt.hit;S.cb=opt;
  S.abort=new AbortController();const sig={signal:S.abort.signal};
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>resize());ro.observe(S.sec);S.abort.signal.addEventListener('abort',()=>ro.disconnect());}
  if(window.IntersectionObserver){S.io=new IntersectionObserver(es=>{S.visible=es[0].isIntersecting;if(S.visible)start();else stopLoop();});S.io.observe(S.sec);S.abort.signal.addEventListener('abort',()=>{S.io.disconnect();S.io=null;});}
  window.addEventListener('resize',resize,sig);
  const h=S.hit;
  // pointer capture：按住后即使移出形体，也能持续跟随，并一定能收到松开
  h.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();try{h.setPointerCapture(e.pointerId);}catch(_){}ptrAt(e,true);startHold(false,e);},sig);
  h.addEventListener('pointermove',e=>{if(S.o.hold&&!S.o.kb)ptrAt(e);},sig);
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>h.addEventListener(t,()=>{if(!S.o.kb)endHold();},sig));
  h.addEventListener('contextmenu',e=>e.preventDefault(),sig);
  h.addEventListener('focus',()=>{S.o.focus=true;kick();},sig);
  h.addEventListener('blur',()=>{S.o.focus=false;if(S.o.kb)endHold();kick();},sig);
  // 键盘：按住空格 / 回车 = 按住；方向键 = 慢慢移动；松开 = 放开
  h.addEventListener('keydown',e=>{
    if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat&&!S.o.hold){const o=S.o;o.ptr.x=o.ptr.sx=o.cx;o.ptr.y=o.ptr.sy=o.cy;o.ptr.init=true;startHold(true);}return;}
    if(S.o.hold&&S.o.kb&&e.key.startsWith('Arrow')){e.preventDefault();const d=18,p=S.o.ptr,o=S.o;
      if(e.key==='ArrowLeft')p.x-=d;if(e.key==='ArrowRight')p.x+=d;if(e.key==='ArrowUp')p.y-=d;if(e.key==='ArrowDown')p.y+=d;
      p.x=clamp(p.x,o.cx-o.R*1.8,o.cx+o.R*1.8);p.y=clamp(p.y,o.cy-o.R*1.6,o.cy+o.R*1.4);kick();}
  },sig);
  h.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&S.o.kb){e.preventDefault();endHold();}},sig);
  // 空间：只感知“靠近”，不阻止滚动、不拦截写作
  S.sec.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(!S.o.hold)ptrAt(e);S.o.ptr.inside=true;},Object.assign({passive:true},sig));
  S.sec.addEventListener('pointerleave',()=>{S.o.ptr.inside=false;kick();},sig);
  window.addEventListener('blur',()=>endHold(),sig);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){endHold();stopLoop();}else start();},sig);
  const onR=e=>{S.rm=e.matches;stopLoop();start();};
  mqR.addEventListener('change',onR,sig);
  S.W=0;resize();start();
}
function unmount(){
  if(S.abort)S.abort.abort();S.abort=null;stopLoop();
  const o=S.o;o.hold=false;o.kb=false;o.press=0;o.warm=0;o.holdTotal=0;
  S.sec=S.cv=S.c=S.hit=null;S.ripples=[];S.pulses=[];S.trail=[];
}
function resize(){
  if(!S.sec)return;
  const w=Math.round(S.sec.clientWidth),h=Math.round(S.sec.clientHeight);if(!w||!h)return;
  S.dpr=Math.min(2,window.devicePixelRatio||1);
  if(w!==S.W||h!==S.H){S.W=w;S.H=h;S.cv.width=Math.round(w*S.dpr);S.cv.height=Math.round(h*S.dpr);}
  const sb=S.sec.getBoundingClientRect(),hb=S.hit.getBoundingClientRect(),o=S.o;
  o.cx=hb.left-sb.left+hb.width/2;o.cy=hb.top-sb.top+hb.height/2;o.R=Math.max(52,hb.width*.4);
  if(!o.ptr.init){o.ptr.x=o.ptr.sx=o.cx;o.ptr.y=o.ptr.sy=o.cy;}
  kick();
}
/* ---------- 指针 ---------- */
function ptrAt(e,force){
  if(!S.sec)return;const b=S.sec.getBoundingClientRect(),p=S.o.ptr;p.x=e.clientX-b.left;p.y=e.clientY-b.top;
  if(!p.init){p.sx=p.x;p.sy=p.y;p.init=true;}kick();
}
function startHold(kb,e){
  const o=S.o;if(o.hold)return;o.hold=true;o.kb=kb;o.holdStart=performance.now();
  if(!S.rm){const px=kb?o.cx:o.ptr.x,py=kb?o.cy:o.ptr.y;S.ripples.push({x:px,y:py,t0:performance.now(),dur:1300,r0:6,r1:o.R*.9,a:.7,touch:true});}
  else{o.press=1;o.warm=.8;}
  if(S.cb.onInteract)S.cb.onInteract({type:'start',keyboard:kb});kick();
}
function endHold(){
  const o=S.o;if(!o.hold)return;o.hold=false;o.kb=false;
  const ms=performance.now()-o.holdStart;o.holdTotal+=ms;
  if(S.rm){o.press=0;o.warm=.3;}
  else S.ripples.push({x:o.cx+o.ox,y:o.cy+o.oy,t0:performance.now(),dur:1500,r0:o.R*.8,r1:o.R*1.9,a:.5});
  if(S.cb.onInteract)S.cb.onInteract({type:'end',ms,totalMs:o.holdTotal});kick();
}
function takeHoldTotal(){const t=S.o.holdTotal+(S.o.hold?performance.now()-S.o.holdStart:0);S.o.holdTotal=0;if(S.o.hold)S.o.holdStart=performance.now();return t;}
function peekHoldTotal(){return S.o.holdTotal+(S.o.hold?performance.now()-S.o.holdStart:0);}
/* 保存时的“接住”：一次缓慢的光，不是奖励动画 */
function pulse(){if(S.rm||!S.on){S.o.warm=Math.max(S.o.warm,.5);kick();return;}S.pulses.push({t0:performance.now(),dur:2200});}

/* ---------- 物理 ---------- */
function step(dt,now){
  const o=S.o,p=o.ptr,t=now/1000;
  const px=p.sx,py=p.sy;p.sx+=(p.x-p.sx)*k(dt,.1);p.sy+=(p.y-p.sy)*k(dt,.1);
  const ivx=(p.sx-px)/Math.max(dt,1e-3),ivy=(p.sy-py)/Math.max(dt,1e-3);p.vx+=(ivx-p.vx)*k(dt,.18);p.vy+=(ivy-p.vy)*k(dt,.18);
  const dx=p.sx-o.cx,dy=p.sy-o.cy,dist=Math.hypot(dx,dy);
  const apprT=o.hold||o.focus?1:p.inside&&p.init?clamp(1-(dist-o.R)/(o.R*1.8),0,1):0;
  o.appr+=(apprT-o.appr)*k(dt,.22);
  o.press+=((o.hold?1:0)-o.press)*k(dt,o.hold?.09:.45);
  o.warm=o.hold?o.warm+(1-o.warm)*k(dt,2.4):o.warm*Math.exp(-dt/1.8);
  // 整体被牵引：弹簧（约 0.8 s 回稳），最多偏离半径的一半
  let tx=0,ty=0;if(o.hold){const m=o.R*.5;tx=clamp(dx*.42,-m,m);ty=clamp(dy*.42,-m*.8,m*.6);}
  o.vx+=((tx-o.ox)*40-o.vx*8.2)*dt;o.vy+=((ty-o.oy)*40-o.vy*8.2)*dt;o.ox+=o.vx*dt;o.oy+=o.vy*dt;
  const speed=Math.hypot(p.vx,p.vy),sN=o.hold?clamp(speed/1000,0,1):0,vdir=Math.atan2(p.vy,p.vx),pdir=Math.atan2(dy,dx);
  const pull=o.hold?clamp((dist-o.R*.35)/(o.R*1.2),0,1):0,inside=o.hold?clamp(1-dist/(o.R*.9),0,1):0;
  const open=o.press*.6+o.warm*.4;
  S.L.forEach((L,li)=>{
    // 每层跟随整体位移，但滞后不同 → 2.5D 层次；按住时几层轻轻分开
    const gx=o.ox+L.spread[0]*o.R*open,gy=o.oy+L.spread[1]*o.R*open,st=40/L.lag,dm=8.2/Math.sqrt(L.lag);
    L.vx+=((gx-L.ox)*st-L.vx*dm)*dt;L.vy+=((gy-L.oy)*st-L.vy*dm)*dt;L.ox+=L.vx*dt;L.oy+=L.vy*dt;
    const breathe=1+.6*o.warm;
    for(let i=0;i<N;i++){
      const th=i/N*TAU,c=Math.cos(th),s=Math.sin(th);
      let tgt=S.rm?0:L.amp*breathe*(Math.sin(t*.55+th*2+L.ph[0])*.6+Math.sin(t*.37-th*3+L.ph[1])*.4);
      tgt+=o.press*(.06*c*c-.08*Math.pow(Math.max(0,-s),1.4))*(li===2?1:.6);           // 压扁
      tgt-=.11*inside*o.press*Math.pow(Math.max(0,Math.cos(th-pdir)),6);                 // 接触点的凹陷
      tgt+=pull*(.2*Math.pow(Math.max(0,Math.cos(th-pdir)),2)-.05)*(li===2?1:.7);        // 被牵引、拉长
      tgt+=sN*(.12*Math.pow(Math.max(0,Math.cos(th-vdir)),2)-.03);                       // 速度只改变形状，不评判
      tgt+=.04*o.appr*Math.pow(Math.max(0,Math.cos(th-pdir)),3);                         // 靠近时朝你微微隆起
      L.pv[i]+=((tgt-L.p[i])*(58/L.lag)-L.pv[i]*(8.5/Math.sqrt(L.lag)))*dt;L.p[i]+=L.pv[i]*dt;
    }
  });
  if(o.hold&&!S.rm&&speed>30)S.trail.push({x:p.sx,y:p.sy,t:now});
  while(S.trail.length&&now-S.trail[0].t>1500)S.trail.shift();
  if(S.cb.onTexture)S.cb.onTexture(o.press*.6+o.warm*.4,sN);
  if(S.cb.onWarm)S.cb.onWarm(o.warm,o.hold);
}

/* ---------- 绘制 ---------- */
function layerPath(c,L,o,scale=1,append=false){
  const cx=o.cx+L.off[0]*o.R+L.ox,cy=o.cy+L.off[1]*o.R+L.oy,r0=o.R*L.r*scale,pts=new Array(N*2);
  const b=L.base;
  for(let j=0;j<N;j++){const th=j/N*TAU,r=r0*(1+L.p[j]+b[0]*Math.cos(2*th+b[1])+b[2]*Math.cos(3*th+b[3]));pts[2*j]=cx+Math.cos(th)*r*L.sx;pts[2*j+1]=cy+Math.sin(th)*r*L.sy;}
  const mx=i=>(pts[2*(i%N)]+pts[2*((i+1)%N)])/2,my=i=>(pts[2*(i%N)+1]+pts[2*((i+1)%N)+1])/2;
  if(!append)c.beginPath();c.moveTo(mx(N-1),my(N-1));
  for(let j=0;j<N;j++)c.quadraticCurveTo(pts[2*j],pts[2*j+1],mx(j),my(j));
  c.closePath();return{cx,cy,r:r0};
}
/* 一层：沿对角线的多色相过渡 + 一点暖白的柔光；边缘轻微羽化（不支持 ctx.filter 的浏览器保持硬边） */
function fillLayer(c,L,o,cols,alpha,ang=-.7,mode='source-over'){
  const g=layerPath(c,L,o),dx=Math.cos(ang)*g.r*1.1,dy=Math.sin(ang)*g.r*1.1;
  const lg=c.createLinearGradient(g.cx-dx,g.cy-dy,g.cx+dx,g.cy+dy);cols.forEach((col,i)=>lg.addColorStop(i/(cols.length-1),col));
  c.save();c.globalCompositeOperation=mode;c.globalAlpha=alpha;c.filter=`blur(${(o.R*.011).toFixed(2)}px)`;c.fillStyle=lg;c.fill();
  const rg=c.createRadialGradient(g.cx-g.r*.3,g.cy-g.r*.35,0,g.cx-g.r*.3,g.cy-g.r*.35,g.r*.95);rg.addColorStop(0,'rgba(255,248,236,.42)');rg.addColorStop(1,'rgba(255,248,236,0)');
  c.globalCompositeOperation='source-over';c.globalAlpha=alpha*.8;c.fillStyle=rg;c.fill();c.restore();
}
/* 倾斜的轨道环：上半圈在形体背后，下半圈在前面（2.5D） */
function orbit(o,t){
  const cx=o.cx+o.ox*.8,cy=o.cy+o.oy*.8+o.R*.05,rx=o.R*(1.5+.06*o.warm),ry=o.R*(.4+.08*o.warm),tl=-.2,ct=Math.cos(tl),stt=Math.sin(tl);
  const at=a=>{const x=Math.cos(a)*rx,y=Math.sin(a)*ry;return[cx+x*ct-y*stt,cy+x*stt+y*ct];};
  return{at,arc(c,a0,a1){c.beginPath();for(let i=0;i<=48;i++){const[x,y]=at(a0+(a1-a0)*i/48);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}};
}
function draw(now){
  if(!S.c||!S.W)return;const c=S.c,o=S.o,P=pal(),t=now/1000;
  c.setTransform(S.dpr,0,0,S.dpr,0,0);c.clearRect(0,0,S.W,S.H);
  const cx=o.cx+o.ox,cy=o.cy+o.oy,Rr=o.R;
  // 环境的回应：形体周围的一片柔光，随停留变暖、扩大
  let pl=0;S.pulses=S.pulses.filter(q=>{const p=(now-q.t0)/q.dur;if(p>=1)return false;pl=Math.max(pl,Math.sin(Math.PI*p));return true;});
  const warm=Math.max(o.warm,pl*.8),fr=Rr*(2.4+1.6*warm+.3*o.appr),fa=.2+.32*warm+.08*o.appr;
  const fg=c.createRadialGradient(cx,cy,Rr*.3,cx,cy,fr);
  fg.addColorStop(0,rgba(warm>.05?P.warmGlow:P.glow,fa));fg.addColorStop(.45,rgba(P.glow,fa*.45));fg.addColorStop(1,rgba(P.glow,0));
  c.fillStyle=fg;c.fillRect(cx-fr,cy-fr,fr*2,fr*2);
  // 保存时一圈很淡的光扩散到整个空间
  S.pulses.forEach(q=>{const p=(now-q.t0)/q.dur,rr=Rr*(1+p*5);c.strokeStyle=rgba(P.warmGlow,.4*(1-p));c.lineWidth=1.2;c.beginPath();c.ellipse(o.cx,o.cy,rr,rr*.9,0,0,TAU);c.stroke();});
  // 光迹
  S.trail.forEach(q=>{const age=(now-q.t)/1500,rr=Rr*.2*(1-age);if(rr<=0)return;const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,rr*2);g.addColorStop(0,rgba(P.warmGlow,.4*(1-age)));g.addColorStop(1,rgba(P.warmGlow,0));c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,rr*2,0,TAU);c.fill();});
  // 柔和的地面投影：越被提起越淡
  const lift=clamp(-o.oy/Rr,-.3,.5),sy=o.cy+Rr*1.02;
  const sg=c.createRadialGradient(o.cx+o.ox*.5,sy,0,o.cx+o.ox*.5,sy,Rr*(.95-lift*.2));sg.addColorStop(0,P.shadow);sg.addColorStop(1,'rgba(0,0,0,0)');
  c.save();c.translate(0,sy);c.scale(1,.16);c.translate(0,-sy);c.fillStyle=sg;c.globalAlpha=1-lift*.7;c.beginPath();c.arc(o.cx+o.ox*.5,sy,Rr*(.95-lift*.2),0,TAU);c.fill();c.restore();c.globalAlpha=1;
  const ob=orbit(o,t);c.lineCap='round';
  c.strokeStyle=P.line;c.globalAlpha=.45;c.lineWidth=1.1;ob.arc(c,Math.PI,TAU);c.globalAlpha=1;
  // 层：半透明叠加（不做发光或镜面），重叠处自然透出下层的颜色
  const [sage,peach,body,inner]=S.L;
  fillLayer(c,sage,o,P.sage,.84,-.9);
  fillLayer(c,peach,o,P.peach,.72,-.4);
  fillLayer(c,body,o,P.body,.8,-1.1);
  // 内里的光：暖白、低对比；按住越久越明显
  const ig=layerPath(c,inner,o,1+.12*warm);const igr=c.createRadialGradient(ig.cx-ig.r*.15,ig.cy-ig.r*.2,0,ig.cx,ig.cy,ig.r*1.15);
  igr.addColorStop(0,rgba(P.inner,.62+.2*warm));igr.addColorStop(.65,rgba(P.inner,.18+.2*warm));igr.addColorStop(1,rgba(P.inner,0));
  c.save();c.filter=`blur(${(Rr*.04).toFixed(1)}px)`;c.fillStyle=igr;c.fill();c.restore();
  // 颜料肌理：只落在几层形体的范围内
  const patch=pigmentPatch(Rr);
  if(patch){c.save();layerPath(c,sage,o);layerPath(c,peach,o,1,true);layerPath(c,body,o,1,true);c.clip();c.globalCompositeOperation='multiply';c.globalAlpha=.6;c.drawImage(patch,cx-Rr*1.8,cy-Rr*1.6,Rr*3.6,Rr*3.2);c.restore();}
  // 轨道的前半圈 + 一颗哑光的小珠子（没有白色描边和高光点）
  c.strokeStyle=P.line;c.lineWidth=1.2+.3*o.appr;ob.arc(c,0,Math.PI);
  const ba=S.rm?.5:(t*.11)%TAU,[bx,by]=ob.at(ba),front=Math.sin(ba)>0,br=o.R*(front?.08:.06);
  const bg=c.createRadialGradient(bx-br*.35,by-br*.35,0,bx,by,br);bg.addColorStop(0,P.bead[0]);bg.addColorStop(1,P.bead[1]);
  c.globalAlpha=front?.95:.5;c.fillStyle=bg;c.beginPath();c.arc(bx,by,br,0,TAU);c.fill();c.globalAlpha=1;
  const [sx2,sy2]=ob.at(2.55);c.fillStyle=P.speck[0];c.globalAlpha=.8;c.beginPath();c.arc(sx2,sy2,o.R*.045,0,TAU);c.fill();c.globalAlpha=1;
  // 一粒漂浮的微尘（原来两粒，减少装饰）
  {const a=2.6+(S.rm?0:-t*.05);c.fillStyle=P.speck[1];c.globalAlpha=.7;c.beginPath();c.arc(o.cx+Math.cos(a)*Rr*1.43+o.ox*.3,o.cy+Math.sin(a)*Rr*.98+o.oy*.3,Rr*.04,0,TAU);c.fill();}
  c.globalAlpha=1;
  // 触碰的涟漪
  S.ripples=S.ripples.filter(rp=>{const p=(now-rp.t0)/rp.dur;if(p>=1)return false;const e=1-Math.pow(1-p,3);
    for(let j=0;j<(rp.touch?3:1);j++){const pj=clamp(e-j*.16,0,1);if(pj<=0)continue;const rr=rp.r0+(rp.r1-rp.r0)*pj;c.strokeStyle=`rgba(255,247,232,${rp.a*.85*(1-p)})`;c.lineWidth=1.2;c.beginPath();c.ellipse(rp.x,rp.y,rr,rr*.92,0,0,TAU);c.stroke();}
    return true;});
}
function frame(){
  if(!S.on)return;
  const now=performance.now(),dt=clamp((now-(S.last||now))/1000,0,.05);S.last=now;
  step(dt,now);draw(now);S.raf=requestAnimationFrame(frame);
}
function start(){if(!S.cv)return;if(document.hidden||S.rm||!S.visible){staticFrame();return;}if(S.on)return;S.on=true;S.last=0;S.raf=requestAnimationFrame(frame);}
function stopLoop(){S.on=false;cancelAnimationFrame(S.raf);}
/* 减少动态：不跑循环，按状态直接画一帧（按住 = 压扁并变暖，松开 = 恢复） */
function staticFrame(){
  if(!S.cv)return;const o=S.o;o.appr=o.hold||o.focus?1:0;o.ox=o.oy=0;
  S.L.forEach((L,li)=>{L.ox=L.spread[0]*o.R*(o.hold?.6:0);L.oy=L.spread[1]*o.R*(o.hold?.6:0);for(let i=0;i<N;i++){const th=i/N*TAU,c=Math.cos(th),s=Math.sin(th);L.p[i]=o.hold?(.05*c*c-.06*Math.pow(Math.max(0,-s),1.4))*(li===2?1:.6):0;}});
  draw(performance.now());
}
function kick(){if(S.cv&&!S.on)staticFrame();}

root.Space={mount,unmount,pulse,takeHoldTotal,peekHoldTotal,
  get holding(){return S.o.hold;},get running(){return S.on;},get listening(){return !!S.abort;},
  get center(){return{x:S.o.cx,y:S.o.cy,R:S.o.R};},get debug(){return{W:S.W,H:S.H,cx:Math.round(S.o.cx),cy:Math.round(S.o.cy),R:Math.round(S.o.R),on:S.on,warm:+S.o.warm.toFixed(2),press:+S.o.press.toFixed(2)};}};
})(window);

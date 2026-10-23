'use strict';
/* 生息 SHENGXI · 视觉语法（SVG）
   所有图形都是程序化生成的：图标、情绪小团子、触发因素图标、记忆痕迹与关怀插画。
   参考图只作为视觉语法，不切片、不贴图。
   - 情绪小团子可以有极简表情，只出现在用户自报情绪、标签与图表节点上。
   - 记忆痕迹没有脸；由保存时生成的 seed 决定形态，之后不会被“开花”或情绪改写。 */
(function(root){
const {EMO,UNNAMED,rng,hash}=root.HH;
const TAU=Math.PI*2;
const f1=n=>Math.round(n*10)/10;

/* ---------- 共享 defs：渐变与颗粒滤镜，按需注册到页面里一个隐藏的 svg ---------- */
let defs=null;const made=new Set();
function ensureDefs(){
  if(defs||typeof document==='undefined')return defs;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML=`<defs>
  <radialGradient id="sx-hl" cx=".35" cy=".3" r=".65"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="sx-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6e6" stop-opacity=".95"/><stop offset=".4" stop-color="#f3dcc0" stop-opacity=".45"/><stop offset="1" stop-color="#f3dcc0" stop-opacity="0"/></radialGradient>
  </defs>`;
  document.body.appendChild(svg);defs=svg.querySelector('defs');return defs;
}
function mix(a,b,t){const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);const c=[16,8,0].map(s=>Math.round(((x>>s)&255)+((((y>>s)&255)-((x>>s)&255))*t)));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');}
/* 一个颜色 → 一枚柔和的径向渐变（中心偏亮、边缘略透明） */
function grad(hex){
  const id='sx-g'+hex.slice(1).toLowerCase();
  if(!made.has(id)&&ensureDefs()){
    made.add(id);
    const g=document.createElementNS('http://www.w3.org/2000/svg','radialGradient');
    g.id=id;g.setAttribute('cx','.38');g.setAttribute('cy','.34');g.setAttribute('r','.72');
    g.innerHTML=`<stop offset="0" stop-color="${mix(hex,'#ffffff',.55)}"/><stop offset=".55" stop-color="${hex}" stop-opacity=".92"/><stop offset="1" stop-color="${mix(hex,'#8f86a8',.12)}" stop-opacity=".7"/>`;
    defs.appendChild(g);
  }
  return`url(#${id})`;
}

/* ---------- 有机形：Catmull-Rom 闭合曲线 ---------- */
function blob(cx,cy,r,seed,o={}){
  const n=o.n||7,amp=o.amp??.13,sx=o.sx||1,sy=o.sy||1,rot=o.rot||0,R=rng(seed);const pts=[];
  for(let i=0;i<n;i++){const th=i/n*TAU+rot,rr=r*(1+amp*(R()*2-1));pts.push([cx+Math.cos(th)*rr*sx,cy+Math.sin(th)*rr*sy]);}
  return closed(pts);
}
function closed(pts){
  const n=pts.length,P=i=>pts[(i+n)%n];let d=`M${f1(P(0)[0])} ${f1(P(0)[1])}`;
  for(let i=0;i<n;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
    d+=`C${f1(p1[0]+(p2[0]-p0[0])/6)} ${f1(p1[1]+(p2[1]-p0[1])/6)} ${f1(p2[0]-(p3[0]-p1[0])/6)} ${f1(p2[1]-(p3[1]-p1[1])/6)} ${f1(p2[0])} ${f1(p2[1])}`;}
  return d+'Z';
}

/* ---------- 图标（24×24，线性） ---------- */
const ICON={
  now:'M12 4.5c4.6 0 7.5 2.9 7.5 7s-3 7.5-7.5 7.5S4.5 16 4.5 12 7.4 4.5 12 4.5ZM3 13.5c3-2.5 6-.5 9-1.8s6-2.4 9 .3',
  reflect:'M4 18.5h16M7 15.5V11M12 15.5V6.5M17 15.5V9',
  care:'M12 20s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.7 12 20 12 20Z',
  leaf:'M5 19C5 10.5 10.5 5 20 5c0 9-5.5 14-15 14ZM5 19l8.5-8.5',
  lock:'M6.5 11h11v9h-11zM9 11V8a3 3 0 0 1 6 0v3',
  settings:'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  arrow:'M5 12h14m-5.5-5.5L19 12l-5.5 5.5',
  back:'M19 12H5m5.5-5.5L5 12l5.5 5.5',
  close:'m6.5 6.5 11 11m0-11-11 11',
  check:'m5.5 12.5 4 4 9-9',
  spark:'M12 4.5c.6 3.7 2.8 6 6.5 6.5-3.7.6-5.9 2.8-6.5 6.5-.6-3.7-2.8-5.9-6.5-6.5 3.7-.5 5.9-2.8 6.5-6.5Z',
  shield:'M12 3.5 18.5 6v5.5c0 4.2-2.8 7.2-6.5 8.8-3.7-1.6-6.5-4.6-6.5-8.8V6ZM9.5 12l2 2 3.5-3.8',
  notes:'M7 3.5h7.5l3 3V20.5H7zM9.8 10h5M9.8 13.5h5M9.8 17h3',
  sound:'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10',
  mute:'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9.5l5 5m0-5-5 5',
  search:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.3 15.3 20 20',
  trash:'M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7',
  edit:'M5 19l1-4.2L15.6 5.2a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L9.2 18 5 19Z',
  clock:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 8v4.3l2.8 1.7',
  play:'M8.5 6v12l9.5-6z',pause:'M8.5 6.5v11M15.5 6.5v11',
  wave:'M3 12c2.2-4 4.3-4 6.5 0s4.3 4 6.5 0 3.5-3 5 0',
  pen:'M15.5 5.5l3 3L9 18l-4 1 1-4zM13.5 7.5l3 3',
  walk:'M13 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 21l2.2-6-2.7-2.6.9-4.6 3.6 3.2 2.5.5M8 11l1-3.5M12.2 15 15 21',
  body:'M12 7a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 12 7ZM6 9.5c4 1 8 1 12 0M12 10v5.5M9.5 21l2.5-5.5 2.5 5.5',
  breath:'M4 10c3 0 3-3 6-3s3 3 6 3 3-1.5 4-2M4 15c3 0 3-3 6-3s3 3 6 3 3-1.5 4-2',
  plus:'M12 5v14M5 12h14',
  rain:'M7.5 14.5a3.8 3.8 0 0 1 .4-7.6A5 5 0 0 1 17.3 8a3.3 3.3 0 0 1-.3 6.5zM9 17.5l-1 2.5M13 17.5l-1 2.5M17 17.5l-1 2.5',
  stretch:'M12 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 8.5l7 1.5 7-1.5M12 10v5l-3 6M12 15l3 6',
  meditate:'M12 7.5a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6ZM5 17.5c2.2-.8 4-4.5 7-4.5s4.8 3.7 7 4.5M4.5 20.5h15',
  help:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3.3M12 16.6h.01',
  user:'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 19.5c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5',
  chevL:'M14.5 6 8.5 12l6 6',chevR:'M9.5 6l6 6-6 6',down:'M6 9.5l6 6 6-6',
  external:'M14 5h5v5M19 5l-8 8M17 14v5H5V7h5',
  info:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 11v5M12 8h.01',
  /* 触发因素 */
  't-求职':'M4.5 8.5h15V19h-15zM9 8.5V6h6v2.5M4.5 13h15',
  't-学业':'M12 7c-2-1.6-4.6-2-7.5-1.5v12c2.9-.5 5.5-.1 7.5 1.5 2-1.6 4.6-2 7.5-1.5v-12C16.6 5 14 5.4 12 7Zm0 0v12',
  't-工作':'M5.5 6.5h13v8.5h-13zM3.5 18.5h17',
  't-社交':'M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 19.5c0-3.2 2.4-5.5 5.5-5.5s5.5 2.3 5.5 5.5M16 5.3a3 3 0 0 1 0 5.4M17.5 14.2c1.8.7 3 2.7 3 5.3',
  't-家庭':'M4.5 11 12 4.5l7.5 6.5v8.5h-15zM10 19.5V15h4v4.5',
  't-睡眠':'M19.5 14.5A7.8 7.8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10Z',
  't-身体':'M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.5a3.9 3.9 0 0 1 7 2.4c0 5.3-7 9.6-7 9.6Z',
  't-环境':'M5.5 18.5C5.5 10.5 10.5 5.5 19 5.5c0 8.5-5 13-13.5 13ZM5.5 18.5l8-8'
};
const icon=(n,cls='icon')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICON[n]||ICON.leaf}"/></svg>`;
/* 触发因素的柔和底色（与母板 trigger icons 一致：图标放在一枚淡色圆里） */
const TRIG_TINT={'求职':'#f5e3d2','学业':'#e7e1f1','工作':'#efe7dc','社交':'#e2e9f1','家庭':'#f3e2e2','睡眠':'#e6e0f2','身体':'#e3ece1','环境':'#e3ece1'};
const trigIcon=(t,cls='trig-ic')=>`<span class="${cls}" style="--tint:${TRIG_TINT[t]||'#ece8f0'}">${icon('t-'+t)}</span>`;

/* ---------- 情绪小团子：极简表情，只用于自报情绪 ---------- */
const FACE={
  '平静':'<path d="M24 30.5q2.2-2 4.4 0M35.6 30.5q2.2-2 4.4 0"/><path d="M27.5 38.5q4.5 3.4 9 0"/>',
  '开心':'<circle cx="26" cy="30" r="1.6" fill="currentColor" stroke="none"/><circle cx="38" cy="30" r="1.6" fill="currentColor" stroke="none"/><path d="M26.5 36.5q5.5 6 11 0"/>',
  '疲惫':'<path d="M23.5 30.5q2.6 2.2 5.2 0M35.3 30.5q2.6 2.2 5.2 0"/><path d="M29 39h6"/>',
  '焦虑':'<circle cx="26" cy="30.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="38" cy="30.5" r="1.6" fill="currentColor" stroke="none"/><path d="M27.5 39.5q1.5-1.6 3 0t3 0 3 0"/>',
  '低落':'<circle cx="26" cy="31" r="1.6" fill="currentColor" stroke="none"/><circle cx="38" cy="31" r="1.6" fill="currentColor" stroke="none"/><path d="M27.5 40.5q4.5-4 9 0"/>',
  '烦躁':'<path d="M23 26.5l5 1.6M41 26.5l-5 1.6"/><circle cx="26.5" cy="31" r="1.5" fill="currentColor" stroke="none"/><circle cx="37.5" cy="31" r="1.5" fill="currentColor" stroke="none"/><path d="M28 39.5q4-2.6 8 0"/>',
  '委屈':'<path d="M23.5 27.5l4.5-1.2M40.5 27.5 36 26.3"/><circle cx="26.5" cy="31" r="1.5" fill="currentColor" stroke="none"/><circle cx="37.5" cy="31" r="1.5" fill="currentColor" stroke="none"/><path d="M28.5 39.5q3.5-2.6 7 0"/>',
  '迷茫':'<circle cx="26" cy="30.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="38" cy="30.5" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="32" cy="38.5" rx="1.9" ry="2.2"/>'
};
/* 未命名的情绪不画脸：我们不替用户决定它是什么 */
function bubble(name,cls='bubble'){
  const e=EMO[name]||UNNAMED,s=hash(name||'none');
  const body=blob(32,33,23.5,s,{n:6,amp:.08,sx:1.04,sy:.96});
  return`<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="${body}" fill="${grad(e.c)}" ${EMO[name]?'':'stroke="'+e.d+'" stroke-opacity=".45" stroke-dasharray="3 3"'}/><path d="${body}" fill="url(#sx-hl)" opacity=".55"/>${EMO[name]?`<g fill="none" stroke="${e.d}" color="${e.d}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${FACE[name]}</g>`:''}</svg>`;
}

/* 只有表情（用于大号的感受气泡，形体由 CSS / SVG 另画） */
function faceSVG(name,cls='face'){const e=EMO[name];if(!e||!FACE[name])return'';return`<svg class="${cls}" viewBox="20 23 24 20" aria-hidden="true" focusable="false"><g fill="none" stroke="${e.d}" color="${e.d}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${FACE[name]}</g></svg>`;}
/* 大号的软形体：用于感受气泡场（无表情，表情另放） */
function softBody(hex,seed,dashed=false){const d=blob(50,50,46,seed,{n:7,amp:.05});return`<svg class="soft-body" viewBox="0 0 100 100" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path d="${d}" fill="${grad(hex)}" ${dashed?'stroke="#857b95" stroke-opacity=".45" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"':''}/><path d="${blob(42,38,30,seed+3,{n:6,amp:.08})}" fill="url(#sx-hl)" opacity=".7"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;}

/* ---------- 记忆痕迹：一段被留下的感受；无脸、不开花 ---------- */
const NEUTRAL=['#d9cfee','#c9dbc6','#f2d6bd','#cfdbe9'];
const ACCENT={lilac:'#c4b7e0',sage:'#b5cfb2',peach:'#f1cba8',blue:'#bccbe0'};
function tracePalette(e){
  const s=(e.form&&e.form.seed)||hash(e.id),R=rng(s^0x9e37);
  if(EMO[e.emotion]){const base=EMO[e.emotion].c,others=Object.values(ACCENT).filter(c=>c!==base);return[base,others[Math.floor(R()*others.length)],others[Math.floor(R()*others.length)]];}
  const o=NEUTRAL.slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;
}
const TEXT_FORMS=['breath','float','layer','gather','anchor'];
function traceKind(e){if(e.kind==='wordless')return'ripple';const s=(e.form&&e.form.seed)||hash(e.id);return TEXT_FORMS[s%TEXT_FORMS.length];}
function traceSVG(e,o={}){
  const s=(e.form&&e.form.seed)||hash(e.id),R=rng(s),[a,b,c]=tracePalette(e),k=traceKind(e),grain=o.grain!==false?'':'';
  const op=.82;let g='';
  const line=(d,w=1.3,al=.9)=>`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-opacity="${al}" stroke-linecap="round"/>`;
  const bead=(x,y,r,col)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${col}" stroke="#fff" stroke-width="1.2"/>`;
  const rot=R()*TAU;
  if(k==='breath'){
    g+=`<path d="${blob(44,47,29,s,{rot})}" fill="${grad(a)}" opacity="${op}"${grain}/>`;
    g+=`<path d="${blob(60,57,21,s+1,{rot})}" fill="${grad(b)}" opacity=".72"/>`;
    g+=line(`M8 ${54+R()*4}C28 ${36+R()*6} 46 ${70-R()*6} 70 ${50+R()*4}S86 ${42+R()*4} 92 ${44+R()*4}`);
    g+=bead(70,51,3.6,mix(b,'#7e9a83',.35));
  }else if(k==='float'){
    g+=`<path d="${blob(40,42,21,s,{rot})}" fill="${grad(a)}" opacity="${op}"${grain}/>`;
    g+=`<path d="${blob(61,58,19,s+2,{rot})}" fill="${grad(b)}" opacity=".74"/>`;
    g+=`<path d="${blob(68,30,9.5,s+3)}" fill="${grad(c)}" opacity=".8"/>`;
    g+=line(`M22 ${70}Q${50+R()*8} ${86} ${82} ${48+R()*6}`,1.1,.85);
    g+=bead(30,66,2.8,mix(a,'#6f6390',.3))+bead(78,58,2.4,mix(b,'#6f6390',.25));
  }else if(k==='layer'){
    [[34,a],[50,b],[66,c]].forEach(([y,col],i)=>{g+=`<path d="${blob(50+(R()-.5)*6,y,30,s+i,{n:8,amp:.06,sy:.34})}" fill="${grad(col)}" opacity="${.78-i*.04}"${i===1?grain:''}/>`;});
    g+=`<path d="M50 20V80" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-dasharray="1 5" stroke-linecap="round"/>`;
    g+=bead(50,34,2.2,'#fff')+bead(50,50,2.6,mix(b,'#6f6390',.3))+bead(50,66,2.2,'#fff');
  }else if(k==='gather'){
    const pts=[[36,42],[60,40],[48,62]];pts.forEach(([x,y],i)=>{g+=`<path d="${blob(x+(R()-.5)*4,y+(R()-.5)*4,18,s+i,{rot})}" fill="${grad([a,b,c][i])}" opacity="${.74}"${i===0?grain:''}/>`;});
    g+=line(`M20 ${30+R()*6}Q50 ${48} 82 ${70-R()*6}`,1.1,.8);
    g+=bead(48,48,2.6,'#fff')+bead(56,54,2,'#fff');
  }else if(k==='anchor'){
    g+=`<path d="${blob(50,66,30,s,{n:8,amp:.07,sy:.55})}" fill="${grad(a)}" opacity="${op}"${grain}/>`;
    g+=`<path d="${blob(56,62,18,s+1,{n:7,amp:.08,sy:.6})}" fill="${grad(b)}" opacity=".6"/>`;
    g+=`<circle cx="${48+R()*6}" cy="31" r="10" fill="${grad(c)}" opacity=".9"/>`;
    g+=line('M14 70Q50 62 86 70',1.1,.85);
  }else{ // ripple：无言的一刻
    g+=`<circle cx="50" cy="50" r="40" fill="${grad(a)}" opacity=".32"/>`;
    [36,27,18].forEach((r,i)=>{g+=`<path d="${blob(50,50,r,s+i,{n:8,amp:.04})}" fill="none" stroke="${i===2?'#fff':mix(a,'#7d7199',.35)}" stroke-opacity="${.35+i*.2}" stroke-width="${i===2?1.4:1}"/>`;});
    g+=`<circle cx="50" cy="50" r="10" fill="${grad(b)}" opacity=".95"${grain}/>`;
    const th=R()*TAU;g+=bead(50+Math.cos(th)*27,50+Math.sin(th)*27,2.6,mix(c,'#6f6390',.3));
  }
  if(o.orbit){const tilt=-18+R()*10;g+=`<g transform="rotate(${f1(tilt)} 50 50)"><ellipse cx="50" cy="50" rx="45" ry="14" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1"/><circle cx="95" cy="50" r="3" fill="#f6dcb8" stroke="#fff" stroke-width="1"/></g>`;}
  return`<svg class="${o.cls||'trace-svg'}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${g}</svg>`;
}

/* ---------- 品牌标记：两团交叠的柔和形体 + 一条细线 ---------- */
const brandMark=`<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="${blob(17,21,12.5,11,{n:6,amp:.09})}" fill="#b5cfb2" opacity=".9"/><path d="${blob(23,19,12,23,{n:6,amp:.09})}" fill="#c4b7e0" opacity=".85"/><path d="M4 25C12 15 22 30 36 17" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><circle cx="31.5" cy="20.6" r="2" fill="#f1cba8" stroke="#fff" stroke-width=".9"/></svg>`;

root.Art={faceSVG,softBody,grad,blob,mix,icon,ICON,trigIcon,TRIG_TINT,bubble,traceSVG,traceKind,brandMark,ensureDefs};
})(typeof window!=='undefined'?window:globalThis);

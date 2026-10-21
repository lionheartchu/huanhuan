'use strict';
/* 缓缓 · 界面层 v2
   首页是一个空间：可以写下文字，也可以只在光体旁停一会儿。
   情绪足迹与关怀工具箱保留在次级入口。个人数据与示例数据完全分开。 */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {EMO,UNNAMED,EMOTIONS,TRIG,INTENSITY,CARE_NAME,CARE_CAT,FEEDBACK,hash,fmt1,named,hasIntensity}=HH;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

const paths={home:'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',chart:'M4 3v17h17M8 14l4-5 4 3 5-7',leaf:'M20 4C7 2 2 9 6 15s14 2 14-11ZM4 21l11-11',lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',settings:'M9 3h6l1 4 4 1v6l-4 1-1 5H9l-1-5-4-1V8l4-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',arrow:'M4 12h16m-6-6 6 6-6 6',close:'m6 6 12 12M6 18 18 6',check:'m5 12 4 4L19 6',spark:'m12 3 2 6 7 3-7 2-2 7-2-7-7-2 7-3z',seed:'M12 3c5 5 6 10 0 18C6 13 7 8 12 3ZM12 9v8',shield:'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9.5 12l2 2 3.5-4',notes:'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h3',sound:'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',mute:'M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6'};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.leaf}"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');

const moods=[{color:'#b9c4da',dark:'#6d7c98'},{color:'#c8bfd9',dark:'#8b7d9e'},{color:'#d9d3ba',dark:'#9b9477'},{color:'#b8cbb5',dark:'#768b72'},{color:'#edc59c',dark:'#b18b64'}];
const BLOB='M12 21C18 7 46 5 58 20S68 50 55 61 18 63 10 49 6 34 12 21Z';
function face(n,cls=''){const m=moods[n-1];const mouths=['M29 43Q36 36 43 43','M30 42Q36 39 42 42','M31 41h10','M29 38q7 10 14 0','M27 37q9 17 18 0Z'];return `<svg class="${cls}" viewBox="0 0 72 72" aria-hidden="true"><path d="${BLOB}" fill="${m.color}"/><path d="M17 22Q29 11 44 15" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M25 30v3m22-3v3" stroke="${m.dark}" stroke-width="2.3" stroke-linecap="round"/><path d="${mouths[n-1]}" fill="${n===5?m.dark:'none'}" stroke="${m.dark}" stroke-width="1.8" stroke-linecap="round"/></svg>`;}
const FACES={'焦虑':'<path d="M25 30v3m22-3v3"/><path d="M21 24l7-1.5M51 24l-7-1.5"/><path d="M28 43q2-3 4 0t4 0 4 0 4 0"/>','烦躁':'<path d="M25 31v2.5m22-2.5v2.5"/><path d="M21 24l8 3M51 24l-8 3"/><path d="M29 44q7-6 14 0"/>','低落':'<path d="M25 31v3m22-3v3"/><path d="M29 44Q36 37 43 44"/>','疲惫':'<path d="M22 32q3.5 2.5 7 0M43 32q3.5 2.5 7 0"/><path d="M31 42h10"/>','委屈':'<path d="M25 31v3m22-3v3"/><path d="M21 26l7-3M51 26l-7-3"/><path d="M30 43q6-4 12 0"/>','迷茫':'<path d="M25 31v3m22-3v3"/><path d="M45 24l6-1"/><circle cx="37" cy="42.5" r="2.6"/>','平静':'<path d="M22 31q3.5-2.5 7 0M43 31q3.5-2.5 7 0"/><path d="M30 40q6 5 12 0"/>','开心':'<path d="M25 30v3m22-3v3"/><path d="M27 37q9 17 18 0Z" fill="currentColor"/>'};
function emoFace(name,cls=''){const e=EMO[name]||UNNAMED;return `<svg class="${cls}" viewBox="0 0 72 72" aria-hidden="true"><path d="${BLOB}" fill="${e.c}"/><path d="M17 22Q29 11 44 15" stroke="#fff" stroke-opacity=".32" stroke-width="3" fill="none" stroke-linecap="round"/><g stroke="${e.d}" color="${e.d}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none">${FACES[name]||'<path d="M27 36h18" opacity=".5"/>'}</g></svg>`;}
const plantArt=`<svg class="pause-graphic" viewBox="0 0 210 220" aria-hidden="true"><ellipse cx="116" cy="207" rx="76" ry="9" fill="#c3b3d3" opacity=".28"/><path d="M63 180C45 132 73 96 111 103s82 61 46 88-84 22-94-11Z" fill="#c7b7db"/><path d="M80 172C83 135 117 122 145 135s40 45 14 57-84 11-79-20Z" fill="#b3a0c8"/><path d="M77 106C63 78 78 41 106 48s46 40 31 58-48 24-60 0Z" fill="#ded2eb"/><path d="M105 124q21-27 13-64" fill="none" stroke="#7d937f" stroke-width="2"/><path d="M117 80q-29-3-26-23 22-4 26 23Z" fill="#9eb19c"/><path d="M120 64q-6-29 17-34 11 21-17 34Z" fill="#b0bda5"/><path d="M120 97q25-24 36-8-13 23-36 8Z" fill="#91a88d"/></svg>`;
function activityArt(kind){if(kind==='breath'||kind==='meditate')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><circle cx="58" cy="52" r="32" fill="#cedac9"/><circle cx="58" cy="52" r="22" fill="none" stroke="#94a58b"/><circle cx="58" cy="52" r="12" fill="none" stroke="#94a58b"/></svg>`;if(kind==='sound')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><path d="M17 73V51a31 31 0 0 1 62 0v22" fill="none" stroke="#baabcf" stroke-width="9"/><rect x="13" y="51" width="18" height="29" rx="8" fill="#ac99c4"/><rect x="66" y="51" width="18" height="29" rx="8" fill="#ac99c4"/></svg>`;if(kind==='scan')return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="22" r="9" fill="#d9c3ad"/><path d="M50 33v30M50 40l-16 12M50 40l16 12M50 63l-12 22M50 63l12 22" stroke="#c4a88f" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;return `<svg class="activity-art" viewBox="0 0 100 100" aria-hidden="true"><path d="M25 82Q51 56 49 15" fill="none" stroke="#b6a080" stroke-width="2"/><path d="M48 38Q17 29 25 13q26 1 23 25M45 57Q77 48 73 27q-29 5-28 30M36 70Q15 65 14 45q25 4 22 25" fill="#c8ba95"/></svg>`;}

/* ---------- 存储：v3，个人与示例分开；旧 v2 原样备份，不删除 ---------- */
const KEY='huanhuan-v3',V2='huanhuan-v2',BACKUP='huanhuan-v2-backup';
let storageOK=true;
function lsGet(k){try{return localStorage.getItem(k);}catch(e){storageOK=false;return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){storageOK=false;return false;}}
function normalize(s){
  const box=b=>({entries:Array.isArray(b&&b.entries)?b.entries:[],sessions:Array.isArray(b&&b.sessions)?b.sessions:[]});
  return{v:3,mode:s.mode==='demo'?'demo':'personal',personal:box(s.personal),demo:s.demo?box(s.demo):null,migration:s.migration||null};
}
function load(){
  const raw=lsGet(KEY);
  if(raw){try{const s=JSON.parse(raw);if(s&&s.v===3&&s.personal)return normalize(s);}catch(e){}lsSet(KEY+'-unreadable-'+Date.now(),raw);}
  const st={v:3,mode:'personal',personal:{entries:[],sessions:[]},demo:null,migration:null};
  const old=lsGet(V2);
  if(old){
    if(!lsGet(BACKUP))lsSet(BACKUP,old);
    try{const m=HH.migrateV2(JSON.parse(old));st.personal=m.personal;st.migration={at:Date.now(),report:m.report};}
    catch(e){st.migration={at:Date.now(),error:'旧数据无法解析，已原样保留在备份里。'};}
  }
  return st;
}
let state=load();
function persist(){const ok=lsSet(KEY,JSON.stringify(state));if(!ok)toast('浏览器存储不可用，这次的记录只在当前页面保留。');return ok;}
persist();
const isDemo=()=>state.mode==='demo';
const cur=()=>isDemo()?state.demo:state.personal;
const entries=()=>cur().entries;
const sessions=()=>cur().sessions;
const sessionsFor=id=>sessions().filter(s=>s.entryId===id);
const accompaniedSet=()=>new Set(sessions().filter(s=>s.entryId).map(s=>s.entryId));

let view=['home','journal','care'].includes(location.hash.slice(1))?location.hash.slice(1):'home';
let sayDraft='', period=7, listFilter='all', search='', timeFilter=0, energyFilter='all', spaceVol=.3;

/* ---------- 小工具 ---------- */
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(window.toastTimeout);window.toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3800);}
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));}
function dayKey(d){const date=new Date(d);return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
function dateLabel(ts,withTime=false){const d=new Date(ts);return `${d.getMonth()+1}月${d.getDate()}日`+(withTime?` ${pad(d.getHours())}:${pad(d.getMinutes())}`:'');}
function relDay(ts){const d0=HH.sod(ts),t0=HH.sod(Date.now()),d=new Date(ts),t=`${pad(d.getHours())}:${pad(d.getMinutes())}`;if(d0===t0)return '今天 '+t;if(d0===HH.addDays(t0,-1))return '昨天 '+t;return dateLabel(ts,true);}
const firstLine=e=>e.kind==='wordless'?`无言的一刻 · ${e.durationSec||0} 秒`:(e.text||'').split('\n')[0].slice(0,40)+((e.text||'').length>40?'…':'');
const emoLabel=e=>named(e)?e.emotion:'没有命名';
function ctxItems(c){if(!c)return '';const rows=[['睡眠',c.sleepHours??c.sleep,'h'],['步数',c.steps,''],['HRV',c.hrvMs??c.hrv,'ms'],['噪音',c.noiseDb??c.noise,'dB'],['天气',c.weather,'']].filter(r=>r[1]!=null);return rows.map(([k,v,u])=>`<span><em>${k}</em>${esc(v)}${u?' '+u:''}</span>`).join('');}
const intenDots=n=>Number.isInteger(n)?`<span class="inten-dots" aria-label="强度 ${n}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`:'';

function helpCard(compact=false){return `<section class="safety-card ${compact?'compact':''}" aria-label="需要帮助时"><div class="safety-icon">${icon('shield')}</div><div><h3>需要帮助时</h3><p>缓缓是日常记录和自我关怀的小工具，不能替代专业帮助。如果你感到难以承受，或有伤害自己的念头，可以联系一个信任的人，也可以拨打：</p><div class="hotlines"><a href="tel:12356"><b>12356</b><span>心理援助热线（中国大陆）</span></a><a href="tel:110"><b>110</b><span>遇到紧急危险</span></a><a href="tel:120"><b>120</b><span>医疗急救</span></a></div><p class="source-note">12356 是国家卫生健康委设立的全国统一心理援助热线，依据中国政府网公开信息核对（2024 年 12 月发布）。不在中国大陆时，请使用当地的服务。</p></div></section>`;}
function demoBar(){return isDemo()?`<div class="demo-bar" role="note"><span>${icon('spark')}你在看示例花园：这里的记录与分析都是虚构的，只用来展示。你的私人记录不受影响。</span><span class="demo-actions"><button data-action="demo-reset">重置示例</button><button data-action="demo-exit">回到我的空间</button></span></div>`:'';}

/* ---------- 此刻：一个空间，两个入口 ---------- */
function home(){
  return `${demoBar()}<section class="space" id="space" aria-label="此刻">
  <canvas id="space-canvas" aria-hidden="true"></canvas>
  <div class="space-inner">
    <div class="space-copy" id="space-copy">
      <h1 class="invite">今天，有什么想留在这里的吗？</h1>
      <p class="invite-sub">不必想清楚，也不必急着好起来。</p>
      <div class="say" id="say-box">
        <label class="sr-only" for="say">写下想留在这里的话</label>
        <textarea id="say" maxlength="2000" rows="4" placeholder="写一点什么都可以，一个词也行。">${esc(sayDraft)}</textarea>
        <div class="say-bar"><span class="say-count"><span id="say-count">${sayDraft.length}</span>/2000</span><span class="say-btns"><button class="text-button" data-action="say-discard" id="say-discard" ${sayDraft.trim()?'':'disabled'}>不保存，只是说说</button><button class="primary-button" data-action="say-keep" id="say-keep" ${sayDraft.trim()?'':'disabled'}>留在这里</button></span></div>
      </div>
      <div class="reply" id="reply" role="status" aria-live="polite"></div>
    </div>
    <div class="object-zone">
      <button class="object-hit" id="object-hit" type="button" aria-label="一团柔软的光。可以按住它慢慢移动；用键盘时，按住空格键，再用方向键移动。" aria-describedby="object-hint"></button>
      <p class="object-hint" id="object-hint">不想说话，也可以在这里停一会儿。</p>
      <div class="object-choices" id="object-choices" hidden><button class="secondary-button" data-action="stay-keep">把这一刻留在这里</button><button class="text-button" data-action="stay-leave">只是待了一会儿</button></div>
    </div>
  </div>
  <div class="space-tools">
    <button class="sound-toggle" data-action="sound" id="sound-toggle" aria-pressed="false">${icon('mute')}<span>开启声音</span></button>
    <label class="space-volume" id="space-volume-wrap" hidden><span class="sr-only">音量</span><input type="range" id="space-volume" min="0" max="60" value="${Math.round(spaceVol*100)}"></label>
    <span class="sound-msg" id="sound-msg" role="status"></span>
    ${isDemo()?'':'<button class="text-button demo-link" data-action="demo-enter">看看示例花园 ↗</button>'}
  </div>
  </section>
  <section class="after-space"><div class="shelf" id="shelf">${shelf()}</div>
  <div class="quiet-links"><button class="link-button" data-action="navigate" data-view="journal">回看情绪足迹 ↗</button><button class="link-button" data-action="navigate" data-view="care">打开关怀工具箱 ↗</button></div>
  ${isDemo()?`<div class="concept-card"><div class="eyebrow">概念演示 · 模拟手表</div><p>如果以后接入手表，它只会提示身体信号，例如「15:20 · 心率变异性比平时低 18%，环境噪音 71 dB」；是什么感受，仍然由你来决定。这里没有接入任何设备，示例里的情境数据都是模拟的，也不参与推荐。</p></div>`:''}</section>`;
}
function shelf(){
  const list=entries().slice().sort((a,b)=>b.ts-a.ts).slice(0,6);
  return `<h2>${isDemo()?'示例花园里最近的记忆':'留在这里的'}</h2>${list.length?`<ul class="shelf-list">${list.map(e=>`<li><button data-action="memory" data-id="${esc(e.id)}"><i class="dot ${e.kind==='wordless'?'ring':''}" style="--c:${(EMO[e.emotion]||UNNAMED).c}"></i><span class="shelf-text">${esc(firstLine(e))}</span><span class="shelf-meta">${relDay(e.ts)}${named(e)?' · '+e.emotion:''}</span></button></li>`).join('')}</ul>`:'<p class="shelf-empty">还没有留下什么。写一句话，或在光旁边停一会儿，都可以。</p>'}`;
}
function refreshSpace(){if(view!=='home')return;Space.setMemories(entries(),{accompanied:accompaniedSet(),max:isDemo()?22:12});const s=$('#shelf');if(s)s.innerHTML=shelf();}
function mountSpace(){
  let lastTex=0;
  Space.mount({section:$('#space'),canvas:$('#space-canvas'),hit:$('#object-hit'),copy:$('#space-copy'),
    onMemory:id=>openMemory(id),
    onInteract:ev=>{
      const hint=$('#object-hint');if(!hint)return;
      if(ev.type==='start'){hint.textContent='轻轻按住，慢慢移动。';}
      else{hint.textContent='松开也可以。想把这一刻留在这里吗？';$('#object-choices').hidden=false;}
    },
    onTexture:(h,m)=>{const n=performance.now();if(Ambient.owner==='space'&&n-lastTex>100){lastTex=n;Ambient.setTexture(h,m);}}
  });
  refreshSpace();syncSound();
}
function updateSayUI(){const ta=$('#say');if(!ta)return;sayDraft=ta.value;$('#say-count').textContent=ta.value.length;const has=!!ta.value.trim();$('#say-keep').disabled=!has;$('#say-discard').disabled=!has;}
function keepText(){
  const ta=$('#say');if(!ta)return;const text=ta.value.replace(/\s+$/,'');if(!text.trim())return;
  const e=HH.blankEntry({kind:'text',text});if(isDemo())e.demo=true;
  entries().push(e);if(!persist())return;
  sayDraft='';refreshSpace();Space.spawn(e.id,ta);
  ta.classList.add('gather');
  setTimeout(()=>{ta.value='';ta.classList.remove('gather');updateSayUI();showReply(e);},reduceMotion()?0:650);
}
function showReply(e){
  const r=HH.textReply(e.text),box=$('#reply');if(!box)return;
  box.innerHTML=`<p class="reply-line">${esc(r.line)}</p><div class="reply-actions"><button class="text-button" data-action="reply-stay">再待一会儿</button><button class="text-button" data-action="annotate" data-id="${esc(e.id)}">留下一点注释</button><button class="text-button" data-action="memory" data-id="${esc(e.id)}">回看这段话</button>${r.flag==='help'?'<button class="text-button strong" data-action="help">需要帮助时</button>':''}</div>`;
  box.classList.add('show');
}
function discardText(){const ta=$('#say');if(!ta)return;ta.classList.add('release');setTimeout(()=>{ta.value='';ta.classList.remove('release');updateSayUI();const box=$('#reply');box.innerHTML='<p class="reply-line">没有保存。说出来就好。</p>';box.classList.add('show');setTimeout(()=>box.classList.remove('show'),3500);},reduceMotion()?0:500);}
function keepStay(){
  const ms=Space.takeHoldTotal();
  const e=HH.blankEntry({kind:'wordless',durationSec:Math.max(1,Math.round(ms/1000))});if(isDemo())e.demo=true;
  entries().push(e);persist();refreshSpace();Space.spawn(e.id,'object');
  $('#object-choices').hidden=true;$('#object-hint').textContent='这一刻留在这里了。';
  setTimeout(()=>{const h=$('#object-hint');if(h&&!Space.holding)h.textContent='不想说话，也可以在这里停一会儿。';},5000);
}
function leaveStay(){Space.takeHoldTotal();$('#object-choices').hidden=true;$('#object-hint').textContent='好。随时可以回来。';setTimeout(()=>{const h=$('#object-hint');if(h&&!Space.holding)h.textContent='不想说话，也可以在这里停一会儿。';},4000);}

/* 声音：默认静音；被拒绝时说明并保持无声 */
function syncSound(){
  const b=$('#sound-toggle');if(!b)return;const on=Ambient.owner==='space';
  b.setAttribute('aria-pressed',on);b.innerHTML=`${icon(on?'sound':'mute')}<span>${on?'声音已开启':'开启声音'}</span>`;
  $('#space-volume-wrap').hidden=!on;
}
Ambient.onChange(syncSound);
function toggleSound(){
  if(Ambient.owner==='space'){Ambient.stop();return;}
  const b=$('#sound-toggle'),msg=$('#sound-msg');b.disabled=true;msg.textContent='';
  Ambient.play('space',{owner:'space',volume:spaceVol,fadeIn:3}).then(()=>{msg.textContent='';})
    .catch(()=>{msg.textContent='浏览器没有允许播放声音，现在是无声模式，其他都不受影响。';})
    .finally(()=>{b.disabled=false;syncSound();});
}

/* ---------- 回看记忆 ---------- */
function openMemory(id){
  const e=entries().find(x=>x.id===id);if(!e)return;const ss=sessionsFor(id).sort((a,b)=>a.ts-b.ts);
  const labels=[named(e)?`你选了「${e.emotion}」${hasIntensity(e)?' · '+INTENSITY[e.intensity-1]:''}`:'没有命名感受',e.triggers.length?'和 '+e.triggers.join('、')+' 有关':'',e.note?'注释：'+e.note:''].filter(Boolean);
  modal(`<div class="eyebrow">${e.demo?'示例记录 · ':''}${dateLabel(e.ts,true)}</div><h2>${e.kind==='wordless'?'无言的一刻':'留在这里的话'}</h2>
  ${e.kind==='wordless'?`<p>你在这里停了 ${e.durationSec||0} 秒，没有说话。</p>`:`<blockquote class="memory-text">${esc(e.text||'（没有文字）').replace(/\n/g,'<br>')}</blockquote>`}
  <ul class="memory-labels">${labels.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
  ${e.ctx?`<div class="ctx-strip in-modal"><span class="ctx-tag">模拟数据，不是测量</span>${ctxItems(e.ctx)}</div>`:''}
  ${e.legacy&&e.legacy.intensityMayBeDefault?'<p class="small muted">这条来自旧版本。旧版本会把强度默认设为 3，所以它的强度不参与统计。</p>':''}
  ${ss.length?`<div class="memory-care"><h3>曾陪自己待了一会儿</h3><ul>${ss.map(s=>`<li>${dateLabel(s.ts,true)} · ${CARE_NAME[s.activity]||s.activity}${s.seconds!=null?` · ${s.seconds<60?s.seconds+' 秒':Math.round(s.seconds/60)+' 分钟'}`:''}${s.ended==='early'?'（提前结束）':''} · ${s.feedback?'你说：'+FEEDBACK[s.feedback]:'没有留下感受'}</li>`).join('')}</ul></div>`:''}
  <div class="modal-actions spread"><button class="text-button danger-text" data-action="delete" data-id="${esc(id)}">删除</button><span><button class="secondary-button" data-action="annotate" data-id="${esc(id)}">${named(e)||e.triggers.length||e.note?'修改注释':'留下一点注释'}</button><button class="secondary-button" data-action="accompany" data-id="${esc(id)}">陪这个感受待一会儿</button></span></div>`);
}
/* 渐进补充：全部可跳过；没选的保持未知 */
let anno=null;
function openAnnotate(id){
  const e=entries().find(x=>x.id===id);if(!e)return;anno={id,emotion:e.emotion||null,intensity:hasIntensity(e)?e.intensity:null,triggers:[...e.triggers],note:e.note||''};
  modal(`<div class="eyebrow">都可以跳过</div><h2>想再补一点吗？</h2><p>没选的部分会保持“未知”，不会被自动补上。</p>
  <div class="field-label"><span>如果要给它一个名字</span><button class="text-button" data-action="anno-clear-emo">说不上来</button></div>
  <div class="emo-grid" role="group" aria-label="选择感受">${EMOTIONS.map(n=>`<button type="button" class="mood-choice ${anno.emotion===n?'selected':''}" data-action="anno-emo" data-value="${n}" aria-pressed="${anno.emotion===n}">${emoFace(n)}<span>${n}</span></button>`).join('')}</div>
  <div class="field-label"><span>有多强烈</span><span class="optional" id="anno-inten-label">${anno.intensity?anno.intensity+' · '+INTENSITY[anno.intensity-1]:'未选择'}</span></div>
  <div class="inten-row" role="group" aria-label="强度">${[1,2,3,4,5].map(i=>`<button type="button" class="inten ${anno.intensity&&i<=anno.intensity?'on':''}" data-action="anno-inten" data-value="${i}" aria-label="强度 ${i}：${INTENSITY[i-1]}" aria-pressed="${anno.intensity===i}"><i style="--s:${8+i*3}px"></i></button>`).join('')}</div>
  <div class="field-label"><span>和什么有关</span><span class="optional">可多选</span></div>
  <div class="chips">${TRIG.map(t=>`<button class="chip ${anno.triggers.includes(t)?'active':''}" data-action="anno-tag" data-value="${t}" aria-pressed="${anno.triggers.includes(t)}">${t}</button>`).join('')}</div>
  <div class="field-label"><label for="anno-note">一句注释</label></div><input id="anno-note" class="note-input" maxlength="200" value="${esc(anno.note)}" placeholder="可以不写">
  <div class="modal-actions"><button class="text-button" data-action="close">跳过</button><button class="primary-button" data-action="anno-save">保存</button></div>`);
}
function syncAnno(){
  $$('[data-action="anno-emo"]').forEach(b=>{const s=b.dataset.value===anno.emotion;b.classList.toggle('selected',s);b.setAttribute('aria-pressed',s);});
  $$('[data-action="anno-inten"]').forEach(b=>{const i=+b.dataset.value;b.classList.toggle('on',!!anno.intensity&&i<=anno.intensity);b.setAttribute('aria-pressed',i===anno.intensity);});
  $('#anno-inten-label').textContent=anno.intensity?anno.intensity+' · '+INTENSITY[anno.intensity-1]:'未选择';
}
function saveAnno(){
  const e=entries().find(x=>x.id===anno.id);if(!e)return;
  e.emotion=anno.emotion;e.intensity=anno.intensity;e.triggers=anno.triggers;e.note=$('#anno-note').value.trim();
  if(e.legacy)e.legacy.intensityMayBeDefault=false;
  persist();closeModal();refreshSpace();if(view==='journal')render();toast('补充好了。');
}

/* ---------- 情绪足迹 ---------- */
function dotChart(list,days){
  const W=600,H=230,left=46,right=14,top=12,bottom=30,t0=HH.sod(Date.now());
  const X=i=>left+(days===1?0:i*(W-left-right)/(days-1)),Y=h=>top+h/24*(H-top-bottom);
  const pts=list.map(e=>{const i=days-1-Math.round((t0-HH.sod(e.ts))/864e5);const d=new Date(e.ts),h=d.getHours()+d.getMinutes()/60;
    const r=hasIntensity(e)?3+e.intensity*1.3:4.5,col=(EMO[e.emotion]||UNNAMED);
    const tip=`${dateLabel(e.ts,true)} · ${e.kind==='wordless'?'无言的一刻':emoLabel(e)}${hasIntensity(e)?' · '+INTENSITY[e.intensity-1]:''}`;
    return{e,x:X(i)+((hash(e.id)%7)-3)*(days>7?.6:1.4),y:Y(h),r,col,tip};});
  return `<svg class="chart large dots" viewBox="0 0 ${W} ${H}" role="img" aria-label="近${days}天的每一条记录：横轴是日期，纵轴是一天中的时间">
  ${[0,6,12,18,24].map(h=>`<line x1="${left}" x2="${W-right}" y1="${Y(h)}" y2="${Y(h)}" stroke="var(--grid)" ${h%12?'stroke-dasharray="3 5"':''}/><text class="chart-value" x="0" y="${Y(h)+4}">${h===0?'0 点':h===6?'6 点':h===12?'中午':h===18?'18 点':'24 点'}</text>`).join('')}
  <line class="cross" id="cross" x1="0" x2="0" y1="${top}" y2="${H-bottom}"/>
  ${pts.map(p=>p.e.kind==='wordless'?`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="2 2" data-tip="${esc(p.tip)}"/>`
    :named(p.e)?`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="${p.col.c}" stroke="var(--paper)" stroke-width="1.5" data-tip="${esc(p.tip)}"/>`
    :`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="var(--paper)" stroke="${UNNAMED.d}" stroke-width="1.6" data-tip="${esc(p.tip)}"/>`).join('')}
  ${Array.from({length:days},(_,i)=>i).filter(i=>days<=7||i%7===0||i===days-1).map(i=>{const d=new Date(HH.addDays(t0,i-days+1));return `<text class="chart-label" x="${X(i)}" y="${H-6}" text-anchor="middle">${i===days-1?'今天':`${d.getMonth()+1}.${d.getDate()}`}</text>`;}).join('')}
  ${pts.length?'':`<text class="chart-label" x="${W/2}" y="${H/2}" text-anchor="middle">这段时间还没有记录</text>`}</svg>`;
}
function legend(list){const present=EMOTIONS.filter(n=>list.some(e=>e.emotion===n));return `<div class="legend">${present.map(n=>`<span><i style="background:${EMO[n].c}"></i>${n}</span>`).join('')}${list.some(e=>!named(e)&&e.kind!=='wordless')?'<span><i class="hollow"></i>没有命名</span>':''}${list.some(e=>e.kind==='wordless')?'<span><i class="dashed"></i>无言的一刻</span>':''}</div>`;}
function emotionSummary(list){
  const st=HH.emotionStats(list),max=Math.max(1,...st.rows.map(r=>r.n),st.unnamed);
  return `<div class="insight-title">${icon('spark')}<h2>你说过的感受</h2></div><p class="insight-detail">只统计你自己选过的感受；强度只算真的选过的。</p>
  <div class="emo-rows">${st.rows.map(r=>`<div class="emo-row"><span class="emo-name"><i style="background:${EMO[r.name].c}"></i>${r.name}</span><div class="bar-track"><i style="width:${r.n/max*100}%;background:${EMO[r.name].c}"></i></div><span class="count">${r.n} 条${r.nI?` · 平均强度 ${fmt1(r.avg)}（${r.nI}）`:''}</span></div>`).join('')}
  ${st.unnamed?`<div class="emo-row"><span class="emo-name"><i class="hollow"></i>没有命名</span><div class="bar-track"><i style="width:${st.unnamed/max*100}%;background:${UNNAMED.c}"></i></div><span class="count">${st.unnamed} 条</span></div>`:''}
  ${!st.rows.length&&!st.unnamed?'<p class="insight-detail">这段时间还没有记录。</p>':''}</div>`;
}
function triggerSoil(list){
  const st=HH.triggerStats(list),max=Math.max(1,...st.map(s=>s.n));
  return `<div class="insight-title">${icon('seed')}<h2>触发因素 · 土层</h2></div><p class="insight-detail">你在注释里标过的事。每一层的颜色是当时选的感受，舒服的时刻也算在里面。</p>
  <div class="soil-bars">${st.length?st.map(s=>`<div class="soil-row"><span class="soil-name">${s.t}</span><div class="soil-cell"><div class="soil-track" style="width:${Math.max(8,s.n/max*100)}%">${Object.entries(s.by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<i style="flex:${v};background:${(EMO[k]||UNNAMED).c}" title="${k} ${v} 条"></i>`).join('')}</div></div><span class="soil-val"><b>${s.n}</b> 条${s.comfort?` · 舒服 ${s.comfort}`:''}${s.nI?` · 强度 ${fmt1(s.avg)}`:''}</span></div>`).join(''):'<p class="insight-detail">还没有标过触发因素。可以在回看记忆时“留下一点注释”。</p>'}</div>`;
}
function findingCard(f){return `<article class="card finding"><div class="eyebrow">${f.eyebrow}${f.simulated?' · <b class="sim">模拟数据</b>':''}</div><div class="finding-big">${esc(f.big)}</div><p class="finding-text">${esc(f.text)}</p>${f.bars?`<div class="finding-bars">${f.bars.map(b=>`<div class="tag-bar"><span>${b.label}</span><div class="bar-track"><i style="width:${Math.round(b.v*100)}%"></i></div><span class="count">${b.n}</span></div>`).join('')}</div>`:''}<p class="finding-tip">${esc(f.caveat)}</p></article>`;}
function journal(){
  const data=HH.inRange(entries(),period),found=HH.insights(HH.inRange(entries(),30),HH.inRange(sessions(),30),{demo:isDemo()});
  return `${demoBar()}<section class="view-intro"><div class="eyebrow">${isDemo()?'EXAMPLE · 示例数据':'YOUR EMOTIONAL LANDSCAPE'}</div><h1>回看，不评判。</h1><p>${isDemo()?'这里是示例花园的虚构记录，用来展示可以怎样回看。':'只有你自己写下、自己选过的，才会出现在这里。'}</p></section>
  <div class="stats-grid"><section class="card large-trend"><div class="card-head"><h2>每一次记录</h2><div class="segmented" aria-label="时间范围"><button data-action="period" data-value="7" class="${period===7?'active':''}">7 天</button><button data-action="period" data-value="30" class="${period===30?'active':''}">30 天</button></div></div><div class="chart-wrap" id="trend">${dotChart(data,period)}<div class="chart-tip" id="chart-tip" role="status"></div></div>${legend(data)}<p class="insight-help">每个点是一条记录：横向是日期，纵向是一天里的时间；颜色是你选的感受，点越大强度越高。不同感受不会被相互抵消成一个平均值。</p></section><section class="card insight-card">${emotionSummary(data)}</section></div>
  <section class="card soil-card">${triggerSoil(data)}</section>
  <div class="section-heading"><div><h2>一点小发现</h2><p>由最近 30 天的${isDemo()?'示例':''}记录计算，写清样本量；只描述同时出现的次数，不推断原因或疗效。</p></div></div>
  <div class="finding-grid">${found.length?found.map(findingCard).join(''):`<div class="card empty-state" style="grid-column:1/-1"><h3>记录还不多，先不下结论。</h3><p>至少有 5 条记录后，这里才会出现计数。${isDemo()?'':'也可以先<button class="link-button" data-action="demo-enter">看看示例花园</button>里的样子。'}</p></div>`}</div>
  <div class="section-heading journal-toolbar"><div><h2>留在这里的</h2><p>点开可以回看原文、日期和你补充的标签。</p></div><div class="toolbar"><label class="sr-only" for="journal-search">搜索</label><input id="journal-search" class="search-input" type="search" placeholder="搜索文字或标签…" value="${esc(search)}"><label class="sr-only" for="journal-filter">筛选</label><select id="journal-filter" class="select-input"><option value="all">全部</option><option value="text" ${listFilter==='text'?'selected':''}>文字</option><option value="wordless" ${listFilter==='wordless'?'selected':''}>无言的一刻</option><option value="unnamed" ${listFilter==='unnamed'?'selected':''}>没有命名</option>${EMOTIONS.map(n=>`<option value="${n}" ${listFilter===n?'selected':''}>${n}</option>`).join('')}</select></div></div>
  <div class="journal-list" id="journal-list">${entryList()}</div>`;
}
function entryList(){
  const acc=accompaniedSet();
  const data=HH.inRange(entries(),period).filter(e=>(listFilter==='all'||(listFilter==='text'?e.kind==='text':listFilter==='wordless'?e.kind==='wordless':listFilter==='unnamed'?!named(e):e.emotion===listFilter))&&(!search||[e.text,e.note,...e.triggers,e.emotion].join(' ').includes(search))).sort((a,b)=>b.ts-a.ts);
  return data.length?data.map(e=>`<article class="entry-card"><button class="entry-open" data-action="memory" data-id="${esc(e.id)}" aria-label="回看 ${dateLabel(e.ts,true)} 的记录">${emoFace(e.emotion,'entry-face')}<div class="entry-content"><div class="entry-head"><span class="entry-title">${e.kind==='wordless'?'无言的一刻':emoLabel(e)}${intenDots(hasIntensity(e)?e.intensity:null)}</span><time class="entry-date">${dateLabel(e.ts,true)}</time></div><p class="entry-text">${e.kind==='wordless'?`在这里停了 ${e.durationSec||0} 秒。`:esc(e.text||'（没有文字）')}</p><div class="entry-meta">${e.triggers.map(t=>`<span class="entry-tag">${esc(t)}</span>`).join('')}${acc.has(e.id)?`<span class="status kept">${icon('leaf')}曾陪自己待了一会儿</span>`:''}${e.demo?'<span class="status demo">示例</span>':''}</div></div></button></article>`).join('')
  :`<div class="card empty-state"><h3>${search||listFilter!=='all'?'没有找到匹配的记录':'这一页，等你慢慢写。'}</h3><p>${search||listFilter!=='all'?'试试更换关键词或筛选。':'在「此刻」写一句话，或停一会儿，都会留在这里。'}</p><button class="secondary-button" data-action="${search||listFilter!=='all'?'reset-filters':'navigate'}" data-view="home">${search||listFilter!=='all'?'清除筛选':'回到此刻'}</button></div>`;
}

/* ---------- 关怀工具箱 ---------- */
const activities=[
{id:'breath',title:'方块呼吸',subtitle:'吸 4 · 停 4 · 呼 4 · 停 4',category:'呼吸练习',minutes:1,choices:[1,3],energy:'low',style:'',kind:'breath',intro:'找一个舒服的姿势，跟着圆圈，四个四秒为一组。不舒服就回到自然呼吸，随时可以结束。',steps:[]},
{id:'meditate',title:'把注意力带回此刻',subtitle:'不用清空大脑，只要留意当下',category:'正念片刻',minutes:3,energy:'low',style:'',kind:'meditate',intro:'走神很正常。发现自己走神时，再温和地回来一次就好。',steps:['留意身体与椅子、地面的接触。','听听周围的声音，不需要判断它。','感受一次自然的呼吸，然后再一次。']},
{id:'music',title:'留一段无词的空白',subtitle:'缓慢的和弦，和一点风声',category:'舒缓音乐',minutes:3,energy:'low',style:'purple',kind:'sound',intro:'浏览器实时生成的环境音：缓慢变换的和弦，加上一点滤过的风声。可以调低音量，让它成为背景。',steps:[]},
{id:'rain',title:'听一会儿雨',subtitle:'把注意力，交给窗外的声音',category:'环境音',minutes:3,energy:'low',style:'purple',kind:'sound',intro:'低沉的和声和连续的雨声。可以闭上眼，也可以望向窗外，暂时不用做任何事。',steps:[]},
{id:'scan',title:'身体扫描',subtitle:'不想动的时候，也可以做',category:'身体感受',minutes:5,energy:'low',style:'peach',kind:'scan',intro:'坐好或躺下。注意力从头顶慢慢往下走，只是感受，不用改变什么。',steps:['从头顶开始，留意额头和眉心是否绷着。','来到下巴和肩膀，让它们往下沉一点。','感受胸口和腹部，随呼吸起伏。','留意双腿的重量，和脚底的温度。','最后，感受整个身体被托住。']},
{id:'stretch',title:'让肩膀先下班',subtitle:'站起来，伸展一下身体',category:'轻运动',minutes:5,energy:'medium',style:'peach',kind:'stretch',intro:'离开屏幕一会儿，只做身体感觉舒服的动作。',steps:['缓缓向后绕肩 5 次，再向前绕肩 5 次。','头慢慢倒向左肩、右肩，各停 15 秒。','双手交扣向上，伸一个长长的懒腰。','坐姿前屈，让后背自然垂下。','起身走几步，让视线看看远处。']},
{id:'walk',title:'出去走一小段',subtitle:'不用计步，也不用走得很远',category:'轻运动',minutes:10,energy:'medium',style:'peach',kind:'walk',intro:'如果此刻方便，选一条熟悉、安全的小路。只是走走，不需要达成什么。',steps:['离开座位，选择一个熟悉的地方。','先慢走两分钟，留意脚底落地的感觉。','找一找路上的五种颜色。','听一听三种不同的声音。','走到想回去的时候，就可以回去。']}
];
const actById=id=>activities.find(a=>a.id===id);
const GROUPS=[['呼吸','给身体一个慢下来的信号'],['聆听','把注意力交给声音'],['身体','让身体动一动，或者只是感受它']];
function activityCard(a,opt={}){return `<button class="activity-card ${a.style}" data-action="activity" data-id="${a.id}" ${opt.entry?`data-entry="${esc(opt.entry)}"`:''}><div class="activity-tag">${a.category} · ${a.minutes} 分钟</div><h3>${a.title}</h3><p>${a.subtitle}</p>${opt.reason?`<p class="activity-reason">${icon('spark')}<span>${esc(opt.reason)}</span></p>`:''}${activityArt(a.kind)}<span class="activity-arrow" aria-hidden="true">↗</span></button>`;}
function care(){
  const recent=entries().filter(named).sort((a,b)=>b.ts-a.ts)[0],fresh=recent&&Date.now()-recent.ts<3*864e5;
  const recs=HH.recommend(fresh?recent.emotion:null,sessions());
  const fb=HH.feedbackStats(sessions());
  const list=activities.filter(a=>(!timeFilter||a.minutes<=timeFilter)&&(energyFilter==='all'||a.energy===energyFilter));
  return `${demoBar()}<section class="view-intro"><div class="eyebrow">SMALL THINGS, GENTLE CHANGES</div><h1>照顾自己，从一点点开始。</h1><p>不必把情绪“修好”。挑一个舒服的，随时可以停下。</p></section>
  <section class="care-hero"><div class="hero-copy"><span class="eyebrow">如果不知道从哪里开始</span><h2>留一分钟，只属于自己。</h2><p>不需要先记录。练习结束时可以留下感受，也可以跳过。</p><button class="primary-button" data-action="activity" data-id="breath">开始 1 分钟呼吸 ${icon('arrow')}</button></div>${plantArt}</section>
  <div class="section-heading"><div><h2>${fresh?`按你最近选的「${recent.emotion}」`:'可以先试试这些'}</h2><p>按透明的规则排序：你选的感受，加上你在同一种练习后留下的反馈。不使用任何传感器数据。</p></div></div>
  <div class="care-cards">${recs.map(r=>activityCard(actById(r.id),{reason:r.reason})).join('')}</div>
  <div class="section-heading"><div><h2>全部小方法</h2><p>按你现在的时间与精力选择。</p></div></div>
  <div class="filter-group"><span class="filter-label">我有时间</span><div class="chips">${[{v:0,t:'不限'},{v:1,t:'1 分钟'},{v:3,t:'3 分钟内'},{v:5,t:'5 分钟内'},{v:10,t:'10 分钟内'}].map(x=>`<button class="chip ${timeFilter===x.v?'active':''}" data-action="time-filter" data-value="${x.v}">${x.t}</button>`).join('')}</div></div>
  <div class="filter-group"><span class="filter-label">现在精力</span><div class="chips">${[{v:'all',t:'都可以'},{v:'low',t:'只想静静待着'},{v:'medium',t:'想动一动'}].map(x=>`<button class="chip ${energyFilter===x.v?'active':''}" data-action="energy-filter" data-value="${x.v}">${x.t}</button>`).join('')}</div></div>
  ${list.length?GROUPS.map(([g,d])=>{const items=list.filter(a=>CARE_CAT[a.id]===g);return items.length?`<div class="tool-group"><h3>${g}<span>${d}</span></h3><div class="care-cards toolbox">${items.map(a=>activityCard(a)).join('')}</div></div>`:'';}).join(''):`<div class="card empty-state" style="margin-top:24px"><h3>这个组合暂时没有合适的练习</h3><button class="secondary-button" data-action="reset-care">查看全部小方法</button></div>`}
  ${fb.nFb?`<div class="reflection"><h3>你留下过的感受</h3><p>你在 ${fb.nFb} 次练习后留下了感受：${fb.better} 次轻松了一点，${fb.same} 次差不多，${fb.worse} 次还不太舒服。${fb.n>fb.nFb?`另有 ${fb.n-fb.nFb} 次没有留下感受。`:''}这是练习结束时的自评，不代表情绪被改善或解决。</p></div>`:''}
  ${helpCard()}`;
}

/* ---------- 渲染与导航 ---------- */
function render(){
  if(view!=='home')Ambient.stopIf('space');
  Space.unmount();
  $('#main').innerHTML=view==='home'?home():view==='journal'?journal():care();
  $('#main').classList.remove('animate-in');void $('#main').offsetWidth;$('#main').classList.add('animate-in');
  document.body.dataset.view=view;document.body.classList.toggle('is-demo',isDemo());
  $$('nav [data-view]').forEach(e=>{e.classList.toggle('active',e.dataset.view===view);if(e.dataset.view===view)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');});
  hydrate($('#main'));
  if(view==='home')mountSpace();
}
function navigate(v){if(!['home','journal','care'].includes(v))v='home';view=v;if(location.hash.slice(1)!==v)history.replaceState(null,'','#'+v);render();window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(v!==view)navigate(v);});

/* ---------- 弹窗与练习 ---------- */
let modalReturn=null;
function modal(html){
  if(!$('#modal').open)modalReturn=document.activeElement;
  $('#modal-content').innerHTML=`<div class="modal-body"><button class="icon-button modal-close" data-action="close" aria-label="关闭">${icon('close')}</button>${html}</div>`;
  if(!$('#modal').open)$('#modal').showModal();$('#modal').scrollTop=0;
}
let activeActivity=null,timer=null,running=false,started=false,tickAt=0,accumulated=0,volume=.5;
function practiceOwner(){return activeActivity?'practice-'+activeActivity.id:null;}
function stopTimer(){clearInterval(timer);timer=null;if(running&&activeActivity)accumulated+=(Date.now()-tickAt)/1000;running=false;if(practiceOwner())Ambient.stopIf(practiceOwner());}
function elapsedSec(){return accumulated+(running?(Date.now()-tickAt)/1000:0);}
/* 结束练习（无论是否到时间）：只记录真实时长；反馈是可选的 */
function recordSession(){
  const a=activeActivity;if(!a||!started||a.sessionId)return null;
  const secs=Math.round(Math.min(a.minutes*60,elapsedSec()));
  const s={id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ts:Date.now(),activity:a.id,plannedSec:a.minutes*60,seconds:secs,ended:secs>=a.minutes*60?'complete':'early',feedback:null,entryId:a.entryId||null};
  if(isDemo())s.demo=true;sessions().push(s);persist();a.sessionId=s.id;return s;
}
function endActivity(){if(activeActivity){stopTimer();recordSession();activeActivity=null;refreshSpace();}}
function closeModal(){endActivity();if($('#modal').open)$('#modal').close();}
$('#modal').addEventListener('close',()=>{endActivity();const r=modalReturn;modalReturn=null;if(r&&document.contains(r))r.focus({preventScroll:true});});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
function openActivity(id,opts={}){
  endActivity();
  const a=actById(id);if(!a)return;
  activeActivity={...a,entryId:opts.entry||null,sessionId:null};accumulated=0;started=false;running=false;activityScreen();
}
function formatTime(s){return `${pad(Math.floor(s/60))}:${pad(Math.floor(s%60))}`;}
function activityScreen(){
  const a=activeActivity,e=a.entryId&&entries().find(x=>x.id===a.entryId);
  modal(`${e?`<div class="caring-for">${emoFace(e.emotion,'tiny-face')}陪着：${esc(firstLine(e))}</div>`:''}<div class="center"><div class="eyebrow">${a.category} · ${a.minutes} 分钟 · 随时可以结束</div><h2>${a.title}</h2><p>${a.intro}</p></div>
  <div class="timer-stage">${a.kind==='breath'?`<div class="segmented center-seg" aria-label="时长">${a.choices.map(m=>`<button data-action="dur" data-value="${m}" class="${a.minutes===m?'active':''}">${m} 分钟</button>`).join('')}</div><div class="breathing-orb" id="breathing-orb"><span id="breath-phase">准备好了</span><small id="breath-count"></small></div>`
  :a.kind==='sound'?`<div class="sound-rings" aria-hidden="true"><i></i><i></i><i></i><span>${a.id==='rain'?'☂':'♫'}</span></div><div class="volume-row"><label for="volume">音量</label><input type="range" min="0" max="100" value="${Math.round(volume*100)}" id="volume"></div>`
  :`<div class="step-list" id="step-list">${a.steps.map((s,i)=>`<div class="${i===0?'current':''}"><span>${i+1}</span><p>${s}</p></div>`).join('')}</div>`}
  <div class="timer-value" id="timer-value">${formatTime(a.minutes*60)}</div><div class="timer-copy" id="timer-copy">${a.kind==='breath'?'不必憋得太用力，不舒服就恢复自然呼吸。':a.kind==='sound'?'声音由浏览器实时生成，没有下载任何文件。':'不用完成目标，只需给自己一点时间。'}</div>
  <div class="timer-buttons"><button class="primary-button" data-action="toggle-timer" id="toggle-timer">${a.kind==='sound'?'开始播放':'开始'}</button><button class="secondary-button" data-action="finish" id="finish-button">结束</button></div></div>`);
}
function updateTimer(){
  if(!activeActivity||!$('#timer-value'))return;
  const a=activeActivity,total=a.minutes*60,el=elapsedSec(),rem=Math.max(0,total-el);
  $('#timer-value').textContent=formatTime(Math.ceil(rem));
  if(a.kind==='breath'&&$('#breath-phase')){
    const p=el%16,ph=Math.floor(p/4),w=p%4;$('#breath-phase').textContent=['吸气','停一下','呼气','停一下'][ph];$('#breath-count').textContent=4-Math.floor(w);
    const sc=ph===0?.78+w/4*.3:ph===1?1.08:ph===2?1.08-w/4*.3:.78;if(!reduceMotion())$('#breathing-orb').style.transform=`scale(${sc.toFixed(3)})`;
  }
  if($('#step-list')){const n=a.steps.length,c=Math.min(n-1,Math.floor(el/total*n));$$('#step-list > div').forEach((d,i)=>{d.classList.toggle('current',i===c);d.classList.toggle('done',i<c);});}
  if(rem<=0){stopTimer();accumulated=total;$('#toggle-timer').disabled=true;$('#toggle-timer').textContent='时间到了';$('#timer-copy').textContent='时间到了。可以点「结束」，也可以再待一会儿。';}
}
function toggleTimer(){
  const a=activeActivity;if(!a)return;
  if(running){stopTimer();$('#toggle-timer').textContent='继续';if($('#breath-phase'))$('#breath-phase').textContent='慢慢来';$('.sound-rings')&&$('.sound-rings').classList.remove('playing');return;}
  started=true;running=true;tickAt=Date.now();$('#toggle-timer').textContent='暂停';$$('[data-action="dur"]').forEach(b=>b.disabled=true);
  if(a.kind==='sound'){Ambient.play(a.id,{owner:practiceOwner(),volume}).then(()=>{const r=$('.sound-rings');r&&r.classList.add('playing');}).catch(()=>{const c=$('#timer-copy');if(c)c.textContent='浏览器没有允许播放声音。可以继续计时，安静地待一会儿；也可以换一个练习。';});}
  timer=setInterval(updateTimer,250);updateTimer();
}
function finishActivity(){
  const a=activeActivity;if(!a)return;
  if(!started){closeModal();return;}
  stopTimer();const s=recordSession();const secs=s?s.seconds:0;
  modal(`<div class="center">${face(4,'saved-face')}<div class="eyebrow">THANK YOU FOR SHOWING UP</div><h2>现在，感觉怎么样？</h2><p>你为自己留了 ${secs<60?`${secs} 秒`:`${Math.floor(secs/60)} 分 ${secs%60} 秒`}。<br>可以留下感受，也可以不选。</p><div class="feedback-buttons"><button data-action="feedback" data-value="better">轻松了一点</button><button data-action="feedback" data-value="same">差不多</button><button data-action="feedback" data-value="worse">还不太舒服</button></div><button class="text-button skip" data-action="feedback-skip">跳过</button></div>`);
}
function feedback(v){
  const a=activeActivity;if(!a)return;const s=sessions().find(x=>x.id===a.sessionId);if(s){s.feedback=FEEDBACK[v]?v:null;persist();}
  activeActivity=null;refreshSpace();if(view==='care')render();
  const line={better:['记下了：轻松了一点。','这个方法这次对你有一点帮助。'],same:['记下了：差不多。','差不多也没关系，不是每一次都要有变化。'],worse:['记下了：还不太舒服。','谢谢你如实说出来。先停下来也可以，喝口水，换个舒服的位置。']}[v];
  modal(`<div class="center"><h2>${line[0]}</h2><p>${line[1]}</p>${v==='worse'?'<p class="small">如果想和人聊聊，可以看看<button class="link-button" data-action="help">需要帮助时</button>。</p>':''}<div class="modal-actions" style="justify-content:center"><button class="primary-button" data-action="close">好</button></div></div>`);
}

/* ---------- 设置 / 隐私 / 关于 / 帮助 ---------- */
function settings(){
  const p=state.personal,hasBackup=!!lsGet(BACKUP),mig=state.migration;
  modal(`<div class="eyebrow">YOUR SPACE, YOUR CHOICE</div><h2>你的记录，由你决定。</h2><p>记录只保存在这台设备的这个浏览器里。清除浏览器数据、更换设备或使用无痕模式，可能无法找回。</p>
  <div class="setting-row"><div><h3>我的记录</h3><p>${p.entries.length} 条记录 · ${p.sessions.length} 次练习（不含示例）</p></div><button class="secondary-button" data-action="export">导出 JSON</button></div>
  <div class="setting-row"><div><h3>示例花园</h3><p>示例数据单独保存，重置或退出都不会影响你的记录。</p></div><span class="row-btns">${isDemo()?'<button class="text-button" data-action="demo-reset">重置示例</button><button class="secondary-button" data-action="demo-exit">回到我的空间</button>':'<button class="secondary-button" data-action="demo-enter">看看示例花园</button>'}</span></div>
  ${hasBackup||mig?`<div class="setting-row"><div><h3>旧版本数据</h3><p>${mig&&mig.report?`已从旧版本迁移 ${mig.report.personalEntries} 条记录、${mig.report.personalSessions} 次练习；旧版的示例记录没有迁移。`:mig&&mig.error?esc(mig.error):''}${hasBackup?' 原始数据已原样备份在这个浏览器里。':''}</p></div>${hasBackup?'<button class="secondary-button" data-action="export-backup">下载备份</button>':''}</div>`:''}
  <div class="setting-row"><div><h3>删除我的全部记录</h3><p>只删除你的私人记录与练习，不影响示例；删除后无法恢复。</p></div><button class="danger-button" data-action="clear-confirm">删除</button></div>`);
}
function privacy(){modal(`<div class="eyebrow">A PRIVATE LITTLE CORNER</div><h2>有些话，只留给自己。</h2><p>缓缓无需注册。你写下的文字、补充的标签与练习记录只保存在当前浏览器的本地存储里，不上传到服务器，也不会发给任何 AI 模型。输入过程不会被自动保存，只有点了「留在这里」才会保存。</p><ul class="modal-list"><li>公开的是这个工具，不是你的日记。</li><li>共用设备上，使用同一浏览器的人可能看到记录。</li><li>你可以随时导出或删除自己的全部记录。</li><li>清除浏览器数据后，记录也会被清除。</li></ul><div class="modal-actions"><button class="primary-button" data-action="close">知道了</button></div>`);}
function about(){modal(`<div class="eyebrow">ABOUT HUAN HUAN</div><h2>一个可以说点什么、也可以安静待着的地方。</h2><p>缓缓是一个静态网页原型。你可以写下一段话，或者只在光旁边停一会儿；它们会成为空间里的一个小生命形态，可以随时回看。情绪足迹和关怀工具箱放在需要时可以找到的地方。</p><ul class="modal-list"><li>文字回应来自少量透明的关键词规则，不理解全文，没有接入大模型。</li><li>推荐是规则排序：你选的感受，加上你在同一种练习后留下的反馈。</li><li>没有接入任何真实设备；示例里的手表与情境数据都是模拟的。</li><li>这里提供日常记录与自我关怀，不提供诊断或治疗。</li></ul><div class="modal-actions"><button class="primary-button" data-action="close">好</button></div>`);}
function exportJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

/* ---------- 设计说明：次级入口，默认收起，关闭后焦点回到入口 ---------- */
function setNotes(open,restore=true){
  document.body.classList.toggle('notes-open',open);const t=$('#notes-toggle'),p=$('#design-notes');t.setAttribute('aria-expanded',open);p.setAttribute('aria-hidden',!open);p.inert=!open;
  if(open)setTimeout(()=>p.querySelector('.dn-close').focus(),50);else if(restore)t.focus({preventScroll:true});
}
setNotes(false,false);

/* ---------- 事件 ---------- */
document.addEventListener('input',e=>{
  if(e.target.id==='say')updateSayUI();
  if(e.target.id==='journal-search'){search=e.target.value;$('#journal-list').innerHTML=entryList();hydrate($('#journal-list'));}
  if(e.target.id==='volume'){volume=+e.target.value/100;if(Ambient.owner===practiceOwner())Ambient.setVolume(volume);}
  if(e.target.id==='space-volume'){spaceVol=+e.target.value/100;if(Ambient.owner==='space')Ambient.setVolume(spaceVol);}
});
document.addEventListener('keydown',e=>{
  // 多行输入：Enter 换行；只有 Ctrl/⌘ + Enter 且不在输入法组字中才提交
  if(e.target.id==='say'&&e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing&&e.keyCode!==229){e.preventDefault();keepText();}
  if(e.key==='Escape'&&document.body.classList.contains('notes-open')){e.preventDefault();setNotes(false);}
});
document.addEventListener('change',e=>{if(e.target.id==='journal-filter'){listFilter=e.target.value;$('#journal-list').innerHTML=entryList();hydrate($('#journal-list'));}});
document.addEventListener('pointermove',e=>{
  const wrap=e.target.closest&&e.target.closest('#trend'),tip=$('#chart-tip'),cross=$('#cross');if(!tip)return;
  if(!wrap){tip.classList.remove('show');if(cross)cross.style.opacity=0;return;}
  const svg=wrap.querySelector('svg'),b=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,x=(e.clientX-b.left)/b.width*vb.width,y=(e.clientY-b.top)/b.height*vb.height;
  let best=null,bd=1e9;svg.querySelectorAll('[data-tip]').forEach(c=>{const d=(+c.getAttribute('cx')-x)**2+(+c.getAttribute('cy')-y)**2;if(d<bd){bd=d;best=c;}});
  if(!best||bd>30*30){tip.classList.remove('show');cross.style.opacity=0;return;}
  const cx=+best.getAttribute('cx'),cy=+best.getAttribute('cy');cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.style.opacity=1;
  tip.textContent=best.dataset.tip;tip.classList.add('show');const wb=wrap.getBoundingClientRect();
  tip.style.left=Math.max(80,Math.min(wb.width-80,b.left-wb.left+cx/vb.width*b.width))+'px';tip.style.top=(b.top-wb.top+cy/vb.height*b.height)+'px';
});
document.addEventListener('click',e=>{
  const nav=e.target.closest('nav a');if(nav){e.preventDefault();navigate(nav.dataset.view);return;}
  const b=e.target.closest('[data-action]');if(!b)return;
  const a=b.dataset.action,id=b.dataset.id,v=b.dataset.value;
  switch(a){
    case 'say-keep':keepText();break;
    case 'say-discard':discardText();break;
    case 'reply-stay':{const r=$('#reply');const ra=r.querySelector('.reply-actions');if(ra)ra.remove();setTimeout(()=>r.classList.remove('show'),2500);break;}
    case 'stay-keep':keepStay();break;
    case 'stay-leave':leaveStay();break;
    case 'sound':toggleSound();break;
    case 'memory':openMemory(id);break;
    case 'annotate':openAnnotate(id);break;
    case 'anno-emo':anno.emotion=anno.emotion===v?null:v;syncAnno();break;
    case 'anno-clear-emo':anno.emotion=null;syncAnno();break;
    case 'anno-inten':anno.intensity=anno.intensity===+v?null:+v;syncAnno();break;
    case 'anno-tag':anno.triggers=anno.triggers.includes(v)?anno.triggers.filter(t=>t!==v):[...anno.triggers,v];b.classList.toggle('active');b.setAttribute('aria-pressed',anno.triggers.includes(v));break;
    case 'anno-save':saveAnno();break;
    case 'accompany':{const en=entries().find(x=>x.id===id);const recs=HH.recommend(en&&en.emotion,sessions());modal(`<div class="eyebrow">都是可选的，随时可以结束</div><h2>陪这个感受待一会儿</h2><p>${en&&named(en)?`按你选的「${en.emotion}」和你以前的反馈排序。`:'没有命名也可以，先挑一个舒服的。'}</p><div class="care-options">${recs.map(r=>{const ac=actById(r.id);return `<button class="care-option ${ac.style}" data-action="activity" data-id="${ac.id}" data-entry="${esc(id)}"><div class="co-top"><span class="activity-tag">${r.cat} · ${ac.minutes} 分钟</span></div><h4>${ac.title}</h4><p class="co-reason">${icon('spark')}<span>${esc(r.reason)}</span></p></button>`;}).join('')}</div>`);break;}
    case 'navigate':closeModal();navigate(b.dataset.view);break;
    case 'close':closeModal();break;
    case 'activity':openActivity(id,{entry:b.dataset.entry});break;
    case 'dur':if(!started&&activeActivity){activeActivity.minutes=+v;$$('[data-action="dur"]').forEach(x=>x.classList.toggle('active',x===b));$('#timer-value').textContent=formatTime(+v*60);}break;
    case 'toggle-timer':toggleTimer();break;
    case 'finish':finishActivity();break;
    case 'feedback':feedback(v);break;
    case 'feedback-skip':activeActivity=null;closeModal();refreshSpace();if(view==='care')render();break;
    case 'period':period=+v;render();break;
    case 'time-filter':timeFilter=+v;render();break;
    case 'energy-filter':energyFilter=v;render();break;
    case 'reset-care':timeFilter=0;energyFilter='all';render();break;
    case 'reset-filters':search='';listFilter='all';render();break;
    case 'settings':settings();break;
    case 'privacy':privacy();break;
    case 'about':about();break;
    case 'help':modal(helpCard()+'<div class="modal-actions"><button class="primary-button" data-action="close">好</button></div>');break;
    case 'export':exportJSON({app:'缓缓',version:3,exportedAt:new Date().toISOString(),entries:state.personal.entries,sessions:state.personal.sessions},`huanhuan-${dayKey(new Date())}.json`);toast('已导出你的记录（不含示例）。');break;
    case 'export-backup':{const raw=lsGet(BACKUP);if(raw){try{exportJSON(JSON.parse(raw),'huanhuan-v2-backup.json');}catch(_){exportJSON({raw},'huanhuan-v2-backup.json');}}break;}
    case 'notes-toggle':setNotes(!document.body.classList.contains('notes-open'));break;
    case 'demo-enter':closeModal();if(!state.demo)state.demo=HH.genDemo(Date.now());state.mode='demo';persist();navigate(view);toast('这是示例花园。你的私人记录不受影响。');break;
    case 'demo-exit':closeModal();state.mode='personal';persist();navigate(view);toast('回到了你的空间。');break;
    case 'demo-reset':closeModal();state.demo=HH.genDemo(Date.now());persist();render();toast('示例已重置，只影响示例数据。');break;
    case 'clear-confirm':modal(`<h2>删除你的全部记录？</h2><p>将删除 ${state.personal.entries.length} 条私人记录和 ${state.personal.sessions.length} 次练习，无法恢复。示例与旧版本备份不受影响。需要的话，可以先导出。</p><div class="modal-actions"><button class="secondary-button" data-action="settings">先保留</button><button class="primary-button" data-action="clear-data">确认删除</button></div>`);break;
    case 'clear-data':state.personal={entries:[],sessions:[]};persist();closeModal();render();toast('已删除你的私人记录。');break;
    case 'delete':modal(`<h2>删除这条记录？</h2><p>原文和你补充的标签都会删除，无法恢复。和它相关的练习记录会保留，但不再关联到它。</p><div class="modal-actions"><button class="secondary-button" data-action="memory" data-id="${esc(id)}">先保留</button><button class="primary-button" data-action="confirm-delete" data-id="${esc(id)}">确认删除</button></div>`);break;
    case 'confirm-delete':{const box=cur();box.entries=box.entries.filter(x=>x.id!==id);box.sessions.forEach(s=>{if(s.entryId===id)s.entryId=null;});persist();closeModal();if(view==='home')refreshSpace();else render();toast('已删除。');break;}
  }
});
hydrate();
render();
